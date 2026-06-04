import { useState } from "react";
import { ChevronRight, Download, Plus, BookOpen } from "lucide-react";

import {
  PrimaryTableAction,
  TABLE_ACTIONS_COLUMN_CLASS,
  TablePrimaryActionsRow,
} from "@/components/TableRowAction";
import { AssessmentTypeLabel } from "@/components/AssessmentTypeLabel";
import { LibraryOutputLabel } from "@/components/LibraryOutputLabel";
import { TeOpportunityLabel } from "@/components/TeOpportunityLabel";
import { isTeOpportunity } from "@/lib/assessment-source";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Assessment, Unit } from "@/lib/assessment-data";
import {
  isExportReady,
} from "@/lib/assessment-helpers";
import { buildUnitLessonSlots, formatLessonLength, type UnitLessonSlot } from "@/lib/unit-table-rows";
import { lessonRowId } from "@/lib/unit-rhythm";
import { cn } from "@/lib/utils";

const TABLE_ROW_CLASS = "bg-card hover:!bg-card";

interface Props {
  unit: Unit;
  query: string;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
  onOpenTeacherEdition: (lessonNum: number) => void;
}

export function UnitAssessmentTable({
  unit,
  query,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
  onOpenTeacherEdition,
}: Props) {
  const slots = buildUnitLessonSlots(unit, query);
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(() => new Set());

  const toggleLesson = (lessonNum: number) => {
    setExpandedLessons((prev) => {
      const next = new Set(prev);
      if (next.has(lessonNum)) next.delete(lessonNum);
      else next.add(lessonNum);
      return next;
    });
  };

  if (slots.length === 0) {
    return (
      <p className="text-sm text-muted-foreground font-body py-12 text-center border border-dashed border-border rounded-2xl bg-card/60">
        No assessments match &quot;{query.trim()}&quot;.
      </p>
    );
  }

  return (
    <div className="rounded-2xl border border-border overflow-hidden bg-card shadow-sm">
      <Table className="table-fixed">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-[38%] min-w-[12rem]" />
          <col className={TABLE_ACTIONS_COLUMN_CLASS} />
        </colgroup>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="font-ui text-eddo-green font-medium">Lsn</TableHead>
            <TableHead className="font-ui text-eddo-green font-medium">Lesson</TableHead>
            <TableHead className="font-ui text-eddo-green font-medium">Assessment</TableHead>
            <TableHead className={cn("text-right font-ui text-eddo-green font-medium", TABLE_ACTIONS_COLUMN_CLASS)}>
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {slots.map((slot) => (
            <LessonSlotRows
              key={`lesson-${slot.lessonNum}`}
              slot={slot}
              expanded={expandedLessons.has(slot.lessonNum)}
              onToggle={() => toggleLesson(slot.lessonNum)}
              onOpenDetail={onOpenDetail}
              onExport={onExport}
              onAddToWorkspace={onAddToWorkspace}
              onOpenTeacherEdition={onOpenTeacherEdition}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function LessonSlotRows({
  slot,
  expanded,
  onToggle,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
  onOpenTeacherEdition,
}: {
  slot: UnitLessonSlot;
  expanded: boolean;
  onToggle: () => void;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
  onOpenTeacherEdition: (lessonNum: number) => void;
}) {
  const padded = String(slot.lessonNum).padStart(2, "0");
  const hasDrivingQuestion =
    slot.drivingQuestion && slot.drivingQuestion !== slot.shortTitle;

  if (slot.assessments.length === 0) {
    return null;
  }

  if (slot.assessments.length === 1) {
    const assessment = slot.assessments[0];
    return (
      <TableRow id={lessonRowId(slot.lessonNum)} className={TABLE_ROW_CLASS}>
        <TableCell className="align-top py-3">
          <LessonChevron expanded={expanded} onToggle={onToggle} label={`Lesson ${padded}`} />
          <span className="font-mono text-xs text-muted-foreground ml-1">{padded}</span>
        </TableCell>
        <TableCell className="align-top py-3">
          <LessonTitleBlock
            slot={slot}
            expanded={expanded}
            hasDrivingQuestion={hasDrivingQuestion}
          />
        </TableCell>
        <AssessmentCells
          assessment={assessment}
          showViewTe
          onOpenTeacherEdition={() => onOpenTeacherEdition(slot.lessonNum)}
          onOpenDetail={onOpenDetail}
          onExport={onExport}
          onAddToWorkspace={onAddToWorkspace}
        />
      </TableRow>
    );
  }

  const count = slot.assessments.length;

  return (
    <>
      {slot.assessments.map((assessment, index) => (
        <TableRow key={assessment.id} id={index === 0 ? lessonRowId(slot.lessonNum) : undefined} className={TABLE_ROW_CLASS}>
          {index === 0 && (
            <>
              <TableCell rowSpan={count} className="align-top py-3">
                <LessonChevron expanded={expanded} onToggle={onToggle} label={`Lesson ${padded}`} />
                <span className="font-mono text-xs text-muted-foreground ml-1">{padded}</span>
              </TableCell>
              <TableCell rowSpan={count} className="align-top py-3">
                <LessonTitleBlock
                  slot={slot}
                  expanded={expanded}
                  hasDrivingQuestion={hasDrivingQuestion}
                />
              </TableCell>
            </>
          )}
          <AssessmentCells
            assessment={assessment}
            showViewTe={index === count - 1}
            onOpenTeacherEdition={() => onOpenTeacherEdition(slot.lessonNum)}
            onOpenDetail={onOpenDetail}
            onExport={onExport}
            onAddToWorkspace={onAddToWorkspace}
          />
        </TableRow>
      ))}
    </>
  );
}

function LessonTitleBlock({
  slot,
  expanded,
  hasDrivingQuestion,
}: {
  slot: UnitLessonSlot;
  expanded: boolean;
  hasDrivingQuestion: boolean;
}) {
  return (
    <>
      <p className="font-ui text-sm font-semibold text-eddo-navy">{slot.shortTitle}</p>
      {slot.expectedDays != null && (
        <p
          className="text-[10px] text-muted-foreground/75 font-ui mt-0.5 tabular-nums"
          title="Instructional length from Unit Overview Materials"
        >
          {formatLessonLength(slot.expectedDays)}
        </p>
      )}
      {expanded && hasDrivingQuestion && (
        <p className="text-sm text-muted-foreground font-body mt-1.5 leading-relaxed">
          {slot.drivingQuestion}
        </p>
      )}
    </>
  );
}

function LessonChevron({
  expanded,
  onToggle,
  label,
}: {
  expanded: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Hide" : "Show"} driving question for ${label}`}
      className="inline-flex items-center justify-center size-6 rounded-md text-muted-foreground hover:text-eddo-green hover:bg-muted/60 transition-colors align-middle"
    >
      <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
    </button>
  );
}

function AssessmentTitleLink({
  title,
  onClick,
}: {
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View details for ${title}`}
      className={cn(
        "block w-full min-w-0 max-w-full text-left font-ui text-sm font-normal",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm",
      )}
    >
      <span
        title={title}
        className={cn(
          "min-w-0 truncate whitespace-nowrap",
          "text-eddo-green underline underline-offset-2 decoration-eddo-green/40",
          "hover:decoration-eddo-green",
        )}
      >
        {title}
      </span>
    </button>
  );
}

function AssessmentCells({
  assessment,
  showViewTe,
  onOpenTeacherEdition,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
}: {
  assessment: Assessment;
  showViewTe?: boolean;
  onOpenTeacherEdition?: () => void;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}) {
  const exportReady = isExportReady(assessment);

  return (
    <>
      <TableCell className="align-top py-3 min-w-0 overflow-hidden">
        <AssessmentTitleLink
          title={assessment.title}
          onClick={() => onOpenDetail(assessment)}
        />
        {isTeOpportunity(assessment) ? (
          <TeOpportunityLabel className="mt-1" />
        ) : (
          <AssessmentTypeLabel assessment={assessment} className="mt-1" />
        )}
        <LibraryOutputLabel assessment={assessment} className="mt-1" />
      </TableCell>
      <TableCell className={cn("align-middle py-3 whitespace-nowrap", TABLE_ACTIONS_COLUMN_CLASS)}>
        <TablePrimaryActionsRow>
          <PrimaryTableAction
            label="Export"
            icon={Download}
            disabled={!exportReady}
            aria-label={`Export ${assessment.title}`}
            onClick={() => onExport(assessment)}
          />
          <PrimaryTableAction
            label="Add"
            icon={Plus}
            aria-label={`Add ${assessment.title} to Workspace`}
            onClick={() => onAddToWorkspace(assessment)}
          />
          {showViewTe && onOpenTeacherEdition && (
            <PrimaryTableAction
              label="View TE"
              icon={BookOpen}
              onClick={onOpenTeacherEdition}
              aria-label="View Teacher Edition for lesson"
            />
          )}
        </TablePrimaryActionsRow>
      </TableCell>
    </>
  );
}
