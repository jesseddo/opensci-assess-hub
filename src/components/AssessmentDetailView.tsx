import { Download, Plus } from "lucide-react";

import { AssessmentGuidePanel } from "@/components/AssessmentGuidePanel";
import { guidanceDetailSectionLabel } from "@/components/guidance-panel-ui";
import { PackageItemRow } from "@/components/PackageItemRow";
import { TeacherEditionGuidancePanel } from "@/components/TeacherEditionGuidancePanel";
import { Button } from "@/components/ui/button";
import type { Assessment, Unit } from "@/lib/assessment-data";
import { assessmentGuideFor } from "@/lib/assessment-guide";
import { assessmentWithTeGuidance } from "@/lib/assessment-te-guidance";
import {
  getDisplayPackageItems,
  getWorkspaceBlockHint,
  isExportReady,
  isWorkspaceReady,
  rowShowsWorkspaceAdd,
} from "@/lib/assessment-helpers";
import { rowShowsTableWorkspaceAdd } from "@/lib/assessment-row-tier";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";
import { cn } from "@/lib/utils";

interface Props {
  assessment: Assessment;
  unit: Unit;
  onExport?: () => void;
  onAddToWorkspace?: () => void;
}

export function AssessmentDetailView({
  assessment,
  unit,
  onExport,
  onAddToWorkspace,
}: Props) {
  const guidanceAssessment = assessmentWithTeGuidance(assessment, unit);
  const hasOseBlock =
    Boolean(guidanceAssessment.buildingTowards?.trim()) ||
    Boolean(guidanceAssessment.lookListenFor?.trim()) ||
    Boolean(guidanceAssessment.whatToDo?.trim());
  const { primary: rowKind, secondary: systemCategory } = assessmentRowTypeDisplay(assessment);
  const guide = assessmentGuideFor(assessment.id);
  const typeLine = `${rowKind} · ${systemCategory}`;
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
    <div className="space-y-6 font-ui">
      <header className="space-y-2 border-b border-border pb-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          OpenSciEd Unit {unit.id} · {assessment.lesson}
          {assessment.peCode ? ` · ${assessment.peCode}` : ""}
        </p>
        <h1 className="text-2xl font-medium leading-tight text-eddo-green font-ui">{assessment.title}</h1>
        <div className="space-y-2 pt-1 text-sm text-muted-foreground">
          {assessment.lessonTitle && <p>{assessment.lessonTitle}</p>}
          <div className="flex flex-wrap items-center gap-1.5">
            {assessment.standards.map((s) => (
              <span
                key={s}
                className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]"
              >
                {s}
              </span>
            ))}
            <span className="text-xs">{typeLine}</span>
          </div>
        </div>
      </header>

      {guide && <AssessmentGuidePanel guide={guide} />}

      {hasOseBlock && <TeacherEditionGuidancePanel assessment={guidanceAssessment} />}

      {!hasOseBlock && assessment.description && (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {assessment.description}
        </p>
      )}

      {assessment.previewExcerpt && (
        <div className="rounded-lg border border-border bg-muted/40 p-4">
          <p className={cn("mb-2", guidanceDetailSectionLabel)}>
            Preview
          </p>
          <p className="text-sm leading-relaxed">{assessment.previewExcerpt}</p>
        </div>
      )}

      {displayMaterials.length > 0 && (
        <div className="space-y-2">
          <p className={guidanceDetailSectionLabel}>
            Materials
          </p>
          <div className="space-y-2">
            {displayMaterials.map((item) => (
              <PackageItemRow key={item.kind} item={item} />
            ))}
          </div>
          {exportReady && (
            <p className="pt-1 text-xs leading-relaxed text-muted-foreground">
              Choose what to export in the next step — handout, guide, key, form, or rubric.
            </p>
          )}
        </div>
      )}

      {hasOseBlock && displayMaterials.length === 0 && (
        <p className="rounded-lg border border-dashed border-border p-3 font-ui text-sm leading-relaxed text-muted-foreground">
          This is Teacher Edition facilitation guidance — read the call-out above while teaching.
          Open the full lesson in your Teacher Edition for surrounding context.
        </p>
      )}

      {workspaceBlockHint && (
        <p className="text-xs leading-relaxed text-amber-700/90 dark:text-amber-500/90">
          {workspaceBlockHint}
        </p>
      )}

      {(exportReady || showWorkspaceAdd) && (
        <footer className="flex flex-col gap-2 border-t border-border pt-6 sm:flex-row">
          {exportReady && onExport && (
            <Button type="button" className="w-full sm:w-auto" onClick={onExport}>
              <Download className="size-4" aria-hidden />
              Export materials
            </Button>
          )}
          {showWorkspaceAdd && onAddToWorkspace && (
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
        </footer>
      )}
    </div>
  );
}
