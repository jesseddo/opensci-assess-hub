import { Download, Plus } from "lucide-react";

import { PackageItemRow } from "@/components/PackageItemRow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Assessment, Unit } from "@/lib/assessment-data";
import { getAssessmentTypeDisplay } from "@/lib/assessment-helpers";

interface Props {
  assessment: Assessment | null;
  unit: Unit;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: () => void;
  onAddToWorkspace: () => void;
}

export function AssessmentDetailDialog({
  assessment,
  unit,
  open,
  onOpenChange,
  onExport,
  onAddToWorkspace,
}: Props) {
  if (!assessment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            OpenSciEd Unit {unit.id} · {assessment.lesson}
          </p>
          <DialogTitle className="text-xl leading-tight">{assessment.title}</DialogTitle>
          <div className="space-y-2 pt-1 text-sm text-muted-foreground">
            {assessment.lessonTitle && <p>{assessment.lessonTitle}</p>}
            <p className="text-foreground">{assessment.description}</p>
            <div className="flex flex-wrap gap-1.5">
              {assessment.standards.map((s) => (
                <span
                  key={s}
                  className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded"
                >
                  {s}
                </span>
              ))}
              <span className="text-xs ml-1">{getAssessmentTypeDisplay(assessment)}</span>
            </div>
          </div>
        </DialogHeader>

        {assessment.previewExcerpt && (
          <div className="rounded-lg border border-border bg-muted/40 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
              Preview
            </p>
            <p className="text-sm leading-relaxed">{assessment.previewExcerpt}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Recommended package
          </p>
          <div className="space-y-2">
            {assessment.package.map((item) => (
              <PackageItemRow key={item.kind} item={item} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed pt-1">
            Recommended versions from OpenSciEd and Eddo. Export creates copies you can edit in
            Google Drive.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          <Button type="button" className="w-full sm:w-auto" onClick={onExport}>
            <Download className="size-4" aria-hidden />
            Export
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onAddToWorkspace}
          >
            <Plus className="size-4" aria-hidden />
            Add to Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
