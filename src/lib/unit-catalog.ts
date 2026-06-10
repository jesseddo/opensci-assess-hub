import { gradeLevels, type Assessment, type GradeLevel, type Unit } from "@/lib/assessment-data";

export interface AssessmentLocation {
  grade: GradeLevel;
  unit: Unit;
  assessment: Assessment;
}

export function findAssessment(unitId: string, assessmentId: string): AssessmentLocation | null {
  for (const grade of gradeLevels) {
    const unit = grade.units.find((u) => u.id === unitId);
    if (!unit) continue;

    const assessment = unit.assessments.find((a) => a.id === assessmentId);
    if (assessment) {
      return { grade, unit, assessment };
    }
  }

  return null;
}

export function findUnit(unitId: string): { grade: GradeLevel; unit: Unit } | null {
  for (const grade of gradeLevels) {
    const unit = grade.units.find((u) => u.id === unitId);
    if (unit) {
      return { grade, unit };
    }
  }

  return null;
}
