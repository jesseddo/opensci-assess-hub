import type { Assessment, Unit } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
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
  assessmentOpportunities: number;
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
    label: "No assessment",
    description: "Lesson content is in the Teacher Edition only",
  },
  {
    kind: "formative",
    label: "Formative",
    description: "Formative check or handout assessment",
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
  if (kind === "none") return "No assessment in library";
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

  const assessmentOpportunities = unit.assessments.length;

  const points: LessonRhythmPoint[] = [];
  for (let lessonNum = 1; lessonNum <= lessonCount; lessonNum += 1) {
    const assessments = byLesson.get(lessonNum) ?? [];
    const lessonMeta = unit.lessons?.find((l) => l.lessonNum === lessonNum);
    const kind = rhythmKindForAssessments(assessments);
    points.push({
      lessonNum,
      kind,
      assessmentCount: assessments.length,
      expectedDays: lessonMeta?.expectedDays,
      typeHint: typeHintForAssessments(assessments, kind),
    });
  }

  const opportunityLabel =
    assessmentOpportunities === 1 ? "opportunity" : "opportunities";
  const summaryParts = [
    `${lessonCount} lessons`,
    `${assessmentOpportunities} assessment ${opportunityLabel}`,
  ];
  if (unit.suggestedPacingDays != null) {
    summaryParts.push(`${unit.suggestedPacingDays} days suggested pacing`);
  }
  const summaryLine = summaryParts.join(" · ");

  return {
    lessonCount,
    assessmentOpportunities,
    suggestedPacingDays: unit.suggestedPacingDays,
    points,
    summaryLine,
  };
}
