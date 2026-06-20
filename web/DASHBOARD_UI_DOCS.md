# Welfare App — Dashboard UI Documentation

> Covers every page and UI feature across both the **Employer** and **Provider** dashboards.

---

## Table of Contents

1. [Shared Shell](#1-shared-shell)
2. [Employer Dashboard](#2-employer-dashboard)
   - [2.1 Overview (Dashboard)](#21-overview-dashboard)
   - [2.2 Employees](#22-employees)
   - [2.3 Approvals](#23-approvals)
   - [2.4 Bundles](#24-bundles)
   - [2.5 Life Moments](#25-life-moments)
   - [2.6 Teams](#26-teams)
   - [2.7 Settings](#27-settings)
3. [Provider Dashboard](#3-provider-dashboard)
   - [3.1 Overview (Dashboard)](#31-overview-dashboard)
   - [3.2 Listings](#32-listings)
   - [3.3 New Perk](#33-new-perk)
   - [3.4 Analytics](#34-analytics)
   - [3.5 Scan QR](#35-scan-qr)

---

## 1. Shared Shell

**Component:** `components/AppShell.tsx`
**Used by:** Every page in both dashboards.

The `AppShell` wraps every dashboard page and provides:

| Element | Description |
|---|---|
| Sidebar / nav | Role-aware navigation links. Renders different items for `employer` vs `provider`. |
| Page title | Passed as a prop (`pageTitle`), shown as the heading of the content area. |
| Content area | Scrollable area where each page renders its content. |

Every page passes `role="employer"` or `role="provider"` to control which nav items appear.

---

## 2. Employer Dashboard

Route prefix: `/employer`

---

### 2.1 Overview (Dashboard)

**Route:** `/employer/dashboard`

The main landing page for employers. Shows a high-level snapshot of welfare spend and engagement.

#### KPI Stat Cards (top row)

Three cards displayed in a responsive 1- to 3-column grid.

| Card | Metric | Icon |
|---|---|---|
| Credits distributed | Total credits spent by the company | CreditCard |
| Avg utilization | Percentage of credits actually redeemed by employees | Percent |
| Employees | Total number of registered employees | Users |

- Each card animates in with a staggered fade-up on load.
- Numbers count up from 0 using the `CountUp` component.
- While data is loading, each card shows a shimmer skeleton placeholder.

#### Spend by Category (bar chart)

- Occupies the left 2/3 of the second row.
- Rendered by `BarChartCard` with `color="#3D5AFE"`.
- X-axis: perk categories. Y-axis: credit amount.
- Shows shimmer bars while loading.

#### Top Perks (ranked list)

- Occupies the right 1/3 of the second row.
- Lists up to 5 most-redeemed perks.
- Each row: rank number, perk name, a proportional progress bar (relative to #1), and redemption count.
- Items animate in with a staggered slide-right.
- Shows shimmer rows while loading.

#### Recent Activity (feed)

- Full-width card below the charts.
- Each item: blue dot indicator, activity description text, and a timestamp.
- Rows highlight on hover.
- Items animate in with staggered fade-up.
- Shows shimmer rows while loading.

---

### 2.2 Employees

**Route:** `/employer/employees`

Manage all employees and allocate welfare credits to them individually or by team.

#### Page Header

| Element | Description |
|---|---|
| Employee count | Shows total number of employees (e.g. "47 employees") with a Users icon |
| "Allocate Credits" button | Opens the Allocate Credits modal targeting all employees (no pre-selection) |

#### Employees Table

A `DataTable` with the following columns:

| Column | Content |
|---|---|
| Name | Avatar (initial in a blue circle), full name, and email below |
| Team | Team name or "—" if unassigned |
| Balance | Credit balance right-aligned in monospaced font with "cr" suffix |
| Last redemption | Date string or "—" |
| Status | `StatusPill` badge (e.g. active, inactive) |
| Actions | "Allocate" link that opens the modal pre-targeted to that employee |

- Shows shimmer skeleton rows while loading.
- Empty state: "No employees yet" with a description when the list is empty.

#### Allocate Credits Modal

Triggered by clicking "Allocate Credits" (bulk) or the "Allocate" row action (individual).

| Field | Type | Notes |
|---|---|---|
| Team (optional) | Dropdown | Only shown for bulk allocation. Options: "All employees" + each team name. |
| Amount (credits) | Number input | Required. Min value 1. |
| Month | Month picker | Required. Defaults to the current month. |

- **Cancel** button closes the modal.
- **Allocate** button submits. Shows a spinner while submitting; disabled when submitting.
- On success: toast notification "Credits allocated".

---

### 2.3 Approvals

**Route:** `/employer/approvals`

Review and act on employee perk requests that require employer sign-off.

#### Page Header

| Element | Description |
|---|---|
| "Perk requests" heading | Static title |
| Pending badge | Amber pulsing badge showing the count of pending requests (e.g. "3 pending"). Only visible when count > 0. |

#### Requests Table

A `DataTable` with the following columns:

| Column | Content |
|---|---|
| Employee | Avatar (initial in blue circle) and full name |
| Perk requested | Name of the perk the employee wants |
| Cost | Credit amount, right-aligned with "cr" suffix |
| Reason | Employee-provided reason or "—" |
| Status | `StatusPill` badge (pending / approved / rejected) |
| Actions | Approve / Reject buttons — only shown for rows with `status === 'pending'` |

**Approve button:** Green styling (`emerald-50` background). Immediately updates the row status to "approved" and shows a success toast.

**Reject button:** Red styling (`red-50` background). Immediately updates the row status to "rejected" and shows a warning toast.

While an action is in-flight for a row, both buttons are disabled and the Approve button shows "…".

- Empty state: "No requests waiting on you" when there are no requests.

---

### 2.4 Bundles

**Route:** `/employer/bundles`

Create pre-configured perk packs and assign them to teams in one click.

#### Page Header

| Element | Description |
|---|---|
| Title + subtitle | "Perk bundles" with description "Pre-configured packs you can assign to teams in one click" |
| "New bundle" button | Opens the Create Bundle modal |

#### Bundle Cards Grid

Responsive grid: 1 column on mobile, 2 on tablet, 3 on desktop.

Each bundle card contains:

| Element | Description |
|---|---|
| Icon + name | Package icon in a blue rounded square, followed by the bundle name |
| Subtitle | Perk count and total credit value (e.g. "4 perks · 1,200 cr total") |
| Perk tags | Color-coded pill badges for each perk in the bundle, colored by category (wellness=green, learning=blue, food=orange, lifestyle=purple, travel=sky, connectivity=indigo) |
| "Assign to team" button | Opens the Assign modal for this specific bundle |

Cards lift on hover (shadow increases).

**Create bundle CTA card:** A dashed-border card at the end of the grid. Clicking it opens the Create Bundle modal.

While loading: 3 shimmer skeleton cards are shown.

#### Create Bundle Modal

| Field | Type | Notes |
|---|---|---|
| Bundle name | Text input | Required. Placeholder: `e.g. "Remote Worker Pack"` |
| Select perks | Checkbox grid | Scrollable (max 260px). Each perk shows as a selectable tile — highlighted in blue when checked. At least one must be selected. |

- **Cancel** closes the modal.
- **Create bundle** submits. Disabled if name is empty or no perks selected. Shows spinner while submitting.
- On success: toast "Bundle created".

#### Assign to Team Modal

Triggered by clicking "Assign to team" on a bundle card.

| Field | Type | Notes |
|---|---|---|
| Team | Dropdown | Required. Lists all available teams. |

- Modal title shows the bundle name: `Assign "Bundle Name"`.
- **Assign** button submits. Disabled until a team is selected.
- On success: toast "Bundle assigned to team".

---

### 2.5 Life Moments

**Route:** `/employer/life-moments`

Review and approve care packages for employees who have reported a life event (e.g. new baby, bereavement).

#### Care Ribbon Header

| Element | Description |
|---|---|
| Title + subtitle | "Care packages" with explanation of the auto-suggest behaviour |
| "N need attention" badge | Pulsing orange badge. Visible only when there are pending events. |
| Progress bar | Thin coral bar showing the ratio of approved events to total. Fills from left as events are approved. Only shown when events exist. |

#### Event Sections

Events are split into two labelled sections:

**Pending Approval** — shown first.
**Approved** — shown below.

Each event is prefixed by a color-coded event type badge:

| Event type | Badge color |
|---|---|
| new_baby | Pink |
| burnout_leave | Amber |
| relocation | Blue |
| bereavement | Slate |
| marriage | Emerald |

Each event renders a `CarePackageCard` which contains the employee details, suggested care package items, and an Approve action. Approving moves the card from the Pending section to the Approved section instantly.

**Empty state:** Centered card with a heart icon and message "No life events pending" when there are no events.

**Loading state:** 2 shimmer skeleton cards.

---

### 2.6 Teams

**Route:** `/employer/teams`

Manage organisational teams that can be assigned bundles and credit allocations.

#### Page Header

| Element | Description |
|---|---|
| Team count | "N teams" dynamically (shows "…" while loading) |
| Subtitle | "Assign bundles and allocate credits across groups" |
| "New team" button | Opens the Create Team modal |

#### Summary Tiles

When there are teams, up to 4 teams are shown as compact tiles in a 2- to 4-column grid.

Each tile shows:
- Team initial in a blue square
- Team name (truncated)
- Member count (large blue number)
- "members" label

Tiles animate in with staggered fade-up.

#### Teams Table

A `DataTable` with the following columns:

| Column | Content |
|---|---|
| Team | Initial avatar (blue square), team name |
| Manager | Manager name or "—" |
| Members | Member count right-aligned with "members" suffix |

- Empty state: "No teams yet" with guidance to create a team.

#### Create Team Modal

| Field | Type | Notes |
|---|---|---|
| Team name | Text input | Required. Placeholder: "e.g. Engineering, Marketing" |

- **Create** button submits. Shows spinner while submitting.
- On success: toast "Team created". New team is added to the list immediately without a full reload.

---

### 2.7 Settings

**Route:** `/employer/settings`

Configure company-wide credit budget and rollover behaviour.

#### Page Header

Title: "Company settings"
Subtitle: "Configure budget allocations and credit behaviour for your organisation"

#### Settings Form (white card, divided into sections)

**Section 1 — Monthly budget**

| Field | Type | Notes |
|---|---|---|
| Credits per employee per month | Number input | Required. Step of 50. Suffix "cr" label inside the input. Hint text: "Allocated at the start of every calendar month" |

Live cost estimate: When a valid budget is entered, a blue info box appears below showing the estimated monthly cost for the whole organisation (calculated as `budget × ~47 employees`).

**Section 2 — Credit behaviour**

| Control | Description |
|---|---|
| "Roll over unused credits" toggle | A custom animated toggle switch. Blue when ON, grey when OFF. Clicking flips state. |

The description text below the toggle changes dynamically:
- **ON:** "Unused credits carry into the next month — employees never lose what they haven't spent."
- **OFF:** "Unused credits expire at month end. This encourages regular engagement with perks."

**Save Footer**

| Element | Description |
|---|---|
| Info text | "Changes take effect from the next monthly allocation" |
| "Save settings" button | Submits the form. Shows spinner icon while saving. Disabled while loading or saving. |

On success: toast "Settings saved".

---

## 3. Provider Dashboard

Route prefix: `/provider`

---

### 3.1 Overview (Dashboard)

**Route:** `/provider/dashboard`

Main landing page for providers. Shows redemption activity and earnings.

#### Verified Provider Badge

Conditionally shown at the top if `is_verified === true`. Green badge with a checkmark icon and "Verified provider" text.

#### KPI Stat Cards (4 cards)

Responsive grid: 1 column on mobile, 2 on tablet, 4 on desktop.

| Card | Metric | Color |
|---|---|---|
| Redemptions this month | Total redemptions in the current month | Blue (#3D5AFE) |
| Credits earned | Total credits earned | Green (#1F9D6B) |
| Top performer | Redemption count of the #1 perk, with the perk name as a subtitle | Amber (#C9821A) |
| Peak hour | The hour with the most redemptions (text, not a number), with count as subtitle | Grey (#5B5F6B) |

- Numbers count up using `CountUp`.
- Shimmer skeleton shown while loading.

#### Charts (2 panels)

| Chart | Description |
|---|---|
| Redemptions over time (30 days) | Line chart (left, 2/3 width). X-axis: dates. Y-axis: redemption count. |
| Peak usage hours | Bar chart (right, 1/3 width). X-axis: hours. Y-axis: redemptions. |

Both rendered by `BarChartCard`. Show shimmer while loading.

#### Perk Performance Leaderboard

Shown below the charts once data is loaded (hidden if no per-perk data).

Each row shows:
- Rank number
- Perk name (truncated)
- Redemption count (right-aligned)
- Proportional blue progress bar relative to the top perk
- Credits earned (right-aligned, e.g. "1,200 cr")

Rows animate in with staggered slide-right.

---

### 3.2 Listings

**Route:** `/provider/listings`

Manage all perk listings offered by the provider.

#### Page Header

| Element | Description |
|---|---|
| Perk count + status | "N perks listed" with "X active · Y inactive" subtitle |
| "New perk" button | Links to `/provider/listings/new` |

#### Listings Grid

Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop.

Each perk card contains:

| Element | Description |
|---|---|
| Image | 176px tall. If an image URL exists, it renders with a zoom-on-hover effect. Falls back to a gift emoji if no image. |
| Active/Inactive badge | Overlaid top-right on the image. Green for active, grey for inactive. |
| Perk name | Bold, truncated to one line |
| Credit price | Right-aligned blue bold text with "cr" suffix |
| Category badge | Color-coded pill (same palette as bundles) |
| Description | Up to 2 lines, clipped with ellipsis |
| Activate/Deactivate toggle button | Full-width-ish. Toggle icon (ToggleLeft / ToggleRight). Text changes to match current state. |
| Edit button | Icon-only (pencil). Currently a no-op placeholder. |
| Delete button | Icon-only (trash). Opens the Delete confirmation modal. |

Inactive cards are shown at 70% opacity.

**Empty state:** Centred card with a plus icon, "No perks listed yet", and an "Add first perk" CTA button linking to `/provider/listings/new`.

**Loading state:** 6 shimmer skeleton cards.

#### Delete Confirmation Modal

Triggered by the trash icon on any listing card.

- Title: "Delete listing"
- Body: Warning that the listing will be permanently removed.
- **Cancel** button closes the modal.
- **Delete** button (red) confirms deletion. Shows spinner while deleting. On success: toast "Listing deleted" and the card is removed from the grid.

---

### 3.3 New Perk

**Route:** `/provider/listings/new`

A full-page form for creating a new perk listing.

#### Navigation

"Back to listings" link (arrow left icon) at the top — uses `router.back()`.

#### Form Fields

| Field | Type | Required | Notes |
|---|---|---|---|
| Perk name | Text input | Yes | Placeholder: "e.g. Monthly Gym Membership". Shows inline error if empty on submit. |
| Category | Dropdown | Yes | Options: Wellness, Food, Travel, Learning, Connectivity, Lifestyle. Inline error if unselected. |
| Credit price | Number input | Yes | Min 1. "cr" suffix label inside input. Inline error if 0 or empty. |
| Description | Textarea | No | 3 rows, vertically resizable. Placeholder asks what the perk includes. |
| Tags | Text input + Add button | No | Type a tag and press Enter or click "Add". Tags appear as removable pill badges below the input. Each tag has an X button to remove it. |

Category and Credit price are in a 2-column side-by-side layout.

#### Form Actions

| Button | Behaviour |
|---|---|
| Cancel | Navigates back |
| List perk | Submits. Disabled while submitting. Shows spinner and "Listing…" text during submission. |

On success: toast "Perk listed successfully" and redirect to `/provider/listings`.
On error: toast "Could not create perk. Try again."

---

### 3.4 Analytics

**Route:** `/provider/analytics`

Deep-dive analytics for provider perk performance.

#### Page Header

Title: "Performance analytics"
Subtitle: "Track your perk redemptions, peak hours, and earnings"

#### Summary Cards (4 cards)

Responsive 2- to 4-column grid.

| Card | Metric | Color |
|---|---|---|
| Total redemptions | Redemptions this month | Blue |
| Credits earned | Sum of all credits across all perks | Green |
| Top perk | Redemption count of #1 perk, with perk name as subtitle | Amber |
| Peak hour | Hour string (text override), with peak count as subtitle | Grey |

Shimmer shown while loading.

#### Charts (2 panels, side by side on desktop)

| Chart | Description |
|---|---|
| Redemptions by perk | Bar chart. X-axis: perk names. Y-axis: redemption count. |
| Peak usage times | Bar chart. X-axis: hours. Y-axis: redemptions. |

#### Per-Perk Breakdown Table

Full-width table inside a white card. Columns:

| Column | Content |
|---|---|
| Perk | Perk name in medium weight |
| Redemptions | Count right-aligned, with a proportional blue mini-bar behind it |
| Credits earned | Total credits in monospaced font with "cr" suffix |

- Empty state: "No redemptions yet" with guidance.

---

### 3.5 Scan QR

**Route:** `/provider/scan`

Allows a provider to redeem an employee's welfare QR code in person (e.g. at a physical location).

#### Page Header

QR code icon + "Redeem employee QR" heading.

#### Camera Viewfinder

Square dark card containing:

| State | Display |
|---|---|
| Requesting permission | Spinning white loader |
| Permission granted | Live camera feed (`<video>` element using rear-facing camera) |
| Permission denied | Camera icon + "Camera access denied" message |

Overlaid on the camera feed (all states): a white corner-bracket scan target frame (48x48 box) centered in the viewfinder.

#### Manual Code Entry

A white card below the viewfinder with:

- Label: "Or enter code manually"
- Text input: placeholder "Paste redemption code"
- **Redeem** button: Submits the code. Disabled when input is empty or while submitting. Shows "…" while submitting.
- Pressing Enter in the input also submits.

#### Success State

Replaces the viewfinder and manual input with a green confirmation card:

| Element | Content |
|---|---|
| Icon | Large green checkmark |
| Heading | "Redeemed" |
| Perk name | Name of the redeemed perk |
| Employee | "for [employee name]" |
| Button | "Scan another" — resets back to idle state |

Also fires a success toast: "Redeemed: [perk name]".

#### Error State

Replaces the UI with a red error card:

| Element | Content |
|---|---|
| Icon | Large red alert circle |
| Heading | "Redemption failed" |
| Error message | Context-specific: "already redeemed", "expired", or "Invalid or unrecognized QR code" |
| Button | "Try again" — resets back to idle state |

---

## Component Reference

Shared UI components used across all dashboard pages:

| Component | Description |
|---|---|
| `AppShell` | Sidebar + layout wrapper, role-aware navigation |
| `StatCard` | KPI metric card with shimmer loading state |
| `BarChartCard` | Recharts-based bar or line chart in a white card |
| `DataTable` | Sortable/paginated table with loading and empty states |
| `StatusPill` | Color-coded status badge (active, pending, approved, rejected, etc.) |
| `Modal` | Accessible overlay dialog with backdrop, title, and close button. Supports `sm`, default, and `lg` sizes. |
| `FormField` | Label + input wrapper with optional hint text and inline error message |
| `Toast` | Toast notification system (success, warn, error variants) |
| `CountUp` | Animated number counter from 0 to a target value |
| `AnimatedSection` | Wrapper that fades/slides children in on mount with configurable direction and delay |
| `EmptyState` | Standardised empty state with icon, title, and body text |
| `CarePackageCard` | Card for a single life event with approve action |
| `PerkCard` | Perk display card (used in marketplace contexts) |
