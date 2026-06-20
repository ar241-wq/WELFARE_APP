# Enterprise Community Plan — Welfare App

## Current State Assessment

### What Exists

**Backend (`backend/community/` + `backend/chat/`)**
- `Post` — ephemeral 24-hour instants, tied to catalog categories, image + caption
- `Like` — toggle likes on posts
- `PostView` — once a user opens a post, it's permanently gone for them (Snapchat mechanic)
- `DirectMessage` — 1:1 DM, with `reply_context`, `read` bool
- `GroupChat` — one group chat per catalog category, M2M members
- `GroupMessage` — flat messages within group chats
- Access control: category-gated — only users who redeemed a perk in a category can post/view

**Mobile (community.js)**
- Story-card stack UI (top 3 cards stacked with offset)
- Full-screen instant viewer with 6 emoji reactions + text reply
- Reactions send DMs to the author
- Camera-only posting (no gallery pick, intentional)
- `WellnessGate` screen for locked users

**What Doesn't Exist**
- Real-time messaging (everything polls)
- Push notifications
- Auto-join group chat on redemption
- Company-wide feed (separate from category feeds)
- Peer recognition / shoutouts
- Wellness challenges
- Moderation tools
- Web community dashboard
- Post reporting
- HR analytics on community health
- Content beyond instants (polls, announcements, milestones)
- Message reactions in group chat
- Image sharing in DMs
- Read receipts per message
- Expired post cleanup (only filtered on read, never deleted)

---

## Enterprise Architecture Plan

### Pillar 1 — Real-Time Foundation

**Goal:** Replace polling with WebSocket connections for DMs and group chat.

**Implementation: Django Channels**

Install:
```
pip install channels channels-redis daphne
```

Update `settings.py`:
```python
INSTALLED_APPS = [..., 'channels']
ASGI_APPLICATION = 'core.asgi.application'
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {'hosts': [('127.0.0.1', 6379)]},
    }
}
```

Create `core/asgi.py`:
```python
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
import chat.routing

application = ProtocolTypeRouter({
    'http': get_asgi_application(),
    'websocket': AuthMiddlewareStack(URLRouter(chat.routing.websocket_urlpatterns)),
})
```

**WebSocket Consumers to build:**

`chat/consumers.py` — `DirectMessageConsumer`
- Room name: `dm_{min(user1_id, user2_id)}_{max(user1_id, user2_id)}`
- On connect: authenticate JWT from query param, join personal room
- On receive: save `DirectMessage`, broadcast to both users
- Events: `message.new`, `message.read`

`chat/consumers.py` — `GroupChatConsumer`
- Room name: `group_{group_id}`
- On connect: verify user is a member of the group
- On receive: save `GroupMessage`, broadcast to group room
- Events: `message.new`, `member.joined`

**Mobile WebSocket client:**
```
npm install react-native-url-polyfill
```
Use native WebSocket in a custom hook `useWebSocket(url, onMessage)`.

---

### Pillar 2 — Push Notifications

**Goal:** Notify users of new DMs, reactions to their instants, and challenge updates even when app is closed.

**Backend: `notifications/` app (new)**

Model:
```python
class PushToken(models.Model):
    user = models.OneToOneField(AUTH_USER_MODEL, on_delete=models.CASCADE)
    token = models.CharField(max_length=200)  # Expo push token
    updated_at = models.DateTimeField(auto_now=True)
```

API endpoint: `POST /api/notifications/register-token/`
- Mobile calls this on app launch after login, saves Expo push token

Notification sender utility (`notifications/push.py`):
```python
import httpx

EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'

def send_push(token, title, body, data=None):
    httpx.post(EXPO_PUSH_URL, json={
        'to': token,
        'title': title,
        'body': body,
        'data': data or {},
        'sound': 'default',
    })
```

Trigger points:
- New DM received → notify recipient
- Instant reaction/reply → notify post author
- Wellness challenge posted → notify challenge participants
- New company-wide shoutout tagging user → notify tagged user
- HR announcement → notify all company employees

**Mobile:**
```
expo install expo-notifications expo-device
```
Register token in `AuthContext` after login.

---

### Pillar 3 — Auto-Join Community on Redemption

**Goal:** When an employee redeems a perk in category X, they automatically join category X's group chat.

**Implementation: Django signal in `catalog/signals.py`**

