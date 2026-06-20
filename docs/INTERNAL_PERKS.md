# Internal Company Perks — Feature Documentation

## Overview

Employers create company-owned perks that live outside the external catalog. These are internal benefits only available to employees of that specific company — things like extra days off, 1-on-1 coaching sessions, team lunches, equipment upgrades, or flexible hours.

Employees see them on the mobile catalog under "Your Company Perks". Each perk can be free or cost credits, can have limited slots, and can require HR approval or auto-approve instantly.

---

## Data Flow

```
Employer creates internal perk in web dashboard (POST /api/internal-perks/)
        ↓
Perk appears in mobile catalog under "Your Company Perks" section (GET /api/internal-perks/)
        ↓
Employee taps a perk → /internal-perk/<id> detail screen
        ↓
Employee submits request with optional note (POST /api/internal-perks/<id>/redeem/)
   ├── requires_approval = False → status = 'approved' immediately, done
   └── requires_approval = True  → status = 'pending', HR must review
        ↓
HR sees pending requests on /employer/internal-perks web page
        ↓
HR approves or denies (POST /api/internal-perks/hr/requests/<id>/resolve/)
   ├── approved → employee notified (status changes), perk granted
   └── denied   → credits refunded if perk had a cost, employee sees 'Denied' badge
```

---

## Backend

### `backend/internal_perks/models.py`

#### `PERK_ICONS`
Module-level list of `(emoji, label)` tuples used as icon choices:
`🏖️ 🎓 🏋️ 💆 🚗 🍽️ 💻 ⏰ ⭐ 🎁`

#### `InternalPerk`

Company-owned perk definition. Scoped to one `Company`.

| Field | Type | Notes |
|---|---|---|
| `company` | FK → `companies.Company` | Scoped — only employees of this company see it |
| `created_by` | FK → User | The employer who created it |
| `title` | CharField | e.g. "Extra Day Off" |
| `description` | TextField | What the employee gets |
| `icon` | CharField(10) | Emoji from `PERK_ICONS`, default `🎁` |
| `credit_cost` | Decimal | Credits required to request. `0` = free |
| `is_free` | BooleanField | Explicit "free" flag — if `True`, credits are not deducted regardless of `credit_cost` |
| `available_slots` | PositiveIntegerField | `null` = unlimited. When set, limits how many can be approved |
| `requires_approval` | BooleanField | If `False`, request auto-approves immediately |
| `is_active` | BooleanField | Soft delete — deactivating hides from employees but keeps historical data |
| `created_at` | DateTimeField | Auto |

**`slots_remaining` property:**
Computed live. Counts redemptions with `status in ('pending', 'approved')` against `available_slots`. Returns `None` when unlimited.
```python
used = self.redemptions.filter(status__in=('pending', 'approved')).count()
return max(0, self.available_slots - used)
```
Note: `pending` counts against slots to prevent overbooking while awaiting approval.

#### `InternalPerkRedemption`

Each employee request creates one row.

| Field | Type | Notes |
|---|---|---|
| `perk` | FK → InternalPerk | Which perk |
| `employee` | FK → User | Who requested it |
| `status` | CharField | `pending` / `approved` / `denied` |
| `note` | TextField | Employee's optional message to HR |
| `hr_note` | TextField | HR's response note (set on resolve) |
| `requested_at` | DateTimeField | Auto |
| `resolved_at` | DateTimeField | Set by HR when approving/denying |

---

### `backend/internal_perks/serializers.py`

**`InternalPerkSerializer`** — passes `context={'request': request}` to compute per-user fields.

| Field | Logic |
|---|---|
| `company_name` | `company.name` |
| `slots_remaining` | Calls `obj.slots_remaining` property |
| `has_requested` | Whether `request.user` has a `pending` or `approved` redemption for this perk |
| `my_request_status` | Most recent redemption status for `request.user` (`null` if none) |

**`InternalPerkRedemptionSerializer`** — for the HR requests table. Exposes `perk_title`, `perk_icon`, `employee_name`, `employee_email`, `status`, `note`, `hr_note`, `requested_at`, `resolved_at`.

---

### `backend/internal_perks/views.py`

#### `get_user_company(user)` helper
Looks up the user's company via `user.company` (direct FK on the User model). Falls back to `Company.objects.filter(created_by=user).first()` for employers who created a company directly. Returns `None` if no company found.

#### `is_hr(user)` helper
Returns `user.role == 'employer'`. Only the `employer` role exists in this codebase (no separate `hr` role).

