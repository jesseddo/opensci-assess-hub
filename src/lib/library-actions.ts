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
  return exportSelectedMaterials(assessment, getAvailablePackageItems(assessment));
}

export function exportSelectedMaterials(
  assessment: Assessment,
  selected: PackageItem[],
): {
  exported: PackageItem[];
  skipped: PackageItem[];
} {
  const exported = selected.filter((item) => item.available);
  const skipped = getUnavailablePackageItems(assessment);

  if (exported.length === 0) {
    toast.error("Nothing to export", {
      description: "Select at least one available material to export.",
    });
    return { exported, skipped };
  }

  for (const item of exported) {
    if (item.url?.startsWith("/")) {
      window.open(item.url, "_blank", "noopener,noreferrer");
    }
  }

  const exportedNames = exported.map((item) => item.label).join(", ");
  const driveItems = exported.filter((item) => !item.url?.startsWith("/"));

  toast.success(`Copied to Google Drive (prototype)`, {
    description:
      driveItems.length > 0
        ? `${exportedNames} — saved to your Drive folder "Eddo Exports / ${assessment.title}".`
        : `${exportedNames} — guidance pages opened in new tabs.`,
  });

  return { exported, skipped };
}

export function copySelectedPackageLinks(selected: PackageItem[]): void {
  if (selected.length === 0) {
    toast.error("No links to copy", {
      description: "Select at least one available material.",
    });
    return;
  }
  const labels = selected.map((item) => item.fileName ?? item.label).join(", ");
  toast.success("Links copied (prototype)", {
    description: labels,
  });
}

export function copyPackageLinks(assessment: Assessment): void {
  copySelectedPackageLinks(getAvailablePackageItems(assessment));
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
