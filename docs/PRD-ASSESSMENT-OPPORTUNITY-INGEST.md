# PRD — Assessment opportunity extraction from OpenSciEd materials

Plain-language spec for product and engineering. Defines **what we ingest, where it lives, and the extraction instructions** an automated agent (or parser) must follow.

**Prototype reference implementation:** `scripts/extract-te-assessment-opportunities.py` (rule-based `.docx` parser — not Google Docs API, not LLM summarization)  
**Dev details:** [TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md](./TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md)

---

## What we are NOT doing

| Not this | Why |
| --- | --- |
| **Google Docs API scrape** | No live connection to Google Drive/Docs in v1 |
| **Browser automation of Google Docs** | Same — materials are used offline |
| **AI rewriting of TE content** | Teachers must see OpenSciEd’s facilitation text verbatim |
| **Hand-authored guidance** | Source of truth is always the official unit download |

---

## What we ARE doing

Teachers and coaches download a **full OpenSciEd unit** from Google Drive (or receive it from their district). That download is a **folder on disk** — often kept in sync via Drive desktop sync, but the ingest pipeline only needs **local files**.

The pipeline reads **Word documents (`.docx`)** inside that folder — specifically each lesson’s **Teacher Edition** file — and extracts every **Assessment opportunity** block into structured catalog rows for the Assessment Library.

```text
Teacher downloads unit from OpenSciEd
        ↓
Folder on computer (Drive sync or manual download)
  e.g. "8.1 Contact Forces/Lesson 6 - …/8.1 Lesson 6 Teacher Edition.docx"
        ↓
Ingest reads .docx files locally (batch job)
        ↓
Assessment Library rows + detail pages
```

**No internet required at ingest time** beyond having the folder available on the machine running the job.

---

## Where the content lives (source map)

| What you need | Where to find it in the unit folder |
| --- | --- |
| **Assessment opportunities** (primary) | `Lesson N - …/8.1 Lesson N Teacher Edition.docx` — one file per lesson |
| **Lesson handouts** (optional link) | Same lesson folder — files with `Handout` in the name (not Answer Key) |
| **Formal Assessments** (separate ingest step) | Same lesson folder — files with `Assessment` in the name (not Answer Key) |
| **Unit pacing** | `8.1 Unit Overview Materials.docx` at unit root |
| **QA reference** | Assessment Overview Table at start of Teacher Edition (compare row counts) |

**Use English files only.** Skip filenames containing `Lección` (Spanish duplicates).

**Unit 8.1 reference:** 16 lesson folders → 16 Teacher Edition files → ~36 assessment opportunities extracted.

---

## Extraction agent instructions

The following is the **instruction set** an AI agent or automated parser must follow. The prototype implements these rules in Python; production may use an AI document agent **as long as it follows the same rules** — especially **verbatim extraction** of facilitation fields.

### Mission

For each lesson in the unit, open the **Teacher Edition `.docx`**, find every **Assessment opportunity** call-out, and emit one structured record per call-out with the fields below. Do not invent content. Do not summarize Building towards / Look·listen / What to do.

---

### Step 1 — Locate files

1. Scan the unit root for folders named `Lesson 1`, `Lesson 2`, … (sorted by lesson number).
2. In each lesson folder, find the file whose name contains **`Teacher Edition`** and ends in **`.docx`**.
3. Collect handout filenames in the same folder (contains `Handout`, excludes `Answer Key`) for optional linking in Step 5.
4. If a lesson has no Teacher Edition file, log it and continue with other lessons.

---

### Step 2 — Find Assessment opportunity blocks

Read the Teacher Edition **in document order** (paragraph by paragraph).

**Start a new block** when you see a paragraph that is exactly (case-insensitive):

```text
ASSESSMENT OPPORTUNITY
```

Each block gets an index within that lesson: 1st → `ao-1`, 2nd → `ao-2`, etc.

**Stop reading the current block** when you hit any of:

- The next `ASSESSMENT OPPORTUNITY` header
- A numbered activity line (e.g. `1 · …`)
- `End of day`
- `MATERIALS:`
- `ADDITIONAL GUIDANCE`, `KEY IDEAS`, `ALTERNATE ACTIVITY`
- Long sidebar call-outs starting with `✱`

**Page-break continuation:** If the paragraph after a header says `continued from previous page`, **do not** start a new record — append the following text to the **previous** block’s Look/listen or What to do fields.

---

### Step 3 — Extract these fields (verbatim)

From each block, extract **full text** for:

| Field | How to recognize start | Rules |
| --- | --- | --- |
| **buildingTowards** | Paragraph starts with `Building towards:` | Include the label line and all following body text until the next section header or boundary. Copy **verbatim**. Max ~4000 characters. |
| **lookListenFor** | Paragraph starts with `What to look` or `What to listen` | Same — verbatim until boundary. May include bullet lists and sub-headings inside the section. |
| **whatToDo** | Paragraph starts with `What to do:` | Same — verbatim until boundary. Optional (some blocks have little or no What to do). |

**Also extract:**

| Field | Rule |
| --- | --- |
| **peCode** | From Building towards text — pattern like `6.A`, `1.A` immediately after `Building towards:` |
| **lessonNum** | From folder name (`Lesson 6` → 6) |
| **lesson** | Display label e.g. `Lesson 06` |

