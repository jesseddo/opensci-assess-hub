import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import { assessmentGuideFor } from "@/lib/assessment-guide";
import { materialPreviewMeta } from "@/lib/material-previews";

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

export function materialQuickLookPreviewUrl(
  assessmentId: string,
  item: PackageItem,
): string | null {
  return materialPreviewMeta(assessmentId, item.kind)?.previewUrl ?? materialGuidancePreviewUrl(item);
}

export function materialItemLastUpdated(
  assessmentId: string,
  item: PackageItem,
  unit: Unit,
): string | null {
  const fromPreview = materialPreviewMeta(assessmentId, item.kind)?.sourceModifiedAt;
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
