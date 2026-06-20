# Provider Reputation & Review System — Implementation Plan

## 0. Current Codebase Snapshot (read before touching anything)

### What already exists and is relevant

**Backend — `catalog` app**
- `Perk` — has `provider` FK, `credit_price`, `is_featured`, `is_active`, `tags`, ordering by `[-is_featured, -created_at]`. The ordering line is the exact place we wire in reputation later.
- `Redemption` — has `employee` FK, `perk` FK, `status` (`pending` / `redeemed` / `expired`), `redeemed_at`. A redemption moves from `pending` → `redeemed` when the provider scans the QR in `ScanRedemptionView`. This is the trigger point for the review prompt.
- `PerkSerializer` — already exposes `provider_name`, `provider_verified`, `images`. We will add `avg_rating`, `review_count`, `reputation_tier` here.

**The redemption lifecycle (critical for review timing)**
1. Employee taps "Redeem" in the mobile app → `POST /api/catalog/redeem/<pk>/` → `Redemption` created with `status=pending`, QR generated.
2. Employee shows QR to provider → provider scans in Scan QR page → `POST /api/catalog/redeem/scan/` → `status` set to `redeemed`, `redeemed_at` stamped.
3. **The review prompt fires at step 2, not step 1.** Only a `redeemed` redemption earns the right to leave a review. This is the integrity guarantee.

**Backend — `users` app**
- `ProviderProfile` — has `company_name`, `logo`, `is_verified`. The reputation score and tier live here (add fields).

**Web — provider pages**
- `/provider/dashboard`, `/provider/listings`, `/provider/analytics`, `/provider/scan`, `/provider/collaborations`
- The new "Reputation" tab slots in between analytics and scan.

**Mobile — employee pages**
- `/perk/[id]` — perk detail. Add star badge here.
- `/redeem/[id]` — post-redemption QR screen. **This is where the review prompt appears**, after status flips to `redeemed`.
- `(tabs)/catalog` — perk cards in `FlatList`. Add star + tier badge.
- `(tabs)/index` — featured perks list. Add star badge.

---

## 1. New Data Models

### 1.1 `Review` (new table in `catalog` app)

| Field | Type | Notes |
|---|---|---|
| `redemption` | OneToOneField → Redemption | Enforces one review per redemption. Use `unique=True`. |
| `provider` | FK → User | Denormalized for fast aggregation queries. |
| `perk` | FK → Perk | Denormalized for per-perk breakdown. |
| `employee` | FK → User | Who wrote it. Never exposed by name in API response. |
| `stars` | IntegerField | 1–5. Validated at serializer level, not just model. |
| `comment` | TextField | Optional, blank=True. Max 500 chars. |
| `created_at` | DateTimeField | auto_now_add. |

**Constraint to enforce in the model:** `unique_together = ['redemption']` (already implied by OneToOne, but make it explicit). Also enforce at the view level: reject if `redemption.employee != request.user` and reject if `redemption.status != 'redeemed'`.

### 1.2 `ReputationScore` (new table in `catalog` app or new `reputation` app)

Cached per-provider score. Recomputed on demand, not on every request.

| Field | Type | Notes |
|---|---|---|
| `provider` | OneToOneField → User | |
| `composite_score` | FloatField | 0–100. The weighted, confidence-adjusted number. |
| `tier` | CharField | `unranked` / `bronze` / `silver` / `gold` / `platinum` |
| `avg_stars` | FloatField | Raw average, stored separately from composite. |
| `review_count` | IntegerField | Total reviews received. |
| `redemption_count` | IntegerField | Total redeemed redemptions. |
| `repeat_rate` | FloatField | 0–1. Unique returning employees / total unique employees. |
| `consistency_score` | FloatField | 0–100. Variance penalty component. |
| `score_breakdown` | JSONField | `{stars: 40, volume: 18, repeat: 22, consistency: 9, fulfillment: 8}` — shown on provider dashboard. |
| `gap_to_next` | JSONField | `{tier: "gold", points_needed: 12.3, actions: ["Need 8 more reviews", "Avg must reach 4.2"]}` — drives the challenge display. |
| `last_calculated` | DateTimeField | Stale if > 1 hour old or a new review just came in. |

### 1.3 `ProviderProfile` — add fields (existing model in `users` app)

