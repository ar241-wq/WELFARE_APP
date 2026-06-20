# Group Buying — Feature Documentation

## Overview

Employees can pool together to buy the same perk at a discount. The more people in the group buy, the larger the discount:
- **3–4 people → 5% off**
- **5–9 people → 10% off**
- **10+ people → 15% off**

A group buy is open for 48 hours. Any employee can start or join one. When ready to pay, each member individually "locks in" — credits are deducted at the discounted price at that moment.

---

## Data Flow

```
Employee opens perk detail screen
        ↓
Sees active group buys for that perk (GET /api/group-buy/perk/<perk_id>/)
        ↓
Starts a new group buy (POST /api/group-buy/perk/<perk_id>/)
   OR joins an existing one (POST /api/group-buy/<id>/join/)
        ↓
As more people join, discount_rate updates automatically (computed from member_count)
        ↓
When happy with discount, employee locks in (POST /api/group-buy/<id>/lock-in/)
   → credits deducted immediately at discounted price
   → member.locked_in = True, member.locked_price = actual price paid
        ↓
Group buy expires after 48h (no background task — just filtered by expires_at)
```

---

## Backend

### `backend/group_buying/models.py`

#### `discount_for_count(count)` — module-level function

Pure function, returns a `Decimal` discount rate based on member count:
```python
10+ → Decimal('0.15')
5-9 → Decimal('0.10')
3-4 → Decimal('0.05')
0-2 → Decimal('0')
```
Used by both the model properties and can be imported in views if needed.

#### `GroupBuy`

| Field | Type | Notes |
|---|---|---|
| `perk` | FK → `catalog.Perk` | Which perk this group buy is for |
| `created_by` | FK → User | The employee who started it |
| `expires_at` | DateTimeField | Set automatically to `now + 48h` in `save()` if not provided |
| `status` | CharField | `open` or `expired` |

**Properties (computed, not stored):**

| Property | Logic |
|---|---|
| `member_count` | `self.members.count()` — live count of joined members |
| `discount_rate` | Calls `discount_for_count(self.member_count)` — updates automatically as members join |
| `discounted_price` | `perk.credit_price * (1 - discount_rate)` |
| `is_active` | `status == 'open' AND expires_at > now()` |

**Important:** Discount is dynamic. It increases as more people join. Members who already locked in paid whatever rate was active at lock-in time (stored in `GroupBuyMember.locked_price`).

#### `GroupBuyMember`

Join table between `GroupBuy` and User.

| Field | Type | Notes |
|---|---|---|
| `group_buy` | FK → GroupBuy | |
| `user` | FK → User | |
| `locked_in` | BooleanField | `True` once they've paid |
| `locked_price` | Decimal | Exact price paid at lock-in time — historical record |
| `joined_at` | DateTimeField | Auto-set |

`unique_together = ['group_buy', 'user']` — prevents joining twice.

---

### `backend/group_buying/serializers.py`

**`GroupBuySerializer`** — all `SerializerMethodField` fields read `request.user` from context. Always pass `context={'request': request}`.

| Field | Source |
|---|---|
| `perk_name` | `perk.name` |
| `perk_id` | `perk.id` |
| `original_price` | `perk.credit_price` (full price before discount) |
| `member_count` | `obj.member_count` property |
| `discount_rate` | float of `obj.discount_rate` (e.g. `0.10` for 10%) |
| `discounted_price` | float of `obj.discounted_price` |
| `savings` | float of `perk.credit_price * discount_rate` — how many credits saved |
| `is_member` | Whether `request.user` has a `GroupBuyMember` row |
| `is_locked_in` | Whether `request.user`'s member row has `locked_in=True` |
| `is_active` | `obj.is_active` property |
| `members_preview` | First names of up to 5 members — shown as "Alice, Bob, Carol..." |

---

### `backend/group_buying/views.py`

| View | Method | URL | What |
|---|---|---|---|
| `PerkGroupBuysView` | GET | `/api/group-buy/perk/<perk_id>/` | All active (open + not expired) group buys for a perk |
| `PerkGroupBuysView` | POST | `/api/group-buy/perk/<perk_id>/` | Start a new group buy. Blocks if user is already in an open one for this perk. Creator is auto-joined as first member. |
| `GroupBuyDetailView` | GET | `/api/group-buy/<pk>/` | Single group buy detail |
| `GroupBuyJoinView` | POST | `/api/group-buy/<pk>/join/` | **Toggle** join/leave. Blocked if expired. Cannot leave if already `locked_in`. |
| `GroupBuyLockInView` | POST | `/api/group-buy/<pk>/lock-in/` | Deducts `discounted_price` from wallet. Creates a `Transaction` with `type='debit'`. Saves `locked_price` on the member row. |
| `MyGroupBuysView` | GET | `/api/group-buy/my/` | All open group buys the current user is a member of |

