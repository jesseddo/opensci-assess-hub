import { BookOpen } from "lucide-react";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

/** Shared wordmark: eddo · OpenSciEd Assessment Library (index + detail headers). */
export function LibraryBrandMark({ className }: Props) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5", className)}>
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-eddo-green">
        <BookOpen className="size-3.5 text-eddo-cream" strokeWidth={2.5} aria-hidden />
      </div>
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="shrink-0 font-display text-lg leading-none tracking-wide text-eddo-green">
          eddo
        </span>
        <span className="select-none text-sm leading-none text-eddo-green/35" aria-hidden>
          ·
        </span>
        <span className="text-sm font-semibold leading-none text-eddo-navy">
          OpenSciEd Assessment Library
        </span>
      </div>
    </div>
  );
}
