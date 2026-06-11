import type { PackageItemKind } from "@/lib/assessment-data";

export interface MaterialPreviewMeta {
  previewUrl: string;
  sourceModifiedAt?: string;
  paragraphCount?: number;
  previewParagraphCount?: number;
}

type PreviewIndex = Record<string, Partial<Record<PackageItemKind, MaterialPreviewMeta>>>;

const previewModules = import.meta.glob<{ default: PreviewIndex } | PreviewIndex>(
  "@/data/material-previews/unit-*.json",
  {
    eager: true,
  },
);

function previewModuleData(module: { default: PreviewIndex } | PreviewIndex): PreviewIndex {
  if (module && typeof module === "object" && "default" in module && module.default) {
    return module.default;
  }
  return module as PreviewIndex;
}

const PREVIEW_INDEX: PreviewIndex = Object.values(previewModules).reduce<PreviewIndex>(
  (merged, module) => ({ ...merged, ...previewModuleData(module) }),
  {},
);

function unitSlugFromAssessmentId(assessmentId: string): string | null {
  const match = assessmentId.match(/^(\d)(\d+)-/);
  if (!match) return null;
  return `${match[1]}-${match[2]}`;
}

/** Static snapshot path for digitized forms (generated under public/previews). */
export function conventionalGoogleFormPreviewUrl(assessmentId: string): string | null {
  const unitSlug = unitSlugFromAssessmentId(assessmentId);
  if (!unitSlug) return null;
  return `/previews/${unitSlug}/${assessmentId}/google-form.html`;
}

export function materialPreviewMeta(
  assessmentId: string,
  kind: PackageItemKind,
): MaterialPreviewMeta | null {
  return PREVIEW_INDEX[assessmentId]?.[kind] ?? null;
}

export function materialPreviewUrl(assessmentId: string, kind: PackageItemKind): string | null {
  return materialPreviewMeta(assessmentId, kind)?.previewUrl ?? null;
}
