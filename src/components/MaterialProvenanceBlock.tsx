import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import {
  formatMaterialLastUpdated,
  materialItemLastUpdated,
  materialSourceLabel,
  materialSourcePath,
  MATERIAL_PROVENANCE_FOOTNOTE,
} from "@/lib/material-provenance";
import { cn } from "@/lib/utils";

interface SectionProps {
  unit: Unit;
  assessment: Assessment;
  className?: string;
}

/** Once per materials list — shared OpenSciEd source context. */
export function MaterialsSectionSource({ unit, assessment, className }: SectionProps) {
  const sourceLabel = materialSourceLabel(unit, assessment);
  const lastUpdated = formatMaterialLastUpdated(unit.ingestedAt);

  return (
    <p
      className={cn(
        "text-xs italic leading-relaxed text-muted-foreground",
        className,
      )}
    >
      {sourceLabel}
      {lastUpdated && <> · Last updated {lastUpdated}</>}
      {" · "}
      {MATERIAL_PROVENANCE_FOOTNOTE}
    </p>
  );
}

interface ItemProps {
  unit: Unit;
  assessment: Assessment;
  item: PackageItem;
  className?: string;
}

/** Per-file provenance — shown in Quick look only. */
export function MaterialProvenanceBlock({ unit, assessment, item, className }: ItemProps) {
  const sourceLabel = materialSourceLabel(unit, assessment);
  const fileName = item.fileName ?? materialSourcePath(item)?.split(/[/\\]/).pop();
  const folderPath = materialSourcePath(item);
  const lastUpdated = materialItemLastUpdated(assessment.id, item, unit);

  return (
    <div
      className={cn(
        "rounded-md border border-border/80 bg-muted/25 px-3 py-2.5 space-y-1.5 text-sm",
        className,
      )}
    >
      <p>
        <span className="font-medium text-foreground">Source:</span>{" "}
        <span className="text-muted-foreground">{sourceLabel}</span>
      </p>
      {fileName && (
        <p>
          <span className="font-medium text-foreground">File:</span>{" "}
          <span className="text-muted-foreground break-all">{fileName}</span>
        </p>
      )}
      {folderPath && folderPath !== fileName && (
        <p className="text-xs text-muted-foreground break-all" title={folderPath}>
          {folderPath}
        </p>
      )}
      {lastUpdated && (
        <p>
          <span className="font-medium text-foreground">Last updated:</span>{" "}
          <span className="text-muted-foreground">{lastUpdated}</span>
        </p>
      )}
      <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
        {MATERIAL_PROVENANCE_FOOTNOTE}
      </p>
    </div>
  );
}
