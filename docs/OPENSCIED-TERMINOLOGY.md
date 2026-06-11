# OpenSciEd terminology

Reference for **teacher-facing copy** in the Assessment Library. Use OpenSciEd’s language in the UI; internal ingest code may still use `formal-assessment` / `te-opportunity`.

**Related:** [OPENSCIED-ASSESSMENT-SYSTEM.md](./OPENSCIED-ASSESSMENT-SYSTEM.md) (system explainer) · [STYLE-GUIDE.md](./STYLE-GUIDE.md) (typography) · `src/lib/ose-vocabulary.ts` (label constants)

**OpenSciEd sources:** [What type of assessments are available?](https://openscied.org/knowledge/what-type-of-assessments-are-available-in-an-openscied-unit/) · [Rubrics and answer keys](https://openscied.org/knowledge/are-rubrics-and-answer-keys-available-for-the-assessments/) · [Assessment System 101](https://openscied.org/on-demand-hub/ose-assessment-system-101/)

---

## Master terminology table

| Term | What it means | Where teachers find it | In this app | Internal / code |
| --- | --- | --- | --- | --- |
| **Assessment system** | Holistic set of pre-, formative, summative, self-, and peer assessments embedded across a unit — designed to work together, not as disconnected worksheets | Described in Teacher Handbook and unit TE | Unit summary line; rhythm strip legend | — |
| **Assessment** | Standalone document from unit materials — student handout, answer key, sometimes rubric. Example: *Soccer Assessment*, *Cheerleading Performance Task*. Typically **~8 per middle-school unit** | Lesson folder in the **unit download** (`… Assessment ….docx`); listed under student materials as **Assessments** | Table row kind; detail materials; tab **Assessments** | `source: "formal-assessment"` · `ASSESSMENT_DOCUMENT_LABEL` |
| **Assessment opportunity** | Call-out in the Teacher Edition learning plan, headed **ASSESSMENT OPPORTUNITY**, with facilitation fields. Used **while teaching** to notice student thinking. Typically **~30–40 per unit**; most are guidance-only | **Teacher Edition** learning plan (embedded call-out boxes) | Table row kind (purple marker); collapsible lesson summaries; tab **Assessments & opportunities** | `source: "te-opportunity"` · `ASSESSMENT_OPPORTUNITY_LABEL` |
| **Assessment category** | OpenSciEd label for the **purpose** of a moment — not the same as row kind | On every row in TE and materials | Shown after kind, e.g. `Assessment · Formative assessment` | `assessmentType` slug → `assessmentTypeLabel()` |
| **Pre-assessment** | Surfaces prior ideas before new instruction | TE opportunities; some standalone assessments | Rhythm marker; row secondary label | `pre-assessment` |
| **Formative assessment** | Monitors learning during instruction; teachers adjust teaching in response | Most assessment opportunities; many standalone assessments | Rhythm marker (orange); default category when unspecified | `formative` (+ aliases: lesson-reflection, exit-ticket, etc.) |
| **Summative assessment** | Evaluates learning at a point in time — often end of lesson set or unit | Key moments in TE; performance tasks | Rhythm marker (green) | `summative` |
| **Peer assessment** | Students give or receive feedback from peers | TE blocks; feedback forms in lesson folders | Rhythm marker | `peer-feedback` → label **Peer assessment** |
| **Self-assessment** | Students reflect on their own progress | Reflection checkpoints in TE (less common) | *Not a separate UI slug today* — ingest may classify as formative | Mentioned in OpenSciEd docs; classifier gap |
| **Assessment Overview Table** | Map of **key assessment moments** in the unit, by category and location | Start of unit **Teacher Edition** (or Unit Overview in digital) | QA reference for ingest row counts | — |
| **Lesson-by-Lesson Assessment Opportunities** | Summary list of assessment opportunities and lesson-level performance expectations across the unit | End of teacher guide / TE | — | — |
| **Key assessment moments** | Important checkpoints for which OpenSciEd provides rubrics or answer keys | Listed in Assessment Overview Table; embedded in lessons | Rows with keys/rubrics in materials | — |
| **Teacher Edition** | Lesson-level teacher guide: overview, snapshot, materials, learning plan, embedded call-outs | `… Teacher Edition.docx` per lesson in unit download | **From Teacher Edition** panel; **Open Teacher Edition** action | `teacherEditionPath` |
| **Unit download** | Official OpenSciEd unit folder synced from openscied.org (Drive or local) | openscied.org → Access the Materials | Provenance footnote; ingest source | `ingestedFrom` on unit manifest |
| **Unit materials** / **unit materials folder** | Same as unit download — lesson subfolders with TE, handouts, assessments, keys | Per-lesson folders (`Lesson 1`, `Lesson 2`, …) | TableTerminologyHelp copy | — |
| **Building towards** | What student thinking or work this moment is meant to surface (TE opportunity field) | Inside **ASSESSMENT OPPORTUNITY** block | **From Teacher Edition** panel section | `buildingTowards` |
| **What to look/listen for** | Evidence teachers should notice during instruction (TE opportunity field) | Same block | Panel section | `lookListenFor` |
| **What to do** | Facilitation guidance — when to act, pivot, or give feedback (TE opportunity field) | Same block | Panel section | `whatToDo` |
| **Student handout** | Document students work from (may be an assessment or lesson handout) | Lesson folder | Materials list on assessment detail | `student-handout` package item |
| **Answer key** | Scoring guidance or expected responses for an assessment | Bundled with assessments when OpenSciEd provides one | Materials list | `answer-key` |
| **Rubric** | Criteria for open-ended work | Some summative / performance tasks | Materials list when present | `rubric` |
| **Assessments & Keys** | OpenSciEd label for assessment files in lesson student materials | Lesson folder structure in program docs | — | — |
| **Lesson-level performance expectation (LLPE)** | Three-dimensional learning target for a lesson (SEP + DCI + CCC) | Lesson overview; Lesson-by-Lesson list | Lesson `drivingQuestion` / title metadata | `unit.lessons[]` |
| **Driving question** | Unit- or lesson-level question anchoring instruction | TE lesson overview | Expandable text in lesson column | `drivingQuestion` on lesson row |
| **Assessments & opportunities** | Full catalog view — both row kinds | — | Table focus toggle (default) | `TableFocusMode: "prepare"` |
| **Assessments** (table tab) | Filtered view — standalone documents only; TE opportunities collapsed/hidden | — | Table focus toggle | `TableFocusMode: "unit-assessments"` |
| **Assessment · …** / **Assessment opportunity · …** | Row display pattern: **kind** · **category** | — | `AssessmentDocumentLabel`, `TeOpportunityLabel` | `assessmentRowTypeDisplay()` |

### Eddo-added terms (not OpenSciEd)

| Term | What it means | In this app | Do not confuse with |
| --- | --- | --- | --- |
| **Assessment guide** | Eddo-generated interpretive companion — alignment, strong understanding, emerging ideas, gaps, sample responses | Detail page panel | Teacher Edition facilitation text |
| **From Teacher Edition** | Verbatim scraped TE opportunity content | Panel eyebrow on opportunity / linked assessment detail | Assessment guide |

### Terms to avoid in teacher-facing UI

| Do not say | Say instead |
| --- | --- |
| Named assessment, formal assessment | **Assessment** |
| TE opportunity, TE row | **Assessment opportunity** |
| Unit assessment(s) | **Assessment** (documents) or **assessment system** (whole unit) |
| Type, kind (alone) | **Assessment category** or the specific category name |
| Worksheet, quiz (unless in source title) | **Assessment** or **handout** as appropriate |

---

## Row kinds (the main split)

OpenSciEd presents assessable moments in **two forms**. This is the most important distinction in the library.

```
Unit assessment system
├── Assessment opportunities     (~36)  ← Teacher Edition call-outs
└── Assessments                  (~8)   ← Unit download documents
```

| | **Assessment opportunity** | **Assessment** |
| --- | --- | --- |
| **Source** | Teacher Edition `.docx` | Unit download lesson folder |
| **Header in TE** | `ASSESSMENT OPPORTUNITY` | *(file name, e.g. Soccer Assessment)* |
| **Typical count (8.1)** | ~36 | 8 |
| **Student artifact** | Usually none (guidance only); sometimes links to a handout | Handout + key (+ rubric) |
| **When used** | During instruction | Assigned / collected as a document |
| **Library detail** | From Teacher Edition panel | Materials + optional linked TE + Assessment guide |

Many **Assessments** link to a matching **assessment opportunity** in the same lesson (`linkedTeOpportunityId`) so teachers see facilitation and materials together.

---

## Assessment categories

Categories describe **purpose** in the assessment system. Every library row shows **kind · category** (for example, `Assessment opportunity · Formative assessment`).

| Category | Purpose | Typical timing |
| --- | --- | --- |
| **Pre-assessment** | Surface prior ideas before new instruction | Early in a lesson set |
| **Formative assessment** | Monitor learning and adjust during instruction | Throughout lessons; most opportunities |
| **Summative assessment** | Evaluate learning at a point in time | End of lesson set or unit |
| **Peer assessment** | Students give or receive feedback from peers | Shared designs, arguments, jigsaw |
| **Self-assessment** | Students reflect on their own progress | Reflection checkpoints |

**Code:** `src/lib/assessment-types.ts` — `ASSESSMENT_TYPE_LABELS`, `assessmentTypeLabel()`, `oseRhythmCategory()` for the rhythm strip.

Internal slugs like `lesson-reflection`, `exit-ticket`, and `performance-task` display as **Formative assessment** unless mapped otherwise.

---

## Teacher Edition opportunity fields

Each **ASSESSMENT OPPORTUNITY** block in the TE contains three facilitation fields (scraped verbatim at ingest):

| Field | Teacher question it answers |
| --- | --- |
| **Building towards** | What understanding is this moment designed to reveal? |
| **What to look/listen for** | What evidence should I notice in student work or talk? |
| **What to do** | How should I respond — pivot, press, or give feedback? |

**Code:** `src/lib/ose-guidance-text.ts`, `TeacherEditionGuidancePanel.tsx`

---

## Unit reference materials (OpenSciEd)

| Term | Role |
| --- | --- |
| **Assessment Overview Table** | Unit-wide map of key moments and categories — use to sanity-check ingest counts |
| **Lesson-by-Lesson Assessment Opportunities** | Per-lesson index of opportunities and LLPEs |
| **Unit Storyline** | Lesson-by-lesson summary with lesson questions |
| **Where we are going and NOT going** | Lesson boundaries — what to focus on vs defer |

---

## Table views

| Tab label | Shows | Count includes |
| --- | --- | --- |
| **Assessments & opportunities** | Named assessments + collapsible TE opportunity summaries per lesson | Formal assessments + TE opportunities |
| **Assessments** | Standalone assessment documents only | Formal assessments only |

**Code:** `TableFocusToggle.tsx`, `buildUnitLessonSlots()` in `unit-table-rows.ts`

---

## Materials on an Assessment detail page

| Material | OpenSciEd source | Notes |
| --- | --- | --- |
| **Student handout** | Unit download | Primary student-facing document |
| **Answer key** | Unit download | Expected responses / scoring |
| **Rubric** | Unit download | When provided for open-ended tasks |
| **Teacher Edition** | Unit download | Full lesson context |
| **Assessment guide** | *Eddo-generated* | Not an OpenSciEd document |

---

## Code mapping (quick reference)

| UI concept | Primary files |
| --- | --- |
| Row kind labels | `src/lib/ose-vocabulary.ts` |
| Category labels | `src/lib/assessment-types.ts` |
| Row kind + category display | `src/lib/unit-assessment-organization.ts` → `assessmentRowTypeDisplay()` |
| `source` field | `src/lib/assessment-source.ts` |
| Unit counts / headline | `buildUnitOrganizationSummary()` |
| In-app definitions | `TableTerminologyHelp.tsx` |
| Rhythm strip legend | `RHYTHM_LEGEND` in `src/lib/unit-rhythm.ts` |

---

## Keeping this doc current

When adding teacher-facing labels:

1. Check this table and [STYLE-GUIDE.md](./STYLE-GUIDE.md).
2. Prefer constants in `ose-vocabulary.ts` and `assessment-types.ts` over hard-coded strings.
3. If OpenSciEd introduces a new category or row kind, update ingest classifiers, UI labels, and this doc together.
