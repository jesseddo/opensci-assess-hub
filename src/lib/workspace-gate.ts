import type { Assessment } from "@/lib/assessment-data";

export const WORKSPACE_RETURN_ACTION = "add-workspace";

export interface WorkspaceGateContext {
  returnTo: string;
  assessmentId?: string;
  assessmentTitle?: string;
  unitId?: string;
}

export function buildAssessmentReturnTo(unitId: string, assessmentId: string): string {
  return `/units/${unitId}/assessments/${assessmentId}?action=${WORKSPACE_RETURN_ACTION}`;
}

export function buildIndexReturnTo(unitId: string, assessmentId: string): string {
  return `/?unit=${encodeURIComponent(unitId)}&action=${WORKSPACE_RETURN_ACTION}&assessment=${encodeURIComponent(assessmentId)}`;
}

export function workspaceGateContext(
  assessment: Assessment,
  unitId: string,
  from: "detail" | "index" = "detail",
): WorkspaceGateContext {
  return {
    returnTo:
      from === "detail"
        ? buildAssessmentReturnTo(unitId, assessment.id)
        : buildIndexReturnTo(unitId, assessment.id),
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    unitId,
  };
}

export function isSafeReturnTo(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//");
}

export function parseReturnTo(returnTo: string | undefined): string {
  if (returnTo && isSafeReturnTo(returnTo)) {
    return returnTo;
  }
  return "/";
}

/** Return path for browsing — strips workspace resume params so Back doesn't re-trigger the gate. */
export function browseReturnTo(returnTo: string | undefined): string {
  const href = parseReturnTo(returnTo);
  const [path, query = ""] = href.split("?");
  const params = new URLSearchParams(query);
  params.delete("action");
  params.delete("assessment");
  const remaining = params.toString();
  return remaining ? `${path}?${remaining}` : path;
}
