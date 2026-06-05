import { Download, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Assessment, Unit } from "@/lib/assessment-data";
import { getAssessmentMetaLine, isExportReady, isWorkspaceReady } from "@/lib/assessment-helpers";
import { openTeacherEdition } from "@/lib/library-actions";

interface Props {
  unit: Unit;
  assessments: Assessment[];
  teacherEditionOnlyLessons?: number[];
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}

export function UnitAssessmentMap({
  unit,
  assessments,
  teacherEditionOnlyLessons = [],
  onOpenDetail,
  onExport,
  onAddToWorkspace,
}: Props) {
  const hasPackages = assessments.length > 0;
  const hasTeRows = teacherEditionOnlyLessons.length > 0;

  if (!hasPackages && !hasTeRows) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center border border-dashed border-border rounded-xl">
        No assessments in this unit match your search.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {hasPackages && (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lesson</TableHead>
                <TableHead>Assessment</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.map((assessment) => (
                <TableRow key={assessment.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap align-top">
                    {assessment.lesson}
                  </TableCell>
                  <TableCell className="align-top">
                    <button
                      type="button"
                      onClick={() => onOpenDetail(assessment)}
                      className="text-left font-medium text-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded"
                    >
                      {assessment.title}
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 md:hidden leading-relaxed">
                      {getAssessmentMetaLine(assessment)}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs hidden md:table-cell align-top leading-relaxed">
                    {getAssessmentMetaLine(assessment)}
                  </TableCell>
                  <TableCell className="text-right align-top">
                    <div className="flex justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!isExportReady(assessment)}
                        aria-label={`Export ${assessment.title}`}
                        onClick={() => onExport(assessment)}
                      >
                        <Download className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={!isWorkspaceReady(assessment)}
                        aria-label={`Add ${assessment.title} to Workspace`}
                        onClick={() => onAddToWorkspace(assessment)}
                      >
                        <Plus className="size-3.5" aria-hidden />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {hasTeRows && (
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
            Teacher Edition only
          </p>
          {teacherEditionOnlyLessons.map((lessonNum) => {
            const padded = String(lessonNum).padStart(2, "0");
            return (
              <div
                key={`te-${lessonNum}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-card/40 px-4 py-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground shrink-0">
                    Lesson {padded}
                  </span>
                  <span className="text-sm text-muted-foreground text-pretty">
                    Assessment guidance is in the Teacher Edition for this lesson.
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0 self-start sm:self-center"
                  onClick={() => openTeacherEdition(unit.id, lessonNum)}
                >
                  View in Teacher Edition
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted-foreground px-1">
        Unit {unit.id} — OpenSciEd assessments and assessment opportunities from the Teacher
        Edition. Named assessment documents include handouts and keys where available.
      </p>
    </div>
  );
}
