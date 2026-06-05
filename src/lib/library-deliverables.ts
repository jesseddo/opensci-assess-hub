/**
 * Internal ingest mapping only — not shown in the library UI.
 * OpenSciEd teachers use assessment / assessment opportunity language instead.
 */
export type LibraryDeliverableKind =
  | "guidance-pdf"
  | "handout-guidance"
  | "handout-form-planned"
  | "handout-key-guide";

const LABELS: Record<LibraryDeliverableKind, string> = {
  "guidance-pdf": "Guidance PDF",
  "handout-guidance": "Handout + guidance",
  "handout-form-planned": "Handout + form (planned)",
  "handout-key-guide": "Handout + key + guide",
};

/** Maps legacy ingest `libraryOutput` values to display labels. */
export function libraryDeliverableLabel(
  kind: string | undefined,
  assessmentSource: "te-opportunity" | "formal-assessment",
): string {
  switch (kind) {
    case "guidance-pdf":
      return LABELS["guidance-pdf"];
    case "handout-guidance":
      return LABELS["handout-guidance"];
    case "handout-form-planned":
      return LABELS["handout-form-planned"];
    case "full-package":
      return LABELS["handout-key-guide"];
    default:
      return assessmentSource === "te-opportunity"
        ? LABELS["guidance-pdf"]
        : LABELS["handout-key-guide"];
  }
}
