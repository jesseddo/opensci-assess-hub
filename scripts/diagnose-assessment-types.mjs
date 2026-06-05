#!/usr/bin/env node
/**
 * Report assessmentType assignment per row and flag likely misclassifications.
 * Usage: node scripts/diagnose-assessment-types.mjs [path/to/unit-8.1.json]
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const manifestPath =
  process.argv[2] ?? path.join(__dirname, "../src/data/ingested/unit-8.1.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

function oseAssessmentTypeFromFields(input) {
  const building = (input.buildingTowards ?? "").toLowerCase();
  const look = (input.lookListenFor ?? "").toLowerCase();
  const todo = (input.whatToDo ?? "").toLowerCase();
  const handout = (input.studentHandout ?? "").toLowerCase();
  const title = (input.title ?? "").toLowerCase();

  const combined = building + look + todo + handout;
  if (
    /performance task/.test(building) ||
    (/summative/.test(building) && !/formative/.test(building)) ||
    /end-of-unit/.test(building) ||
    /cheerleading headgear assessment/.test(combined) ||
    /cheerleading assessment/.test(combined) ||
    /part [12][:\s].*assessment/.test(combined)
  ) {
    return "summative";
  }
  if (/pre-assessment/.test(look) || /pre-assessment/.test(building) || /pre assessment/.test(look)) {
    return "pre-assessment";
  }
  if (
    /looking back/.test(handout) ||
    /looking back/.test(building) ||
    /lesson reflection/.test(building) ||
    (/reflect on/.test(look) && /learning|unit|lesson/.test(look))
  ) {
    return "lesson-reflection";
  }
  if (
    /peer feedback/.test(building + look + todo) ||
    /stakeholder feedback/.test(building + look + todo + handout) ||
    /provide and receive critiques/.test(building + look) ||
    /receive critiques about/.test(building + look) ||
    /critiques about claims/.test(building + look) ||
    /jigsaw feedback/.test(building + look + todo) ||
    /feedback form/.test(handout) ||
    (/stakeholder/.test(title) && /feedback/.test(title))
  ) {
    return "peer-feedback";
  }
  return "formative";
}

function rhythmKind(slug) {
  if (slug === "summative") return "summative (green)";
  if (slug === "peer-feedback") return "peer assessment (navy)";
  if (slug === "pre-assessment") return "pre-assessment (orange outline)";
  return "formative (orange)";
}

const rows = manifest.assessments.map((a) => {
  const input = {
    buildingTowards: a.buildingTowards,
    lookListenFor: a.lookListenFor,
    whatToDo: a.whatToDo,
    studentHandout: a.files?.studentHandout,
    title: a.title,
  };
  let expected = oseAssessmentTypeFromFields(input);
  if (a.opportunityType === "named-package" || a.isSummative === true) {
    expected = a.assessmentType ?? expected;
  }
  const current = a.assessmentType ?? "missing";
  return { ...a, input, expected, current, match: current === expected };
});

const counts = {};
for (const r of rows) {
  counts[r.current] = (counts[r.current] ?? 0) + 1;
}

console.log(`\n=== assessmentType distribution (${manifestPath}) ===`);
console.log(counts);

const mismatches = rows.filter((r) => !r.match);
console.log(`\n=== Mismatches (${mismatches.length}) ===`);
for (const r of mismatches) {
  console.log(
    `${r.id}\n  title: ${r.title}\n  current: ${r.current} → expected: ${r.expected} (swatch: ${rhythmKind(r.expected)})\n`,
  );
}

const embedded = rows.filter((r) => r.id.includes("-ao-"));
const listenOnly = embedded.filter(
  (r) => !r.files?.studentHandout && /^what to (look|listen)/i.test(r.lookListenFor ?? ""),
);
console.log(`=== Listen/look-only embedded (${listenOnly.length}) — OSE calls these formative checks ===`);
for (const r of listenOnly.slice(0, 8)) {
  console.log(`  ${r.id}: ${r.title} [${r.current}]`);
}
if (listenOnly.length > 8) console.log(`  … and ${listenOnly.length - 8} more`);

console.log("\n=== Embedded by lesson (type counts) ===");
const byLesson = new Map();
for (const r of embedded) {
  const n = r.lessonNum;
  if (!byLesson.has(n)) byLesson.set(n, {});
  const c = byLesson.get(n);
  c[r.current] = (c[r.current] ?? 0) + 1;
}
for (const [n, c] of [...byLesson.entries()].sort((a, b) => a[0] - b[0])) {
  console.log(`  L${String(n).padStart(2, "0")}: ${JSON.stringify(c)}`);
}

process.exit(mismatches.length > 0 ? 1 : 0);
