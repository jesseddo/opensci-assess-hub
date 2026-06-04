import type { Assessment, Unit, UnitLesson } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
import { assessmentMatchesSearch, lessonMatchesSearch } from "@/lib/unit-search";

export interface UnitLessonSlot {
  lessonNum: number;
  shortTitle: string;
  drivingQuestion?: string;
  teacherEditionPath?: string | null;
  expectedDays?: number;
  assessments: Assessment[];
  isTeOnly: boolean;
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

  for (const [, list] of byLesson) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }

  const q = query.trim();
  const slots: UnitLessonSlot[] = [];

  for (let lessonNum = 1; lessonNum <= total; lessonNum += 1) {
    const meta = getLessonMeta(unit, lessonNum);
    const assessments = byLesson.get(lessonNum) ?? [];
    const lessonNavMatch = lessonMatchesSearch(
      lessonNum,
      meta.drivingQuestion ?? meta.shortTitle,
      q,
    );

    if (assessments.length === 0) {
      if (!q || lessonNavMatch) {
        slots.push({
          lessonNum,
          ...meta,
          assessments: [],
          isTeOnly: true,
        });
      }
      continue;
    }

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
      isTeOnly: false,
    });
  }

  return slots;
}

export function unitBrowseMeta(unit: Unit): { lessonCount: number; packageCount: number } {
  return {
    lessonCount: unit.lessonCount ?? 8,
    packageCount: unit.assessments.length,
  };
}

export type { UnitLesson };
