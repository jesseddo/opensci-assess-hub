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
      assessmentType,
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
        assessmentType: extra.assessmentType,
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

assessments.sort((a, b) => a.lessonNum - b.lessonNum || a.title.localeCompare(b.title));

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
const pacingCount = Object.keys(pacing.lessons).length;
console.log(
  `Wrote ${assessments.length} assessments, ${lessonDirs.length} lessons` +
    (pacingCount ? `, ${pacingCount} pacing entries (${pacing.totalDays ?? "?"} days total)` : "") +
    ` → ${outPath}`,
);
