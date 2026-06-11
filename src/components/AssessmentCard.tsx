import { ChevronRight, Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Assessment } from "@/lib/assessment-data";
import {
  getAssessmentMetaLine,
  isExportReady,
  rowShowsWorkspaceAddButton,
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
  const showWorkspaceAdd = rowShowsWorkspaceAddButton(assessment);

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
          {showWorkspaceAdd && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddToWorkspace(assessment)}
              aria-label={`Add ${assessment.title} to my workspace`}
            >
              <Plus className="size-3.5" aria-hidden />
              <span className="hidden sm:inline">Add to my workspace</span>
              <span className="sm:hidden">My workspace</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