```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Redemption
from chat.models import GroupChat

@receiver(post_save, sender=Redemption)
def auto_join_community(sender, instance, created, **kwargs):
    if not created:
        return
    category = instance.perk.category
    if not category:
        return
    group, _ = GroupChat.objects.get_or_create(
        category=category,
        defaults={'name': f'{category.name} Community'}
    )
    group.members.add(instance.employee)
```

Register in `catalog/apps.py`:
```python
def ready(self):
    import catalog.signals
```

This is the missing link — currently `GroupChat.members` is never populated automatically, so the group chat tab is always empty for new users.

---

### Pillar 4 — Company-Wide Feed

**Goal:** A separate feed that is company-scoped (not category-scoped): HR announcements, peer shoutouts, milestone celebrations.

**New models in `community/models.py`:**

```python
class CompanyPost(models.Model):
    POST_TYPES = [
        ('announcement', 'Announcement'),
        ('shoutout', 'Shoutout'),
        ('milestone', 'Milestone'),
        ('challenge', 'Challenge Update'),
    ]
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='feed_posts')
    author = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    post_type = models.CharField(max_length=20, choices=POST_TYPES)
    content = models.TextField()
    tagged_users = models.ManyToManyField(AUTH_USER_MODEL, related_name='tagged_in_posts', blank=True)
    image = models.ImageField(upload_to='company_feed/', null=True, blank=True)
    pinned = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-pinned', '-created_at']

class CompanyPostLike(models.Model):
    post = models.ForeignKey(CompanyPost, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)

    class Meta:
        unique_together = ['post', 'user']

class CompanyPostComment(models.Model):
    post = models.ForeignKey(CompanyPost, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
```

**Access rules:**
- All employees of the company can read
- Employees can post shoutouts and milestone updates
- Only HR/employer can post announcements and pin posts

**API endpoints (`community/views.py` additions):**
```
GET  /api/community/feed/               → company feed (paginated, pinned first)
POST /api/community/feed/               → create post (type determines who can)
POST /api/community/feed/<pk>/like/     → toggle like
POST /api/community/feed/<pk>/comment/  → add comment
DELETE /api/community/feed/<pk>/        → delete (own post or HR)
PATCH /api/community/feed/<pk>/pin/     → pin/unpin (HR only)
```

---

### Pillar 5 — Wellness Challenges

**Goal:** HR creates time-bound challenges, employees join and post progress updates tied to the challenge.

**New models:**
```python
class WellnessChallenge(models.Model):
    company = models.ForeignKey('companies.Company', on_delete=models.CASCADE, related_name='challenges')
    created_by = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey('catalog.Category', on_delete=models.SET_NULL, null=True)
    starts_at = models.DateTimeField()
    ends_at = models.DateTimeField()
    credit_reward = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

class ChallengeParticipant(models.Model):
    challenge = models.ForeignKey(WellnessChallenge, on_delete=models.CASCADE, related_name='participants')
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['challenge', 'user']

class ChallengeUpdate(models.Model):
    challenge = models.ForeignKey(WellnessChallenge, on_delete=models.CASCADE, related_name='updates')
    author = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField()
    image = models.ImageField(upload_to='challenge_updates/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
```

**Flow:**
1. HR creates challenge in employer dashboard (title, desc, dates, category, optional credit reward)
2. Challenge appears in company feed as pinned `CompanyPost` with type `challenge`
3. Employees tap "Join Challenge"
4. They post progress updates (text + optional photo) — visible to all participants
5. On `ends_at`, HR marks winners and allocates credit reward via existing `DepartmentAllocateView` pattern

**API endpoints:**
```
GET  /api/community/challenges/                     → active challenges
POST /api/community/challenges/                     → create (HR only)
POST /api/community/challenges/<pk>/join/           → join challenge
POST /api/community/challenges/<pk>/updates/        → post progress update
GET  /api/community/challenges/<pk>/updates/        → get all progress updates
POST /api/community/challenges/<pk>/complete/       → mark complete + distribute credits (HR)
```

---

### Pillar 6 — Peer Recognition (Shoutouts)

**Goal:** Employees can publicly recognize colleagues. Tied to company feed.

This is a thin layer on top of `CompanyPost` with `post_type='shoutout'` + `tagged_users`.

