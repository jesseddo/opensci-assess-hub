import type { Assessment } from "@/lib/assessment-data";
import { getPackageItem, isExportReady } from "@/lib/assessment-helpers";
import { isFormalAssessment, isTeOpportunity } from "@/lib/assessment-source";

/** Named unit handout/key — primary deliverable tier. */
export function isNamedAssessmentRow(assessment: Assessment): boolean {
  return isFormalAssessment(assessment);
}

/** TE row with a linked student handout in the library. */
export function isOpportunityWithHandout(assessment: Assessment): boolean {
  if (!isTeOpportunity(assessment)) return false;
  return Boolean(getPackageItem(assessment, "student-handout")?.available);
}

/** Real exportable deliverable (named assessment or TE + handout). */
export function isDeliverableRow(assessment: Assessment): boolean {
  return isNamedAssessmentRow(assessment) || isOpportunityWithHandout(assessment);
}

/** TE call-out — guidance only, no handout to export. */
export function isGuidanceOnlyRow(assessment: Assessment): boolean {
  return isTeOpportunity(assessment) && !isOpportunityWithHandout(assessment);
}

export function rowShowsExport(assessment: Assessment): boolean {
  return isDeliverableRow(assessment) && isExportReady(assessment);
}

export function rowShowsAdd(assessment: Assessment): boolean {
  return isDeliverableRow(assessment);
}

export type TableFocusMode = "all" | "unit-assessments";

export function assessmentVisibleInTableFocus(
  assessment: Assessment,
  focus: TableFocusMode,
): boolean {
  if (focus === "all") return true;
  return isNamedAssessmentRow(assessment);
}
