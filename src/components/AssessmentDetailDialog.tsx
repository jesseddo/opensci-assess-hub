import { Download, Plus } from "lucide-react";

import { AssessmentGuidePanel } from "@/components/AssessmentGuidePanel";
import { PackageItemRow } from "@/components/PackageItemRow";
import { TeacherEditionGuidancePanel } from "@/components/TeacherEditionGuidancePanel";
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
import { isExportReady, getDisplayPackageItems, getWorkspaceBlockHint, isWorkspaceReady, rowShowsWorkspaceAdd } from "@/lib/assessment-helpers";
import { rowShowsTableWorkspaceAdd } from "@/lib/assessment-row-tier";
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
    Boolean(assessment.buildingTowards?.trim()) ||
    Boolean(assessment.lookListenFor?.trim()) ||
    Boolean(assessment.whatToDo?.trim());
  const { primary: rowKind, secondary: systemCategory } = assessmentRowTypeDisplay(assessment);
  const guide = assessmentGuideFor(assessment.id);
  const typeLine = systemCategory ? `${rowKind} · ${systemCategory}` : rowKind;
  const displayMaterials = getDisplayPackageItems(assessment);
  const exportReady = isExportReady(assessment);
  const showWorkspaceAdd = rowShowsTableWorkspaceAdd(assessment);
  const workspaceAddReady = isWorkspaceReady(assessment);
  const workspaceBlockHint = rowShowsWorkspaceAdd(assessment)
    ? getWorkspaceBlockHint(assessment)
    : showWorkspaceAdd && !workspaceAddReady
      ? "Workspace add is for formative and summative assessments with digitized forms"
      : null;

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

        {hasOseBlock && <TeacherEditionGuidancePanel assessment={assessment} />}

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

        {displayMaterials.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Materials
            </p>
            <div className="space-y-2">
              {displayMaterials.map((item) => (
                <PackageItemRow key={item.kind} item={item} />
              ))}
            </div>
            {exportReady && (
              <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                Choose what to export in the next step — handout, guide, key, form, or rubric.
              </p>
            )}
          </div>
        )}

        {hasOseBlock && displayMaterials.length === 0 && (
          <p className="text-sm text-muted-foreground font-ui leading-relaxed border border-dashed border-border rounded-lg p-3">
            This is Teacher Edition facilitation guidance — read the call-out above while teaching.
            Open the full lesson in your Teacher Edition for surrounding context.
          </p>
        )}

        {workspaceBlockHint && (
          <p className="text-xs text-amber-700/90 dark:text-amber-500/90 leading-relaxed">
            {workspaceBlockHint}
          </p>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-2">
          {exportReady && (
            <Button type="button" className="w-full sm:w-auto" onClick={onExport}>
              <Download className="size-4" aria-hidden />
              Export materials
            </Button>
          )}
          {showWorkspaceAdd && (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!workspaceAddReady}
              title={
                workspaceAddReady
                  ? undefined
                  : (workspaceBlockHint ?? "Not digitized for workspace yet")
              }
              onClick={onAddToWorkspace}
            >
              <Plus className="size-4" aria-hidden />
              Add to Eddo workspace
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
