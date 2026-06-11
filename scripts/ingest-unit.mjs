#!/usr/bin/env node
/**
 * Scan an OpenSciEd unit folder (Grade 8 download layout) and emit assessment manifest JSON.
 * Usage: node scripts/ingest-unit.mjs "/path/to/8.1 Contact Forces" src/data/ingested/unit-8.1.json
 */
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extractTitleScript = path.join(__dirname, "extract-lesson-title.py");
const extractPacingScript = path.join(__dirname, "extract-lesson-pacing.py");
const extractOpportunitiesScript = path.join(__dirname, "extract-te-assessment-opportunities.py");
const extractGuidesScript = path.join(__dirname, "extract-assessment-guides.py");
const repoRoot = path.join(__dirname, "..");
const titleOverridesPath = path.join(repoRoot, "src/data/ingested/unit-8.1-title-overrides.json");

function loadTitleOverrides() {
  if (!fs.existsSync(titleOverridesPath)) return {};
  const raw = JSON.parse(fs.readFileSync(titleOverridesPath, "utf8"));
  const { _comment, ...overrides } = raw;
  return overrides;
}

const TITLE_OVERRIDES = loadTitleOverrides();

function applyShortTitle(id, shortTitle) {
  return TITLE_OVERRIDES[id] ?? shortTitle;
}

const unitDir = process.argv[2];
const outPath = process.argv[3];

if (!unitDir || !outPath) {
  console.error("Usage: node scripts/ingest-unit.mjs <unit-folder> <output.json>");
  process.exit(1);
}

const UNIT_ID = "8.1";
const UNIT_TITLE = "Contact Forces";
const DEFAULT_STANDARDS = ["MS-PS2-1", "MS-PS2-2"];
const ENERGY_STANDARDS = ["MS-PS2-3"];

function basename(p) {
  return path.basename(p);
}

function listLessonDirs(root) {
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^Lesson \d+/.test(d.name))
    .map((d) => ({ name: d.name, path: path.join(root, d.name) }))
    .sort((a, b) => {
      const na = parseInt(a.name.match(/Lesson (\d+)/)[1], 10);
      const nb = parseInt(b.name.match(/Lesson (\d+)/)[1], 10);
      return na - nb;
    });
}

function listFiles(dir) {
  return fs.readdirSync(dir).map((f) => path.join(dir, f));
}

function englishLessonFiles(files) {
  return files.filter((f) => /8\.1 Lesson \d+/.test(basename(f)) && !/Lecci[oó]n/.test(basename(f)));
}

function relPath(fullPath) {
  return path.relative(unitDir, fullPath);
}

function extractLessonTitle(teacherGuidePath) {
  if (!teacherGuidePath || !fs.existsSync(teacherGuidePath)) return null;
  try {
    const title = execFileSync("python3", [extractTitleScript, teacherGuidePath], {
      encoding: "utf8",
    }).trim();
    return title || null;
  } catch {
    return null;
  }
}

function findUnitOverviewDoc(root) {
  const matches = fs
    .readdirSync(root)
    .filter((f) => /Unit Overview Materials/i.test(f) && /\.docx$/i.test(f))
    .map((f) => path.join(root, f));
  return matches[0] ?? null;
}

function extractLessonPacing(overviewPath) {
  if (!overviewPath || !fs.existsSync(overviewPath)) {
    return { lessons: {}, totalDays: null };
  }
  try {
    const raw = execFileSync("python3", [extractPacingScript, overviewPath], {
      encoding: "utf8",
    }).trim();
    const parsed = JSON.parse(raw);
    return {
      lessons: parsed.lessons ?? {},
      totalDays: parsed.totalDays ?? null,
    };
  } catch (err) {
    console.warn("Could not parse unit overview pacing:", err.message);
    return { lessons: {}, totalDays: null };
  }
}