**Do not** paraphrase or shorten these three facilitation fields in stored output. (Short titles for the table are separate — Step 4.)

---

### Step 4 — Derive display metadata (allowed transformations)

These fields may be **derived** from extracted text; they are not in the TE as a single labeled field:

| Field | Instructions |
| --- | --- |
| **id** | `{unitId digits}{lessonNum}-ao-{index}` — e.g. unit 8.1 lesson 6 2nd AO → `81-6-ao-2` |
| **shortTitle** | Priority order: (1) linked handout filename cleaned of prefixes, (2) first actionable sentence from Look/listen, (3) short phrase from Building towards, (4) fallback `Lesson NN · Check-in N` |
| **assessmentType** | OpenSciEd category — see classification rules in Step 6 |
| **source** | Always `te-opportunity` |

Human QA may override **shortTitle** only via a title-overrides file; facilitation fields stay verbatim.

---

### Step 5 — Link student handout (if any)

Check whether the block’s text **references a handout** in that lesson (match keywords in Building towards / Look·listen / What to do against handout filenames in the lesson folder).

If a handout matches, set **studentHandout** to its relative path in the unit folder.

**Dedup rule:** If that handout is **already cataloged as a formal Assessment** (separate ingest step — file named `… Assessment …`), **do not emit** this assessment opportunity as its own row. The Assessment row will link to the TE facilitation separately.

---

### Step 6 — Classify assessment category

Assign **one** OpenSciEd category slug from the block text (check Building towards, Look/listen, What to do, handout name, short title):

| Category | Assign when text indicates… |
| --- | --- |
| **summative** | Performance task, end-of-unit, cheerleading assessment, “Part 1/2 assessment” |
| **pre-assessment** | “Pre-assessment” in look/listen or building towards |
| **peer-feedback** | Peer/stakeholder feedback, jigsaw feedback, feedback form handout |
| **lesson-reflection** | “Looking back”, lesson reflection (displayed as formative in UI) |
| **formative** | Default when none of the above |

When uncertain, default to **formative** and flag for human QA.

---

### Step 7 — Emit outputs

For each assessment opportunity record, produce:

1. **Catalog row** merged into unit manifest JSON with:
   - All fields from Steps 3–6
   - `files.teacherGuide` → path to this lesson’s Teacher Edition `.docx`
   - `files.guidanceSheet` → URL/path to printable HTML snapshot (optional but in prototype)

2. **Guidance HTML** (prototype): one static page per block with Building towards, Look/listen, What to do — for open/print actions.

3. **Sort order:** by lesson number, then formal Assessments before opportunities, then title.

---

### Step 8 — Quality checks before publish

- [ ] Opportunity count roughly matches Assessment Overview Table in TE (8.1 ≈ 36)
- [ ] Spot-check 3 lessons: facilitation text matches source `.docx` word-for-word
- [ ] Summative lessons (e.g. L15) classified as summative
- [ ] No duplicate row for handouts already listed as Assessments
- [ ] Every row has `Assessment opportunity` kind + category in UI

---

## What the prototype did (reference)

The current codebase **does not use an LLM**. It implements the instructions above with:

- **`extract-te-assessment-opportunities.py`** — opens `.docx` as ZIP, reads `word/document.xml`, walks paragraphs, applies regex/rules from Steps 2–6
- **`ingest-unit.mjs`** — calls the script, applies dedup + title overrides, writes manifest
- **`unit-8.1-title-overrides.json`** — human QA fixes for awkward auto-titles only

If production moves to an **AI document agent**, the agent prompt should embed Steps 1–8. The agent’s job is **structured extraction**, not interpretation or rewriting.

---

## Paste-ready PRD section

### Assessment opportunity ingest — source & method

**Source:** Downloaded OpenSciEd unit folder (local `.docx` files from Drive sync or manual download). **Not** a Google Docs API integration.

**Method:** An automated extraction job reads each lesson’s **Teacher Edition Word file**, locates every **Assessment opportunity** call-out, and copies three facilitation fields verbatim: **Building towards**, **What to look/listen for**, and **What to do**. The job also assigns OpenSciEd assessment category, links lesson handouts when referenced, and skips rows duplicated by standalone **Assessment** documents.

**Agent rules:** Extract verbatim — do not summarize TE text. One catalog row per Assessment opportunity block. English materials only. Light human QA on titles and summative/peer classification.

**Out of scope:** Live Google Docs access; AI-generated paraphrases of facilitation guidance; Google Form digitization.

**Reference unit:** Grade 8 Unit 8.1 — ~36 assessment opportunities from 16 Teacher Edition files.

---

## Related docs

- [OPENSCIED-ASSESSMENT-SYSTEM.md](./OPENSCIED-ASSESSMENT-SYSTEM.md) — what Assessments vs assessment opportunities mean in OpenSciEd
- [TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md](./TECHNICAL-NOTES-ASSESSMENT-OPPORTUNITIES.md) — parser implementation for devs
- [OPENSCIED-INGEST.md](./OPENSCIED-INGEST.md) — full unit ingest pipeline