**Lock-in credit flow:**
```python
price = gb.discounted_price           # computed at moment of lock-in
wallet.balance -= price               # deduct from user's wallet
Transaction.create(type='debit', amount=-price, description='Group Buy: <perk_name> (X% off)')
member.locked_in = True
member.locked_price = price           # snapshot of price paid
```

Note: `amount` is stored as a negative value (`-price`) in the Transaction to indicate a debit.

---

### `backend/group_buying/urls.py`

Mounted at `api/group-buy/` in `backend/config/urls.py`.

```
GET     api/group-buy/my/                    → MyGroupBuysView
GET     api/group-buy/perk/<perk_id>/        → PerkGroupBuysView (list active buys for perk)
POST    api/group-buy/perk/<perk_id>/        → PerkGroupBuysView (start new buy)
GET     api/group-buy/<pk>/                  → GroupBuyDetailView
POST    api/group-buy/<pk>/join/             → GroupBuyJoinView (toggle)
POST    api/group-buy/<pk>/lock-in/          → GroupBuyLockInView
```

---

### `backend/group_buying/migrations/0001_initial.py`
Auto-generated. Creates `GroupBuy` and `GroupBuyMember` tables.

---

## Mobile

### `mobile/lib/api.js` — Added functions

```js
getPerkGroupBuys(perkId)    // GET /api/group-buy/perk/<perkId>/
startGroupBuy(perkId)       // POST /api/group-buy/perk/<perkId>/
joinGroupBuy(id)            // POST /api/group-buy/<id>/join/  (toggle)
lockInGroupBuy(id)          // POST /api/group-buy/<id>/lock-in/
getMyGroupBuys()            // GET /api/group-buy/my/
```

---

### `mobile/app/perk/[id].js` — Modified (Group Buy Section Added)

The existing perk detail screen was extended. No new screen was created — group buying is embedded inline.

**New state added:**
```js
const [groupBuys, setGroupBuys] = useState([]);
```

**`load()` updated:**
```js
const [p, w, gbs] = await Promise.all([getPerkById(id), getWallet(), getPerkGroupBuys(id)]);
setGroupBuys(gbs);
```

**`<GroupBuySection>` rendered inside the ScrollView**, below the perk info, above the fixed footer Redeem button.

#### `GroupBuySection` component (defined at top of file)

**Props:** `perkId`, `groupBuys`, `onRefresh`

**Logic:**
- `activeGroupBuys` — filters to `gb.is_active === true`
- `myGroupBuy` — the group buy the current user is already in (if any)
- `discountLabel(rate)` — converts `0.15` → `'15% OFF'` etc.
- `nextThreshold(count)` — tells user how many more people needed for next discount tier

**Renders (in order):**

1. **Header** — "💪 Group Buy" title + subtitle
2. **Tier badges** — three fixed `[3+/5%]`, `[5+/10%]`, `[10+/15%]` info boxes
3. **For each active group buy:**
   - Discount badge (grey if `< 3 members`, green if discount active)
   - Strikethrough original price + discounted price + savings pill (shown when discount > 0)
   - "N more to unlock X%" hint (shown when not at max tier)
   - Members preview (first names of up to 5)
   - Action buttons:
     - Not a member → "Join This Group" button
     - Member, not locked in → "🔒 Lock In & Pay X cr" + "Leave" link
     - Locked in → Green "✓ You're locked in!" badge
4. **"Start a Group Buy"** — dashed border button, only shown if user isn't already in any group buy for this perk. Creates a new group buy and auto-joins the user.

**StyleSheet:** `gb` prefix (e.g. `gb.section`, `gb.tier`, `gb.buyCard`).

---

## Key Design Decisions

**Why is discount dynamic (not locked at join time)?**
Discount is calculated live from `member_count` at the moment of lock-in. This means if you join early (1 person, no discount) and 9 more join before you lock in, you get 15% off. This incentivises waiting and encourages viral sharing ("invite more people before I lock in").

**Why do members lock in individually rather than all at once?**
Each person controls their own timing. Someone might lock in at 5% while another waits for more members. The `locked_price` field records exactly what each person paid.

**Why 48-hour expiry?**
Keeps group buys fresh and prevents abandoned buys from cluttering the perk page. No background cleanup needed — expiry is checked inline via `expires_at__gt=timezone.now()` in all queries.

**Why no dedicated group buying screen/tab?**
The feature lives on the perk detail page where the purchase decision is made. `getMyGroupBuys()` exists for a future "my active group buys" screen if needed.

---

## Testing Checklist

1. Open any perk in the mobile app
2. Tap "Start a Group Buy" → group buy created, you're member #1
3. Log in as a second employee → open same perk → see the existing group buy → "Join This Group"
4. Member count updates → check discount badge changes at 3, 5, 10 members
5. Tap "Lock In & Pay X cr" → confirm dialog → credits deducted, "✓ You're locked in!" shown
6. Check wallet balance decreased by discounted price (not original price)
7. Check Transaction record created with `type='debit'`
