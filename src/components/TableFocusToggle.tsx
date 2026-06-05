import { cn } from "@/lib/utils";
import type { TableFocusMode } from "@/lib/assessment-row-tier";

interface Props {
  value: TableFocusMode;
  onChange: (value: TableFocusMode) => void;
  unitAssessmentCount: number;
  totalCount: number;
}

export function TableFocusToggle({ value, onChange, unitAssessmentCount, totalCount }: Props) {
  return (
    <div
      className="inline-flex h-8 items-center rounded-xl border border-eddo-green/20 bg-surface p-0.5 text-xs font-ui shadow-sm"
      role="group"
      aria-label="Table focus"
    >
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "h-full rounded-[10px] px-3 transition-colors whitespace-nowrap",
          value === "all"
            ? "bg-background text-eddo-navy shadow-sm font-medium"
            : "text-muted-foreground hover:text-eddo-green",
        )}
      >
        Show all ({totalCount})
      </button>
      <button
        type="button"
        onClick={() => onChange("unit-assessments")}
        className={cn(
          "h-full rounded-[10px] px-3 transition-colors whitespace-nowrap",
          value === "unit-assessments"
            ? "bg-background text-eddo-navy shadow-sm font-medium"
            : "text-muted-foreground hover:text-eddo-green",
        )}
      >
        Assessments only ({unitAssessmentCount})
      </button>
    </div>
  );
}
