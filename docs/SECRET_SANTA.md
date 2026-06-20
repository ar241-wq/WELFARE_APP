# Secret Santa — Feature Documentation

## Overview

A department-scoped gift exchange game. HR creates an event per department, employees join, HR triggers a random assignment shuffle, each participant sends credits as a gift to their secretly assigned colleague, and on the reveal date all pairings are shown.

---

## Data Flow (end-to-end)

```
HR creates event (POST /api/santa/)
        ↓
Employees join (POST /api/santa/<id>/join/)  ← toggle, same endpoint to leave
        ↓
HR triggers shuffle (POST /api/santa/<id>/assign/)
        ↓
Each participant sees only their own assignment (GET /api/santa/<id>/ → my_assignment)
        ↓
Participant sends credits (POST /api/santa/<id>/send-gift/)  ← debits giver, credits receiver
        ↓
HR reveals (POST /api/santa/<id>/reveal/)
        ↓
All assignments shown (GET /api/santa/<id>/ → all_assignments)
```

---

## Backend

### `backend/secret_santa/models.py`

**Three models:**

#### `SecretSantaEvent`
The main event object. Scoped to one department.

| Field | Type | Notes |
|---|---|---|
| `department` | FK → `companies.Department` | Which department this event belongs to |
| `created_by` | FK → User | The HR user who created it |
| `title` | CharField | Display name, default "Secret Santa" |
| `credit_budget` | Decimal | Suggested gift amount in credits |
| `join_deadline` | DateTimeField | After this, joining is closed |
| `reveal_date` | DateTimeField | When assignments are shown to everyone |
| `status` | CharField | `open` → `assigned` → `revealed` |

**Key method — `assign_santas()`:**
Uses a Fisher-Yates-style shuffle inside a `while` loop to guarantee nobody is assigned themselves. Deletes any previous assignments, then writes a `SantaAssignment` row for each giver→receiver pair, and flips `status` to `assigned`.

#### `SantaParticipant`
Join table between event and user. `unique_together = ['event', 'user']` prevents double-joining.
- `gift_sent` bool: flipped to `True` when the participant sends their credit gift.

#### `SantaAssignment`
Stores who-has-whom. Created in bulk by `assign_santas()`.
- `unique_together = ['event', 'giver']` — each giver has exactly one assignment per event.
- Intentionally not directly exposed by the API except through the serializer's `my_assignment` field, which only returns the current user's own assignment.

---

### `backend/secret_santa/serializers.py`

**`SecretSantaEventSerializer`** — all computed fields are `SerializerMethodField`, which means they read from `request.user` via `self.context['request']`. Always pass `context={'request': request}` when instantiating.

| Field | Logic |
|---|---|
| `participant_count` | `obj.participants.count()` |
| `is_joined` | Whether `request.user` has a `SantaParticipant` row for this event |
| `my_assignment` | Only returns data when `status in ('assigned', 'revealed')`. Returns `{receiver_id, receiver_name}` for the current user's assignment only. Returns `null` if not assigned or status is `open`. |
| `is_revealed` | `True` if `status == 'revealed'` OR `reveal_date <= now()` (auto-reveals by time) |
| `all_assignments` | Only populated when revealed. Returns array of `{giver_name, receiver_name}` for everyone. |

---

### `backend/secret_santa/views.py`

| View | Method | URL | Who | What |
|---|---|---|---|---|
| `MyDepartmentSantaView` | GET | `/api/santa/` | Employee | Lists events for the user's department(s) via `DepartmentMembership` |
| `MyDepartmentSantaView` | POST | `/api/santa/` | HR only | Creates a new event |
| `SantaEventDetailView` | GET | `/api/santa/<pk>/` | Any | Single event detail |
| `SantaJoinView` | POST | `/api/santa/<pk>/join/` | Employee | **Toggle** — joins if not joined, leaves if already joined. Blocked after `join_deadline` or when `status != open`. |
| `SantaAssignView` | POST | `/api/santa/<pk>/assign/` | HR only | Calls `event.assign_santas()`. Requires 2+ participants. |
| `SantaSendGiftView` | POST | `/api/santa/<pk>/send-gift/` | Employee | Deducts `amount` from giver's wallet, adds to receiver's wallet, creates a `Transaction` record on the receiver's wallet with `type='credit'`. Marks `SantaParticipant.gift_sent = True`. |
| `SantaRevealView` | POST | `/api/santa/<pk>/reveal/` | HR only | Sets `status = 'revealed'`. After this, `all_assignments` is returned to everyone. |

