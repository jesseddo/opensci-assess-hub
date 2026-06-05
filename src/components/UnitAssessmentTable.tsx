import { useState, type ReactNode } from "react";
import { ChevronRight, Plus } from "lucide-react";

import { PrimaryTableAction } from "@/components/TableRowAction";
import { AssessmentDocumentLabel } from "@/components/AssessmentDocumentLabel";
import { TableFocusToggle } from "@/components/TableFocusToggle";
import { TableTerminologyHelp } from "@/components/TableTerminologyHelp";
import {
  isNamedAssessmentRow,
  rowShowsTableWorkspaceAdd,
  type TableFocusMode,
} from "@/lib/assessment-row-tier";
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
  getWorkspaceBlockHint,
  isWorkspaceReady,
  rowShowsWorkspaceAdd,
} from "@/lib/assessment-helpers";
import { formalAssessmentsInUnit, isTeOpportunity } from "@/lib/assessment-source";
import { rhythmMarkerClassName } from "@/lib/rhythm-markers";
import { lessonRowId } from "@/lib/unit-rhythm";
import { buildUnitLessonSlots, formatLessonLength, type UnitLessonSlot } from "@/lib/unit-table-rows";
import { cn } from "@/lib/utils";

/** Uniform white row surface — grouping is divider-only, not fill. */
const TABLE_ROW_SURFACE = "bg-card hover:!bg-muted/30 border-0";

interface Props {
  unit: Unit;
  query: string;
  onOpenDetail: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}

