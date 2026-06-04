import { Check, Download, Link2 } from "lucide-react";

import { PackageItemRow } from "@/components/PackageItemRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Assessment, Unit } from "@/lib/assessment-data";
import { getAvailablePackageItems, getUnavailablePackageItems } from "@/lib/assessment-helpers";
import { copyPackageLinks, exportPackage } from "@/lib/library-actions";

interface Props {
  assessment: Assessment | null;
  unit: Unit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportAssessmentDialog({ assessment, unit, open, onOpenChange }: Props) {
  if (!assessment) return null;

  const available = getAvailablePackageItems(assessment);
  const unavailable = getUnavailablePackageItems(assessment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
            Unit {unit.id} · Export package
          </DialogDescription>
          <DialogTitle>{assessment.title}</DialogTitle>
          <DialogDescription>
            You&apos;ll receive copies of these files. Edit them in Google Drive as needed for your
            classroom.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Package manifest ({available.length} of {assessment.package.length})
            </p>
            <div className="space-y-2">
              {assessment.package.map((item) => (
                <PackageItemRow key={item.kind} item={item} compact />
              ))}
            </div>
          </div>

          {unavailable.length > 0 && (
            <p className="text-xs text-muted-foreground rounded-md border border-dashed border-border p-3">
              <span className="font-medium text-foreground">Partial package: </span>
              {unavailable.map((item) => item.label).join(", ")} not included. Export will include
              available items only.
            </p>
          )}

          {available.length > 0 && (
            <ul className="text-xs text-muted-foreground space-y-1">
              {available.map((item) => (
                <li key={item.kind} className="flex items-center gap-2">
                  <Check className="size-3.5 text-primary shrink-0" aria-hidden />
                  {item.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={available.length === 0}
            onClick={() => copyPackageLinks(assessment)}
          >
            <Link2 className="size-4" aria-hidden />
            Copy links
          </Button>
          <Button
            type="button"
            disabled={available.length === 0}
            onClick={() => {
              exportPackage(assessment);
              onOpenChange(false);
            }}
          >
            <Download className="size-4" aria-hidden />
            Export package
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