Add directly to the existing `ProviderProfile` model:
- `reputation_tier` CharField default `'unranked'` (mirror of `ReputationScore.tier`, denormalized for fast serializer access without a join)

---

## 2. The Score Engine — Exact Calculation Spec

This section is the most important. Every number here is a decision Claude Code must not change without reason.

### 2.1 Five components, five weights

```
composite = (
  stars_component    * 0.40 +
  volume_component   * 0.20 +
  repeat_component   * 0.20 +
  consistency_component * 0.10 +
  fulfillment_component * 0.10
)
```

### 2.2 How each component is calculated

**Stars component (40%)**

Do NOT use raw average. Use a Bayesian-adjusted average:

```
GLOBAL_PRIOR_MEAN = 3.5       # pulled toward neutral
MIN_REVIEWS_FOR_FULL_WEIGHT = 30

adjusted_avg = (
    (GLOBAL_PRIOR_MEAN * MIN_REVIEWS_FOR_FULL_WEIGHT + sum_of_stars)
    /
    (MIN_REVIEWS_FOR_FULL_WEIGHT + review_count)
)

stars_component = ((adjusted_avg - 1) / 4) * 100   # normalize 1–5 → 0–100
```

A provider with 3 five-star reviews gets an adjusted avg of ~3.63, not 5.0. They earn their way to 5.0 at ~30 reviews.

**Volume component (20%)**

Use logarithmic scale so 1→10 reviews matters as much as 10→100:

```
volume_component = min(100, (log(redemption_count + 1) / log(200)) * 100)
```

200 redemptions = 100/100 on this component. Anything above that is capped.

**Repeat rate component (20%)**

```
unique_employees_ever = count of distinct employees who redeemed any perk from this provider
repeat_employees = count of employees who redeemed 2+ times from this provider

repeat_rate = repeat_employees / unique_employees_ever  (0 if denominator is 0)
repeat_component = repeat_rate * 100
```

**Consistency component (10%)**

Measures whether the provider's monthly average star rating is stable or volatile. A provider who spiked 5.0 for one month and dropped to 3.0 the next should score lower than one who holds 4.2 every month.

```
monthly_avgs = list of per-month average star ratings over last 6 months
std_dev = standard_deviation(monthly_avgs)
consistency_component = max(0, 100 - (std_dev * 25))
```

A std_dev of 0 = 100/100. A std_dev of 2.0 = 50/100. More than 4.0 std_dev = 0/100.

If fewer than 3 months of data exist, use 50 as a neutral placeholder (not 0, which would unfairly punish new providers).

**Fulfillment component (10%)**

```
fulfillment_rate = redeemed_count / total_redemption_count
fulfillment_component = fulfillment_rate * 100
```

Pending/expired redemptions count against this. A provider whose QR scans are rarely recorded has a fulfillment gap.

### 2.3 Minimum review gate

**If `review_count < 10`: do not compute a tier. Set tier = `unranked`, composite_score = null.**

The API must return `{"tier": "unranked", "review_count": 4, "reviews_needed": 6}` for these providers. Display "Building reputation" in the UI instead of any score.

### 2.4 Tier thresholds

| Tier | Composite score | Additional gates |
|---|---|---|
| Bronze | ≥ 10 reviews, score ≥ 0 | Default ranked tier |
| Silver | score ≥ 60 | min 20 reviews |
| Gold | score ≥ 75 | min 40 reviews + 3 months of data |
| Platinum | score ≥ 88 | min 80 reviews + top 5% of providers |

### 2.5 The gap calculation (what powers the challenge display)

After computing the current score, compute `gap_to_next`:

```python
def compute_gap(provider, current_score, current_tier, review_count):
    next_tier = {"unranked": "bronze", "bronze": "silver", "silver": "gold", "gold": "platinum"}
    next_thresholds = {"bronze": 0, "silver": 60, "gold": 75, "platinum": 88}

    target = next_tier.get(current_tier)
    if target is None:  # already platinum
        return {"tier": "platinum", "message": "You are at the top tier."}

    actions = []
    score_gap = max(0, next_thresholds[target] - current_score)

    if score_gap > 0:
        actions.append(f"Increase composite score by {score_gap:.1f} points")

    # Specific levers with concrete numbers
    reviews_needed_for_next_gate = max(0, min_reviews_for_tier[target] - review_count)
    if reviews_needed_for_next_gate > 0:
        actions.append(f"Get {reviews_needed_for_next_gate} more verified reviews")

    # What's the weakest component?
    weakest = min(score_breakdown, key=score_breakdown.get)
    actions.append(f"Biggest opportunity: improve your {weakest} score")

    return {"tier": target, "points_needed": round(score_gap, 1), "actions": actions}
```

