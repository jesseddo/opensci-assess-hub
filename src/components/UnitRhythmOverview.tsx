import type { CSSProperties } from "react";
import type { Unit } from "@/lib/assessment-data";
import { rhythmMarkerClassName } from "@/lib/rhythm-markers";
import {
  buildUnitRhythm,
  RHYTHM_LEGEND,
  scrollToLessonRow,
  type LessonRhythmKind,
  type LessonRhythmPoint,
} from "@/lib/unit-rhythm";
import { formatLessonLength } from "@/lib/unit-table-rows";
import { cn } from "@/lib/utils";

/** Marker row height — track is vertically centered here. */
const TRACK_ROW_H = "h-7";

interface Props {
  unit: Unit;
}

export function UnitRhythmOverview({ unit }: Props) {
  const rhythm = buildUnitRhythm(unit);
  const activeKinds = new Set(rhythm.points.map((p) => p.kind));
  const hasPacing = rhythm.points.some((p) => p.expectedDays != null);

  return (
    <section
      className="rounded-2xl border border-border bg-card px-3 py-2 shadow-sm"
      aria-label="Unit assessment rhythm"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 mb-1.5">
        <p className="text-[11px] text-muted-foreground font-ui leading-snug min-w-0">
          {rhythm.summaryLine}
          {hasPacing && (
            <span className="text-muted-foreground/70"> · column width = suggested days</span>
          )}
        </p>
        <ul
          className="flex flex-wrap items-center justify-end gap-x-2.5 gap-y-0.5 list-none m-0 p-0 shrink-0"
          aria-label="Marker key"
        >
          {RHYTHM_LEGEND.filter(
            (item) => item.kind === "none" || activeKinds.has(item.kind),
          ).map((item) => (
            <li key={item.kind} className="flex items-center gap-1">
              <RhythmMarker kind={item.kind} />
              <span className="text-[9px] font-ui text-muted-foreground whitespace-nowrap">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative px-1">
        <div
          className="pointer-events-none absolute inset-x-1 top-3.5 h-0.5 -translate-y-1/2 rounded-full bg-eddo-green/30"
          aria-hidden
        />
        <ol
          className="relative flex list-none m-0 p-0 w-full"
          aria-label="Lesson sequence"
        >
          {rhythm.points.map((point) => (
            <LessonRhythmColumn key={point.lessonNum} point={point} hasPacing={hasPacing} />
          ))}
        </ol>
      </div>
    </section>
  );
}

function columnFlexStyle(point: LessonRhythmPoint, hasPacing: boolean): CSSProperties {
  if (!hasPacing) return { flex: 1, minWidth: 0 };
  return { flex: point.expectedDays ?? 1, minWidth: 0 };
}

function RhythmMarker({
  kind,
  className,
}: {
  kind: LessonRhythmKind;
  className?: string;
}) {
  return (
    <span
      className={cn("relative z-10 shrink-0 ring-2 ring-card", rhythmMarkerClassName(kind, "timeline"), className)}
      aria-hidden
    />
  );
}

function LessonRhythmColumn({
  point,
  hasPacing,
}: {
  point: LessonRhythmPoint;
  hasPacing: boolean;
}) {
  const padded = String(point.lessonNum).padStart(2, "0");
  const label = markerLabel(point);
  const isEmpty = point.kind === "none";
  const daysLabel =
    point.expectedDays != null ? formatLessonLength(point.expectedDays) : null;

  return (
    <li
      className="flex min-w-0 flex-col items-center"
      style={columnFlexStyle(point, hasPacing)}
    >
      <div className={cn("flex w-full items-center justify-center", TRACK_ROW_H)}>
        {isEmpty ? (
          <span className={cn("relative z-10 shrink-0", rhythmMarkerClassName("none", "timeline"))} aria-label={label} />
        ) : (
          <button
            type="button"
            onClick={() => scrollToLessonRow(point.lessonNum)}
            aria-label={label}
            title={label}
            className={cn(
              "relative z-10 shrink-0 transition-transform",
              "hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-card",
              rhythmMarkerClassName(point.kind, "timeline"),
            )}
          />
        )}
      </div>

      <div className="flex w-full flex-col items-center gap-0.5 pt-0.5">
        {isEmpty ? (
          <span className="font-mono text-[9px] leading-none tabular-nums text-muted-foreground/35">
            {padded}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => scrollToLessonRow(point.lessonNum)}
            className={cn(
              "font-mono text-[9px] leading-none tabular-nums",
              "focus-visible:outline-none focus-visible:underline",
              numberClass(point.kind),
            )}
          >
            {padded}
          </button>
        )}
        {daysLabel && (
          <span
            className="font-ui text-[8px] leading-none tabular-nums text-muted-foreground/65 whitespace-nowrap"
            title="Instructional length from Unit Overview Materials"
          >
            {daysLabel}
          </span>
        )}
      </div>
    </li>
  );
}

/**
 * Dual encoding: size + shape (not color alone).
 */
function numberClass(kind: LessonRhythmKind): string {
  switch (kind) {
    case "formative":
      return "font-medium text-eddo-accent hover:text-eddo-accent";
    case "supporting":
      return "font-medium text-eddo-navy/65 hover:text-eddo-navy";
    case "summative":
      return "font-semibold text-eddo-green hover:text-eddo-green";
    default:
      return "";
  }
}

function markerLabel(point: LessonRhythmPoint): string {
  const padded = String(point.lessonNum).padStart(2, "0");
  const pacing =
    point.expectedDays != null ? ` · ${formatLessonLength(point.expectedDays)}` : "";
  if (point.kind === "none") {
    return `Lesson ${padded} — TE opportunities (no formal assessment)${pacing}`;
  }
  const count =
    point.assessmentCount > 1 ? ` (${point.assessmentCount} assessments)` : "";
  return `Lesson ${padded} — ${point.typeHint}${count}${pacing}. Jump to lesson in table`;
}
