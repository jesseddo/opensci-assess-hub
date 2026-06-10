import type { Assessment, Unit } from "@/lib/assessment-data";
import { isFormalAssessment } from "@/lib/assessment-source";

/** TE facilitation fields for detail view — merges linked TE row onto named assessments. */
export function assessmentWithTeGuidance(assessment: Assessment, unit: Unit): Assessment {
  if (!isFormalAssessment(assessment) || !assessment.linkedTeOpportunityId) {
    return assessment;
  }

  const linked = unit.assessments.find((row) => row.id === assessment.linkedTeOpportunityId);
  if (!linked) return assessment;

  return {
    ...assessment,
    peCode: assessment.peCode ?? linked.peCode,
    buildingTowards: linked.buildingTowards,
    lookListenFor: linked.lookListenFor,
    whatToDo: linked.whatToDo,
  };
}