---

## 3. Recalculation Strategy

**When to recalculate:**
- Immediately when a new Review is saved (signal or post-save hook on Review model).
- On a background task every 24 hours for all providers (catches fulfillment rate drift).
- Never on a GET request — always read from the cached `ReputationScore` row.

**How:**
- Use Django's `post_save` signal on `Review`.
- The recalculation function runs as a synchronous call for now (the dataset is small). When it grows, move to Celery task.
- Function signature: `recalculate_reputation(provider_user)` — computes all components, writes to `ReputationScore`, updates `ProviderProfile.reputation_tier`.

---

## 4. API Endpoints (new)

### 4.1 Submit a review
```
POST /api/catalog/reviews/
```
**Auth:** Employee only.
**Body:** `{ "redemption_id": 12, "stars": 4, "comment": "Great session." }`
**Validations:**
- `redemption.employee == request.user` — you can only review your own redemption
- `redemption.status == "redeemed"` — not pending or expired
- No existing `Review` for this `redemption_id` — one review per redemption
- `stars` must be 1–5 integer

**Response:** `{ "id": 1, "stars": 4, "comment": "...", "created_at": "..." }`
**Side effect:** triggers `recalculate_reputation(perk.provider)`.

### 4.2 Get reviews for a provider
```
GET /api/catalog/providers/<provider_id>/reviews/
```
**Auth:** Any authenticated user.
**Response:** Paginated list. Each item: `{ "stars": 4, "comment": "...", "perk_name": "Therapy Session", "created_at": "..." }`. **Never include employee name or email.**

### 4.3 Get reputation score for a provider
```
GET /api/catalog/providers/<provider_id>/reputation/
```
**Auth:** Any authenticated user (employees need it for catalog; providers need it for dashboard).
**Response:**
```json
{
  "tier": "silver",
  "composite_score": 67.4,
  "review_count": 28,
  "avg_stars": 4.2,
  "score_breakdown": {
    "stars": 72, "volume": 55, "repeat": 68, "consistency": 80, "fulfillment": 91
  },
  "gap_to_next": {
    "tier": "gold",
    "points_needed": 7.6,
    "actions": [
      "Get 12 more verified reviews",
      "Biggest opportunity: improve your volume score"
    ]
  }
}
```

### 4.4 Check if a redemption has been reviewed
```
GET /api/catalog/reviews/check/?redemption_id=12
```
**Auth:** Employee only.
**Response:** `{ "reviewed": true }` or `{ "reviewed": false }`
Used by the mobile app to decide whether to show the review prompt.

### 4.5 Add reputation fields to `PerkSerializer` (existing endpoint)
Add to the existing `GET /api/catalog/perks/` response:
```json
{
  "avg_rating": 4.2,
  "review_count": 28,
  "reputation_tier": "silver"
}
```
These come from the cached `ReputationScore` row via a `SerializerMethodField`. No extra query if you use `select_related('provider__reputation_score')`.

### 4.6 Modify catalog ordering (existing `PerkListView`)
Change the queryset ordering from `['-is_featured', '-created_at']` to:
```python
.annotate(
    rep_score=Coalesce('provider__reputation_score__composite_score', 0.0)
).order_by('-is_featured', '-rep_score', '-created_at')
```
Platinum providers with strong scores surface first. Unranked/new providers fall to the bottom but are still visible.

---

## 5. Mobile — Review Prompt (the only new screen)

### Where it lives
File: `mobile/app/redeem/[id].js` — the existing post-redemption QR screen.

### When it appears
The scan endpoint (`POST /api/catalog/redeem/scan/`) already flips `status` to `redeemed`. The mobile app currently polls or re-fetches the redemption status. When `status === 'redeemed'` and `reviewed === false` (from endpoint 4.4), show the review prompt.

