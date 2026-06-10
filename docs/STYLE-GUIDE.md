# Typography & style guide

OpenSciEd Assessment Library uses **sans-serif only** — no serif body text anywhere in the app.

## OpenSciEd terminology

Use OpenSciEd’s language in all teacher-facing copy. Internal ingest code may still use `formal-assessment` / `te-opportunity`.

| OpenSciEd term | Meaning | Internal `source` |
| --- | --- | --- |
| **Assessment** | Standalone document from unit materials (handout + key) | `formal-assessment` |
| **Assessment opportunity** | TE call-out — Building towards, Look/listen for, What to do | `te-opportunity` |

Do **not** say “named assessment” or “TE opportunity” in the UI.

### Assessment categories

Every row shows an OpenSciEd **category** after the kind:

| Category | When |
| --- | --- |
| Pre-assessment | Prior-knowledge check before instruction |
| Formative assessment | During instruction — most assessment opportunities |
| Summative assessment | End of lesson set or unit |
| Peer assessment | Student-to-student feedback |

Labels come from `src/lib/assessment-types.ts` (`assessmentTypeLabel`). The rhythm strip and table rows use the same vocabulary.

## Font roles

| Token | Family | Use |
| --- | --- | --- |
| `font-ui` / `--font-sans` | **Inter** | All UI text: body copy, headings, labels, buttons, tables, guidance panels |
| `font-display` / `--font-display` | **Fredoka One** | **eddo** wordmark in the header only |
| `font-mono` / `--font-mono` | **JetBrains Mono** | Standards codes (MS-PS2-1), lesson numbers, technical metadata, filenames |

Do not introduce Georgia, Times, or other serif stacks.

## Type scale (guidance & detail pages)

Defined in `src/components/guidance-panel-ui.ts`:

| Level | Class / token | Size | Example |
| --- | --- | --- | --- |
| Panel eyebrow | `guidancePanelEyebrow` | `text-lg` | FROM TEACHER EDITION |
| Section title | `guidanceSectionTitle` | `text-lg` uppercase | BUILDING TOWARDS |
| Sub-heading | `guidanceSubheading` | `text-base` semibold | Unobservable mechanisms |
| Body | `guidanceBody` | `text-sm` | Paragraphs, bullet lists |
| Detail section | `guidanceDetailSectionLabel` | `text-base` uppercase | Materials, Preview |

Hierarchy: section title → sub-heading → body (each one Tailwind step apart).

## Color tokens (eddo v3)

| Token | Value | Use |
| --- | --- | --- |
| `eddo-green` | `#2f4a3e` | Brand, headings, table headers |
| `eddo-navy` | `#001242` | Primary text, sub-headings |
| `eddo-accent` | `#d96b3c` | Primary actions, links |
| `eddo-cream` | `#f5f1e8` | On-accent text |
| `eddo-violet` | `#6d28d9` | TE assessment opportunity markers |

## Conventions

- **Default:** `font-ui` (Inter) on layout shells (`header`, `main`, panels). Unstyled text inherits Inter from `body`.
- **Wordmark:** `font-display` on the **eddo** logotype only — not on content headings.
- **Mono:** `font-mono` only for codes and numeric/metadata labels — not for sentences.
- **Body copy:** always sans-serif via `font-ui` or inherited from `body`.

## Source of truth

- Theme & font stacks: `src/styles.css`
- Guidance typography tokens: `src/components/guidance-panel-ui.ts`
- Google Fonts load: `src/routes/__root.tsx` and `src/routes/index.tsx`
