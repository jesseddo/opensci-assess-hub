import type { PackageItem, PackageItemKind } from "@/lib/assessment-data";

/** Export chooser display order (Story 7 — handout, form, key, rubric, guide). */
export const EXPORT_MATERIAL_KIND_ORDER: PackageItemKind[] = [
  "student-handout",
  "google-form",
  "answer-key",
  "rubric",
  "teacher-guide",
  "guidance-sheet",
];

export function sortPackageItemsForExportChooser(items: PackageItem[]): PackageItem[] {
  const order = new Map(EXPORT_MATERIAL_KIND_ORDER.map((kind, index) => [kind, index]));
  return [...items].sort(
    (a, b) => (order.get(a.kind) ?? 99) - (order.get(b.kind) ?? 99),
  );
}
