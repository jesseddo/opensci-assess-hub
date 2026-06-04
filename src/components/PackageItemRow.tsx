import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { PackageItem } from "@/lib/assessment-data";
import { openPackageItem } from "@/lib/library-actions";

interface Props {
  item: PackageItem;
  compact?: boolean;
}

export function PackageItemRow({ item, compact = false }: Props) {
  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-md border px-3 py-2 ${
        item.available
          ? "border-border bg-card"
          : "border-dashed border-border/70 bg-muted/30 opacity-80"
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${compact ? "text-sm" : "text-sm"}`}>{item.label}</p>
        {item.available && item.fileName ? (
          <p className="text-xs text-muted-foreground truncate">{item.fileName}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {item.unavailableReason ?? "Not included"}
          </p>
        )}
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
