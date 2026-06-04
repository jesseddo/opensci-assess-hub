import type { Assessment } from "@/lib/assessment-data";
import { getAssessmentTypeDisplay } from "@/lib/assessment-helpers";

export function assessmentMatchesSearch(assessment: Assessment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (assessment.title.toLowerCase().includes(q)) return true;
  if (getAssessmentTypeDisplay(assessment).toLowerCase().includes(q)) return true;
  if (assessment.assessmentType?.includes(q)) return true;
  if (assessment.standards.some((s) => s.toLowerCase().includes(q))) return true;
  return false;
}

/** Lesson-number or topic navigation shortcut (includes TE-only rows). */
export function lessonMatchesSearch(
  lessonNum: number,
  lessonTitle: string | undefined,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (lessonTitle && lessonTitle.toLowerCase().includes(q)) return true;

  const padded = String(lessonNum).padStart(2, "0");
  const compact = String(lessonNum);

  if (q === `lesson ${compact}` || q === `lesson ${padded}`) return true;
  if (q === compact || q === padded) return true;
  if (q === `l${compact}` || q === `lsn ${compact}` || q === `lsn ${padded}`) return true;

  return false;
}
