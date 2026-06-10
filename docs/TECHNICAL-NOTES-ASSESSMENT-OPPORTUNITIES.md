# Technical Notes — Assessment opportunity ingest

Dev reference for scraping **Assessment opportunity** blocks from OpenSciEd Teacher Edition `.docx` files.

**Related docs:** [OPENSCIED-INGEST.md](./OPENSCIED-INGEST.md) (full pipeline) · [ONBOARDING.md](./ONBOARDING.md) (5-min start) · [OPENSCIED-ASSESSMENT-SYSTEM.md](./OPENSCIED-ASSESSMENT-SYSTEM.md) (OpenSciEd terminology)

---

## What this does

Reads local **Teacher Edition Word files** (from the OpenSciEd unit download — not the Google Docs API) and produces:

1. **Manifest rows** — `source: "te-opportunity"` in `src/data/ingested/unit-*.json`
2. **Guidance HTML** — `public/guidance/{unit-slug}/L{NN}-AO{n}.html`

Unit 8.1 reference: **~36 rows** from 16 lesson TE files.

---

## Architecture

```text
ingest-unit.mjs
  │
  ├─ builds lessonsForExtract[]  (lessonNum, teacherEditionAbs, handoutAbsPaths)
  │
  └─ exec python3 extract-te-assessment-opportunities.py <repo> <unitId> <json>
         │
         ├─ per lesson: docx_paragraphs() → parse_opportunities()
         ├─ write_guidance_files() → public/guidance/8-1/*.html
         └─ stdout: JSON array of opportunity objects
  │
  ├─ dedup: skip opp if studentHandout already on formal-assessment row
  ├─ applyShortTitle() from unit-*-title-overrides.json
  └─ append rows to manifest → write unit-*.json
```

| Component | Path |
| --- | --- |
| Extractor | `scripts/extract-te-assessment-opportunities.py` |
| Orchestrator | `scripts/ingest-unit.mjs` (lines ~280–362) |
| Title overrides | `src/data/ingested/unit-8.1-title-overrides.json` |
| Type diagnostics | `scripts/diagnose-assessment-types.mjs` |
| UI — detail panel | `src/components/TeacherEditionGuidancePanel.tsx` |
| UI — display parse | `src/lib/ose-guidance-text.ts` |
| Runtime loader | `src/lib/ingest-manifest.ts` → `assessmentsFromManifest()` |

---

## How docx parsing works

### Input format

OpenSciEd TE files are `.docx` (OOXML). The script unzips `word/document.xml` and walks `<w:p>` paragraphs, concatenating `<w:t>` text nodes — **no python-docx dependency**.

### Block detection

Scanner looks for a paragraph exactly matching `ASSESSMENT OPPORTUNITY` (case-insensitive). Each match starts a new block; index increments per lesson (`ao-1`, `ao-2`, …).

### Section extraction

After the header, paragraphs are routed into three fields until a **section boundary**:

| Header pattern | Field |
| --- | --- |
| `Building towards:` | `buildingTowards` |
| `What to look…` / `What to listen…` | `lookListenFor` |
| `What to do:` | `whatToDo` |

**Boundaries** (`is_te_section_boundary`) — stop collecting:

- Numbered activity lines (`1 · …`)
- `End of day`, `MATERIALS:`, `ADDITIONAL GUIDANCE`, `KEY IDEAS`, `ALTERNATE ACTIVITY`
- Long `✱` call-out lines
- Next `ASSESSMENT OPPORTUNITY`

**Page breaks:** If the next paragraph is `continued from previous page`, body text is **appended to the previous opportunity** in the same lesson (does not create a new row).

**Field length:** Each field trimmed to **4000 chars** max (`trim_ao_field`).

### Continuation / narrative fallback

Paragraphs before an explicit section header may land in `lookListenFor` (if they mention listen/circulate) or `whatToDo` under a `narrative` section state.

---

## Derived fields

