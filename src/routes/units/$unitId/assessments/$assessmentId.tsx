import { createFileRoute, notFound } from "@tanstack/react-router";
import { useState } from "react";

import { AddToWorkspaceDialog } from "@/components/AddToWorkspaceDialog";
import { AssessmentDetailHeader } from "@/components/AssessmentDetailHeader";
import { AssessmentDetailView } from "@/components/AssessmentDetailView";
import { ExportAssessmentDialog } from "@/components/ExportAssessmentDialog";
import { findAssessment } from "@/lib/unit-catalog";

type DialogKind = "export" | "add" | null;

export const Route = createFileRoute("/units/$unitId/assessments/$assessmentId")({
  loader: ({ params }) => {
    const location = findAssessment(params.unitId, params.assessmentId);
    if (!location) {
      throw notFound();
    }
    return location;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Assessment — OpenSciEd" }] };
    }

    const { unit, assessment } = loaderData;
    const title = `${assessment.title} — Unit ${unit.id} — OpenSciEd`;
    const description =
      assessment.description?.trim() ||
      `${assessment.title} for OpenSciEd Unit ${unit.id} (${assessment.lesson}).`;

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: AssessmentDetailPage,
});

function AssessmentDetailPage() {
  const { grade, unit, assessment } = Route.useLoaderData();
  const [dialog, setDialog] = useState<DialogKind>(null);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/15">
      <AssessmentDetailHeader grade={grade} unit={unit} assessment={assessment} />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <AssessmentDetailView
          assessment={assessment}
          unit={unit}
          onExport={() => setDialog("export")}
          onAddToWorkspace={() => setDialog("add")}
        />
      </main>

      <ExportAssessmentDialog
        assessment={assessment}
        unit={unit}
        open={dialog === "export"}
        onOpenChange={(open) => !open && setDialog(null)}
      />

      <AddToWorkspaceDialog
        assessment={assessment}
        open={dialog === "add"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </div>
  );
}
