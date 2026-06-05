import type { Assessment } from "@/lib/assessment-data";

/** How this row appears in the unit table — OpenSciEd-aligned naming. */
export type AssessmentSource = "te-opportunity" | "formal-assessment";

export {
  ASSESSMENT_OPPORTUNITY_LABEL,
  TE_OPPORTUNITY_LABEL,
} from "@/lib/ose-vocabulary";

export function assessmentSource(assessment: Assessment): AssessmentSource {
  if (assessment.source) return assessment.source;
  if (assessment.id.includes("-ao-")) return "te-opportunity";
  return "formal-assessment";
}

export function isTeOpportunity(assessment: Assessment): boolean {
  return assessmentSource(assessment) === "te-opportunity";
}

export function isFormalAssessment(assessment: Assessment): boolean {
  return assessmentSource(assessment) === "formal-assessment";
}

export function formalAssessmentsInUnit(assessments: Assessment[]): Assessment[] {
  return assessments.filter(isFormalAssessment);
}

export function teOpportunitiesInUnit(assessments: Assessment[]): Assessment[] {
  return assessments.filter(isTeOpportunity);
}
