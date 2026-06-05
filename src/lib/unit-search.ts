import type { Assessment } from "@/lib/assessment-data";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";
import { ASSESSMENT_OPPORTUNITY_LABEL } from "@/lib/ose-vocabulary";

export function assessmentMatchesSearch(assessment: Assessment, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (assessment.title.toLowerCase().includes(q)) return true;
  const { primary, secondary } = assessmentRowTypeDisplay(assessment);
  if (primary.toLowerCase().includes(q)) return true;
  if (secondary?.toLowerCase().includes(q)) return true;
  if (assessment.assessmentType?.includes(q)) return true;
  if (
    q.includes("opportunity") &&
    (assessment.source === "te-opportunity" || assessment.id.includes("-ao-"))
  ) {
    return true;
  }
  if (q.includes("document") && assessment.source === "formal-assessment") return true;
  if (q === "assessment opportunity" || q === ASSESSMENT_OPPORTUNITY_LABEL.toLowerCase()) {
    if (assessment.source === "te-opportunity" || assessment.id.includes("-ao-")) return true;
  }
  if (q === "assessment" && assessment.source === "formal-assessment") return true;
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