| Field | Function | Notes |
| --- | --- | --- |
| `id` | `{unitDigits}-{lessonNum}-ao-{index}` | e.g. `81-6-ao-2` |
| `shortTitle` | `compose_short_title()` | Priority: handout filename → look/listen sentence → building-towards paraphrase → `Lesson NN · Check-in N` |
| `peCode` | `extract_pe_code()` | Regex `Building towards: (\d+\.[A-Z0-9]+)` |
| `assessmentType` | `ose_assessment_type()` | Heuristic — see below |
| `opportunityType` | `classify_opportunity()` | Internal only (`observation`, `handout-written`, …) |
| `libraryOutput` | `library_output_for_type()` | Drives package/export rules in app |
| `studentHandout` | `match_handout()` | Keyword match against lesson handout filenames |
| `guidancePath` | `write_guidance_files()` | e.g. `/guidance/8-1/L06-AO2.html` |

Title overrides are applied in **Node** after Python returns (`applyShortTitle` in `ingest-unit.mjs`), not inside the Python script.

---

## Assessment type classifier

`ose_assessment_type()` reads building-towards, look/listen, what-to-do, handout filename, and short title. Order matters:

```text
summative     → performance task, end-of-unit, cheerleading, "part 1/2 assessment"
pre-assessment → "pre-assessment" in look/building
lesson-reflection → "looking back", "reflect on" + learning/unit
peer-feedback → peer/stakeholder feedback, jigsaw, feedback form
formative     → default
```

`lesson-reflection` is stored in ingest but **displayed as Formative assessment** in the UI (`assessment-types.ts`).

**Known gap:** `self-assessment` is not classified; those rows fall through to formative.

Run diagnostics after ingest:

```bash
node scripts/diagnose-assessment-types.mjs src/data/ingested/unit-8.1.json
```

---

## Dedup with formal Assessments

When an opportunity links to a handout path that is **already** a `formal-assessment` row (`source: "formal-assessment"`), the orchestrator **skips** the opportunity row entirely.

Example: Lesson 6 Soccer — the handout exists as Assessment `81-6-soccer-assessment`; TE block `81-6-ao-2` remains in manifest for linking but the duplicate handout opp is not emitted as a separate catalog entry when packaged.

Verify linked TE on Assessment detail via `linkedTeOpportunityId` (set by `extract-assessment-guides.py`, not the TE extractor).

---

## Manifest row contract

After merge in `ingest-unit.mjs`, each opportunity row includes:

```json
{
  "id": "81-6-ao-2",
  "source": "te-opportunity",
  "lesson": "Lesson 06",
  "lessonNum": 6,
  "title": "Soccer assessment (in TE block)",
  "shortTitle": "Soccer assessment (in TE block)",
  "peCode": "6.A",
  "assessmentType": "formative",
  "buildingTowards": "Building towards: 6.A …",
  "lookListenFor": "What to look/listen for: …",
  "whatToDo": "What to do: …",
  "opportunityType": "handout-written",
  "libraryOutput": "handout-guidance",
  "standards": ["MS-PS2-1", "MS-PS2-2"],
  "isSummative": false,
  "description": "OpenSciEd Unit 8.1 Lesson 06 — assessment opportunity from Teacher Edition.",
  "files": {
    "studentHandout": null,
    "teacherGuide": "Lesson 6 - …/8.1 Lesson 6 Teacher Edition.docx",
    "answerKey": null,
    "googleForm": null,
    "rubric": null,
    "guidanceSheet": "/guidance/8-1/L06-AO2.html"
  }
}
```

**Note:** `assessmentType` is omitted from JSON when `formative` or `lesson-reflection` (orchestrator strips default).

At runtime, `ingest-manifest.ts` maps these to `Assessment` objects with `package[]` items. TE facilitation fields render in `TeacherEditionGuidancePanel`; `ose-guidance-text.ts` splits bullets for display.

---

## Guidance HTML artifacts

One file per opportunity: `public/guidance/8-1/L{lesson:02d}-AO{index}.html`

- Self-contained HTML + minimal print CSS
- Sections: Building towards, What to look/listen for, What to do (optional)
- Referenced as `files.guidanceSheet` → `PackageItem` kind `guidance-sheet`
- Prototype opens via `library-actions.ts` stub (toast); production = real URL/CDN

Re-ingest **overwrites** existing HTML files in the unit folder.

---

## Commands

### Full unit ingest (recommended)