| View | Method | URL | Who | What |
|---|---|---|---|---|
| `InternalPerkListView` | GET | `/api/internal-perks/` | Employee/Employer | Lists all `is_active=True` perks for the user's company |
| `InternalPerkListView` | POST | `/api/internal-perks/` | Employer only | Creates a new internal perk |
| `InternalPerkDetailView` | GET | `/api/internal-perks/<pk>/` | Any | Single perk detail |
| `InternalPerkDetailView` | PATCH | `/api/internal-perks/<pk>/` | Employer only | Edit any field (title, description, icon, slots, is_free, credit_cost, requires_approval, is_active) |
| `InternalPerkDetailView` | DELETE | `/api/internal-perks/<pk>/` | Employer only | Soft-deletes: sets `is_active=False`, returns 204 |
| `InternalPerkRedeemView` | POST | `/api/internal-perks/<pk>/redeem/` | Employee | Request/redeem a perk |
| `HRRedemptionListView` | GET | `/api/internal-perks/hr/requests/` | Employer only | All redemptions for company's perks. Filter by `?status=pending\|approved\|denied` |
| `HRRedemptionResolveView` | POST | `/api/internal-perks/hr/requests/<pk>/resolve/` | Employer only | `{action: 'approve'\|'deny', hr_note: ''}` |

**Redeem flow (`InternalPerkRedeemView`):**
1. Block if already has `pending` or `approved` redemption for this perk
2. Block if `slots_remaining === 0`
3. If `not is_free AND credit_cost > 0`: deduct credits from wallet, create `Transaction(type='debit')`
4. Create `InternalPerkRedemption` with `status='approved'` (if `requires_approval=False`) or `status='pending'`

**Resolve flow (`HRRedemptionResolveView`):**
- On `deny`: if perk had a credit cost, refunds credits back to employee wallet and creates `Transaction(type='refund')`
- Sets `resolved_at = timezone.now()`

---

### `backend/internal_perks/urls.py`

Mounted at `api/internal-perks/` in `backend/config/urls.py`.

```
GET/POST  api/internal-perks/                           → InternalPerkListView
GET/PATCH/DELETE api/internal-perks/<pk>/               → InternalPerkDetailView
POST      api/internal-perks/<pk>/redeem/               → InternalPerkRedeemView
GET       api/internal-perks/hr/requests/               → HRRedemptionListView
POST      api/internal-perks/hr/requests/<pk>/resolve/  → HRRedemptionResolveView
```

**URL ordering note:** `hr/requests/` pattern must come BEFORE `<pk>/` in urls.py, otherwise `hr` would be matched as an integer pk. This is correctly handled — `'hr/requests/'` is listed before `'<int:pk>/'`.

---

### `backend/internal_perks/migrations/0001_initial.py`

Hand-written migration (auto-generation was not possible in the agent environment). Depends on `companies.0003_add_departments` because `InternalPerk` has a FK to `companies.Company`. Creates `InternalPerk` and `InternalPerkRedemption` tables.

---

## Mobile

### `mobile/lib/api.js` — Added functions

```js
getInternalPerks()              // GET /api/internal-perks/
getInternalPerk(id)             // GET /api/internal-perks/<id>/
redeemInternalPerk(id, note)    // POST /api/internal-perks/<id>/redeem/ — { note }
```

---

### `mobile/app/(tabs)/catalog.js` — Modified

**New state:**
```js
const [internalPerks, setInternalPerks] = useState([]);
```

**New function `loadInternalPerks()`** — calls `getInternalPerks()`, gracefully catches errors (user may not be an employee with a company).

**New inline component `InternalPerkCard({ perk, onPress })`:**
- Row layout: icon square (52×52, indigo bg), title + truncated description, cost/slots/status badges
- Status badge color: pending = amber, approved = green, denied = red
- Navigates to `/internal-perk/<id>` on press

**`ip` StyleSheet prefix** — all styles for `InternalPerkCard`.

**Rendered in JSX** above the external perks `FlatList`, only when:
- `internalPerks.length > 0`
- No active search (`!search`)
- No category filter (`!selectedCategory`)

```jsx
{internalPerks.length > 0 && !search && !selectedCategory && (
  <View>
    <Text style={styles.sectionTitle}>🏢 Your Company Perks</Text>
    {internalPerks.map(p => (
      <InternalPerkCard key={p.id} perk={p} onPress={() => router.push(`/internal-perk/${p.id}`)} />
    ))}
  </View>
)}
```

---

### `mobile/app/internal-perk/[id].js` — New Screen

**Route:** `/internal-perk/<id>` (dynamic segment `id`)

