/**
 * Assessment categories from the OpenSciEd assessment system.
 * @see https://openscied.org/knowledge/what-type-of-assessments-are-available-in-an-openscied-unit/
 */
export const ASSESSMENT_TYPE_LABELS = {
  formative: "Formative assessment",
  summative: "Summative assessment",
  "pre-assessment": "Pre-assessment",
  "peer-feedback": "Peer assessment",
  /** Embedded in formative system; stored for ingest, displayed as formative */
  "lesson-reflection": "Formative assessment",
  "progress-tracker": "Formative assessment",
  "exit-ticket": "Formative assessment",
  "performance-task": "Formative assessment",
} as const;

export type AssessmentTypeSlug = keyof typeof ASSESSMENT_TYPE_LABELS;

const ALIASES: Record<string, AssessmentTypeSlug> = {
  formative: "formative",
  "formative assessment": "formative",
  summative: "summative",
  "summative assessment": "summative",
  "pre-assessment": "pre-assessment",
  "pre assessment": "pre-assessment",
  "peer assessment": "peer-feedback",
  "peer feedback": "peer-feedback",
  "peer assessments": "peer-feedback",
  "lesson reflection": "lesson-reflection",
  "progress tracker": "progress-tracker",
  "exit ticket": "exit-ticket",
  "performance task": "performance-task",
  "transfer task": "summative",
};

export function normalizeAssessmentType(raw: string): AssessmentTypeSlug {
  const key = raw.trim().toLowerCase();
  return ALIASES[key] ?? "formative";
}

/** Teacher-facing label for a stored slug. */
export function assessmentTypeLabel(slug: AssessmentTypeSlug): string {
  return ASSESSMENT_TYPE_LABELS[slug];
}

/** Rhythm strip / priority grouping (OpenSciEd categories). */
export type OseRhythmCategory = "formative" | "summative" | "pre-assessment" | "peer-assessment";

export function oseRhythmCategory(slug: AssessmentTypeSlug): OseRhythmCategory {
  switch (slug) {
    case "summative":
      return "summative";
    case "pre-assessment":
      return "pre-assessment";
    case "peer-feedback":
      return "peer-assessment";
    default:
      return "formative";
  }
}

export function assessmentTypeFromFlags(opts: {
  isSummative?: boolean;
  kind?: "handout-extra" | "named-assessment";
  extraSlug?: AssessmentTypeSlug;
}): AssessmentTypeSlug {
  if (opts.extraSlug) return opts.extraSlug;
  if (opts.isSummative) return "summative";
  return "formative";
}
