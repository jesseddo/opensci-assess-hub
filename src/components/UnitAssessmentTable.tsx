import { useState } from "react";
import { ChevronRight, Download, Plus, BookOpen } from "lucide-react";

import {
  PrimaryTableAction,
  TABLE_ACTIONS_COLUMN_CLASS,
  TablePrimaryActionsRow,
} from "@/components/TableRowAction";
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
  getAssessmentTypeDisplay,
  isExportReady,
} from "@/lib/assessment-helpers";
import { buildUnitLessonSlots, type UnitLessonSlot } from "@/lib/unit-table-rows";
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
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-16 font-ui text-eddo-green font-medium">Lsn</TableHead>
            <TableHead className="min-w-[200px] font-ui text-eddo-green font-medium">Lesson</TableHead>
            <TableHead className="min-w-[160px] font-ui text-eddo-green font-medium">Assessment</TableHead>
            <TableHead className="w-36 hidden lg:table-cell font-ui text-eddo-green font-medium">Type</TableHead>
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

  if (slot.isTeOnly) {
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
        <TableCell className="align-top py-3 text-sm text-muted-foreground italic font-body">
          In Teacher Edition
        </TableCell>
        <TableCell className="hidden lg:table-cell text-muted-foreground align-top py-3">—</TableCell>
        <TableCell className={cn("align-middle py-3", TABLE_ACTIONS_COLUMN_CLASS)}>
          <TablePrimaryActionsRow>
            <PrimaryTableAction
              label="View TE"
              icon={BookOpen}
              onClick={() => onOpenTeacherEdition(slot.lessonNum)}
              aria-label={`View Teacher Edition for lesson ${padded}`}
            />
          </TablePrimaryActionsRow>
        </TableCell>
      </TableRow>
    );
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
            listIndex={count > 1 ? index + 1 : undefined}
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
          title="Suggested instructional days from Unit Overview Materials"
        >
          {slot.expectedDays} day{slot.expectedDays === 1 ? "" : "s"} suggested
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
  listIndex,
  onClick,
}: {
  title: string;
  listIndex?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`View details for ${title}`}
      className={cn(
        "text-left font-ui text-sm font-normal max-w-full",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm",
        listIndex != null ? "flex items-start gap-1.5" : "block",
      )}
    >
      {listIndex != null && (
        <span className="shrink-0 tabular-nums text-muted-foreground font-medium">{listIndex}.</span>
      )}
      <span
        className={cn(
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
  listIndex,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
}: {
  assessment: Assessment;
  listIndex?: number;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}) {
  const exportReady = isExportReady(assessment);

  return (
    <>
      <TableCell className="align-top py-3">
        <AssessmentTitleLink
          title={assessment.title}
          listIndex={listIndex}
          onClick={() => onOpenDetail(assessment)}
        />
        <p className="text-xs text-muted-foreground mt-1 lg:hidden leading-relaxed font-ui">
          {getAssessmentTypeDisplay(assessment)}
        </p>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground align-top py-3 font-ui">
        {getAssessmentTypeDisplay(assessment)}
      </TableCell>
      <TableCell className={cn("align-middle py-3", TABLE_ACTIONS_COLUMN_CLASS)}>
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
        </TablePrimaryActionsRow>
      </TableCell>
    </>
  );
}
