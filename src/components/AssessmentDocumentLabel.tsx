import type { Assessment } from "@/lib/assessment-data";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";
import { rhythmKindForAssessment, rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { cn } from "@/lib/utils";

/** Standalone assessment document from unit materials + OpenSciEd system category. */
export function AssessmentDocumentLabel({
  assessment,
  className,
  showSwatch = true,
}: {
  assessment: Assessment;
  className?: string;
  showSwatch?: boolean;
}) {
  const { primary, secondary } = assessmentRowTypeDisplay(assessment);
  const kind = rhythmKindForAssessment(assessment);

  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-ui leading-none">
        {showSwatch && (
          <span
            className={cn("relative shrink-0", rhythmMarkerClassName(kind, "inline"))}
            aria-hidden
          />
        )}
        <span className={showSwatch ? undefined : "text-muted-foreground/75"}>{primary}</span>
      </p>
      {secondary && (
        <p
          className={cn(
            "text-[10px] text-muted-foreground/75 font-ui leading-none",
            showSwatch ? "pl-[14px]" : "pl-0",
          )}
        >
          {secondary}
        </p>
      )}
    </div>
  );
}
