import type { Assessment, Unit } from "@/lib/assessment-data";
import {
  formalAssessmentsInUnit,
  isFormalAssessment,
  isTeOpportunity,
  teOpportunitiesInUnit,
} from "@/lib/assessment-source";
import {
  assessmentTypeLabel,
  normalizeAssessmentType,
  type AssessmentTypeSlug,
} from "@/lib/assessment-types";
import { ASSESSMENT_DOCUMENT_LABEL, ASSESSMENT_OPPORTUNITY_LABEL } from "@/lib/ose-vocabulary";

/** OpenSciEd system category slug for any library row. */
export function assessmentSystemCategorySlug(assessment: Assessment): AssessmentTypeSlug {
  if (isTeOpportunity(assessment)) {
    return assessment.assessmentType ?? "formative";
  }
  return formalCategorySlug(assessment);
}

export function assessmentSystemCategoryLabel(assessment: Assessment): string {
  return assessmentTypeLabel(assessmentSystemCategorySlug(assessment));
}

/** TE text named a non-default system category (Pre / Peer / Summative). */
export function explicitOpportunityCategory(assessment: Assessment): AssessmentTypeSlug | null {
  if (!isTeOpportunity(assessment)) return null;
  const slug = assessment.assessmentType;
  if (!slug || slug === "formative" || slug === "lesson-reflection") return null;
  return slug;
}

export function rowKindLabel(assessment: Assessment): string {
  if (isTeOpportunity(assessment)) return ASSESSMENT_OPPORTUNITY_LABEL;
  return ASSESSMENT_DOCUMENT_LABEL;
}

function formalCategorySlug(assessment: Assessment): AssessmentTypeSlug {
  if (assessment.assessmentType) return assessment.assessmentType;
  if (assessment.isSummative) return "summative";
  return normalizeAssessmentType(assessment.typeLabel);
}

export interface UnitOrganizationSummary {
  assessmentOpportunityCount: number;
  assessmentDocumentCount: number;
  documentCategories: Partial<Record<AssessmentTypeSlug, number>>;
  /** Short breakdown of document categories for UI, e.g. "2 summative · 1 peer" */
  documentCategoryLine: string | null;
  /** Primary unit line under the title */
  headline: string;
}

/** Shown in unit summary — only categories teachers distinguish on documents. */
const DOCUMENT_CATEGORY_ORDER: AssessmentTypeSlug[] = [
  "summative",
  "peer-feedback",
  "pre-assessment",
];

function formatDocumentCategoryLine(counts: Partial<Record<AssessmentTypeSlug, number>>): string | null {
  const parts: string[] = [];
  for (const slug of DOCUMENT_CATEGORY_ORDER) {
    const n = counts[slug];
    if (!n) continue;
    parts.push(`${n} ${assessmentTypeLabel(slug).toLowerCase()}${n === 1 ? "" : "s"}`);
  }
  return parts.length > 0 ? parts.join(", ") : null;
}

export function buildUnitOrganizationSummary(unit: Unit): UnitOrganizationSummary {
  const opportunities = teOpportunitiesInUnit(unit.assessments);
  const documents = formalAssessmentsInUnit(unit.assessments);
  const documentCategories: Partial<Record<AssessmentTypeSlug, number>> = {};

  for (const doc of documents) {
    const slug = formalCategorySlug(doc);
    documentCategories[slug] = (documentCategories[slug] ?? 0) + 1;
  }

  const opportunityWord = opportunities.length === 1 ? "opportunity" : "opportunities";
  const documentWord = documents.length === 1 ? "" : "s";
  const headline = [
    `${opportunities.length} assessment ${opportunityWord}`,
    `${documents.length} assessment${documentWord}`,
  ].join(" · ");

  return {
    assessmentOpportunityCount: opportunities.length,
    assessmentDocumentCount: documents.length,
    documentCategories,
    documentCategoryLine: formatDocumentCategoryLine(documentCategories),
    headline,
  };
}

/** Table / detail labels: row kind + system category when it adds information. */
export function assessmentRowTypeDisplay(assessment: Assessment): {
  primary: string;
  secondary: string | null;
} {
  if (isTeOpportunity(assessment)) {
    const explicit = explicitOpportunityCategory(assessment);
    return {
      primary: ASSESSMENT_OPPORTUNITY_LABEL,
      secondary: explicit ? assessmentTypeLabel(explicit) : null,
    };
  }
  return {
    primary: ASSESSMENT_DOCUMENT_LABEL,
    secondary: assessmentSystemCategoryLabel(assessment),
  };
}
