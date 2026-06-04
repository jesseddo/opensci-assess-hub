import { TE_OPPORTUNITY_LABEL } from "@/lib/assessment-source";
import { rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { cn } from "@/lib/utils";

/** OpenSciEd “Assessment opportunity” rows from the Teacher Edition. */
export function TeOpportunityLabel({ className }: { className?: string }) {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground font-ui leading-none",
        className,
      )}
    >
      <span
        className={cn("relative shrink-0", rhythmMarkerClassName("none", "inline"))}
        aria-hidden
      />
      <span>{TE_OPPORTUNITY_LABEL}</span>
    </p>
  );
}
