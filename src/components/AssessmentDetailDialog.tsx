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
import { isTeOpportunity, TE_OPPORTUNITY_LABEL } from "@/lib/assessment-source";

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

  const hasOseBlock =
    Boolean(assessment.buildingTowards) ||
    Boolean(assessment.lookListenFor) ||
    Boolean(assessment.whatToDo);
  const teRow = isTeOpportunity(assessment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            OpenSciEd Unit {unit.id} · {assessment.lesson}
            {assessment.peCode ? ` · ${assessment.peCode}` : ""}
          </p>
          <DialogTitle className="text-xl leading-tight">{assessment.title}</DialogTitle>
          <div className="space-y-2 pt-1 text-sm text-muted-foreground">
            {assessment.lessonTitle && <p>{assessment.lessonTitle}</p>}
            <div className="flex flex-wrap gap-1.5 items-center">
              {assessment.standards.map((s) => (
                <span
                  key={s}
                  className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded"
                >
                  {s}
                </span>
              ))}
              <span className="text-xs">
                {teRow ? TE_OPPORTUNITY_LABEL : getAssessmentTypeDisplay(assessment)}
              </span>
            </div>
          </div>
        </DialogHeader>

        {hasOseBlock && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3 font-body text-sm leading-relaxed">
            <p className="text-[10px] font-bold uppercase tracking-widest text-eddo-green font-ui">
              From Teacher Edition
            </p>
            {assessment.buildingTowards && (
              <div>
                <p className="text-[10px] font-ui font-medium text-eddo-navy mb-1">Building towards</p>
                <p className="text-foreground/90 whitespace-pre-wrap">{assessment.buildingTowards}</p>
              </div>
            )}
            {assessment.lookListenFor && (
              <div>
                <p className="text-[10px] font-ui font-medium text-eddo-navy mb-1">
                  What to look / listen for
                </p>
                <p className="text-foreground/90 whitespace-pre-wrap">{assessment.lookListenFor}</p>
              </div>
            )}
            {assessment.whatToDo && (
              <div>
                <p className="text-[10px] font-ui font-medium text-eddo-navy mb-1">What to do</p>
                <p className="text-foreground/90 whitespace-pre-wrap">{assessment.whatToDo}</p>
              </div>
            )}
          </div>
        )}

        {!hasOseBlock && assessment.description && (
          <p className="text-sm text-muted-foreground font-body leading-relaxed">
            {assessment.description}
          </p>
        )}

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
            {teRow ? "From Teacher Edition" : "Materials"}
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
