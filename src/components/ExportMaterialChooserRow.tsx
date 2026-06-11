import { Checkbox } from "@/components/ui/checkbox";
import type { PackageItem, PackageItemKind } from "@/lib/assessment-data";
import {
  packageItemAvailability,
  packageItemAvailabilityBadgeClass,
  packageItemRowClass,
  packageItemStatusLabel,
  packageItemUnavailableLabel,
} from "@/lib/package-item-status";
import { cn } from "@/lib/utils";

interface Props {
  item: PackageItem;
  checked: boolean;
  onCheckedChange: (kind: PackageItemKind, checked: boolean) => void;
}

export function ExportMaterialChooserRow({ item, checked, onCheckedChange }: Props) {
  const availability = packageItemAvailability(item);
  const selectable = item.available;
  const statusText = selectable ? packageItemStatusLabel(item) : packageItemUnavailableLabel(item);

  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-md border px-3 py-2.5 font-ui transition-colors",
        packageItemRowClass(item),
        selectable && "cursor-pointer hover:bg-muted/20",
        !selectable && "cursor-not-allowed",
      )}
    >
      <Checkbox
        checked={selectable ? checked : false}
        disabled={!selectable}
        onCheckedChange={(value) => onCheckedChange(item.kind, value === true)}
        className="mt-0.5"
        aria-label={
          selectable
            ? `Include ${item.label} in export`
            : `${item.label} — ${statusText}`
        }
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("text-sm font-medium", !selectable && "text-muted-foreground")}>
            {item.label}
          </span>
          <span
            className={cn(
              "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
              packageItemAvailabilityBadgeClass(item),
            )}
          >
            {selectable
              ? "Available"
              : availability === "planned"
                ? "Not digitized"
                : availability === "not-applicable"
                  ? "N/A"
                  : "Unavailable"}
          </span>
        </div>
        <p
          className={cn(
            "text-xs leading-snug",
            selectable ? "text-muted-foreground truncate" : "text-muted-foreground/90",
          )}
          title={statusText}
        >
          {statusText}
        </p>
      </div>
    </label>
  );
}
