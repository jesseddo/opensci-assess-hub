import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import { assessmentGuideFor } from "@/lib/assessment-guide";
import {
  conventionalGoogleFormPreviewUrl,
  materialPreviewMeta,
} from "@/lib/material-previews";

export const MATERIAL_PROVENANCE_FOOTNOTE =
  "Matched from your official unit download — not edited by Eddo.";

export function formatMaterialLastUpdated(iso?: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
}

export function materialSourceLabel(unit: Unit, assessment: Assessment): string {
  return `OpenSciEd Unit ${unit.id} · ${assessment.lesson}`;
}

export function materialSourcePath(item: PackageItem): string | undefined {
  if (item.sourcePath) return item.sourcePath;
  if (item.url?.startsWith("ingest:")) {
    return item.url.slice("ingest:".length);
  }
  return undefined;
}

export function materialGuidancePreviewUrl(item: PackageItem): string | null {
  if (item.url?.startsWith("/guidance/")) return item.url;
  if (item.url?.startsWith("/previews/")) return item.url;
  return null;
}

export type MaterialQuickLookPreviewSource = "document" | "google-form-snapshot" | "google-form-handout";

export interface MaterialQuickLookPreview {
  url: string;
  source: MaterialQuickLookPreviewSource;
}

/**
 * Google Forms with file-upload questions cannot be iframe-embedded (Google restriction).
 * For digitized forms, preview the matching student handout content when available.
 */
export function materialQuickLookPreview(
  assessmentId: string,
  item: PackageItem,
): MaterialQuickLookPreview | null {
  const dedicated = materialPreviewMeta(assessmentId, item.kind)?.previewUrl;
  if (dedicated) {
    return {
      url: dedicated,
      source: item.kind === "google-form" ? "google-form-snapshot" : "document",
    };
  }

  if (item.kind === "google-form" && item.available && item.url?.startsWith("http")) {
    const snapshotUrl = conventionalGoogleFormPreviewUrl(assessmentId);
    if (snapshotUrl) {
      return { url: snapshotUrl, source: "google-form-snapshot" };
    }
  }

  if (item.kind === "google-form" && item.available) {
    const handoutPreview = materialPreviewMeta(assessmentId, "student-handout")?.previewUrl;
    if (handoutPreview) {
      return { url: handoutPreview, source: "google-form-handout" };
    }
  }

  const guidance = materialGuidancePreviewUrl(item);
  if (guidance) return { url: guidance, source: "document" };

  return null;
}

/** @deprecated Use materialQuickLookPreview */
export function materialQuickLookPreviewUrl(
  assessmentId: string,
  item: PackageItem,
): string | null {
  return materialQuickLookPreview(assessmentId, item)?.url ?? null;
}

export function materialQuickLookPreviewCaption(preview: MaterialQuickLookPreview): string {
  if (preview.source === "google-form-snapshot") {
    return "Static snapshot of the digitized Google Form — shows question layout and choices. Use Open form for the live version.";
  }
  if (preview.source === "google-form-handout") {
    return "Question content from the OpenSciEd student handout — the digitized form is built from this source. Use Open form for the live version.";
  }
  return "Verbatim excerpt from the OpenSciEd file — scroll to review before exporting.";
}

export function materialQuickLookPreviewHeading(preview: MaterialQuickLookPreview): string {
  if (preview.source === "google-form-snapshot" || preview.source === "google-form-handout") {
    return "Form preview";
  }
  return "Document preview";
}

export function materialItemLastUpdated(
  assessmentId: string,
  item: PackageItem,
  unit: Unit,
): string | null {
  const preview = materialQuickLookPreview(assessmentId, item);
  const previewKind =
    preview?.source === "google-form-handout"
      ? "student-handout"
      : preview?.source === "google-form-snapshot"
        ? "google-form"
        : item.kind;
  const fromPreview = materialPreviewMeta(assessmentId, previewKind)?.sourceModifiedAt;
  return formatMaterialLastUpdated(fromPreview ?? unit.ingestedAt);
}

function lessonNumFromAssessment(assessment: Assessment): number | null {
  const match = assessment.lesson.match(/(\d+)/);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

export interface MaterialQuickLookExcerpt {
  title: string;
  body: string;
}

/** In-app preview text until ingest stores first-page docx excerpts. */
export function getMaterialQuickLookExcerpt(
  assessment: Assessment,
  item: PackageItem,
  unit: Unit,
): MaterialQuickLookExcerpt | null {
  const guide = assessmentGuideFor(assessment.id);
  const lessonNum = lessonNumFromAssessment(assessment);
  const lessonMeta = lessonNum
    ? unit.lessons?.find((lesson) => lesson.lessonNum === lessonNum)
    : undefined;

  switch (item.kind) {
    case "student-handout": {
      const sample = guide?.understanding.strong[0];
      if (sample) {
        return { title: "Sample from this handout", body: sample };
      }
      if (assessment.buildingTowards?.trim()) {
        return { title: "Building towards", body: assessment.buildingTowards.trim() };
      }
      return { title: "About this handout", body: assessment.description };
    }
    case "answer-key": {
      const samples = guide?.understanding.strong.slice(0, 2) ?? [];
      if (samples.length > 0) {
        return {
          title: "What the key covers",
          body: samples.join("\n\n"),
        };
      }
      return {
        title: "About this key",
        body: `Scoring guidance for ${assessment.title}.`,
      };
    }
    case "teacher-guide":
      return {
        title: "Lesson context",
        body:
          lessonMeta?.title ??
          `Teacher Edition for ${assessment.lesson} — includes assessment opportunities and facilitation notes.`,
      };
    case "guidance-sheet": {
      const snippet = assessment.lookListenFor?.trim();
      if (snippet) {
        return {
          title: "What to look / listen for",
          body: snippet.length > 480 ? `${snippet.slice(0, 477)}…` : snippet,
        };
      }
      return {
        title: "Assessment opportunity guidance",
        body: "Facilitation guidance extracted from the OpenSciEd Teacher Edition.",
      };
    }
    case "google-form":
      if (item.available && item.url?.startsWith("http")) {
        return null;
      }
      return {
        title: "Google Form",
        body: "This assessment does not have a digitized Google Form yet. Export the student handout and key instead.",
      };
    case "rubric":
      return {
        title: "Rubric",
        body: "No rubric file is bundled with this assessment in the OpenSciEd unit materials.",
      };
    default:
      return null;
  }
}
