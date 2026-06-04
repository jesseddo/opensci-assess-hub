import type { Assessment } from "@/lib/assessment-data";
import { assessmentSource } from "@/lib/assessment-source";
import { libraryDeliverableLabel } from "@/lib/library-deliverables";
import { cn } from "@/lib/utils";

export function LibraryOutputLabel({
  assessment,
  className,
}: {
  assessment: Assessment;
  className?: string;
}) {
  const source = assessmentSource(assessment);

  return (
    <p className={cn("text-[10px] text-muted-foreground/80 font-ui leading-none", className)}>
      {libraryDeliverableLabel(assessment.libraryOutput, source)}
    </p>
  );
}
