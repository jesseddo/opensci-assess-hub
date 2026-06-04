import { gradeGroups, gradeLevels, type GradeLevel } from "@/lib/assessment-data";

export type SchoolLevel = "elementary" | "middle" | "high";

const LEVEL_BY_GROUP: Record<string, SchoolLevel> = {
  Elementary: "elementary",
  Middle: "middle",
  "High School": "high",
};

const GROUP_BY_LEVEL: Record<SchoolLevel, string> = {
  elementary: "Elementary",
  middle: "Middle",
  high: "High School",
};

export const schoolLevels: { id: SchoolLevel; label: string }[] = [
  { id: "elementary", label: "Elementary" },
  { id: "middle", label: "Middle School" },
  { id: "high", label: "High School" },
];

export function schoolLevelForGrade(gradeId: string): SchoolLevel {
  const grade = gradeLevels.find((g) => g.id === gradeId);
  return grade?.group ?? "middle";
}

export function gradesForSchoolLevel(level: SchoolLevel): GradeLevel[] {
  const groupLabel = GROUP_BY_LEVEL[level];
  const group = gradeGroups.find((g) => g.label === groupLabel);
  if (!group) return [];
  return group.ids
    .map((id) => gradeLevels.find((g) => g.id === id))
    .filter((g): g is GradeLevel => g != null);
}

export function defaultGradeForLevel(level: SchoolLevel): string {
  if (level === "middle") return "grade-8";
  return gradesForSchoolLevel(level)[0]?.id ?? "grade-8";
}

/** Label for the grade/course picker — "Grade" vs "Course" */
export function gradePickerLabel(level: SchoolLevel): string {
  return level === "high" ? "Course" : "Grade";
}

export function isGradeInLevel(gradeId: string, level: SchoolLevel): boolean {
  return schoolLevelForGrade(gradeId) === level;
}

export { LEVEL_BY_GROUP };