**State:** `perk`, `loading`, `note` (employee's optional message), `requesting`

**Three conditional sections:**

1. **Hero card** — always shown: large emoji icon, title, company name, FREE/credit cost badge, slots remaining badge (amber, only if `slots_remaining !== null`)

2. **Description card** — always shown: perk description with uppercase "ABOUT THIS PERK" label

3. **Status card** (shown when `perk.has_requested === true`):
   - `pending` → amber border + "⏳ Request Pending"
   - `approved` → green border + "✅ Approved!"
   - `denied` → red border + "❌ Denied"
   - Color derived from `my_request_status`

4. **Request form** (shown when NOT already requested):
   - Optional note `TextInput` (multiline)
   - Submit button: "📬 Request This Perk" when `requires_approval=true`, "✅ Redeem Now" when auto-approve
   - "Requires HR approval" hint shown below button when applicable

Uses `KeyboardAvoidingView` (iOS padding) + `keyboardShouldPersistTaps="handled"` for keyboard safety.

---

## Web Dashboard

### `web/app/employer/internal-perks/page.tsx` — New Page

**Route:** `/employer/internal-perks`

Uses `AppShell` with `role="employer"`, same layout as all other employer pages.

#### Perks Section (top half)
- Header + "Add Perk" button (opens create modal)
- Quick stat cards: first 4 active perks shown as clickable mini-cards (click opens edit modal)
- Full `DataTable` with columns: Perk (icon + title + description), Cost, Slots, Approval, Status, Actions (Edit + Deactivate)
- "Deactivate" is soft-delete — sets `is_active=False` via DELETE endpoint

#### Employee Requests Section (bottom half)
- Status filter tabs: `pending | approved | denied | All`
- Pending count badge (animated pulse) shown on "pending" tab
- `DataTable` with columns: Employee (avatar initial + name + email), Perk (icon + title), Note, Requested date, Status badge, Actions
- Actions only shown for `status === 'pending'` rows: green "Approve" + red "Deny" buttons
- Clicking Approve/Deny opens the **HR Note modal** before submitting

#### Create/Edit Perk Modal
Fields in order:
1. **Icon picker** — 10 emoji buttons, selected state = `border-[#3D5AFE] scale-110`
2. **Title** — text input, required
3. **Description** — textarea, required
4. **Free perk toggle** — custom toggle switch. When ON, credit cost field is hidden
5. **Credit cost** — number input, only shown when `is_free = false`
6. **Available slots** — number input, empty = unlimited
7. **Requires approval toggle** — custom toggle switch

#### HR Note Modal
Small modal opened before approve/deny. Optional note textarea. Submit sends `POST /api/internal-perks/hr/requests/<id>/resolve/` with `{action, hr_note}`. On success, reloads the redemptions table.

### `web/lib/api.ts` — Added functions

```typescript
getInternalPerks()                    // GET /api/internal-perks/
createInternalPerk(data)              // POST /api/internal-perks/
updateInternalPerk(id, data)          // PATCH /api/internal-perks/<id>/
deleteInternalPerk(id)                // DELETE /api/internal-perks/<id>/
getHRInternalRequests(status?)        // GET /api/internal-perks/hr/requests/?status=...
resolveInternalRequest(id, action, hr_note?)  // POST /api/internal-perks/hr/requests/<id>/resolve/
```

### `web/components/AppShell.tsx` — Modified

Added to `employerNav`:
```tsx
{ label: 'Internal Perks', href: '/employer/internal-perks', icon: Building2 }
```
`Building2` was already imported for the Departments nav item.

---

## Registration

- `'internal_perks'` added to `INSTALLED_APPS` in `backend/config/settings.py`
- `path('api/internal-perks/', include('internal_perks.urls'))` added to `backend/config/urls.py`

---

## Key Design Decisions

**Why soft-delete instead of hard-delete?**
`is_active = False` preserves historical redemption records. Employees who previously requested the perk can still see their request status. Hard deleting would orphan `InternalPerkRedemption` rows.

**Why does `pending` count against slots?**
Prevents overbooking. If 10 slots exist and 10 pending requests come in, the 11th employee is blocked. If some get denied, slots free up. This is the safest behavior for limited-quantity perks like "Team Lunch with CEO".

**Why is there both `is_free` and `credit_cost`?**
Allows an employer to set a credit cost for reference (e.g. "this is worth 100 credits") while still marking it as free. The `is_free` flag is the authoritative gate — credits are only deducted when `not is_free AND credit_cost > 0`.

**Why no separate HR role?**
The codebase only has `role='employer'`. The `is_hr()` helper checks for `employer` role. If an `hr` role is added in future, update the helper.

---

## Testing Checklist

1. Log in as employer at `/employer/internal-perks`
2. Click "Add Perk" → create "Extra Day Off" with icon 🏖️, free, requires approval, 3 slots
3. Log in as employee on mobile → Catalog tab → see "Your Company Perks" section at top
4. Tap "Extra Day Off" → detail screen → submit request with a note
5. Back in web dashboard → Requests tab shows pending request
6. Click "Approve" → enter note → confirm → status becomes approved
7. Employee refreshes → status badge turns green ✅
8. Create a second paid perk (e.g. 50 credits, auto-approve) → employee redeems → credits deducted instantly, status = approved immediately
9. Set available_slots = 1 → two employees try to request → second is blocked "No slots remaining"
10. Click Deactivate on a perk → disappears from mobile catalog