**`is_hr(user)` helper:** checks `user.role in ('employer', 'hr')`.

**Gift transfer logic** (`SantaSendGiftView`):
- Uses `Wallet.get_or_create(employee=user)` for both giver and receiver
- Validates giver has enough balance before deducting
- Creates a `Transaction` with `type='credit'` and `description='Secret Santa gift'` on the receiver's wallet

---

### `backend/secret_santa/urls.py`

Mounted at `api/santa/` in `backend/config/urls.py`.

```
GET/POST  api/santa/                    → MyDepartmentSantaView
GET       api/santa/<pk>/               → SantaEventDetailView
POST      api/santa/<pk>/join/          → SantaJoinView
POST      api/santa/<pk>/assign/        → SantaAssignView
POST      api/santa/<pk>/send-gift/     → SantaSendGiftView
POST      api/santa/<pk>/reveal/        → SantaRevealView
```

---

### `backend/secret_santa/migrations/0001_initial.py`
Auto-generated. Creates `SecretSantaEvent`, `SantaParticipant`, `SantaAssignment` tables. Generated with `python manage.py makemigrations secret_santa`.

---

## Mobile

### `mobile/lib/api.js` — Added functions

```js
getSantaEvents()              // GET /api/santa/  — events for user's department
getSantaEvent(id)             // GET /api/santa/<id>/
joinSantaEvent(id)            // POST /api/santa/<id>/join/  — toggle join/leave
sendSantaGift(id, amount)     // POST /api/santa/<id>/send-gift/  — { amount }
```

---

### `mobile/app/santa/index.js` — Event List Screen

**Route:** `/santa`

**State:**
- `events` — array of `SecretSantaEvent` objects from API
- `loading` / `refreshing` — for spinner and pull-to-refresh

**Renders:**
- Empty state (🎄) when no events
- For each event: a card showing title, status badge (color-coded: green=open, indigo=assigned, amber=revealed), department name, credit budget, participant count, reveal date
- Join/Leave button shown only when `status === 'open'` — calls `joinSantaEvent()` as a toggle, re-fetches on success

**Status colors:**
```
open     → #10b981 (green)
assigned → #6366f1 (indigo)
revealed → #f59e0b (amber)
```

Tapping a card navigates to `/santa/<id>`.

---

### `mobile/app/santa/[id].js` — Event Detail Screen

**Route:** `/santa/<id>` (dynamic segment `id`)

**State:**
- `event` — full event object including `my_assignment`, `all_assignments`
- `amount` — pre-filled with `event.credit_budget`, editable by user before sending

**Three conditional sections rendered based on `event.status`:**

1. **`status === 'open'`** → Shows waiting card (⏳). Encourages user to join if they haven't.

2. **`status === 'assigned'` AND `event.my_assignment` exists** → Shows the dark `#1a0533` assignment card:
   - Displays the receiver's name prominently
   - Editable credit input pre-filled with `credit_budget`
   - "Send Secret Gift" button → calls `sendSantaGift(id, amount)`

3. **`status === 'revealed'`** → Shows the reveal card (yellow border) with the full `all_assignments` list: each row is `giver_name → receiver_name`.

**Always shown:** Stats row (participant count, join deadline, reveal date).

---

### `mobile/app/(tabs)/index.js` — Home Screen Addition

A "Secret Santa" entry card was added below the AI Assistant card on the home screen. Dark purple (`#1a0533`) styling with a 🎅 icon. Tapping navigates to `/santa`. This was chosen over adding a new tab because the tab bar was already at capacity (7 tabs).

---

## Registration

- `'secret_santa'` added to `INSTALLED_APPS` in `backend/config/settings.py`
- `path('api/santa/', include('secret_santa.urls'))` added to `backend/config/urls.py`

---

## Testing Checklist

1. Log in as employer → create a Santa event for a department via API: `POST /api/santa/` with `{department_id, join_deadline, reveal_date, credit_budget}`
2. Log in as employee in that department → open app → see the event card on Home screen
3. Tap → `/santa` → tap "Join Event" → `is_joined` becomes `true`
4. Log in as second employee → join the same event
5. HR: `POST /api/santa/<id>/assign/` → status becomes `assigned`
6. Each employee: `GET /api/santa/<id>/` → `my_assignment` shows their person (different for each)
7. Employee: send gift → wallet balances update
8. HR: `POST /api/santa/<id>/reveal/` → `all_assignments` populates for everyone
