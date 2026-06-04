import type { Assessment, Unit, UnitLesson } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
import { isFormalAssessment } from "@/lib/assessment-source";
import { assessmentMatchesSearch, lessonMatchesSearch } from "@/lib/unit-search";

export interface UnitLessonSlot {
  lessonNum: number;
  shortTitle: string;
  drivingQuestion?: string;
  teacherEditionPath?: string | null;
  expectedDays?: number;
  assessments: Assessment[];
}

/** Per-lesson instructional length from Unit Overview Materials. */
export function formatLessonLength(days: number): string {
  return `length: ${days} day${days === 1 ? "" : "s"}`;
}

export function getLessonMeta(
  unit: Unit,
  lessonNum: number,
): Pick<UnitLessonSlot, "shortTitle" | "drivingQuestion" | "teacherEditionPath" | "expectedDays"> {
  const row = unit.lessons?.find((l) => l.lessonNum === lessonNum);
  return {
    shortTitle: row?.shortTitle ?? row?.title ?? `Lesson ${lessonNum}`,
    drivingQuestion: row?.title,
    teacherEditionPath: row?.teacherEditionPath,
    expectedDays: row?.expectedDays,
  };
}

function sortAssessments(list: Assessment[]): Assessment[] {
  return [...list].sort((a, b) => {
    const aFormal = isFormalAssessment(a) ? 0 : 1;
    const bFormal = isFormalAssessment(b) ? 0 : 1;
    if (aFormal !== bFormal) return aFormal - bFormal;
    return a.title.localeCompare(b.title);
  });
}

export function buildUnitLessonSlots(unit: Unit, query: string): UnitLessonSlot[] {
  const total = unit.lessonCount ?? 8;
  const byLesson = new Map<number, Assessment[]>();

  for (const assessment of unit.assessments) {
    const n = lessonNumber(assessment.lesson);
    if (n == null) continue;
    const list = byLesson.get(n) ?? [];
    list.push(assessment);
    byLesson.set(n, list);
  }

  const q = query.trim();
  const slots: UnitLessonSlot[] = [];

  for (let lessonNum = 1; lessonNum <= total; lessonNum += 1) {
    const meta = getLessonMeta(unit, lessonNum);
    const assessments = sortAssessments(byLesson.get(lessonNum) ?? []);
    const lessonNavMatch = lessonMatchesSearch(
      lessonNum,
      meta.drivingQuestion ?? meta.shortTitle,
      q,
    );

    const visibleAssessments = q
      ? lessonNavMatch
        ? assessments
        : assessments.filter((a) => assessmentMatchesSearch(a, q))
      : assessments;

    if (visibleAssessments.length === 0) continue;

    slots.push({
      lessonNum,
      ...meta,
      assessments: visibleAssessments,
    });
  }

  return slots;
}

export function unitBrowseMeta(unit: Unit): {
  lessonCount: number;
  formalAssessmentCount: number;
  teOpportunityCount: number;
} {
  const formalAssessmentCount = unit.assessments.filter(isFormalAssessment).length;
  return {
    lessonCount: unit.lessonCount ?? 8,
    formalAssessmentCount,
    teOpportunityCount: unit.assessments.length - formalAssessmentCount,
  };
}

export type { UnitLesson };
