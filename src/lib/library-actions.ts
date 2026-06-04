import { toast } from "sonner";

import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import { getAvailablePackageItems, getUnavailablePackageItems } from "@/lib/assessment-helpers";

export function openPackageItem(item: PackageItem): void {
  if (item.url?.startsWith("/")) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (item.url?.startsWith("ingest:")) {
    toast.info("Local OpenSciEd file (ingested)", {
      description: item.fileName ?? item.url.slice("ingest:".length),
    });
    return;
  }
  if (item.available && item.url) {
    window.open(item.url, "_blank", "noopener,noreferrer");
    return;
  }
  toast.info("Opens in Google Drive (prototype)", {
    description: item.available
      ? (item.fileName ?? item.label)
      : `${item.label} is not available for export.`,
  });
}

export function exportPackage(assessment: Assessment): {
  exported: PackageItem[];
  skipped: PackageItem[];
} {
  const exported = getAvailablePackageItems(assessment);
  const skipped = getUnavailablePackageItems(assessment);

  if (exported.length === 0) {
    toast.error("Nothing to export", {
      description: "This assessment has no exportable materials yet.",
    });
    return { exported, skipped };
  }

  const exportedNames = exported.map((item) => item.label).join(", ");

  if (skipped.length > 0) {
    const skippedNames = skipped.map((item) => item.label).join(", ");
    toast.success(`Export ready — ${exported.length} files (prototype)`, {
      description: `Exported: ${exportedNames}. Not included: ${skippedNames}. Edit copies in Google Drive.`,
    });
  } else {
    toast.success(`Export ready — ${exported.length} files (prototype)`, {
      description: `Exported: ${exportedNames}. Edit copies in Google Drive as needed.`,
    });
  }

  return { exported, skipped };
}

export function copyPackageLinks(assessment: Assessment): void {
  const exported = getAvailablePackageItems(assessment);
  if (exported.length === 0) {
    toast.error("No links to copy");
    return;
  }
  toast.success("Links copied (prototype)", {
    description: exported.map((item) => item.fileName ?? item.label).join(", "),
  });
}

export function exportUnitPackages(unit: Unit): void {
  const ready = unit.assessments.filter((a) => getAvailablePackageItems(a).length > 0);
  if (ready.length === 0) {
    toast.error("No assessments to export in this unit");
    return;
  }
  toast.success(`Exported ${ready.length} assessments (prototype)`, {
    description: `Unit ${unit.id}: ${unit.title}. Edit copies in Google Drive as needed.`,
  });
}

export function addToWorkspace(assessment: Assessment, destination: string): string[] {
  const attached = ["google-form", "answer-key", "rubric"] as const;
  const names = attached
    .map((kind) => assessment.package.find((item) => item.kind === kind))
    .filter((item): item is PackageItem => item != null && item.available)
    .map((item) => item.label);

  toast.success(`Added to ${destination}`, {
    description:
      names.length > 0
        ? `Attached: ${names.join(", ")}. Customize scoring in Workspace if needed.`
        : "Assessment added. Attach scoring materials in Workspace.",
  });

  return names;
}

export function goToWorkspaceStub(): void {
  toast.info("Opens Eddo Workspace (prototype)");
}

export function openIngestedDocument(relativePath: string, fileName: string): void {
  toast.info("Open Teacher Edition document", {
    description: `${fileName} — from your OpenSciEd download. In production this opens Google Drive.`,
  });
}

export function openTeacherEdition(unitId: string, lessonNum: number): void {
  toast.info("Opens Teacher Edition (prototype)", {
    description: `Unit ${unitId}, Lesson ${String(lessonNum).padStart(2, "0")}`,
  });
}
