import type { Assessment, Unit, UnitLesson } from "@/lib/assessment-data";
import { lessonNumber } from "@/lib/assessment-data";
import { isFormalAssessment, isTeOpportunity } from "@/lib/assessment-source";
import { assessmentMatchesSearch, lessonMatchesSearch } from "@/lib/unit-search";
import type { TableFocusMode } from "@/lib/assessment-row-tier";
import { buildUnitOrganizationSummary } from "@/lib/unit-assessment-organization";

export type { TableFocusMode, UnitLesson };

export interface UnitLessonSlot {
  lessonNum: number;
  shortTitle: string;
  drivingQuestion?: string;
  teacherEditionPath?: string | null;
  expectedDays?: number;
  /** Named unit assessments — primary rows in prepare and unit-assessments modes. */
  assessments: Assessment[];
  /** TE opportunities — shown when expanded in prepare mode only. */
  teOpportunities: Assessment[];
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

function visibleForSearch(
  assessments: Assessment[],
  lessonNum: number,
  lessonTitle: string,
  query: string,
): Assessment[] {
  const q = query.trim();
  if (!q) return assessments;
  const lessonNavMatch = lessonMatchesSearch(lessonNum, lessonTitle, q);
  if (lessonNavMatch) return assessments;
  return assessments.filter((a) => assessmentMatchesSearch(a, q));
}

export function buildUnitLessonSlots(
  unit: Unit,
  query: string,
  focus: TableFocusMode = "prepare",
): UnitLessonSlot[] {
  const total = unit.lessonCount ?? 8;
  const byLesson = new Map<number, Assessment[]>();

  for (const assessment of unit.assessments) {
    const n = lessonNumber(assessment.lesson);
    if (n == null) continue;
    const list = byLesson.get(n) ?? [];
    list.push(assessment);
    byLesson.set(n, list);
  }

  const slots: UnitLessonSlot[] = [];

  for (let lessonNum = 1; lessonNum <= total; lessonNum += 1) {
    const meta = getLessonMeta(unit, lessonNum);
    const lessonTitle = meta.drivingQuestion ?? meta.shortTitle;
    const inLesson = sortAssessments(byLesson.get(lessonNum) ?? []);
    const formal = inLesson.filter(isFormalAssessment);
    const te = inLesson.filter(isTeOpportunity);

    const visibleFormal = visibleForSearch(formal, lessonNum, lessonTitle, query);
    const visibleTe =
      focus === "prepare" ? visibleForSearch(te, lessonNum, lessonTitle, query) : [];

    if (focus === "unit-assessments") {
      if (visibleFormal.length === 0) continue;
      slots.push({ lessonNum, ...meta, assessments: visibleFormal, teOpportunities: [] });
      continue;
    }

    if (visibleFormal.length === 0 && visibleTe.length === 0) continue;

    slots.push({
      lessonNum,
      ...meta,
      assessments: visibleFormal,
      teOpportunities: visibleTe,
    });
  }

  return slots;
}

export function unitBrowseMeta(unit: Unit) {
  const org = buildUnitOrganizationSummary(unit);
  return {
    lessonCount: unit.lessonCount ?? 8,
    formalAssessmentCount: org.assessmentDocumentCount,
    assessmentOpportunityCount: org.assessmentOpportunityCount,
    headline: org.headline,
    documentCategoryLine: org.documentCategoryLine,
  };
}
