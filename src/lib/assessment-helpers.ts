import type { Assessment, PackageItem, PackageItemKind, Unit } from "@/lib/assessment-data";
import type { LibraryOutputKind } from "@/lib/assessment-opportunity-types";
import { isFormalAssessment, isTeOpportunity } from "@/lib/assessment-source";
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

/** Whether a package slot is relevant for this row (excludes N/A ghosts like Form on a listen-for call-out). */
export function packageItemKindApplies(assessment: Assessment, kind: PackageItemKind): boolean {
  const item = getPackageItem(assessment, kind);
  const output: LibraryOutputKind | undefined = assessment.libraryOutput;

  if (kind === "guidance-sheet") {
    return Boolean(item?.available);
  }

  if (isFormalAssessment(assessment)) {
    if (kind === "rubric") {
      return Boolean(assessment.isSummative || item?.available);
    }
    return true;
  }

  if (!isTeOpportunity(assessment)) {
    return true;
  }

  if (kind === "teacher-guide") return true;

  if (kind === "student-handout") {
    return Boolean(item?.available);
  }

  if (kind === "google-form") {
    return output === "handout-form-planned";
  }

  if (kind === "answer-key") {
    return Boolean(item?.available);
  }

  if (kind === "rubric") {
    return false;
  }

  return false;
}

/** Materials list for UI — only slots that apply to this assessment type. */
export function getDisplayPackageItems(assessment: Assessment): PackageItem[] {
  return assessment.package.filter((item) => packageItemKindApplies(assessment, item.kind));
}

export function getAvailablePackageItems(assessment: Assessment): PackageItem[] {
  return getDisplayPackageItems(assessment).filter((item) => item.available);
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
  if (
    packageItemKindApplies(assessment, "google-form") &&
    !getPackageItem(assessment, "google-form")?.available
  ) {
    gaps.push("Form not available");
  }
  const hasScoring =
    (packageItemKindApplies(assessment, "answer-key") &&
      getPackageItem(assessment, "answer-key")?.available) ||
    (packageItemKindApplies(assessment, "rubric") &&
      getPackageItem(assessment, "rubric")?.available);
  if (
    (packageItemKindApplies(assessment, "answer-key") ||
      packageItemKindApplies(assessment, "rubric")) &&
    !hasScoring
  ) {
    gaps.push("no scoring materials");
  }

  const gapSuffix = gaps.length > 0 ? ` — ${gaps.join("; ")}` : "";
  return `${standards} · ${typePart} · Materials: ${pkg}${gapSuffix}`;
}

export function isExportReady(assessment: Assessment): boolean {
  return getAvailablePackageItems(assessment).length > 0;
}

export function isWorkspaceEligible(assessment: Assessment): boolean {
  if (!isFormalAssessment(assessment)) return false;
  const slug =
    assessment.assessmentType ?? (assessment.isSummative ? "summative" : "formative");
  return slug === "formative" || slug === "summative";
}

/** AI feedback / Workspace — named formative or summative assessments only. */
export function rowShowsWorkspaceAdd(assessment: Assessment): boolean {
  return isWorkspaceEligible(assessment);
}

/** Table/detail primary action — only when digitized (form + scoring materials). */
export function rowShowsWorkspaceAddButton(assessment: Assessment): boolean {
  return isWorkspaceEligible(assessment) && isWorkspaceReady(assessment);
}

export function isWorkspaceReady(assessment: Assessment): boolean {
  if (!packageItemKindApplies(assessment, "google-form")) return false;
  const form = getPackageItem(assessment, "google-form");
  const key = getPackageItem(assessment, "answer-key");
  const rubric = getPackageItem(assessment, "rubric");
  const hasScoring =
    (packageItemKindApplies(assessment, "answer-key") && key?.available) ||
    (packageItemKindApplies(assessment, "rubric") && rubric?.available);
  return Boolean(form?.available && hasScoring);
}

export function getWorkspaceAttachItems(assessment: Assessment): PackageItem[] {
  const kinds: PackageItemKind[] = ["google-form", "answer-key", "rubric"];
  return kinds
    .map((kind) => getPackageItem(assessment, kind))
    .filter((item): item is PackageItem => item != null && item.available);
}

export function getUnavailablePackageItems(assessment: Assessment): PackageItem[] {
  return getDisplayPackageItems(assessment).filter((item) => !item.available);
}

export function countWorkspaceReady(unit: Unit): number {
  return unit.assessments.filter(isWorkspaceReady).length;
}

export function buildUnitExportStats(unit: Unit) {
  return unit.assessments.map((assessment) => ({
    assessment,
    availableCount: getAvailablePackageItems(assessment).length,
    totalCount: getDisplayPackageItems(assessment).length,
    exportReady: isExportReady(assessment),
    workspaceReady: isWorkspaceReady(assessment),
  }));
}
