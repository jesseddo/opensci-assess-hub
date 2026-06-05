import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Narrow trailing column for the lone workspace Add action. */
export const TABLE_WORKSPACE_COLUMN_CLASS = "w-[9rem] min-w-[9rem] max-w-[9rem]";

/** @deprecated Use TABLE_WORKSPACE_COLUMN_CLASS */
export const TABLE_ACTIONS_COLUMN_CLASS = TABLE_WORKSPACE_COLUMN_CLASS;

/** Horizontal pair — co-equal primary actions (Export · Add). */
export function TablePrimaryActionsRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full items-center justify-end gap-1.5">{children}</div>
  );
}

interface PrimaryTableActionProps {
  label: string;
  icon?: LucideIcon;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
  "aria-label"?: string;
}

/** Co-equal primary row action — lightweight icon + label. */
export function PrimaryTableAction({
  label,
  icon: Icon,
  disabled,
  title,
  onClick,
  "aria-label": ariaLabel,
}: PrimaryTableActionProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={ariaLabel ?? label}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1",
        "text-xs font-ui font-medium text-eddo-navy",
        "border border-border bg-card",
        "hover:bg-muted/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
        "disabled:pointer-events-none disabled:opacity-45",
      )}
    >
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden />}
      {label}
    </button>
  );
}