function titleFromAssessmentFile(file) {
  let title = basename(file)
    .replace(/^8\.1 Lesson \d+ Assessment\s*/i, "")
    .replace(/\.docx$/i, "")
    .trim();
  const partMatch = title.match(/^Part (\d+) Cheerleading$/i);
  if (partMatch) {
    return `Cheerleading Performance Task (Part ${partMatch[1]})`;
  }
  return title;
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function matchKeyForAssessment(assessmentFile, keyFiles) {
  const base = basename(assessmentFile);
  if (/Part 1/i.test(base)) {
    return keyFiles.find((k) => /Part 1/i.test(basename(k)));
  }
  if (/Part 2/i.test(base)) {
    return keyFiles.find((k) => /Part 2/i.test(basename(k)));
  }
  if (/Assessment 1/i.test(base)) {
    return keyFiles.find((k) => /Key 1/i.test(basename(k)));
  }
  if (/Assessment 2/i.test(base)) {
    return keyFiles.find((k) => /Key 2/i.test(basename(k)));
  }
  if (/Soccer/i.test(base)) {
    return keyFiles.find((k) => /Soccer/i.test(basename(k)));
  }
  return keyFiles[0];
}

/** Short display titles for unit table (driving question shown on expand) */
const LESSON_SHORT_TITLES = {
  1: "Things hitting each other",
  2: "Motion and shape in collisions",
  3: "Do all objects bend?",
  4: "Deformation and contact force",
  5: "Mass, speed, and collision forces",
  6: "Applying collisions",
  7: "Kinetic energy and damage",
  8: "Energy in the launcher",
  9: "Forces from air & track",
  10: "Why objects break",
  11: "Designing collision protection",
  12: "Materials and peak forces",
  13: "Cushioning structure",
  14: "Refining designs with stakeholders",
  15: "Evaluating engineer designs",
  16: "Marketing designs (optional)",
};

/** Handouts used as assessment ops but not named "Assessment" in Drive */
const EXTRA_HANDOUT_ASSESSMENTS = {
  7: {
    fileMatch: /Handout Looking back Explaining/i,
    title: "Looking Back — Explaining Collisions",
    assessmentType: "lesson-reflection",
    standards: ENERGY_STANDARDS,
    isSummative: false,
  },
  8: {
    fileMatch: /Handout Modeling other force/i,
    keyMatch: /Answer Key Key for modeling/i,
    title: "Modeling Other Force Interactions",
    assessmentType: "formative",
    standards: ENERGY_STANDARDS,
    isSummative: false,
  },
  14: {
    fileMatch: /Handout Stakeholder Feedback Form/i,
    title: "Stakeholder Feedback Form",
    assessmentType: "peer-feedback",
    standards: DEFAULT_STANDARDS,
    isSummative: false,
  },
};

const lessonDirs = listLessonDirs(unitDir);
const unitOverviewPath = findUnitOverviewDoc(unitDir);
const pacing = extractLessonPacing(unitOverviewPath);
const lessons = [];
const assessments = [];

for (const { name, path: lessonPath } of lessonDirs) {
  const lessonNum = parseInt(name.match(/Lesson (\d+)/)[1], 10);
  const lessonLabel = `Lesson ${String(lessonNum).padStart(2, "0")}`;
  const files = listFiles(lessonPath);
  const en = englishLessonFiles(files);

  const teacherGuide = en.find((f) => /Teacher Edition/i.test(basename(f)));
  const lessonTitle = teacherGuide ? extractLessonTitle(teacherGuide) : null;
  lessons.push({
    lessonNum,
    shortTitle: LESSON_SHORT_TITLES[lessonNum] ?? `Lesson ${lessonNum}`,
    title: lessonTitle ?? `Lesson ${lessonNum}`,
    teacherEditionPath: teacherGuide ? relPath(teacherGuide) : null,
    expectedDays: pacing.lessons[lessonNum] ?? undefined,
  });
  const assessmentFiles = en.filter((f) => {
    const base = basename(f);
    return /Assessment/i.test(base) && !/Answer Key/i.test(base);
  });
  const keyFiles = en.filter((f) => /Answer Key/i.test(basename(f)));

  for (const af of assessmentFiles) {
    const title = titleFromAssessmentFile(af);
    const key = matchKeyForAssessment(af, keyFiles);
    const isSummative = lessonNum === 15 || /Cheerleading/i.test(title);
    const assessmentType = isSummative ? "summative" : "formative";
    assessments.push({
      id: `81-${lessonNum}-${slugify(title)}`,
      lesson: lessonLabel,
      lessonNum,
      title,
      source: "formal-assessment",
      assessmentType,
      opportunityType: "named-package",
      libraryOutput: "full-package",
      standards: lessonNum <= 6 || lessonNum >= 9 ? DEFAULT_STANDARDS : ENERGY_STANDARDS,
      isSummative,
      description: `OpenSciEd Unit ${UNIT_ID} ${lessonLabel} — ${title}.`,
      files: {
        studentHandout: relPath(af),
        teacherGuide: teacherGuide ? relPath(teacherGuide) : null,
        answerKey: key ? relPath(key) : null,
        googleForm: null,
        rubric: null,
      },
    });
  }

  const extra = EXTRA_HANDOUT_ASSESSMENTS[lessonNum];
  if (extra) {
    const handout = en.find((f) => extra.fileMatch.test(basename(f)));
    if (handout) {
      const key = extra.keyMatch ? en.find((f) => extra.keyMatch.test(basename(f))) : null;
      assessments.push({
        id: `81-${lessonNum}-${slugify(extra.title)}`,
        lesson: lessonLabel,
        lessonNum,
        title: extra.title,
        source: "formal-assessment",
        assessmentType: extra.assessmentType,
        opportunityType: "handout-written",
        libraryOutput: "handout-form-planned",
        standards: extra.standards,
        isSummative: extra.isSummative ?? false,
        description: `OpenSciEd Unit ${UNIT_ID} ${lessonLabel} — ${extra.title}.`,
        files: {
          studentHandout: handout ? relPath(handout) : null,
          teacherGuide: teacherGuide ? relPath(teacherGuide) : null,
          answerKey: key ? relPath(key) : null,
          googleForm: null,
          rubric: null,
        },
      });
    }
  }
}

/** Lessons metadata for TE opportunity extraction */
const lessonsForExtract = lessons.map((row) => {
  const lessonPath = lessonDirs.find((d) => d.name.startsWith(`Lesson ${row.lessonNum} `))?.path;
  const files = lessonPath ? listFiles(lessonPath) : [];
  const en = englishLessonFiles(files);
  const te = en.find((f) => /Teacher Edition/i.test(basename(f)));
  const handouts = en.filter((f) => /Handout/i.test(basename(f)) && !/Answer Key/i.test(basename(f)));
  return {
    lessonNum: row.lessonNum,
    shortTitle: row.shortTitle,
    teacherEditionAbs: te ?? null,
    handoutAbsPaths: handouts,
  };
});

let embeddedOpportunities = [];
try {
  const raw = execFileSync(
    "python3",
    [
      extractOpportunitiesScript,
      repoRoot,
      UNIT_ID,
      JSON.stringify(lessonsForExtract.filter((l) => l.teacherEditionAbs)),
    ],
    { encoding: "utf8" },
  ).trim();
  embeddedOpportunities = JSON.parse(raw);
} catch (err) {
  console.warn("Could not extract TE assessment opportunities:", err.message);
}

const packagedHandouts = new Set(
  assessments.map((a) => a.files.studentHandout).filter(Boolean),
);

for (const opp of embeddedOpportunities) {
  const handoutRel = opp.studentHandout
    ? path.relative(unitDir, opp.studentHandout).split(path.sep).join("/")
    : null;
  if (handoutRel && packagedHandouts.has(handoutRel)) {
    continue;
  }
  const lessonNum = opp.lessonNum;
  const lessonLabel = opp.lesson;
  const teacherGuide = lessonsForExtract.find((l) => l.lessonNum === lessonNum)?.teacherEditionAbs;
  const tgRel = teacherGuide ? relPath(teacherGuide) : null;
  const standards =
    lessonNum <= 6 || lessonNum >= 9 ? DEFAULT_STANDARDS : ENERGY_STANDARDS;

  const shortTitle = applyShortTitle(opp.id, opp.shortTitle ?? opp.title);
  const rawType = opp.assessmentType ?? "formative";
  const assessmentType =
    rawType === "formative" || rawType === "lesson-reflection" ? undefined : rawType;

  const row = {
    id: opp.id,
    lesson: lessonLabel,
    lessonNum,
    source: "te-opportunity",
    title: shortTitle,
    shortTitle,
    peCode: opp.peCode ?? null,
    buildingTowards: opp.buildingTowards ?? null,
    lookListenFor: opp.lookListenFor ?? null,
    whatToDo: opp.whatToDo ?? null,
    opportunityType: opp.opportunityType,
    libraryOutput: opp.libraryOutput,
    standards,
    isSummative: rawType === "summative",
    description: `OpenSciEd Unit ${UNIT_ID} ${lessonLabel} — assessment opportunity from Teacher Edition.`,
    files: {
      studentHandout: handoutRel,
      teacherGuide: tgRel,
      answerKey: null,
      googleForm: null,
      rubric: null,
      guidanceSheet: opp.guidancePath ?? null,
    },
  };
  if (assessmentType) row.assessmentType = assessmentType;
  assessments.push(row);
}

assessments.sort((a, b) => {
  if (a.lessonNum !== b.lessonNum) return a.lessonNum - b.lessonNum;
  const aFormal = a.source === "formal-assessment" ? 0 : 1;
  const bFormal = b.source === "formal-assessment" ? 0 : 1;
  if (aFormal !== bFormal) return aFormal - bFormal;
  return a.title.localeCompare(b.title);
});

const manifest = {
  unitId: UNIT_ID,
  unitTitle: UNIT_TITLE,
  description: "How forces act during collisions and impacts.",
  lessonCount: lessonDirs.length,
  suggestedPacingDays: pacing.totalDays ?? undefined,
  unitOverviewPath: unitOverviewPath ? relPath(unitOverviewPath) : null,
  ingestedFrom: unitDir,
  ingestedAt: new Date().toISOString(),
  lessons,
  assessments,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2));

