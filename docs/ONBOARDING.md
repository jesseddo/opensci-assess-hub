# 5-minute onboarding — Assessment Library ingest

For developers who need the gist before reading [OPENSCIED-INGEST.md](./OPENSCIED-INGEST.md).

---

## What this app is

A **browseable catalog** of OpenSciEd assessments for one unit (8.1 today), built from the **official unit download** (Google Drive folder). Teachers see lessons in order, assessments, and assessment opportunities — not a flat file list.

---

## One command

```bash
npm run ingest:unit -- \
  "/path/to/8.1 Contact Forces" \
  src/data/ingested/unit-8.1.json
```

Requires **Python 3** + **Node**. Regenerates catalog, TE HTML, assessment guides, and TE links.

Then: `npm run dev` → http://localhost:8080

---

## Pipeline in one sentence

**Drive folder → `ingest-unit.mjs` (+ Python extractors) → JSON in `src/data/` → React table & detail UI.**

---

## See the graphs

| How | Where |
|-----|--------|
| **Open in browser (easiest)** | Double-click or open **`docs/diagrams.html`** — renders all Mermaid charts live |
| **PNG snapshot** | **`docs/openscied-ingest-architecture.png`** — system overview image |
| **Full doc with Mermaid source** | **`docs/OPENSCIED-INGEST.md`** — preview in GitHub, VS Code, or Cursor Markdown preview |
| **On GitHub** | Push repo → open `docs/OPENSCIED-INGEST.md` on github.com (Mermaid renders automatically) |

**Cursor / VS Code:** Open `docs/OPENSCIED-INGEST.md` → Markdown Preview (⌘⇧V) — Mermaid may need a Mermaid extension.

**Quick local view:**

```bash
open docs/diagrams.html
```

---

## Two row types (memorize this)

| Type | `source` | What it is |
|------|----------|------------|
| **Assessment** | `formal-assessment` | Unit handout/key (8 per unit) — Soccer, Cheerleading, etc. |
| **Assessment opportunity** | `te-opportunity` | Teacher Edition call-out — building towards, look/listen, what to do |

Each row also has an OpenSciEd **category**: Pre-assessment, Formative, Summative, or Peer assessment (see `assessmentType` in manifest).

---

## Two guidance panels on detail

| Panel | From |
|-------|------|
| **From Teacher Edition** | Scraped TE docx (`extract-te-assessment-opportunities.py`) |
| **Assessment guide** | Generated at ingest (`extract-assessment-guides.py`) from TE + answer key |

Assessments often **link** to an assessment opportunity row (`linkedTeOpportunityId`) so Soccer shows TE facilitation on the handout page.

---

## Key files (only 8)

```text
scripts/ingest-unit.mjs              ← start here
scripts/extract-te-assessment-opportunities.py
scripts/extract-assessment-guides.py
src/data/ingested/unit-8.1.json      ← catalog
src/data/assessment-guides/unit-8.1.json
src/lib/ingest-manifest.ts           ← JSON → TypeScript types
src/components/UnitAssessmentTable.tsx
src/components/AssessmentDetailDialog.tsx
```

---

## Adding unit 8.2 (later)

1. Generalize hardcoded `8.1` in `ingest-unit.mjs`
2. Run ingest → new JSON + guides
3. Add `src/lib/ingested/unit-8.2.ts` + register in `assessment-data.ts`

Details: [OPENSCIED-INGEST.md §8](./OPENSCIED-INGEST.md#8-adding-a-new-unit-checklist)

---

## Prototype vs production

| Works today | Still stubbed |
|-------------|---------------|
| Browse, search, TE expand, guides | Real Google Drive export |
| Ingest from local folder | Google Forms in manifest |
| Detail modal | Routable pages + auth (August) |

---

**Next read:** [OPENSCIED-INGEST.md](./OPENSCIED-INGEST.md) for full pipeline, folder layout, and QA.
