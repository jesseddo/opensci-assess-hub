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
const TRACK_ROW_H = "h-8";

interface Props {
  unit: Unit;
}

export function UnitRhythmOverview({ unit }: Props) {
  const rhythm = buildUnitRhythm(unit);
  const activeKinds = new Set(rhythm.points.map((p) => p.kind));
  const hasPacing = rhythm.points.some((p) => p.expectedDays != null);

  return (
    <section
      className="rounded-lg border border-border bg-card px-4 py-3.5"
      aria-label="Unit assessment rhythm"
    >
      <p className="text-[11px] text-muted-foreground font-ui leading-snug mb-2.5">
        {rhythm.summaryLine}
      </p>

      <div className="border-t border-border pt-3">
        <div className="relative px-1">
          <div
            className="pointer-events-none absolute inset-x-2 top-4 h-px -translate-y-1/2 bg-border"
            aria-hidden
          />
          <ol className="relative flex list-none m-0 p-0 w-full" aria-label="Lesson sequence">
            {rhythm.points.map((point) => (
              <LessonRhythmColumn key={point.lessonNum} point={point} hasPacing={hasPacing} />
            ))}
          </ol>
        </div>

        <ul
          className="flex flex-wrap items-center gap-x-3 gap-y-1 list-none m-0 p-0 mt-2.5 pt-2.5 border-t border-border/60"
          aria-label="Marker key"
        >
          {RHYTHM_LEGEND.filter((item) => item.kind === "none" || activeKinds.has(item.kind)).map(
            (item) => (
              <li key={item.kind} className="flex items-center gap-1.5">
                <RhythmMarker kind={item.kind} />
                <span className="text-[10px] font-ui text-muted-foreground whitespace-nowrap">
                  {item.label}
                </span>
              </li>
            ),
          )}
        </ul>
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
      className={cn(
        "relative z-10 shrink-0 ring-2 ring-card",
        rhythmMarkerClassName(kind, "timeline"),
        className,
      )}
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

  return (
    <li
      className="flex min-w-0 flex-col items-center"
      style={columnFlexStyle(point, hasPacing)}
    >
      <div className={cn("flex w-full items-center justify-center", TRACK_ROW_H)}>
        {isEmpty ? (
          <span
            className={cn("relative z-10 shrink-0", rhythmMarkerClassName("none", "timeline"))}
            aria-label={label}
          />
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

      <div className="flex w-full flex-col items-center pt-1">
        {isEmpty ? (
          <span className="font-mono text-[9px] leading-none tabular-nums text-muted-foreground/30">
            {padded}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => scrollToLessonRow(point.lessonNum)}
            className={cn(
              "font-mono text-[10px] leading-none tabular-nums text-muted-foreground",
              "focus-visible:outline-none focus-visible:underline",
              numberClass(point.kind),
            )}
          >
            {padded}
          </button>
        )}
      </div>
    </li>
  );
}

/** Color on lesson numbers only when a marker kind carries assessment meaning. */
function numberClass(kind: LessonRhythmKind): string {
  switch (kind) {
    case "formative":
      return "font-medium text-eddo-accent hover:text-eddo-accent";
    case "peer-assessment":
      return "font-medium text-eddo-navy/65 hover:text-eddo-navy";
    case "pre-assessment":
      return "font-medium text-eddo-accent/80 hover:text-eddo-accent";
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
    return `Lesson ${padded} — ${point.typeHint} only (no standalone assessment document)${pacing}`;
  }
  const count =
    point.assessmentCount > 1 ? ` (${point.assessmentCount} assessments)` : "";
  return `Lesson ${padded} — ${point.typeHint}${count}${pacing}. Jump to lesson in table`;
}