export function UnitAssessmentTable({
  unit,
  query,
  onOpenDetail,
  onAddToWorkspace,
}: Props) {
  const [focus, setFocus] = useState<TableFocusMode>("prepare");
  const [expandedDrivingQuestion, setExpandedDrivingQuestion] = useState<Set<number>>(
    () => new Set(),
  );
  const [expandedTeLessons, setExpandedTeLessons] = useState<Set<number>>(() => new Set());
  const slots = buildUnitLessonSlots(unit, query, focus);

  const unitAssessmentTotal = formalAssessmentsInUnit(unit.assessments).length;

  const handleFocusChange = (next: TableFocusMode) => {
    setFocus(next);
    if (next === "unit-assessments") {
      setExpandedTeLessons(new Set());
    }
  };

  const toggleDrivingQuestion = (lessonNum: number) => {
    setExpandedDrivingQuestion((prev) => {
      const next = new Set(prev);
      if (next.has(lessonNum)) next.delete(lessonNum);
      else next.add(lessonNum);
      return next;
    });
  };

  const toggleTeLesson = (lessonNum: number) => {
    setExpandedTeLessons((prev) => {
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
          onFocusChange={handleFocusChange}
          unitAssessmentCount={unitAssessmentTotal}
        />
        <p className="text-sm text-muted-foreground font-body py-12 text-center border border-dashed border-border rounded-lg bg-card">
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
        onFocusChange={handleFocusChange}
        unitAssessmentCount={unitAssessmentTotal}
      />
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <Table className="table-fixed">
          <colgroup>
            <col className="w-12" />
            <col className="w-[28%] min-w-[9rem]" />
            <col />
          </colgroup>
          <TableHeader>
            <TableRow className="bg-card hover:bg-card border-b border-border">
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">Lsn</TableHead>
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">Lesson</TableHead>
              <TableHead className="font-ui text-eddo-green font-medium py-2.5">
                <span className="block">In this lesson</span>
                <span className="block text-[9px] font-normal text-muted-foreground/80 normal-case tracking-normal font-body">
                  Click for details · chevron expands TE · Add on named assessments
                </span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slots.map((slot, lessonIndex) => (
              <LessonSlotRows
                key={`lesson-${slot.lessonNum}`}
                slot={slot}
                focus={focus}
                showLessonDivider={lessonIndex > 0}
                drivingQuestionExpanded={expandedDrivingQuestion.has(slot.lessonNum)}
                teExpanded={expandedTeLessons.has(slot.lessonNum)}
                onToggleDrivingQuestion={() => toggleDrivingQuestion(slot.lessonNum)}
                onToggleTe={() => toggleTeLesson(slot.lessonNum)}
                onOpenDetail={onOpenDetail}
                onAddToWorkspace={onAddToWorkspace}
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
}: {
  unit: Unit;
  focus: TableFocusMode;
  onFocusChange: (f: TableFocusMode) => void;
  unitAssessmentCount: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <TableFocusToggle
        value={focus}
        onChange={onFocusChange}
        unitAssessmentCount={unitAssessmentCount}
      />
      <TableTerminologyHelp unit={unit} />
    </div>
  );
}

function LessonSlotRows({
  slot,
  focus,
  showLessonDivider,
  drivingQuestionExpanded,
  teExpanded,
  onToggleDrivingQuestion,
  onToggleTe,
  onOpenDetail,
  onAddToWorkspace,
}: {
  slot: UnitLessonSlot;
  focus: TableFocusMode;
  showLessonDivider: boolean;
  drivingQuestionExpanded: boolean;
  teExpanded: boolean;
  onToggleDrivingQuestion: () => void;
  onToggleTe: () => void;
  onOpenDetail: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
}) {
  const padded = String(slot.lessonNum).padStart(2, "0");
  const hasDrivingQuestion =
    slot.drivingQuestion && slot.drivingQuestion !== slot.shortTitle;
  const primary = slot.assessments;
  const te = slot.teOpportunities;
  const showTeSummary = focus === "prepare" && te.length > 0;
  const visibleTe = teExpanded ? te : [];
  const summaryCount = showTeSummary ? 1 : 0;
  const totalRows = primary.length + summaryCount + visibleTe.length;
  const summaryIsFirstRow = primary.length === 0 && showTeSummary;

  const lessonCells = (
    <>
      <TableCell rowSpan={totalRows} className={cn("align-middle py-3 pr-1 border-0", TABLE_ROW_SURFACE)}>
        <LessonChevron
          expanded={drivingQuestionExpanded}
          onToggle={onToggleDrivingQuestion}
          label={`Lesson ${padded}`}
        />
        <span className="font-mono text-[11px] text-muted-foreground ml-0.5">{padded}</span>
      </TableCell>
      <TableCell rowSpan={totalRows} className={cn("align-middle py-3 border-0", TABLE_ROW_SURFACE)}>
        <LessonTitleBlock
          slot={slot}
          expanded={drivingQuestionExpanded}
          hasDrivingQuestion={hasDrivingQuestion}
        />
      </TableCell>
    </>
  );

  return (
    <>
      {primary.map((assessment, index) => (
        <AssessmentRow
          key={assessment.id}
          assessment={assessment}
          id={index === 0 ? lessonRowId(slot.lessonNum) : undefined}
          className={cn(
            showLessonDivider && index === 0 && "border-t border-border",
            index > 0 && "border-t border-border/40",
          )}
          lessonCells={index === 0 ? lessonCells : undefined}
          onOpenDetail={onOpenDetail}
          onAddToWorkspace={onAddToWorkspace}
        />
      ))}

      {showTeSummary && (
        <TeOpportunitySummaryRow
          count={te.length}
          expanded={teExpanded}
          onToggle={onToggleTe}
          showLessonDivider={showLessonDivider && summaryIsFirstRow}
          includesLessonCells={summaryIsFirstRow}
          lessonCells={summaryIsFirstRow ? lessonCells : undefined}
          lessonRowId={summaryIsFirstRow ? lessonRowId(slot.lessonNum) : undefined}
        />
      )}

      {visibleTe.map((assessment) => (
        <AssessmentRow
          key={assessment.id}
          assessment={assessment}
          className="border-t border-border/40"
          onOpenDetail={onOpenDetail}
          onAddToWorkspace={onAddToWorkspace}
          nested
        />
      ))}
    </>
  );
}

function workspaceAddTitle(assessment: Assessment): string | undefined {
  if (isWorkspaceReady(assessment)) return undefined;
  if (rowShowsWorkspaceAdd(assessment)) {
    return getWorkspaceBlockHint(assessment) ?? "Not digitized for workspace yet";
  }
  return "Workspace add is for formative and summative assessments with digitized forms";
}

function AssessmentRow({
  assessment,
  id,
  className,
  lessonCells,
  onOpenDetail,
  onAddToWorkspace,
  nested = false,
}: {
  assessment: Assessment;
  id?: string;
  className?: string;
  lessonCells?: ReactNode;
  onOpenDetail: (assessment: Assessment) => void;
  onAddToWorkspace: (assessment: Assessment) => void;
  nested?: boolean;
}) {
  const teOpportunity = isTeOpportunity(assessment);
  const named = isNamedAssessmentRow(assessment);
  const showTableAdd = rowShowsTableWorkspaceAdd(assessment);
  const addReady = isWorkspaceReady(assessment);
  const titleEmphasis = named || teOpportunity;

  return (
    <TableRow
      id={id}
      className={cn(TABLE_ROW_SURFACE, className)}
    >
      {lessonCells}
      <TableCell
        className={cn(
          "align-top min-w-0 overflow-hidden border-0 py-2",
          TABLE_ROW_SURFACE,
          nested && "pl-6",
        )}
      >
        <div className="flex items-start gap-2 min-w-0 flex-wrap">
          <button
            type="button"
            onClick={() => onOpenDetail(assessment)}
            aria-label={`Open ${assessment.title}`}
            className={cn(
              "min-w-0 max-w-full text-left rounded-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            )}
          >
            <p
              className={cn(
                "font-ui",
                titleEmphasis
                  ? "text-sm font-semibold text-eddo-green"
                  : "text-xs font-normal text-muted-foreground/85",
                showTableAdd ? "whitespace-nowrap" : "truncate",
              )}
              title={assessment.title}
            >
              {assessment.title}
            </p>
            {titleEmphasis && (
              <div className="mt-0.5">
                <AssessmentDocumentLabel assessment={assessment} variant="table" />
              </div>
            )}
          </button>
          {showTableAdd && (
            <PrimaryTableAction
              label="Add"
              icon={Plus}
              disabled={!addReady}
              title={workspaceAddTitle(assessment)}
              aria-label={`Add ${assessment.title} to workspace`}
              onClick={() => onAddToWorkspace(assessment)}
            />
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function TeOpportunitySummaryRow({
  count,
  expanded,
  onToggle,
  showLessonDivider,
  includesLessonCells,
  lessonCells,
  lessonRowId: rowId,
}: {
  count: number;
  expanded: boolean;
  onToggle: () => void;
  showLessonDivider: boolean;
  includesLessonCells: boolean;
  lessonCells?: ReactNode;
  lessonRowId?: string;
}) {
  const oppLabel = count === 1 ? "opportunity" : "opportunities";

  return (
    <TableRow
      id={rowId}
      className={cn(
        TABLE_ROW_SURFACE,
        showLessonDivider && "border-t border-border",
        !showLessonDivider && !includesLessonCells && "border-t border-border/40",
      )}
    >
      {includesLessonCells && lessonCells}
      <TableCell className={cn("border-0 py-1.5", TABLE_ROW_SURFACE)}>
        <div className="flex items-center gap-2 min-w-0">
          <TeExpandChevron expanded={expanded} onToggle={onToggle} count={count} oppLabel={oppLabel} />
          <span className="min-w-0 truncate text-xs font-ui text-muted-foreground">
            <span
              className={cn("inline-block mr-1.5 align-middle", rhythmMarkerClassName("none", "inline"))}
              aria-hidden
            />
            {count} assessment {oppLabel}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function TeExpandChevron({
  expanded,
  onToggle,
  count,
  oppLabel,
}: {
  expanded: boolean;
  onToggle: () => void;
  count: number;
  oppLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      aria-label={`${expanded ? "Hide" : "Show"} ${count} assessment ${oppLabel} in this lesson`}
      className={cn(
        "inline-flex shrink-0 items-center justify-center size-6 rounded-md",
        "text-muted-foreground/70 hover:text-eddo-green hover:bg-muted/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
      )}
    >
      <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
    </button>
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
      <p className="font-ui text-sm font-semibold text-eddo-navy leading-snug">{slot.shortTitle}</p>
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
      className="inline-flex items-center justify-center size-5 rounded-md text-muted-foreground hover:text-eddo-green hover:bg-muted transition-colors align-middle"
    >
      <ChevronRight className={cn("size-3.5 transition-transform", expanded && "rotate-90")} />
    </button>
  );
}
