import type { Assessment, Unit } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
import { formalAssessmentsInUnit, teOpportunitiesInUnit } from "@/lib/assessment-source";
import { buildUnitOrganizationSummary } from "@/lib/unit-assessment-organization";
import { ASSESSMENT_OPPORTUNITY_LABEL } from "@/lib/ose-vocabulary";
import {
  assessmentTypeLabel,
  normalizeAssessmentType,
  oseRhythmCategory,
  type AssessmentTypeSlug,
  type OseRhythmCategory,
} from "@/lib/assessment-types";

/** Visual rhythm marker — maps to OpenSciEd assessment categories. */
export type LessonRhythmKind = "none" | OseRhythmCategory;

export interface LessonRhythmPoint {
  lessonNum: number;
  kind: LessonRhythmKind;
  assessmentCount: number;
  expectedDays?: number;
  /** Short label for tooltip */
  typeHint: string;
}

export interface UnitRhythmOverview {
  lessonCount: number;
  formalAssessmentCount: number;
  assessmentOpportunityCount: number;
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
    label: ASSESSMENT_OPPORTUNITY_LABEL,
    description: "Call-out in the Teacher Edition lesson plan",
  },
  {
    kind: "formative",
    label: "Formative assessment",
    description: "Conducted during instruction to monitor and adjust teaching and learning",
  },
  {
    kind: "pre-assessment",
    label: "Pre-assessment",
    description: "Checks prior understanding before new instruction",
  },
  {
    kind: "peer-assessment",
    label: "Peer assessment",
    description: "Students give or receive feedback from peers",
  },
  {
    kind: "summative",
    label: "Summative assessment",
    description: "Evaluates learning at a point in time, often end of a lesson set or unit",
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
  return oseRhythmCategory(assessmentSlug(assessment));
}

const CATEGORY_PRIORITY: LessonRhythmKind[] = [
  "summative",
  "peer-assessment",
  "pre-assessment",
  "formative",
];

const RHYTHM_KIND_SHORT: Record<Exclude<LessonRhythmKind, "none">, string> = {
  formative: "formative assessment",
  summative: "summative assessment",
  "pre-assessment": "pre-assessment",
  "peer-assessment": "peer assessment",
};

function rhythmKindForAssessments(assessments: Assessment[]): LessonRhythmKind {
  if (assessments.length === 0) return "none";
  const categories = new Set(assessments.map(categoryForAssessment));
  for (const kind of CATEGORY_PRIORITY) {
    if (categories.has(kind)) return kind;
  }
  return "formative";
}

function typeHintForAssessments(assessments: Assessment[], kind: LessonRhythmKind): string {
  if (kind === "none") return ASSESSMENT_OPPORTUNITY_LABEL;
  if (assessments.length > 1) {
    const byKind = assessments.reduce<Record<string, number>>((acc, a) => {
      const cat = categoryForAssessment(a);
      acc[cat] = (acc[cat] ?? 0) + 1;
      return acc;
    }, {});
    const parts = Object.entries(byKind).map(([cat, n]) => {
      const label = RHYTHM_KIND_SHORT[cat as Exclude<LessonRhythmKind, "none">] ?? cat;
      return `${n} ${label}`;
    });
    return parts.join(", ");
  }
  return assessmentTypeLabel(assessmentSlug(assessments[0]));
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

  const org = buildUnitOrganizationSummary(unit);
  const formalAssessmentCount = org.assessmentDocumentCount;
  const assessmentOpportunityCount = org.assessmentOpportunityCount;

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
    `${assessmentOpportunityCount} TE ${assessmentOpportunityCount === 1 ? "opportunity" : "opportunities"}`,
    `${formalAssessmentCount} named assessment${formalAssessmentCount === 1 ? "" : "s"}`,
  ];
  if (unit.suggestedPacingDays != null) {
    summaryParts.push(`length: ${unit.suggestedPacingDays} days`);
  }
  const summaryLine = summaryParts.join(" · ");

  return {
    lessonCount,
    formalAssessmentCount,
    assessmentOpportunityCount,
    suggestedPacingDays: unit.suggestedPacingDays,
    points,
    summaryLine,
  };
}
