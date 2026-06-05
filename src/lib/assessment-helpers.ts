import type { Assessment, PackageItem, PackageItemKind, Unit } from "@/lib/assessment-data";
import { isFormalAssessment } from "@/lib/assessment-source";
import { assessmentRowTypeDisplay, assessmentSystemCategoryLabel } from "@/lib/unit-assessment-organization";

/** OpenSciEd system category label for any row. */
export function getAssessmentTypeDisplay(assessment: Assessment): string {
  return assessmentSystemCategoryLabel(assessment);
}

/** @deprecated Use assessmentRowTypeDisplay */
export function getFormalTypeDisplay(assessment: Assessment): string | null {
  if (!isFormalAssessment(assessment)) return null;
  return getAssessmentTypeDisplay(assessment);
}

export function getAvailablePackageItems(assessment: Assessment): PackageItem[] {
  return assessment.package.filter((item) => item.available);
}

export function getPackageItem(
  assessment: Assessment,
  kind: PackageItemKind,
): PackageItem | undefined {
  return assessment.package.find((item) => item.kind === kind);
}

const SUMMARY_LABELS: Record<PackageItemKind, string> = {
  "student-handout": "Handout",
  "google-form": "Form",
  "teacher-guide": "Guide",
  "answer-key": "Key",
  rubric: "Rubric",
  "guidance-sheet": "Opportunity guidance",
};

export function getPackageSummary(assessment: Assessment): string {
  const labels = getAvailablePackageItems(assessment).map((item) => SUMMARY_LABELS[item.kind]);
  return labels.length > 0 ? labels.join(", ") : "none";
}

/** Single scan line: standard · type · package contents · gaps */
export function getAssessmentMetaLine(assessment: Assessment): string {
  const standards = assessment.standards.join(", ");
  const available = getAvailablePackageItems(assessment);
  const pkg = available.map((item) => SUMMARY_LABELS[item.kind]).join(", ") || "none";
  const { primary, secondary } = assessmentRowTypeDisplay(assessment);
  const typePart = secondary ? `${primary} · ${secondary}` : primary;

  const gaps: string[] = [];
  if (!getPackageItem(assessment, "google-form")?.available) {
    gaps.push("Form not available");
  }
  const hasScoring =
    getPackageItem(assessment, "answer-key")?.available ||
    getPackageItem(assessment, "rubric")?.available;
  if (!hasScoring) {
    gaps.push("no scoring materials");
  }

  const gapSuffix = gaps.length > 0 ? ` — ${gaps.join("; ")}` : "";
  return `${standards} · ${typePart} · Materials: ${pkg}${gapSuffix}`;
}

/** Shown on card only when Add to Workspace is blocked */
export function getWorkspaceBlockHint(assessment: Assessment): string | null {
  if (isWorkspaceReady(assessment)) return null;
  if (!getPackageItem(assessment, "google-form")?.available) {
    return "Not digitized for Workspace — export the handout materials instead.";
  }
  return "Missing scoring materials for Workspace.";
}

export function isExportReady(assessment: Assessment): boolean {
  return getAvailablePackageItems(assessment).length > 0;
}

export function isWorkspaceReady(assessment: Assessment): boolean {
  const form = getPackageItem(assessment, "google-form");
  const key = getPackageItem(assessment, "answer-key");
  const rubric = getPackageItem(assessment, "rubric");
  return Boolean(form?.available && (key?.available || rubric?.available));
}

export function getWorkspaceAttachItems(assessment: Assessment): PackageItem[] {
  const kinds: PackageItemKind[] = ["google-form", "answer-key", "rubric"];
  return kinds
    .map((kind) => getPackageItem(assessment, kind))
    .filter((item): item is PackageItem => item != null && item.available);
}

export function getUnavailablePackageItems(assessment: Assessment): PackageItem[] {
  return assessment.package.filter((item) => !item.available);
}

export function countWorkspaceReady(unit: Unit): number {
  return unit.assessments.filter(isWorkspaceReady).length;
}

export function buildUnitExportStats(unit: Unit) {
  return unit.assessments.map((assessment) => ({
    assessment,
    availableCount: getAvailablePackageItems(assessment).length,
    totalCount: assessment.package.length,
    exportReady: isExportReady(assessment),
    workspaceReady: isWorkspaceReady(assessment),
  }));
}
