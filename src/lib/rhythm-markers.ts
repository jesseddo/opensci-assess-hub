import type { Assessment } from "@/lib/assessment-data";
import { isTeOpportunity } from "@/lib/assessment-source";
import { normalizeAssessmentType } from "@/lib/assessment-types";
import type { LessonRhythmKind } from "@/lib/unit-rhythm";

export function rhythmKindForAssessment(assessment: Assessment): LessonRhythmKind {
  if (isTeOpportunity(assessment)) return "none";
  if (assessment.isSummative === true || assessment.assessmentType === "summative") {
    return "summative";
  }
  const slug = assessment.assessmentType ?? normalizeAssessmentType(assessment.typeLabel);
  if (slug === "formative") return "formative";
  return "supporting";
}

/** Timeline dots (rhythm strip) vs inline table swatches. */
export function rhythmMarkerClassName(
  kind: LessonRhythmKind,
  variant: "timeline" | "inline" = "timeline",
): string {
  if (variant === "inline") {
    const base = "size-2 shrink-0";
    switch (kind) {
      case "none":
        return `${base} rounded-full border border-muted-foreground/25 bg-card`;
      case "formative":
        return `${base} rounded-full bg-eddo-accent`;
      case "supporting":
        return `${base} rounded-[2px] bg-eddo-navy/55`;
      case "summative":
        return `${base} rounded-full bg-eddo-green`;
    }
  }
  switch (kind) {
    case "none":
      return "size-1 rounded-full border border-muted-foreground/20 bg-card";
    case "formative":
      return "size-3 rounded-full bg-eddo-accent ring-2 ring-card";
    case "supporting":
      return "size-2.5 rounded-[3px] bg-eddo-navy/55 ring-2 ring-card";
    case "summative":
      return "size-4 rounded-full bg-eddo-green ring-2 ring-card shadow-[0_0_0_2px_var(--eddo-green)]";
  }
}
