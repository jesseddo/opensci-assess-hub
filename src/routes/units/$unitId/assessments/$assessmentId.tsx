import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AddToWorkspaceDialog } from "@/components/AddToWorkspaceDialog";
import { AssessmentDetailHeader } from "@/components/AssessmentDetailHeader";
import { AssessmentDetailView } from "@/components/AssessmentDetailView";
import { ExportAssessmentDialog } from "@/components/ExportAssessmentDialog";
import { useAddToWorkspaceGate } from "@/hooks/use-add-to-workspace-gate";
import { useAuth } from "@/lib/auth-context";
import { WORKSPACE_RETURN_ACTION } from "@/lib/workspace-gate";
import { findAssessment } from "@/lib/unit-catalog";

type DialogKind = "export" | "add" | null;

export const Route = createFileRoute("/units/$unitId/assessments/$assessmentId")({
  validateSearch: (search: Record<string, unknown>) => ({
    action: search.action === WORKSPACE_RETURN_ACTION ? WORKSPACE_RETURN_ACTION : undefined,
  }),
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
  const { action } = Route.useSearch();
  const [dialog, setDialog] = useState<DialogKind>(null);
  const { openAddToWorkspace } = useAddToWorkspaceGate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (action === WORKSPACE_RETURN_ACTION && isAuthenticated) {
      openAddToWorkspace(assessment, unit.id, "detail", () => setDialog("add"));
    }
  }, [action, assessment, isAuthenticated, openAddToWorkspace, unit.id]);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground selection:bg-primary/15">
      <AssessmentDetailHeader grade={grade} unit={unit} assessment={assessment} />

      <main className="mx-auto max-w-3xl px-6 py-8">
        <AssessmentDetailView
          assessment={assessment}
          unit={unit}
          onExport={() => setDialog("export")}
          onAddToWorkspace={() =>
            openAddToWorkspace(assessment, unit.id, "detail", () => setDialog("add"))
          }
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
