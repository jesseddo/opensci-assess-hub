import type { Assessment } from "@/lib/assessment-data";
import { isTeOpportunity } from "@/lib/assessment-source";
import { normalizeAssessmentType, oseRhythmCategory } from "@/lib/assessment-types";
import type { LessonRhythmKind } from "@/lib/unit-rhythm";

export function rhythmKindForAssessment(assessment: Assessment): LessonRhythmKind {
  if (isTeOpportunity(assessment)) return "none";
  if (assessment.isSummative === true || assessment.assessmentType === "summative") {
    return "summative";
  }
  const slug = assessment.assessmentType ?? normalizeAssessmentType(assessment.typeLabel);
  return oseRhythmCategory(slug);
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
        return `${base} rounded-full bg-eddo-violet`;
      case "formative":
        return `${base} rounded-full bg-eddo-accent`;
      case "pre-assessment":
        return `${base} rounded-full bg-eddo-accent/50 border border-eddo-accent`;
      case "peer-assessment":
        return `${base} rounded-[2px] bg-eddo-navy/55`;
      case "summative":
        return `${base} rounded-full bg-eddo-green`;
    }
  }
  switch (kind) {
    case "none":
      return "size-2.5 rounded-full bg-eddo-violet ring-2 ring-card shadow-sm";
    case "formative":
      return "size-3.5 rounded-full bg-eddo-accent ring-2 ring-card shadow-sm";
    case "pre-assessment":
      return "size-3 rounded-full bg-eddo-accent/70 ring-2 ring-card border border-eddo-accent/80 shadow-sm";
    case "peer-assessment":
      return "size-3 rounded-[3px] bg-eddo-navy/60 ring-2 ring-card shadow-sm";
    case "summative":
      return "size-4 rounded-full bg-eddo-green ring-2 ring-card shadow-[0_1px_3px_rgb(47_74_62_/0.35)]";
  }
}
