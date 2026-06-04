/**
 * OpenSciEd Teacher Edition assessment opportunity taxonomy
 * and the library artifact(s) Eddo can provide per type.
 */

export type AssessmentOpportunityType =
  | "observation"
  | "handout-written"
  | "discussion-argument"
  | "investigation-data"
  | "engineering-design"
  | "named-package";

export type LibraryOutputKind =
  | "guidance-pdf"
  | "handout-guidance"
  | "full-package"
  | "handout-form-planned";

export const OPPORTUNITY_TYPE_CATALOG: {
  type: AssessmentOpportunityType;
  label: string;
  description: string;
  libraryOutput: LibraryOutputKind;
  libraryOutputLabel: string;
}[] = [
  {
    type: "observation",
    label: "Observation & listening",
    description: "Listen/look during discussion or activity — no separate student handout",
    libraryOutput: "guidance-pdf",
    libraryOutputLabel: "Guidance PDF",
  },
  {
    type: "handout-written",
    label: "Written handout task",
    description: "Students complete a lesson handout used as evidence",
    libraryOutput: "handout-form-planned",
    libraryOutputLabel: "Handout + form (planned)",
  },
  {
    type: "discussion-argument",
    label: "Discussion & argumentation",
    description: "Peer critique, jigsaw, or evidence-based discussion",
    libraryOutput: "guidance-pdf",
    libraryOutputLabel: "Guidance PDF",
  },
  {
    type: "investigation-data",
    label: "Investigation & data",
    description: "Plan investigations, collect data, or interpret graphs",
    libraryOutput: "handout-guidance",
    libraryOutputLabel: "Handout + guidance",
  },
  {
    type: "engineering-design",
    label: "Engineering & design",
    description: "Define problems, design solutions, or iterate on devices",
    libraryOutput: "handout-guidance",
    libraryOutputLabel: "Handout + guidance",
  },
  {
    type: "named-package",
    label: "Named assessment package",
    description: "Standalone Assessment document in OpenSciEd materials",
    libraryOutput: "full-package",
    libraryOutputLabel: "Full package",
  },
];

const catalogByType = new Map(OPPORTUNITY_TYPE_CATALOG.map((row) => [row.type, row]));

export function opportunityTypeMeta(type: AssessmentOpportunityType) {
  return catalogByType.get(type) ?? catalogByType.get("observation")!;
}

export function libraryOutputLabel(kind: LibraryOutputKind): string {
  return OPPORTUNITY_TYPE_CATALOG.find((r) => r.libraryOutput === kind)?.libraryOutputLabel ?? kind;
}
