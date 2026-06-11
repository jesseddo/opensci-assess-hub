import type { PackageItem } from "@/lib/assessment-data";

export type PackageItemAvailability = "available" | "planned" | "not-applicable" | "missing";

export function packageItemAvailability(item: PackageItem): PackageItemAvailability {
  if (item.available) return "available";
  const reason = item.unavailableReason ?? "";
  if (/not applicable|not part of this assessment/i.test(reason)) return "not-applicable";
  if (/planned|digitized/i.test(reason)) return "planned";
  return "missing";
}

export function packageItemStatusLabel(item: PackageItem): string {
  if (item.available && item.fileName) return item.fileName;
  return packageItemUnavailableLabel(item);
}

/** Short reason for export chooser disabled rows (Story 7). */
export function packageItemUnavailableLabel(item: PackageItem): string {
  switch (packageItemAvailability(item)) {
    case "not-applicable":
      return "Not applicable for this assessment";
    case "planned":
      return "Not yet digitized";
    case "missing":
      return item.unavailableReason ?? "Not generated for this assessment";
    default:
      return item.fileName ?? item.label;
  }
}

export function packageItemAvailabilityBadgeClass(item: PackageItem): string {
  if (item.available) return "bg-eddo-green/10 text-eddo-green border-eddo-green/25";
  switch (packageItemAvailability(item)) {
    case "not-applicable":
      return "bg-muted/50 text-muted-foreground border-border/60";
    case "planned":
      return "bg-amber-500/10 text-amber-900/90 border-amber-500/30";
    default:
      return "bg-muted/40 text-muted-foreground border-dashed border-border";
  }
}

export function packageItemRowClass(item: PackageItem): string {
  if (item.available) return "border-border bg-card";
  switch (packageItemAvailability(item)) {
    case "not-applicable":
      return "border-border/50 bg-muted/20 opacity-70";
    case "planned":
      return "border-dashed border-amber-500/35 bg-amber-500/5";
    default:
      return "border-dashed border-border/70 bg-muted/30 opacity-80";
  }
}
