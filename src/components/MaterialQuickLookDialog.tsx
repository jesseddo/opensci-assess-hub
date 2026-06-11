import { Download, Eye, ExternalLink } from "lucide-react";

import { MaterialProvenanceBlock } from "@/components/MaterialProvenanceBlock";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import { exportSelectedMaterials } from "@/lib/library-actions";
import {
  getMaterialQuickLookExcerpt,
  materialQuickLookPreview,
  materialQuickLookPreviewCaption,
  materialQuickLookPreviewHeading,
} from "@/lib/material-provenance";

interface Props {
  assessment: Assessment;
  unit: Unit;
  item: PackageItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MaterialQuickLookDialog({ assessment, unit, item, open, onOpenChange }: Props) {
  if (!item) return null;

  const excerpt = getMaterialQuickLookExcerpt(assessment, item, unit);
  const preview = materialQuickLookPreview(assessment.id, item);
  const externalFormUrl =
    item.kind === "google-form" && item.available && item.url?.startsWith("http")
      ? item.url
      : null;

  const handleExport = () => {
    exportSelectedMaterials(assessment, [item]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`max-h-[92vh] overflow-y-auto font-ui ${preview ? "max-w-3xl" : "max-w-xl"}`}
      >
        <DialogHeader>
          <DialogDescription className="font-mono text-[10px] uppercase tracking-widest">
            Quick look · OpenSciEd source
          </DialogDescription>
          <DialogTitle>{item.label}</DialogTitle>
          <DialogDescription>
            Verify this is the right document before exporting — preview stays in the Assessment
            Library.
          </DialogDescription>
        </DialogHeader>

        <MaterialProvenanceBlock unit={unit} assessment={assessment} item={item} />

        {preview ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {materialQuickLookPreviewHeading(preview)}
            </p>
            <iframe
              title={`Preview of ${item.label}`}
              src={preview.url}
              className="h-[min(36rem,65vh)] w-full rounded-md border border-border bg-background"
            />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {materialQuickLookPreviewCaption(preview)}
            </p>
          </div>
        ) : (
          excerpt && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {excerpt.title}
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                {excerpt.body}
              </p>
            </div>
          )
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {externalFormUrl ? (
            <Button type="button" variant="outline" asChild>
              <a href={externalFormUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                Open form
              </a>
            </Button>
          ) : null}
          <Button type="button" onClick={handleExport}>
            <Download className="size-4" aria-hidden />
            Export this file
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface QuickLookButtonProps {
  item: PackageItem;
  onClick: () => void;
}

export function MaterialQuickLookButton({ item, onClick }: QuickLookButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={!item.available}
      aria-label={item.available ? `Quick look at ${item.label}` : `${item.label} unavailable`}
      onClick={onClick}
      className="shrink-0"
    >
      <Eye className="size-3.5" aria-hidden />
      Quick look
    </Button>
  );
}
