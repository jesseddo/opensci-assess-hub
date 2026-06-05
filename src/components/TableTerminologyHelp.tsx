import { CircleHelp } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Unit } from "@/lib/assessment-data";
import { buildUnitOrganizationSummary } from "@/lib/unit-assessment-organization";
import { cn } from "@/lib/utils";

interface Props {
  unit: Unit;
  className?: string;
}

export function TableTerminologyHelp({ unit, className }: Props) {
  const org = buildUnitOrganizationSummary(unit);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5",
            "text-[11px] font-ui text-muted-foreground",
            "hover:text-eddo-navy hover:bg-muted/60",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            className,
          )}
        >
          <CircleHelp className="size-3.5 shrink-0" aria-hidden />
          What&apos;s in this table?
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(22rem,calc(100vw-2rem))] p-4 space-y-3">
        <p className="text-xs text-muted-foreground font-ui leading-snug">
          This table lists everything assessable in Unit {unit.id}:{" "}
          {org.assessmentOpportunityCount} assessment{" "}
          {org.assessmentOpportunityCount === 1 ? "opportunity" : "opportunities"} from the
          Teacher Edition, plus {org.assessmentDocumentCount} named assessment
          {org.assessmentDocumentCount === 1 ? "" : "s"} from the unit download
          {org.documentCategoryLine ? ` (${org.documentCategoryLine})` : ""}.
        </p>
        <dl className="space-y-2.5 text-xs text-muted-foreground font-ui">
          <div>
            <dt className="font-semibold text-eddo-navy mb-0.5">Assessment opportunity</dt>
            <dd className="leading-relaxed">
              An OpenSciEd call-out inside the lesson plan — Building towards, What to look/listen
              for, and What to do. Use while teaching to notice student thinking. Most rows are
              guidance only; some link to a lesson handout.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-eddo-navy mb-0.5">Assessment</dt>
            <dd className="leading-relaxed">
              A standalone document from the unit materials folder — for example Soccer Assessment
              or Cheerleading Performance Task. Includes the student handout and answer key when
              OpenSciEd provides them.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-eddo-navy mb-0.5">Assessment guide</dt>
            <dd className="leading-relaxed">
              Eddo&apos;s interpretive companion for a named assessment — alignment, strong
              understanding, common gaps, and sample responses. Separate from Teacher Edition
              facilitation text.
            </dd>
          </div>
        </dl>
      </PopoverContent>
    </Popover>
  );
}
