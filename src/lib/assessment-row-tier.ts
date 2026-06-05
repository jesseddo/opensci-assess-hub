import type { Assessment } from "@/lib/assessment-data";
import { getPackageItem, isExportReady, rowShowsWorkspaceAddButton } from "@/lib/assessment-helpers";
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

/** Table row — show Add on all named unit assessments (the 8). */
export function rowShowsTableWorkspaceAdd(assessment: Assessment): boolean {
  return isNamedAssessmentRow(assessment);
}

export function rowShowsAdd(assessment: Assessment): boolean {
  return rowShowsWorkspaceAddButton(assessment);
}

/** prepare = named assessments + collapsible TE summaries; unit-assessments = named only. */
export type TableFocusMode = "prepare" | "unit-assessments";

export function isPrimaryTableRow(assessment: Assessment): boolean {
  return isNamedAssessmentRow(assessment);
}