**Mobile flow:**
1. In the company feed, tap "Give a Shoutout"
2. Search for a colleague by name
3. Write recognition message (e.g., "Sarah crushed the Q2 demo!")
4. Tagged colleague gets push notification
5. Shoutout appears in company feed — liked by teammates

No new model needed — uses `CompanyPost` + `tagged_users` M2M.

---

### Pillar 7 — Group Chat Upgrades

**Current gaps:** flat messages, no reactions, no file sharing, no read receipts per message, no threading.

**Model additions to `chat/models.py`:**

```python
class GroupMessageReaction(models.Model):
    message = models.ForeignKey(GroupMessage, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)

    class Meta:
        unique_together = ['message', 'user']

class GroupMessageReadReceipt(models.Model):
    message = models.ForeignKey(GroupMessage, on_delete=models.CASCADE, related_name='read_receipts')
    user = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE)
    read_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['message', 'user']

# Add to GroupMessage:
#   reply_to = models.ForeignKey('self', null=True, blank=True, on_delete=models.SET_NULL)
#   attachment = models.FileField(upload_to='chat_attachments/', null=True, blank=True)
```

**New API endpoints:**
```
POST /api/chat/groups/<pk>/messages/<msg_pk>/react/     → toggle reaction
POST /api/chat/groups/<pk>/messages/<msg_pk>/read/      → mark as read
GET  /api/chat/groups/<pk>/messages/<msg_pk>/read-by/   → who has read it
```

**Real-time:** via `GroupChatConsumer` — broadcast reactions and read receipts over WebSocket.

---

### Pillar 8 — Moderation & Reporting

**Goal:** HR can moderate content. Users can report posts.

**New model:**
```python
class ContentReport(models.Model):
    REASONS = [
        ('inappropriate', 'Inappropriate'),
        ('harassment', 'Harassment'),
        ('spam', 'Spam'),
        ('other', 'Other'),
    ]
    reporter = models.ForeignKey(AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reports_made')
    # Generic FK to handle both Post and CompanyPost
    post_id = models.IntegerField()
    post_type = models.CharField(max_length=20)  # 'instant' or 'company_post'
    reason = models.CharField(max_length=30, choices=REASONS)
    note = models.TextField(blank=True)
    resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
```

**API:**
```
POST /api/community/report/     → submit report
GET  /api/community/reports/    → HR only — list unresolved reports
PATCH /api/community/reports/<pk>/resolve/   → HR marks resolved + optionally deletes content
```

**Mobile:** long-press on any instant → "Report this post" option.

---

### Pillar 9 — Community Analytics (HR Dashboard)

**Goal:** HR sees engagement stats per category, active members, shoutout frequency, challenge participation.

**New view: `GET /api/community/analytics/`** (HR/employer only)

Returns:
```json
{
  "total_instants_this_week": 42,
  "total_likes_this_week": 187,
  "total_dms_this_week": 93,
  "active_members_this_week": 28,
  "top_categories": [
    { "name": "Fitness", "post_count": 18, "member_count": 15 }
  ],
  "challenge_participation_rate": 0.64,
  "shoutouts_this_week": 11,
  "pending_reports": 2
}
```

Implementation: aggregation queries over `Post`, `Like`, `DirectMessage`, `GroupMessage`, `ChallengeParticipant`, `CompanyPost`, `ContentReport`.

**Web employer dashboard:** New `/employer/community` page.
- Card grid: key metrics
- Line chart: post volume over 30 days (by day)
- Bar chart: engagement by category
- Table: active challenges with participation %
- Badge: pending moderation reports with link

---

### Pillar 10 — Performance & Cleanup

**Problem 1: Expired posts never deleted** — they just accumulate in DB and are filtered on every read.

Fix: Celery periodic task.
```python
# community/tasks.py
from celery import shared_task
from django.utils import timezone

@shared_task
def cleanup_expired_posts():
    from community.models import Post
    deleted, _ = Post.objects.filter(expires_at__lt=timezone.now()).delete()
    return deleted
```

Schedule: every hour.

**Problem 2: `PostListView` does Python-level filtering** — fetches all posts, then filters by viewed_ids in Python.

Fix:
```python
qs = (Post.objects
      .filter(expires_at__gt=timezone.now(), category_id__in=user_cat_ids)
      .exclude(author=request.user)
      .exclude(views__user=request.user)  # DB-level, not Python
      .select_related('author', 'category')
      .prefetch_related('likes'))
```

