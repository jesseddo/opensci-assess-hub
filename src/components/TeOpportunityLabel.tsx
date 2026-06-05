import type { Assessment } from "@/lib/assessment-data";
import { assessmentRowTypeDisplay } from "@/lib/unit-assessment-organization";
import { rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { cn } from "@/lib/utils";

/** Teacher Edition assessment opportunity + OpenSciEd assessment type tag. */
export function TeOpportunityLabel({
  assessment,
  className,
}: {
  assessment: Assessment;
  className?: string;
}) {
  const { primary, secondary } = assessmentRowTypeDisplay(assessment);

  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-ui leading-none">
        <span
          className={cn("relative shrink-0", rhythmMarkerClassName("none", "inline"))}
          aria-hidden
        />
        <span>{primary}</span>
      </p>
      {secondary && (
        <p className="text-[10px] text-muted-foreground/75 font-ui leading-none pl-[14px]">
          {secondary}
        </p>
      )}
    </div>
  );
}
