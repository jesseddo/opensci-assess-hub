import { useState } from "react";
import { ChevronRight, Download, Plus, BookOpen } from "lucide-react";

import {
  PrimaryTableAction,
  TABLE_ACTIONS_COLUMN_CLASS,
  TablePrimaryActionsRow,
} from "@/components/TableRowAction";
import { AssessmentDocumentLabel } from "@/components/AssessmentDocumentLabel";
import { TableFocusToggle } from "@/components/TableFocusToggle";
import { TableTerminologyHelp } from "@/components/TableTerminologyHelp";
import { hasAssessmentGuide } from "@/lib/assessment-guide";
import {
  isDeliverableRow,
  isGuidanceOnlyRow,
  isNamedAssessmentRow,
  isOpportunityWithHandout,
  rowShowsAdd,
  rowShowsExport,
  type TableFocusMode,
} from "@/lib/assessment-row-tier";
import { explicitOpportunityCategory } from "@/lib/unit-assessment-organization";
import { assessmentTypeLabel } from "@/lib/assessment-types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Assessment, Unit } from "@/lib/assessment-data";
import { formalAssessmentsInUnit } from "@/lib/assessment-source";
import { buildUnitLessonSlots, formatLessonLength, type UnitLessonSlot } from "@/lib/unit-table-rows";
import { lessonRowId } from "@/lib/unit-rhythm";
import { cn } from "@/lib/utils";

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
  const [focus, setFocus] = useState<TableFocusMode>("all");
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(() => new Set());
  const slots = buildUnitLessonSlots(unit, query, focus);

  const unitAssessmentTotal = formalAssessmentsInUnit(unit.assessments).length;
  const totalCount = unit.assessments.length;

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
      <div className="space-y-3">
        <TableToolbar
          unit={unit}
          focus={focus}
          onFocusChange={setFocus}
          unitAssessmentCount={unitAssessmentTotal}
          totalCount={totalCount}
        />
        <p className="text-sm text-muted-foreground font-body py-12 text-center border border-dashed border-eddo-green/25 rounded-2xl bg-surface/60">
          {focus === "unit-assessments"
            ? "No unit assessments match your filter."
            : `No assessments match "${query.trim()}".`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <TableToolbar
        unit={unit}
        focus={focus}
        onFocusChange={setFocus}
        unitAssessmentCount={unitAssessmentTotal}
        totalCount={totalCount}
      />
      <div className="rounded-2xl border border-eddo-green/20 overflow-hidden bg-card shadow-sm">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-12" />
            <col />
            <col className="w-[40%] min-w-[12rem]" />
            <col className={TABLE_ACTIONS_COLUMN_CLASS} />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border">
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">Lsn</TableHead>
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">Lesson</TableHead>
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">
                <span className="block">In this lesson</span>
                <span className="block text-[9px] font-normal text-muted-foreground/80 normal-case tracking-normal font-body">
                  Unit handout or TE guidance
                </span>
              </TableHead>
              <TableHead
                className={cn(
                  "text-right font-ui text-eddo-green font-medium py-2.5",
                  TABLE_ACTIONS_COLUMN_CLASS,
                )}
              >
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
    </div>
  );
}