This removes the `viewed_ids` set and the Python list comprehension — all at DB level.

**Problem 3: GroupChat.members never populated** — solved by Pillar 3 signal.

**Problem 4: No pagination** — `PostListView` returns all unviewed posts at once.

Fix: add `?limit=20&offset=0` query params + DRF pagination.

---

## Build Order

Build these in sequence — each pillar unblocks the next.

### Phase 1 — Foundation (implement first)
1. **Auto-join on redemption** (Pillar 3) — 1 signal, 0 migrations, fixes broken group chat
2. **DB-level post filtering** (Pillar 10 item 2) — 1-line fix in `PostListView`
3. **Expired post cleanup** (Pillar 10 item 1) — Celery task, add to beat schedule

### Phase 2 — Company Feed
4. **CompanyPost model + migration** (Pillar 4)
5. **Company feed API** (Pillar 4)
6. **Shoutout flow** (Pillar 6 — thin layer on Phase 2)
7. **Mobile company feed tab** — new `feed.js` tab

### Phase 3 — Challenges
8. **WellnessChallenge models + migration** (Pillar 5)
9. **Challenge API** (Pillar 5)
10. **HR dashboard challenge creation UI** (web)
11. **Mobile challenge screens** — list, detail, post update

### Phase 4 — Real-Time
12. **Redis + Django Channels setup**
13. **DirectMessage WebSocket consumer**
14. **GroupMessage WebSocket consumer**
15. **Mobile WebSocket hooks**

### Phase 5 — Notifications
16. **PushToken model + register endpoint**
17. **Push sender utility**
18. **Hook into DMs, reactions, challenges**
19. **Mobile token registration in AuthContext**

### Phase 6 — Polish
20. **Group chat reactions + read receipts** (Pillar 7)
21. **Moderation + reporting** (Pillar 8)
22. **Community analytics page** (Pillar 9)

---

## Warnings for Claude Code

- **Do not add WebSocket before Redis is running** — check `redis-cli ping` returns `PONG` before writing consumers
- **Auto-join signal must be in `catalog/signals.py`, registered in `catalog/apps.py`** — not in community or chat apps, to avoid circular imports
- **CompanyPost and community Post are separate models** — do not merge them; they have different access rules, expiry logic, and UI treatment
- **`GroupChat` members is currently always empty** — the signal in Phase 1 is the fix; do not manually populate it or create a migration that tries to backfill
- **Celery requires a running worker AND beat scheduler** — both must be started separately (`celery -A core worker` and `celery -A core beat`)
- **WebSocket JWT auth**: standard DRF `IsAuthenticated` does not work on WebSocket — use `channels.auth` middleware with a custom JWT handshake (pass token as `?token=...` query param, validate in `connect()`)
- **Push notification tokens are per device**, not per user — if user uses multiple devices, store multiple rows (change PushToken to allow multiple per user, not `OneToOneField`)
- **Do not delete the existing `Post`/`Like`/`PostView` models** — the Instants feature is the best part of the current community; all new content types layer on top

---

## Summary Table

| Feature | Models | Migrations | API Endpoints | Mobile Screens |
|---|---|---|---|---|
| Auto-join community | — | — | — | — |
| DB-level post filter | — | — | Fix existing | — |
| Expired post cleanup | — | — | — | — |
| Company feed | `CompanyPost`, `CompanyPostLike`, `CompanyPostComment` | Yes | 6 | `feed.js` tab |
| Shoutouts | Uses CompanyPost | No | Uses feed | Tag UI in feed |
| Wellness Challenges | `WellnessChallenge`, `ChallengeParticipant`, `ChallengeUpdate` | Yes | 6 | `challenge.js` |
| WebSocket DMs | — | — | WS consumer | useWebSocket hook |
| WebSocket Groups | — | — | WS consumer | useWebSocket hook |
| Push Notifications | `PushToken` | Yes | 1 | AuthContext |
| Group chat reactions | `GroupMessageReaction`, `GroupMessageReadReceipt` | Yes | 3 | Chat screen |
| Moderation | `ContentReport` | Yes | 3 | Long-press menu |
| HR Analytics | — | — | 1 | `/employer/community` |
