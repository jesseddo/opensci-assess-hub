import type { Unit } from "@/lib/assessment-data";
import { buildUnitOrganizationSummary } from "@/lib/unit-assessment-organization";

interface Props {
  unit: Unit;
}

/** Compact unit inventory line — full definitions live in TableTerminologyHelp. */
export function UnitOrganizationSummary({ unit }: Props) {
  const org = buildUnitOrganizationSummary(unit);
  const opp = org.assessmentOpportunityCount;
  const docs = org.assessmentDocumentCount;

  return (
    <p className="text-sm font-ui text-muted-foreground leading-snug max-w-3xl">
      <span className="text-foreground/90">
        {opp} assessment {opp === 1 ? "opportunity" : "opportunities"}
      </span>
      {" · "}
      <span className="text-foreground/90">
        {docs} assessment{docs === 1 ? "" : "s"}
      </span>
      {org.documentCategoryLine ? (
        <span className="text-muted-foreground"> ({org.documentCategoryLine})</span>
      ) : null}
    </p>
  );
}
