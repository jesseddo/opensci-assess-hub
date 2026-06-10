import type { Assessment } from "@/lib/assessment-data";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";
import { rhythmKindForAssessment, rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { cn } from "@/lib/utils";

/** Standalone assessment document from unit materials + OpenSciEd system category. */
export function AssessmentDocumentLabel({
  assessment,
  className,
  showSwatch = true,
  variant = "default",
}: {
  assessment: Assessment;
  className?: string;
  showSwatch?: boolean;
  /** Table rows: primary label only — matches TE opportunity subtitle styling. */
  variant?: "default" | "table";
}) {
  const { primary, secondary } = assessmentRowTypeDisplay(assessment);

  if (variant === "table") {
    const kind = rhythmKindForAssessment(assessment);
    return (
      <p
        className={cn(
          "inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/75 font-ui leading-none",
          className,
        )}
      >
        <span
          className={cn("relative shrink-0", rhythmMarkerClassName(kind, "inline"))}
          aria-hidden
        />
        <span>
          {primary}
          <span className="text-muted-foreground/60"> · </span>
          {secondary}
        </span>
      </p>
    );
  }

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
        <span>{primary}</span>
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
