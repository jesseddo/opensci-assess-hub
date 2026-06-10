import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
import type { AssessmentSource } from "@/lib/assessment-source";
import { ASSESSMENT_OPPORTUNITY_LABEL } from "@/lib/ose-vocabulary";
import type {
  AssessmentOpportunityType,
  LibraryOutputKind,
} from "@/lib/assessment-opportunity-types";
import { opportunityTypeMeta } from "@/lib/assessment-opportunity-types";
import {
  assessmentTypeLabel,
  normalizeAssessmentType,
  type AssessmentTypeSlug,
} from "@/lib/assessment-types";

export interface IngestedFileRefs {
  studentHandout: string | null;
  teacherGuide: string | null;
  answerKey: string | null;
  googleForm: string | null;
  rubric: string | null;
  guidanceSheet?: string | null;
}

export interface IngestedAssessment {
  id: string;
  lesson: string;
  lessonNum: number;
  title: string;
  shortTitle?: string;
  peCode?: string | null;
  buildingTowards?: string | null;
  lookListenFor?: string | null;
  whatToDo?: string | null;
  assessmentType?: AssessmentTypeSlug;
  typeLabel?: string;
  source?: AssessmentSource;
  opportunityType?: AssessmentOpportunityType;
  libraryOutput?: LibraryOutputKind;
  standards: string[];
  isSummative?: boolean;
  description: string;
  previewExcerpt?: string;
  files: IngestedFileRefs;
  /** Related TE opportunity row for formal assessments (ingest-generated). */
  linkedTeOpportunityId?: string | null;
}

export interface IngestedUnitManifest {
  unitId: string;
  unitTitle: string;
  description: string;
  lessonCount: number;
  suggestedPacingDays?: number;
  unitOverviewPath?: string | null;
  ingestedFrom?: string;
  ingestedAt?: string;
  lessons?: {
    lessonNum: number;
    shortTitle?: string;
    title: string;
    teacherEditionPath?: string | null;
    expectedDays?: number;
  }[];
  assessments: IngestedAssessment[];
}

function fileNameFromPath(p: string | null): string | undefined {
  if (!p) return undefined;
  const parts = p.split(/[/\\]/);
  return parts[parts.length - 1];
}

function localUrl(p: string | null): string | undefined {
  if (!p) return undefined;
  return `ingest:${p}`;
}

function resolveAssessmentType(
  row: IngestedAssessment,
  source: AssessmentSource,
): AssessmentTypeSlug | undefined {
  const fromRow = row.assessmentType;
  if (source === "te-opportunity") {
    if (!fromRow || fromRow === "formative" || fromRow === "lesson-reflection") return undefined;
    return fromRow;
  }
  if (fromRow) return fromRow;
  if (row.isSummative) return "summative";
  if (row.typeLabel) return normalizeAssessmentType(row.typeLabel);
  return "formative";
}

function buildPackageFromFiles(
  files: IngestedFileRefs,
  libraryOutput?: LibraryOutputKind,
): PackageItem[] {
  const guidanceUrl = files.guidanceSheet?.startsWith("/")
    ? files.guidanceSheet
    : localUrl(files.guidanceSheet ?? null);

  return [
    {
      kind: "guidance-sheet",
      label: "Assessment opportunity guidance",
      fileName: files.guidanceSheet?.split("/").pop(),
      url: guidanceUrl,
      available: Boolean(files.guidanceSheet),
      unavailableReason: "Not generated",
    },
    {
      kind: "student-handout",
      label: "Student handout",
      fileName: fileNameFromPath(files.studentHandout),
      url: localUrl(files.studentHandout),
      available: Boolean(files.studentHandout),
      unavailableReason: "Not in library",
    },
    {
      kind: "google-form",
      label: "Google Form",
      fileName: fileNameFromPath(files.googleForm),
      url: localUrl(files.googleForm),
      available: Boolean(files.googleForm),
      unavailableReason:
        libraryOutput === "handout-form-planned" ? "Planned — not yet digitized" : "Not yet digitized",
    },
    {
      kind: "teacher-guide",
      label: "Teacher guide",
      fileName: fileNameFromPath(files.teacherGuide),
      url: localUrl(files.teacherGuide),
      available: Boolean(files.teacherGuide),
      unavailableReason: "Not in library",
    },
    {
      kind: "answer-key",
      label: "Answer key (recommended)",
      fileName: fileNameFromPath(files.answerKey),
      url: localUrl(files.answerKey),
      available: Boolean(files.answerKey),
      unavailableReason: "Not in library",
    },
    {
      kind: "rubric",
      label: "Rubric (recommended)",
      fileName: fileNameFromPath(files.rubric),
      url: localUrl(files.rubric),
      available: Boolean(files.rubric),
      unavailableReason: "Not part of this assessment",
    },
  ];
}

export function assessmentsFromManifest(manifest: IngestedUnitManifest): Assessment[] {
  return manifest.assessments.map((row) => {
    const oppMeta = row.opportunityType ? opportunityTypeMeta(row.opportunityType) : null;
    const source: AssessmentSource =
      row.source ??
      (row.id.includes("-ao-") ? "te-opportunity" : "formal-assessment");
    const assessmentType = resolveAssessmentType(row, source);
    const typeLabel =
      source === "te-opportunity"
        ? assessmentType
          ? assessmentTypeLabel(assessmentType)
          : ASSESSMENT_OPPORTUNITY_LABEL
        : assessmentTypeLabel(assessmentType ?? "formative");
    return {
      id: row.id,
      lesson: row.lesson,
      title: row.shortTitle ?? row.title,
      shortTitle: row.shortTitle ?? row.title,
      source,
      peCode: row.peCode ?? undefined,
      buildingTowards: row.buildingTowards ?? undefined,
      lookListenFor: row.lookListenFor ?? undefined,
      whatToDo: row.whatToDo ?? undefined,
      assessmentType,
      typeLabel,
      standards: row.standards,
      isSummative: row.isSummative,
      description: row.description,
      previewExcerpt: row.previewExcerpt,
      opportunityType: row.opportunityType,
      libraryOutput: row.libraryOutput ?? oppMeta?.libraryOutput,
      linkedTeOpportunityId: row.linkedTeOpportunityId ?? undefined,
      package: buildPackageFromFiles(row.files, row.libraryOutput ?? oppMeta?.libraryOutput),
    };
  });
}

export function unitFromManifest(manifest: IngestedUnitManifest): Unit {
  return {
    id: manifest.unitId,
    title: manifest.unitTitle,
    description: manifest.description,
    lessonCount: manifest.lessonCount,
    suggestedPacingDays: manifest.suggestedPacingDays,
    lessons: manifest.lessons,
    assessments: assessmentsFromManifest(manifest),
  };
}
