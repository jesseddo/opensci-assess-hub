import { useEffect, useMemo, useState } from "react";
import { Download, Link2 } from "lucide-react";

import { ExportMaterialChooserRow } from "@/components/ExportMaterialChooserRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Assessment, PackageItemKind, Unit } from "@/lib/assessment-data";
import {
  getAvailablePackageItems,
  getDisplayPackageItems,
} from "@/lib/assessment-helpers";
import { sortPackageItemsForExportChooser } from "@/lib/export-material-order";
import { copySelectedPackageLinks, exportSelectedMaterials } from "@/lib/library-actions";

interface Props {
  assessment: Assessment | null;
  unit: Unit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function defaultSelection(assessment: Assessment): Set<PackageItemKind> {
  return new Set(getAvailablePackageItems(assessment).map((item) => item.kind));
}

export function ExportAssessmentDialog({ assessment, unit, open, onOpenChange }: Props) {
  const [selected, setSelected] = useState<Set<PackageItemKind>>(() => new Set());

  const materials = useMemo(
    () =>
      assessment
        ? sortPackageItemsForExportChooser(getDisplayPackageItems(assessment))
        : [],
    [assessment],
  );
  const available = assessment ? getAvailablePackageItems(assessment) : [];
  const selectedItems = materials.filter((item) => item.available && selected.has(item.kind));
  const allAvailableSelected =
    available.length > 0 && available.every((item) => selected.has(item.kind));

  useEffect(() => {
    if (open && assessment) {
      setSelected(defaultSelection(assessment));
    }
  }, [open, assessment]);

  const toggleKind = (kind: PackageItemKind, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(kind);
      else next.delete(kind);
      return next;
    });
  };

  const toggleAllAvailable = () => {
    if (!assessment) return;
    if (allAvailableSelected) {
      setSelected(new Set());
    } else {
      setSelected(defaultSelection(assessment));
    }
  };

  if (!assessment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto font-ui">
        <DialogHeader>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
            Unit {unit.id} · Export materials
          </DialogDescription>
          <DialogTitle>{assessment.title}</DialogTitle>
          <DialogDescription>
            Choose which materials to copy to your Google Drive. Unavailable items are shown but
            cannot be selected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Materials to export
            </p>
            {available.length > 0 && (
              <button
                type="button"
                onClick={toggleAllAvailable}
                className="text-xs font-medium text-primary underline-offset-2 hover:underline"
              >
                {allAvailableSelected ? "Clear selection" : "Select all available"}
              </button>
            )}
          </div>

          <div className="space-y-2" role="group" aria-label="Export material choices">
            {materials.map((item) => (
              <ExportMaterialChooserRow
                key={item.kind}
                item={item}
                checked={selected.has(item.kind)}
                onCheckedChange={toggleKind}
              />
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            {selectedItems.length === 0
              ? "Select one or more available materials to export."
              : `${selectedItems.length} material${selectedItems.length === 1 ? "" : "s"} selected — copies will be placed in your Drive.`}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={selectedItems.length === 0}
            onClick={() => copySelectedPackageLinks(selectedItems)}
          >
            <Link2 className="size-4" aria-hidden />
            Copy links
          </Button>
          <Button
            type="button"
            disabled={selectedItems.length === 0}
            onClick={() => {
              exportSelectedMaterials(assessment, selectedItems);
              onOpenChange(false);
            }}
          >
            <Download className="size-4" aria-hidden />
            Export to Google Drive
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