const guidesOutPath = path.join(repoRoot, "src/data/assessment-guides", `unit-${UNIT_ID}.json`);
try {
  const guidesRaw = execFileSync(
    "python3",
    [extractGuidesScript, unitDir, outPath, guidesOutPath],
    { encoding: "utf8" },
  ).trim();
  const guidesResult = JSON.parse(guidesRaw);
  console.log(
    `Wrote ${guidesResult.guideCount} assessment guides (${guidesResult.linkCount} TE links) → ${guidesOutPath}`,
  );
} catch (err) {
  console.warn("Could not extract assessment guides:", err.message);
}

const previewsOutPath = path.join(repoRoot, "src/data/material-previews", `unit-${UNIT_ID}.json`);
const extractPreviewsScript = path.join(__dirname, "extract-material-previews.py");
try {
  execFileSync("python3", [extractPreviewsScript, unitDir, outPath, previewsOutPath], {
    stdio: "inherit",
  });
} catch (err) {
  console.warn("Could not extract material previews:", err.message);
}

const pacingCount = Object.keys(pacing.lessons).length;
const embeddedCount = assessments.filter((a) => a.opportunityType && a.opportunityType !== "named-package").length;
console.log(
  `Wrote ${assessments.length} library rows (${embeddedCount} from TE), ${lessonDirs.length} lessons` +
    (pacingCount ? `, ${pacingCount} pacing entries (${pacing.totalDays ?? "?"} days total)` : "") +
    ` → ${outPath}`,
);
