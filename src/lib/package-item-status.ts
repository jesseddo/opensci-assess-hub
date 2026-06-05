import type { PackageItem } from "@/lib/assessment-data";

export type PackageItemAvailability = "available" | "planned" | "not-applicable" | "missing";

export function packageItemAvailability(item: PackageItem): PackageItemAvailability {
  if (item.available) return "available";
  const reason = item.unavailabilityReason ?? "";
  if (/not applicable|not part of this assessment/i.test(reason)) return "not-applicable";
  if (/planned|digitized/i.test(reason)) return "planned";
  return "missing";
}

export function packageItemStatusLabel(item: PackageItem): string {
  if (item.available && item.fileName) return item.fileName;
  switch (packageItemAvailability(item)) {
    case "not-applicable":
      return "Not part of this assessment";
    case "planned":
      return "Planned for Eddo — not available yet";
    case "missing":
      return item.unavailableReason ?? "Not in library";
    default:
      return item.fileName ?? item.label;
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
