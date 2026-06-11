import { useState } from "react";

import {
  MaterialQuickLookButton,
  MaterialQuickLookDialog,
} from "@/components/MaterialQuickLookDialog";
import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import {
  packageItemAvailability,
  packageItemRowClass,
  packageItemStatusLabel,
  packageItemUnavailableLabel,
} from "@/lib/package-item-status";

interface Props {
  item: PackageItem;
  assessment: Assessment;
  unit: Unit;
}

export function PackageItemRow({ item, assessment, unit }: Props) {
  const [quickLookOpen, setQuickLookOpen] = useState(false);
  const availability = packageItemAvailability(item);
  const isPermanentAbsent = availability === "not-applicable";
  const isPlanned = availability === "planned";
  const selectable = item.available;
  const statusText = selectable ? packageItemStatusLabel(item) : packageItemUnavailableLabel(item);

  return (
    <>
      <div
        className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 font-ui ${packageItemRowClass(item)}`}
      >
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm">{item.label}</p>
          <p
            className={`text-xs ${
              selectable
                ? "text-muted-foreground truncate"
                : isPlanned
                  ? "text-amber-800/80"
                  : isPermanentAbsent
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground"
            }`}
            title={statusText}
          >
            {statusText}
          </p>
        </div>
        <MaterialQuickLookButton item={item} onClick={() => setQuickLookOpen(true)} />
      </div>

      <MaterialQuickLookDialog
        assessment={assessment}
        unit={unit}
        item={item}
        open={quickLookOpen}
        onOpenChange={setQuickLookOpen}
      />
    </>
  );
}
