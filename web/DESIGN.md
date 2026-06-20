# Welfare Marketplace — Design System

## Color Strategy
**Dashboards:** Restrained — tinted neutrals + brand accent ≤10% of surface. Data drives visual weight.
**Marketing:** Committed — brand indigo carries the hero; coral used on Life Moments block.

## Palette (OKLCH equivalents noted)
| Token | Hex | OKLCH approx | Role |
|---|---|---|---|
| `--ink` | #15161A | oklch(10% 0.008 264) | Primary text |
| `--ink-soft` | #5B5F6B | oklch(42% 0.01 264) | Secondary text, labels |
| `--surface` | #FFFFFF | oklch(100% 0 0) | Cards |
| `--canvas` | #F7F8FA | oklch(97.5% 0.004 264) | App background |
| `--line` | #E7E9EE | oklch(92% 0.006 264) | Borders, table rules |
| `--brand` | #3D5AFE | oklch(52% 0.22 264) | Primary actions, active nav |
| `--brand-press` | #2E45C4 | oklch(44% 0.22 264) | Pressed brand |
| `--care` | #E8623D | oklch(62% 0.18 34) | Life Moments only |
| `--care-soft` | #FCEDE7 | oklch(94% 0.03 34) | Care backgrounds |
| `--ok` | #1F9D6B | oklch(59% 0.13 162) | Success, verified |
| `--warn` | #C9821A | oklch(62% 0.14 68) | Pending, expiry |
| `--stop` | #D23B3B | oklch(52% 0.18 25) | Error, rejected |

## Typography
- **Display:** Geist (geometric-humanist) — headlines, page titles, marketing
- **UI:** Inter — all interface text, labels, table content
- **Numbers:** Inter with `font-variant-numeric: tabular-nums` — always on financial figures
- Scale: 0.75 / 0.875 / 1 / 1.125 / 1.5 / 2 / 2.5 / 3.25 rem
- Hierarchy: minimum 1.25x ratio between steps, enforced through both scale AND weight contrast
- Line length: max 65–75ch on body copy

## Spacing
Base unit: 4px. Component padding: multiples of 8px (8/12/16/24/32/48).

## Border Radius
- `--r-sm`: 8px — inputs, badges, chips
- `--r-md`: 12px — cards, panels
- `--r-lg`: 16px — modals, hero panels

## Elevation
One shadow level: `0 1px 2px rgba(21,22,26,.04), 0 4px 16px rgba(21,22,26,.06)`.
Appears on cards. Increases on modals: `0 8px 32px rgba(21,22,26,.12)`.
Flat default; never decorative shadow stacks.

## Icons
Lucide — single stroke weight, functional not decorative, always beside a text label in nav.

## Motion
- Content load: fade-up 8px over 160ms ease-out. Staggered by row in lists.
- Hover: 120ms ease on interactive surfaces only.
- Care Ribbon: `scaleX(0→1)` from left, 400ms cubic-bezier(0.22,1,0.36,1). The one orchestrated moment.
- All motion off under `prefers-reduced-motion`.
- Easing: ease-out-quart or similar exponential curves. No bounce. No elastic.

## Layout rules
- Sidebar: 240px fixed. Collapses to icon rail <1024px, top drawer <768px.
- Content max-width: 1280px. Gutters: 24px.
- Dashboard KPI row: 3 cards across on ≥1024px.
- No nested cards. Cards only where they're the genuinely best affordance.

## Component notes
- StatusPill: text label + background tint. Color is never the sole signal.
- DataTable: sticky first column on scroll, row hover bg #F7F8FA.
- BarChartCard: recharts, brand fill on primary series, no decorative grid lines on Y-axis.
- CarePackageCard: the only component that uses --care and --care-soft. Coral left accent border is the ONE sanctioned use (the entire card is a care context, not a list-item callout).
