import type { AssessmentTypeSlug } from "@/lib/assessment-types";

export interface OseTypeInput {
  buildingTowards?: string | null;
  lookListenFor?: string | null;
  whatToDo?: string | null;
  studentHandout?: string | null;
  title?: string | null;
}

/**
 * Classify assessment opportunity type from OSE Teacher Edition language.
 * Conservative rules — avoid false positives from facilitation prose (e.g. "stakeholders").
 */
export function oseAssessmentTypeFromFields(input: OseTypeInput): AssessmentTypeSlug {
  const building = (input.buildingTowards ?? "").toLowerCase();
  const look = (input.lookListenFor ?? "").toLowerCase();
  const todo = (input.whatToDo ?? "").toLowerCase();
  const handout = (input.studentHandout ?? "").toLowerCase();
  const title = (input.title ?? "").toLowerCase();

  const combined = building + look + todo + handout;
  if (
    /performance task/.test(building) ||
    (/summative/.test(building) && !/formative/.test(building)) ||
    /end-of-unit/.test(building) ||
    /cheerleading headgear assessment/.test(combined) ||
    /cheerleading assessment/.test(combined) ||
    /part [12][:\s].*assessment/.test(combined)
  ) {
    return "summative";
  }

  if (/pre-assessment/.test(look) || /pre-assessment/.test(building) || /pre assessment/.test(look)) {
    return "pre-assessment";
  }

  if (
    /looking back/.test(handout) ||
    /looking back/.test(building) ||
    /lesson reflection/.test(building) ||
    (/reflect on/.test(look) && /learning|unit|lesson/.test(look))
  ) {
    return "lesson-reflection";
  }

  if (
    /peer feedback/.test(building + look + todo) ||
    /stakeholder feedback/.test(building + look + todo + handout) ||
    /provide and receive critiques/.test(building + look) ||
    /receive critiques about/.test(building + look) ||
    /critiques about claims/.test(building + look) ||
    /jigsaw feedback/.test(building + look + todo) ||
    /feedback form/.test(handout) ||
    (/stakeholder/.test(title) && /feedback/.test(title))
  ) {
    return "peer-feedback";
  }

  return "formative";
}

/** Shorter label for listen/look-only checks (still formative in OSE). */
export function isListenLookPrimaryCheck(
  input: OseTypeInput & { hasStudentHandout?: boolean },
): boolean {
  const hasHandout = input.hasStudentHandout ?? Boolean(input.studentHandout);
  const look = (input.lookListenFor ?? "").trim();
  const building = (input.buildingTowards ?? "").trim();
  if (hasHandout) return false;
  if (!look) return false;
  return /^what to (look|listen)/i.test(look) && building.length > 0;
}
