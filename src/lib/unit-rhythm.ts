import type { Assessment, Unit } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
import { formalAssessmentsInUnit, teOpportunitiesInUnit } from "@/lib/assessment-source";
import { normalizeAssessmentType, type AssessmentTypeSlug } from "@/lib/assessment-types";

export type LessonRhythmKind = "none" | "formative" | "supporting" | "summative";

export interface LessonRhythmPoint {
  lessonNum: number;
  kind: LessonRhythmKind;
  assessmentCount: number;
  expectedDays?: number;
  /** Short label for tooltip, e.g. "Formative" or "2 formatives" */
  typeHint: string;
}

export interface UnitRhythmOverview {
  lessonCount: number;
  formalAssessmentCount: number;
  teOpportunityCount: number;
  suggestedPacingDays?: number;
  points: LessonRhythmPoint[];
  summaryLine: string;
}

export const RHYTHM_LEGEND: {
  kind: LessonRhythmKind;
  label: string;
  description: string;
}[] = [
  {
    kind: "none",
    label: "TE opportunities",
    description: "Assessment opportunities in the Teacher Edition only",
  },
  {
    kind: "formative",
    label: "Formative",
    description: "Formal formative assessment",
  },
  {
    kind: "supporting",
    label: "Reflection & feedback",
    description: "Lesson reflection, peer feedback, or similar",
  },
  {
    kind: "summative",
    label: "Summative",
    description: "End-of-unit or performance task assessment",
  },
];

export function lessonRowId(lessonNum: number): string {
  return `unit-lesson-${lessonNum}`;
}

export function scrollToLessonRow(lessonNum: number): void {
  document.getElementById(lessonRowId(lessonNum))?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function isSummativeAssessment(assessment: Assessment): boolean {
  return assessment.isSummative === true || assessment.assessmentType === "summative";
}

function assessmentSlug(assessment: Assessment): AssessmentTypeSlug {
  if (assessment.assessmentType) return assessment.assessmentType;
  return normalizeAssessmentType(assessment.typeLabel);
}

function categoryForAssessment(assessment: Assessment): LessonRhythmKind {
  if (isSummativeAssessment(assessment)) return "summative";
  const slug = assessmentSlug(assessment);
  if (slug === "formative") return "formative";
  return "supporting";
}

const CATEGORY_PRIORITY: LessonRhythmKind[] = [
  "summative",
  "formative",
  "supporting",
];

function rhythmKindForAssessments(assessments: Assessment[]): LessonRhythmKind {
  if (assessments.length === 0) return "none";
  const categories = new Set(assessments.map(categoryForAssessment));
  for (const kind of CATEGORY_PRIORITY) {
    if (categories.has(kind)) return kind;
  }
  return "supporting";
}

function typeHintForAssessments(assessments: Assessment[], kind: LessonRhythmKind): string {
  if (kind === "none") return "TE opportunities";
  if (assessments.length > 1) {
    const byKind = assessments.reduce<Record<string, number>>((acc, a) => {
      const cat = categoryForAssessment(a);
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
    const parts = Object.entries(byKind).map(([cat, n]) => {
      const label =
        cat === "formative"
          ? "formative"
          : cat === "summative"
            ? "summative"
            : "reflection/feedback";
      return `${n} ${label}`;
    });
    return parts.join(", ");
  }
  const slug = assessmentSlug(assessments[0]);
  if (slug === "formative") return "Formative";
  if (slug === "summative") return "Summative";
  if (slug === "lesson-reflection") return "Lesson reflection";
  if (slug === "peer-feedback") return "Peer feedback";
  return "Assessment";
}

export function buildUnitRhythm(unit: Unit): UnitRhythmOverview {
  const lessonCount = unit.lessonCount ?? 8;
  const byLesson = new Map<number, Assessment[]>();

  for (const assessment of unit.assessments) {
    const n = lessonNumber(assessment.lesson);
    if (n == null) continue;
    const list = byLesson.get(n) ?? [];
    list.push(assessment);
    byLesson.set(n, list);
  }

  const formalAssessmentCount = formalAssessmentsInUnit(unit.assessments).length;
  const teOpportunityCount = teOpportunitiesInUnit(unit.assessments).length;

  const points: LessonRhythmPoint[] = [];
  for (let lessonNum = 1; lessonNum <= lessonCount; lessonNum += 1) {
    const allInLesson = byLesson.get(lessonNum) ?? [];
    const formalOnly = formalAssessmentsInUnit(allInLesson);
    const lessonMeta = unit.lessons?.find((l) => l.lessonNum === lessonNum);
    const kind = rhythmKindForAssessments(formalOnly);
    points.push({
      lessonNum,
      kind,
      assessmentCount: formalOnly.length,
      expectedDays: lessonMeta?.expectedDays,
      typeHint: typeHintForAssessments(formalOnly, kind),
    });
  }

  const summaryParts = [
    `${lessonCount} lessons`,
    `${formalAssessmentCount} assessment${formalAssessmentCount === 1 ? "" : "s"}`,
    `${teOpportunityCount} TE opportunit${teOpportunityCount === 1 ? "y" : "ies"}`,
  ];
  if (unit.suggestedPacingDays != null) {
    summaryParts.push(`length: ${unit.suggestedPacingDays} days`);
  }
  const summaryLine = summaryParts.join(" · ");

  return {
    lessonCount,
    formalAssessmentCount,
    teOpportunityCount,
    suggestedPacingDays: unit.suggestedPacingDays,
    points,
    summaryLine,
  };
}
