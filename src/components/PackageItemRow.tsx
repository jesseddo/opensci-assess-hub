import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PackageItem } from "@/lib/assessment-data";
import { openPackageItem } from "@/lib/library-actions";
import {
  packageItemAvailability,
  packageItemRowClass,
  packageItemStatusLabel,
} from "@/lib/package-item-status";

interface Props {
  item: PackageItem;
  compact?: boolean;
}

export function PackageItemRow({ item, compact = false }: Props) {
  const availability = packageItemAvailability(item);
  const isPermanentAbsent = availability === "not-applicable";
  const isPlanned = availability === "planned";

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 font-ui ${packageItemRowClass(item)}`}
    >
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${compact ? "text-sm" : "text-sm"}`}>{item.label}</p>
        <p
          className={`text-xs ${
            item.available
              ? "text-muted-foreground truncate"
              : isPlanned
                ? "text-amber-800/80"
                : isPermanentAbsent
                  ? "text-muted-foreground/60"
                  : "text-muted-foreground"
          }`}
        >
          {packageItemStatusLabel(item)}
        </p>
      </div>
      <Button
        type="button"
        variant={item.available ? "outline" : "ghost"}
        size="sm"
        disabled={!item.available}
        aria-label={item.available ? `Open ${item.label}` : `${item.label} unavailable`}
        onClick={() => openPackageItem(item)}
        className="shrink-0"
      >
        <ExternalLink className="size-3.5" aria-hidden />
        Open
      </Button>
    </div>
  );
}
