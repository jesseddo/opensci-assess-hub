import type { PackageItemKind } from "@/lib/assessment-data";
import previewsUnit81 from "@/data/material-previews/unit-8.1.json";

export interface MaterialPreviewMeta {
  previewUrl: string;
  sourceModifiedAt?: string;
  paragraphCount?: number;
  previewParagraphCount?: number;
}

type PreviewIndex = Record<string, Partial<Record<PackageItemKind, MaterialPreviewMeta>>>;

const PREVIEW_INDEX: PreviewIndex = {
  ...(previewsUnit81 as PreviewIndex),
};

export function materialPreviewMeta(
  assessmentId: string,
  kind: PackageItemKind,
): MaterialPreviewMeta | null {
  return PREVIEW_INDEX[assessmentId]?.[kind] ?? null;
}

export function materialPreviewUrl(assessmentId: string, kind: PackageItemKind): string | null {
  return materialPreviewMeta(assessmentId, kind)?.previewUrl ?? null;
}