**Trigger flow:**
1. Provider scans QR → status flips to `redeemed` on the server.
2. Employee's redeem screen detects the status change (either via a poll or a WebSocket if available; poll every 3s for simplicity).
3. Screen transitions from "Show QR" to "Rate your experience" automatically.

### The prompt UI (keep it minimal — one tap to complete)
```
"How was [Perk Name]?"
[ ★ ][ ★ ][ ★ ][ ★ ][ ★]   ← tap a star, that's enough
[ optional: add a comment... ]  ← multiline TextInput, not required
[ Submit ] [ Skip ]
```
- Tapping a star immediately enables Submit but does not auto-submit (let them optionally add a comment).
- Skip is allowed — don't force reviews. Forced reviews are meaningless.
- After submit or skip, return to home tab.

### New file to create
`mobile/app/review/[redemptionId].js` — or keep it inline in `redeem/[id].js` as a conditional second screen state. Inline is simpler for now.

---

## 6. Web — Provider Dashboard "Reputation" Tab

### Location
New page: `web/app/provider/reputation/page.tsx`
Nav entry added in `AppShell.tsx` between Analytics and Scan QR.

### Layout
```
┌─────────────────────────────────────────────────────┐
│  SILVER                          Score: 67.4 / 100  │
│  ████████████████░░░░░░  67%                        │
│  7.6 points to Gold                                 │
│  → Get 12 more reviews  → Improve volume score      │
└─────────────────────────────────────────────────────┘

┌───────────┐ ┌───────────┐ ┌───────────┐ ┌─────────┐
│ 4.2 ★     │ │ 28 reviews│ │ 34% repeat│ │91% fill │
└───────────┘ └───────────┘ └───────────┘ └─────────┘

Score Breakdown               What's holding you back?
Stars         ████████ 72     Volume is your weakest
Volume        █████ 55       component. More redemptions
Repeat        ███████ 68     = higher score.
Consistency   ████████ 80
Fulfillment   █████████ 91

Recent Reviews
[ star rating ] [ comment ] [ perk name ] [ date ]
...
```

### What to fetch
- `GET /api/catalog/providers/<me>/reputation/` for the score/tier/gap data
- `GET /api/catalog/providers/<me>/reviews/` for the recent reviews table

The provider's own `id` comes from `GET /api/auth/me/`.

---

## 7. Web — Employee Catalog Changes

