import type { Assessment, PackageItem, Unit } from "@/lib/assessment-data";
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
}

export interface IngestedAssessment {
  id: string;
  lesson: string;
  lessonNum: number;
  title: string;
  assessmentType?: AssessmentTypeSlug;
  typeLabel?: string;
  standards: string[];
  isSummative?: boolean;
  description: string;
  previewExcerpt?: string;
  files: IngestedFileRefs;
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

function buildPackageFromFiles(files: IngestedFileRefs): PackageItem[] {
  return [
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
      unavailableReason: "Not yet digitized",
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
      unavailableReason: "Not applicable",
    },
  ];
}

export function assessmentsFromManifest(manifest: IngestedUnitManifest): Assessment[] {
  return manifest.assessments.map((row) => {
    const assessmentType =
      row.assessmentType ??
      (row.typeLabel ? normalizeAssessmentType(row.typeLabel) : "formative");
    return {
      id: row.id,
      lesson: row.lesson,
      title: row.title,
      assessmentType,
      typeLabel: assessmentTypeLabel(assessmentType),
      standards: row.standards,
      isSummative: row.isSummative,
      description: row.description,
      previewExcerpt: row.previewExcerpt,
      package: buildPackageFromFiles(row.files),
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
