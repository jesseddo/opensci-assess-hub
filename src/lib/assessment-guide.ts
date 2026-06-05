import guidesByUnit from "@/data/assessment-guides/unit-8.1.json";

export interface AssessmentGuideProgression {
  early: string;
  target: string;
}

export interface AssessmentGuideAlignment {
  performanceExpectations: string[];
  lessonPe?: string;
  note?: string;
}

export interface AssessmentGuideUnderstanding {
  strong: string[];
  emerging: string[];
  gaps: string[];
}

export interface AssessmentGuideSample {
  label: string;
  excerpt: string;
  note?: string;
}

export interface AssessmentGuide {
  assessmentId: string;
  status: "draft" | "published";
  progression: AssessmentGuideProgression;
  alignment: AssessmentGuideAlignment;
  understanding: AssessmentGuideUnderstanding;
  misconceptions: string[];
  studentSamples: AssessmentGuideSample[];
}

const GUIDE_INDEX: Record<string, AssessmentGuide> = guidesByUnit as Record<
  string,
  AssessmentGuide
>;

/** Eddo-authored interpretive guide — separate from TE facilitation snippets. */
export function assessmentGuideFor(assessmentId: string): AssessmentGuide | null {
  return GUIDE_INDEX[assessmentId] ?? null;
}

export function hasAssessmentGuide(assessmentId: string): boolean {
  return assessmentId in GUIDE_INDEX;
}
