import type { Assessment } from "@/lib/assessment-data";
import { getAssessmentTypeDisplay } from "@/lib/assessment-helpers";
import { rhythmKindForAssessment, rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { cn } from "@/lib/utils";

export function AssessmentTypeLabel({
  assessment,
  className,
}: {
  assessment: Assessment;
  className?: string;
}) {
  const kind = rhythmKindForAssessment(assessment);
  const label = getAssessmentTypeDisplay(assessment);

  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground font-ui leading-none",
        className,
      )}
    >
      <span
        className={cn("relative shrink-0", rhythmMarkerClassName(kind, "inline"))}
        aria-hidden
      />
      <span>{label}</span>
    </p>
  );
}