function TableToolbar({
  unit,
  focus,
  onFocusChange,
  unitAssessmentCount,
  totalCount,
}: {
  unit: Unit;
  focus: TableFocusMode;
  onFocusChange: (f: TableFocusMode) => void;
  unitAssessmentCount: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div className="flex flex-wrap items-center gap-2.5">
        <TableFocusToggle
          value={focus}
          onChange={onFocusChange}
          unitAssessmentCount={unitAssessmentCount}
          totalCount={totalCount}
        />
        <TableTerminologyHelp unit={unit} />
      </div>
      <p className="text-[11px] text-muted-foreground font-ui">
        <span className="font-medium text-eddo-navy/80">Show all</span> = unit assessments + TE
        opportunities ·{" "}
        <span className="font-medium text-eddo-navy/80">Assessments only</span> = named unit
        handouts
      </p>
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
  const count = slot.assessments.length;

  return (
    <>
      {slot.assessments.map((assessment, index) => (
        <TableRow
          key={assessment.id}
          id={index === 0 ? lessonRowId(slot.lessonNum) : undefined}
          className={cn(
            "hover:!bg-transparent border-b border-border/50 last:border-b-0",
            index === 0 && "border-t-2 border-eddo-green/25",
            rowSurfaceClass(assessment),
          )}
        >
          {index === 0 && (
            <>
              <TableCell rowSpan={count} className="align-middle py-3 pr-1 border-0">
                <LessonChevron expanded={expanded} onToggle={onToggle} label={`Lesson ${padded}`} />
                <span className="font-mono text-[11px] text-muted-foreground ml-0.5">{padded}</span>
              </TableCell>
              <TableCell rowSpan={count} className="align-middle py-3 border-0">
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

function rowSurfaceClass(assessment: Assessment): string {
  if (isNamedAssessmentRow(assessment)) return "bg-card";
  if (isGuidanceOnlyRow(assessment)) return "bg-muted/30";
  return "bg-surface/80";
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
      <p className="font-ui text-[13px] font-semibold text-eddo-navy leading-snug">{slot.shortTitle}</p>
      {slot.expectedDays != null && (
        <p
          className="text-[10px] text-muted-foreground/75 font-ui mt-0.5 tabular-nums"
          title="Instructional length from Unit Overview Materials"
        >
          {formatLessonLength(slot.expectedDays)}
        </p>
      )}
      {expanded && hasDrivingQuestion && (
        <p className="text-xs text-muted-foreground font-body mt-1 leading-relaxed">
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
      className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-eddo-green hover:bg-muted/60 transition-colors align-middle"
    >
      <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
    </button>
  );
}

function AssessmentCells({
  assessment,
  onOpenTeacherEdition,
  onOpenDetail,
  onExport,
  onAddToWorkspace,
}: {
  assessment: Assessment;
  onOpenTeacherEdition: () => void;
  onOpenDetail: (assessment: Assessment) => void;
  onExport: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}) {
  const named = isNamedAssessmentRow(assessment);
  const handoutOpportunity = isOpportunityWithHandout(assessment);
  const deliverable = isDeliverableRow(assessment);
  const guidance = isGuidanceOnlyRow(assessment);
  const showExport = rowShowsExport(assessment);
  const showAdd = rowShowsAdd(assessment);
  const explicitType = explicitOpportunityCategory(assessment);

  return (
    <>
      <TableCell
        className={cn(
          "align-top min-w-0 overflow-hidden border-0",
          named ? "py-2.5" : "py-1.5",
        )}
      >
        <button
          type="button"
          onClick={() => onOpenDetail(assessment)}
          aria-label={`View details for ${assessment.title}`}
          className={cn(
            "block w-full min-w-0 max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-sm",
            named &&
              "font-ui text-sm font-semibold text-eddo-navy underline underline-offset-2 decoration-eddo-navy/25 hover:decoration-eddo-navy/60",
            handoutOpportunity &&
              "font-ui text-sm font-medium text-eddo-navy/75 hover:text-eddo-navy",
            guidance &&
              "font-ui text-xs font-normal text-muted-foreground/70 hover:text-muted-foreground",
          )}
        >
          <span title={assessment.title} className="min-w-0 truncate whitespace-nowrap block">
            {assessment.title}
          </span>
        </button>
        {named && (
          <div className="mt-1">
            <AssessmentDocumentLabel assessment={assessment} showSwatch />
            {hasAssessmentGuide(assessment.id) && (
              <p className="text-[10px] text-eddo-green/80 font-ui leading-none mt-1 pl-[14px]">
                Assessment guide
              </p>
            )}
          </div>
        )}
        {handoutOpportunity && (
          <div className="mt-0.5">
            <AssessmentDocumentLabel assessment={assessment} showSwatch={false} />
          </div>
        )}
        {guidance && explicitType && (
          <p className="text-[10px] text-muted-foreground/55 font-ui leading-none mt-0.5 pl-0.5">
            {assessmentTypeLabel(explicitType)}
          </p>
        )}
      </TableCell>
      <TableCell
        className={cn(
          "align-middle whitespace-nowrap border-0",
          named ? "py-2.5" : "py-1.5",
          TABLE_ACTIONS_COLUMN_CLASS,
        )}
      >
        <TablePrimaryActionsRow>
          {deliverable && (
            <>
              <PrimaryTableAction
                label="Export"
                icon={Download}
                disabled={!showExport}
                aria-label={`Export ${assessment.title}`}
                onClick={() => onExport(assessment)}
              />
              <PrimaryTableAction
                label="Add to workspace"
                icon={Plus}
                disabled={!showAdd}
                aria-label={`Add ${assessment.title} to workspace`}
                onClick={() => onAddToWorkspace(assessment)}
              />
            </>
          )}
          {guidance && (
            <PrimaryTableAction
              label="View TE"
              icon={BookOpen}
              onClick={onOpenTeacherEdition}
              aria-label="View Teacher Edition for this lesson"
            />
          )}
        </TablePrimaryActionsRow>
      </TableCell>
    </>
  );
}
