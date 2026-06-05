import { Download, Plus } from "lucide-react";

import { AssessmentGuidePanel } from "@/components/AssessmentGuidePanel";
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
import { assessmentGuideFor } from "@/lib/assessment-guide";
import {
  isDeliverableRow,
  isGuidanceOnlyRow,
  rowShowsExport,
} from "@/lib/assessment-row-tier";
import { getAvailablePackageItems } from "@/lib/assessment-helpers";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";

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
  const { primary: rowKind, secondary: systemCategory } = assessmentRowTypeDisplay(assessment);
  const guide = assessmentGuideFor(assessment.id);
  const typeLine = systemCategory ? `${rowKind} · ${systemCategory}` : rowKind;
  const deliverable = isDeliverableRow(assessment);
  const guidanceOnly = isGuidanceOnlyRow(assessment);
  const availableMaterials = getAvailablePackageItems(assessment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
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
              <span className="text-xs">{typeLine}</span>
            </div>
          </div>
        </DialogHeader>

        {guide && <AssessmentGuidePanel guide={guide} />}

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

        {deliverable && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Materials
            </p>
            <div className="space-y-2">
              {assessment.package.map((item) => (
                <PackageItemRow key={item.kind} item={item} />
              ))}
            </div>
            {availableMaterials.length > 0 && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Export creates copies you can edit in Google Drive.
              </p>
            )}
          </div>
        )}

        {guidanceOnly && (
          <p className="text-sm text-muted-foreground font-body leading-relaxed border border-dashed border-border rounded-lg p-3">
            This is Teacher Edition facilitation guidance — read the call-out above while teaching.
            Open the full lesson in your Teacher Edition for surrounding context.
          </p>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          {deliverable && rowShowsExport(assessment) && (
            <Button type="button" className="w-full sm:w-auto" onClick={onExport}>
              <Download className="size-4" aria-hidden />
              Export
            </Button>
          )}
          {deliverable && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onAddToWorkspace}
            >
              <Plus className="size-4" aria-hidden />
              Add to Workspace
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
