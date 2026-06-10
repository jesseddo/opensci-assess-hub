import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, BookOpen } from "lucide-react";
import { useState } from "react";

import { AddToWorkspaceDialog } from "@/components/AddToWorkspaceDialog";
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
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 font-ui backdrop-blur-md">
        <div className="mx-auto max-w-3xl px-6 py-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/"
              search={{ unit: unit.id }}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-primary underline-offset-2 hover:underline"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Unit {unit.id}
            </Link>
            <div className="hidden h-5 w-px shrink-0 bg-border sm:block" aria-hidden />
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-eddo-green">
                <BookOpen className="size-3.5 text-eddo-cream" strokeWidth={2.5} />
              </div>
              <div className="flex min-w-0 items-baseline gap-2">
                <span className="shrink-0 font-display text-lg leading-none tracking-wide text-eddo-green">
                  eddo
                </span>
                <span className="text-sm font-semibold leading-none text-eddo-navy">
                  Assessment Library
                </span>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {grade.label} · Unit {unit.id}: {unit.title}
          </p>
        </div>
      </header>

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
