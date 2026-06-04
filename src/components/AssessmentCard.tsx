import { ChevronRight, Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/assessment-data";
import {
  getAssessmentMetaLine,
  getWorkspaceBlockHint,
  isExportReady,
  isWorkspaceReady,
} from "@/lib/assessment-helpers";

interface Props {
  assessment: Assessment;
  delayMs?: number;
  hideLessonBadge?: boolean;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}

export function AssessmentCard({
  assessment,
  delayMs = 0,
  hideLessonBadge = false,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
}: Props) {
  const highlight = assessment.isSummative;
  const exportReady = isExportReady(assessment);
  const workspaceReady = isWorkspaceReady(assessment);
  const blockHint = getWorkspaceBlockHint(assessment);

  return (
    <div
      className={`animate-reveal group rounded-xl p-4 sm:p-5 transition-all hover:shadow-md ${
        highlight
          ? "bg-primary/5 border border-primary/20"
          : "bg-card border border-border hover:border-primary/40"
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            {!hideLessonBadge && (
              <span
                className={`font-mono text-[10px] px-2 py-0.5 rounded shrink-0 ${
                  highlight ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                {assessment.lesson}
              </span>
            )}
            <button
              type="button"
              onClick={() => onOpenDetail(assessment)}
              className="inline-flex items-center gap-1 min-w-0 text-left font-semibold text-base sm:text-lg leading-tight hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm"
              aria-label={`View details for ${assessment.title}`}
            >
              <span className="truncate">{assessment.title}</span>
              <ChevronRight
                className="size-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors"
                aria-hidden
              />
            </button>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed text-pretty">
            {getAssessmentMetaLine(assessment)}
          </p>

          {blockHint && (
            <p className="text-xs text-amber-700/90 dark:text-amber-500/90 leading-relaxed">
              {blockHint}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 shrink-0">
          <Button
            type="button"
            size="sm"
            onClick={() => onExport(assessment)}
            disabled={!exportReady}
            aria-label={`Export ${assessment.title}`}
          >
            <Download className="size-3.5" aria-hidden />
            Export
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddToWorkspace(assessment)}
            disabled={!workspaceReady}
            title={workspaceReady ? undefined : (blockHint ?? undefined)}
            aria-label={`Add ${assessment.title} to Workspace`}
          >
            <Plus className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">Add to Workspace</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
