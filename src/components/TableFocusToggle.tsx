import { cn } from "@/lib/utils";
import type { TableFocusMode } from "@/lib/assessment-row-tier";

interface Props {
  value: TableFocusMode;
  onChange: (value: TableFocusMode) => void;
  allAssessmentCount: number;
  unitAssessmentCount: number;
}

export function TableFocusToggle({
  value,
  onChange,
  allAssessmentCount,
  unitAssessmentCount,
}: Props) {
  return (
    <div
      className="inline-flex h-8 items-center rounded-lg border border-border bg-card p-0.5 text-xs font-ui"
      role="group"
      aria-label="Table focus"
    >
      <button
        type="button"
        onClick={() => onChange("prepare")}
        className={cn(
          "h-full rounded-[10px] px-3 transition-colors whitespace-nowrap",
          value === "prepare"
            ? "bg-muted text-eddo-navy font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Assessments & opportunities ({allAssessmentCount})
      </button>
      <button
        type="button"
        onClick={() => onChange("unit-assessments")}
        className={cn(
          "h-full rounded-[10px] px-3 transition-colors whitespace-nowrap",
          value === "unit-assessments"
            ? "bg-muted text-eddo-navy font-medium"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Assessments ({unitAssessmentCount})
      </button>
    </div>
  );
}
