export const ASSESSMENT_TYPE_LABELS = {
  formative: "Formative assessment",
  summative: "Summative assessment",
  "lesson-reflection": "Lesson reflection",
  "peer-feedback": "Peer feedback",
  "progress-tracker": "Progress tracker",
  "exit-ticket": "Exit ticket",
  "performance-task": "Performance task",
} as const;

export type AssessmentTypeSlug = keyof typeof ASSESSMENT_TYPE_LABELS;

const ALIASES: Record<string, AssessmentTypeSlug> = {
  formative: "formative",
  "formative assessment": "formative",
  "formative check": "formative",
  summative: "summative",
  "summative assessment": "summative",
  "lesson reflection": "lesson-reflection",
  "peer feedback": "peer-feedback",
  "progress tracker": "progress-tracker",
  "exit ticket": "exit-ticket",
  "performance task": "performance-task",
};

export function normalizeAssessmentType(raw: string): AssessmentTypeSlug {
  const key = raw.trim().toLowerCase();
  return ALIASES[key] ?? "formative";
}

export function assessmentTypeLabel(slug: AssessmentTypeSlug): string {
  return ASSESSMENT_TYPE_LABELS[slug];
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
