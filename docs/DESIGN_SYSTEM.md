# Design system

All tokens are defined once in `app/globals.css` as CSS variables and
re-exposed to Tailwind via `@theme inline`. Use the variables — don't
hard-code hex values or reach for default Tailwind grays/blues in new UI.

## Color

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#F5F5F1` | page background |
| `--color-paper-raised` | `#FFFFFF` | cards, table surfaces, sidebar |
| `--color-ink` | `#1F2A24` | primary text |
| `--color-ink-muted` | `#5B6660` | secondary text, meta info |
| `--color-border` | `#DDD9CD` | all hairline borders/dividers |
| `--color-primary` | `#2F6F4E` | primary actions (buttons, active nav, links) |
| `--color-primary-hover` | `#24573D` | hover state for primary actions |
| `--color-accent` | `#B8862B` | low-stock warnings, non-critical alerts |
| `--color-danger` | `#A63D40` | destructive actions, error text |
| `--color-danger-bg` | `#F6E9E9` | error message backgrounds |

Usage in Tailwind classes: `bg-[var(--color-primary)]`,
`text-[var(--color-ink-muted)]`, etc.

Rationale: a "ledger book" feel appropriate to a general store's day-to-day
tool — warm paper background, ink-green text, a muted green for actions
rather than a generic SaaS blue. Ochre for warnings (not red) keeps
"low stock" from reading as an error state, since it's routine, not broken.

## Typography

| Token | Font | Role |
|---|---|---|
| `--font-heading` | Roboto Slab (500/700) | page titles, section headers, totals — gives a price-tag/signage feel |
| `--font-sans` | Inter | everything else: body text, tables, form inputs |

Numbers that matter (prices, quantities, totals) should get the `.tnum`
utility class (defined in `globals.css`), which sets
`font-variant-numeric: tabular-nums` so digits align in columns.

## Layout

Left sidebar (`components/Sidebar.tsx`), fixed width, listing the four
top-level routes. Main content area is left-aligned, not centered — this is
a working tool used all day, not a marketing page. Avoid introducing a
different navigation pattern (top nav, tabs) without updating this doc.

## Adding new UI

Before adding a new component, check whether an existing pattern already
covers it (e.g. the table styling in `app/products/page.tsx`, the card
styling in `app/page.tsx`). Reuse the same border/radius/spacing scale
instead of inventing a new one per page — the whole app should read as one
tool, not a collection of separately-styled screens.

If a task genuinely needs a new color (e.g. a second warning tier), add it
as a named token in `app/globals.css` and document it here rather than
inlining a one-off hex value in a component.