### Perk cards (existing `DataTable` / perk list)
Add to each card:
- Star rating badge: `★ 4.2` (only if `review_count >= 10`)
- Tier chip: `SILVER` (color-coded: Bronze=#cd7f32, Silver=#adb5bd, Gold=#ffd700, Platinum=#e5e4e2)
- If `review_count < 10`: show nothing (not "no reviews" — just omit the badge entirely)

### Perk detail page (if one exists on web)
Show the full review list for that provider below the perk info.

---

## 8. Build Order — Step by Step

Follow this sequence exactly. Each step is independently useful and testable.

### Step 1 — Review model + submit endpoint
- Create `Review` model in `catalog/models.py`
- Migration
- `POST /api/catalog/reviews/` with all validations
- `GET /api/catalog/reviews/check/?redemption_id=X`
- Seed 5–10 test reviews via Django shell for testing
- **Test:** POST a review as an employee who has a `redeemed` redemption. Verify the one-per-redemption constraint rejects a second attempt.

### Step 2 — Raw aggregation on PerkSerializer
- Add `avg_rating`, `review_count`, `reputation_tier` to `PerkSerializer` (read from DB, no caching yet)
- Add `GET /api/catalog/providers/<id>/reviews/` endpoint
- **Test:** Fetch `/api/catalog/perks/` and confirm `avg_rating` appears for providers with reviews.

### Step 3 — ReputationScore model + score engine
- Create `ReputationScore` model
- Write `recalculate_reputation(provider_user)` function (pure Python, no side effects, unit-testable in isolation)
- Wire it to `Review.post_save` signal
- Add `GET /api/catalog/providers/<id>/reputation/` endpoint
- **Test:** Run `recalculate_reputation` manually after seeding reviews. Verify Bayesian adjustment pulls a 3-review 5.0 provider down to ~3.6 adjusted avg. Verify a <10 review provider gets `tier=unranked`.

### Step 4 — Catalog ordering
- Modify `PerkListView.get_queryset()` to order by reputation score
- **Test:** Seed a Gold provider and a Bronze provider. Verify the Gold provider's perks appear first in `/api/catalog/perks/`.

### Step 5 — Mobile review prompt
- Modify `mobile/app/redeem/[id].js` to check `GET /api/catalog/reviews/check/` after QR is shown
- Add a polling loop (every 3s) that checks redemption status — when it flips to `redeemed`, show the review UI inline
- **Test manually on device:** Scan a QR via the provider scan page, confirm the employee's screen transitions to the star prompt.

### Step 6 — Provider dashboard Reputation page (web)
- New page `web/app/provider/reputation/page.tsx`
- Nav entry in `AppShell.tsx`
- Score card, tier progress bar with gap text, breakdown bars, recent reviews table
- **Test:** Log in as a provider with reviews, confirm the page loads and the gap text is accurate.

### Step 7 — Employee catalog badges (web + mobile)
- Add star badge and tier chip to perk cards on the web catalog
- Add star badge to `mobile/app/(tabs)/catalog.js` perk FlatList items
- Add star badge to `mobile/app/(tabs)/index.js` featured perk cards
- **Test:** Confirm badges only appear for providers with ≥ 10 reviews.

### Step 8 — Anti-abuse hardening
- Add rate limiting on review submission (1 per redemption already enforced; also add a server-side check that `redeemed_at` exists)
- Add the minimum-reviews gate everywhere it could be bypassed
- Add the consistency component's volatility penalty to `recalculate_reputation`
- Ensure the `ScanRedemptionView` response includes `"prompt_review": true` so the mobile app knows the status changed

---

## 9. Explicit Warnings for Claude Code

These are the mistakes that will silently break the system if not followed:

1. **Never rank on raw star average.** Always use the Bayesian-adjusted average from `ReputationScore.avg_stars`. If you find yourself writing `Avg('reviews__stars')` in an ordering clause, stop — that's the wrong approach.

2. **Never recompute score on GET.** The `GET /api/catalog/perks/` endpoint is called constantly. It must only read the cached `ReputationScore` row, never trigger computation. Computation happens only in `recalculate_reputation()` called from the post-save signal.

3. **The review prompt fires after `status == redeemed`, not after the employee taps Redeem.** The employee taps Redeem → `status=pending`. The provider scans → `status=redeemed`. Only then does the review become possible. If you fire the prompt at `pending`, every review will be uninformed.

4. **Never expose employee identity in review responses.** The `GET /api/catalog/providers/<id>/reviews/` serializer must not include `employee_name`, `employee_email`, or any field that could identify who wrote the review. Return `perk_name`, `stars`, `comment`, `created_at` only.

5. **The `<10 reviews` gate is silent, not a zero.** Don't show `0 stars` or `No reviews` on perk cards. Show nothing. A badge that says "0 reviews" signals abandonment; no badge signals the product is too new to have accumulated reviews yet — a neutral message.

6. **Catalog ordering must degrade gracefully.** New providers with `null` reputation scores must still appear in the catalog — just sorted below ranked providers. Use `Coalesce('provider__reputation_score__composite_score', 0.0)` in the annotation, not a filter that excludes them.

7. **The `gap_to_next` computation must name concrete actions.** Vague output like "improve your score" is useless. The gap object must always contain at least one number (e.g. "8 more reviews needed") so the provider knows exactly what to do.

---

## 10. Answer to the Mentor Question

**How is a redemption "completed" in the current flow?**

It is NOT instant at the employee's tap. The flow is:
1. Employee taps "Redeem" → `Redemption` created, `status=pending`.
2. Employee shows the QR code screen to the provider.
3. Provider scans the QR in their "Scan QR" page → `POST /api/catalog/redeem/scan/` → `status` set to `redeemed`, `redeemed_at` stamped.

The review prompt must fire at step 3. The mobile app (employee side) should poll the redemption status after showing the QR, and when it detects `status === "redeemed"`, replace the QR view with the review prompt.

The `ScanRedemptionView` response should be extended to include a signal if needed, but the cleanest approach is polling on the employee side — avoids websockets and works with Expo Go.