```bash
npm run ingest:unit -- \
  "/path/to/8.1 Contact Forces" \
  src/data/ingested/unit-8.1.json
```

### TE extractor only (debug)

```bash
python3 scripts/extract-te-assessment-opportunities.py \
  . 8.1 '[{"lessonNum":6,"shortTitle":"Applying collisions","teacherEditionAbs":"/absolute/path/to/8.1 Lesson 6 Teacher Edition.docx","handoutAbsPaths":[]}]'
```

Stdout is a JSON array — pipe to `jq` for inspection.

### Single-lesson sanity check

1. Run extractor for one lesson (above).
2. Compare `buildingTowards` / `lookListenFor` / `whatToDo` against TE docx side-by-side.
3. Open generated `public/guidance/8-1/L06-AO*.html` in browser.

---

## QA workflow (new unit)

1. Ingest unit → check row count vs TE Assessment Overview Table.
2. `node scripts/diagnose-assessment-types.mjs src/data/ingested/unit-X.Y.json`
3. Review auto `shortTitle` values — add `unit-X.Y-title-overrides.json` for awkward titles (copy 8.1 file as template).
4. Spot-check summative lessons (e.g. L15) and peer lesson (L14).
5. Confirm guidance HTML loads for random sample of rows.
6. Run app — expand TE rows in table, open detail page, verify **From Teacher Edition** panel.

---

## Extending to new units

Today **hardcoded in `ingest-unit.mjs`:**

- `UNIT_ID`, `UNIT_TITLE`
- Lesson `shortTitle` map
- Standards bands by lesson number
- Title overrides path (`unit-8.1-title-overrides.json`)

**Generalization checklist:**

1. Parameterize unit id/title from CLI args or folder metadata.
2. Derive lesson short titles from pacing/overview or config file.
3. Create `unit-X.Y-title-overrides.json` per unit after QA.
4. Guidance output dir auto-uses `unit_id.replace(".", "-")` — no code change needed.
5. Register manifest in `src/lib/ingested/` + `assessment-data.ts`.

Python extractor is **unit-agnostic** except for handout filename prefix regex (`8.1 Lesson`) in `clean_handout_title` — may need parameterization for other grades.

---

## Known limitations

| Limitation | Detail |
| --- | --- |
| Local `.docx` only | No Google Docs API; requires synced Drive download |
| Paragraph-order parsing | Fragile if OpenSciEd changes TE template structure |
| English files only | `Lección` filenames filtered out in orchestrator |
| Heuristic classifier | Misclassification possible — use overrides + diagnose script |
| No self-assessment slug | Not in classifier; defaults to formative |
| `googleForm: null` | Digitization not in ingest scope |
| Hardcoded 8.1 in orchestrator | Other units need ingest-unit generalization |

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Zero TE rows | Python error swallowed | Check console warn from `ingest-unit.mjs`; run extractor standalone |
| Missing lesson | No TE file or wrong path | Verify `teacherEditionAbs` exists; English filename |
| Truncated guidance | 4000-char cap | Expected; full text still in TE docx |
| Wrong title | Auto-title heuristic | Add entry to title-overrides JSON |
| Duplicate Soccer row | Dedup not firing | Confirm handout path matches between formal + opp |
| Empty look/listen | Section boundary hit early | Inspect TE structure; may need parser tweak |
| Wrong category | Classifier heuristic | Fix `ose_assessment_type()` or set `assessmentType` in overrides/diagnostics |

---

## File index

```text
scripts/extract-te-assessment-opportunities.py   # Parser + HTML writer
scripts/ingest-unit.mjs                         # Calls extractor, merges manifest
scripts/diagnose-assessment-types.mjs           # QA helper
src/data/ingested/unit-8.1.json                 # Output manifest (TE + formal rows)
src/data/ingested/unit-8.1-title-overrides.json # shortTitle QA map
public/guidance/8-1/*.html                      # Static guidance snapshots
src/lib/ingest-manifest.ts                      # JSON → Assessment[]
src/lib/ose-guidance-text.ts                    # Bullet parsing for UI
src/components/TeacherEditionGuidancePanel.tsx  # Detail page TE panel
```
