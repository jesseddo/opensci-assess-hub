import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";
import {
  gradeLevels,
  type Assessment,
  type GradeLevel,
  type Unit,
} from "@/lib/assessment-data";
import { AssessmentDetailDialog } from "@/components/AssessmentDetailDialog";
import { ExportAssessmentDialog } from "@/components/ExportAssessmentDialog";
import { ExportUnitDialog } from "@/components/ExportUnitDialog";
import { AddToWorkspaceDialog } from "@/components/AddToWorkspaceDialog";
import { TeacherEditionDialog } from "@/components/TeacherEditionDialog";
import { UnitAssessmentTable } from "@/components/UnitAssessmentTable";
import { UnitOrganizationSummary } from "@/components/UnitOrganizationSummary";
import { UnitRhythmOverview } from "@/components/UnitRhythmOverview";
import {
  defaultGradeForLevel,
  gradePickerLabel,
  gradesForSchoolLevel,
  isGradeInLevel,
  schoolLevelForGrade,
  schoolLevels,
  type SchoolLevel,
} from "@/lib/curriculum-scope";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type DialogKind = "detail" | "export" | "add" | "export-unit" | null;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assessment Library — OpenSciEd" },
      {
        name: "description",
        content:
          "Browse OpenSciEd assessments by grade level, unit, and lesson. Export materials or add formal assessments to Eddo Workspace.",
      },
      { property: "og:title", content: "Assessment Library — OpenSciEd" },
      {
        property: "og:description",
        content:
          "Find the right OpenSciEd assessment fast — organized by grade, unit, and lesson, with one-click export.",
      },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fredoka+One&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: AssessmentLibrary,
});

function AssessmentLibrary() {
  const [schoolLevel, setSchoolLevel] = useState<SchoolLevel>("middle");
  const [gradeId, setGradeId] = useState<string>("grade-8");
  const [unitId, setUnitId] = useState<string>("8.1");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [teLessonNum, setTeLessonNum] = useState<number | null>(null);

  const gradeOptions = useMemo(() => gradesForSchoolLevel(schoolLevel), [schoolLevel]);

  const grade: GradeLevel =
    gradeLevels.find((g) => g.id === gradeId) ??
    gradeOptions[0] ??
    gradeLevels.find((g) => g.id === "grade-8")!;

  const unit: Unit = useMemo(() => {
    const found = grade.units.find((u) => u.id === unitId);
    return found ?? grade.units[0];
  }, [grade, unitId]);

  useEffect(() => {
    if (!isGradeInLevel(gradeId, schoolLevel)) {
      setGradeId(defaultGradeForLevel(schoolLevel));
    }
  }, [schoolLevel, gradeId]);

  useEffect(() => {
    if (!grade.units.some((u) => u.id === unitId)) {
      setUnitId(grade.units[0].id);
    }
  }, [grade, unitId]);

  const isSearching = query.trim().length > 0;

  const openDetail = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDialog("detail");
  };

  const openExport = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDialog("export");
  };

  const openAdd = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setDialog("add");
  };

  const openExportUnit = () => {
    setSelectedAssessment(null);
    setDialog("export-unit");
  };

  const closeDialog = () => setDialog(null);

  const handleSchoolLevelChange = (level: SchoolLevel) => {
    setSchoolLevel(level);
    setGradeId(defaultGradeForLevel(level));
    setQuery("");
  };

  const handleGradeChange = (nextGradeId: string) => {
    setGradeId(nextGradeId);
    setSchoolLevel(schoolLevelForGrade(nextGradeId));
    const nextGrade = gradeLevels.find((g) => g.id === nextGradeId);
    if (nextGrade) {
      setUnitId(nextGrade.units[0].id);
    }
    setQuery("");
  };

  const handleUnitChange = (nextUnitId: string) => {
    setUnitId(nextUnitId);
    setQuery("");
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/15 overflow-x-hidden">
      <div
        aria-hidden
        className="pointer-events-none fixed -top-28 -right-20 size-[22rem] rounded-full bg-eddo-green/30 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed top-[40%] -left-36 size-[28rem] rounded-full bg-eddo-green/20 blur-3xl"
      />

      <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-md eddo-nav-shadow font-ui">
        <div className="max-w-7xl mx-auto px-6 py-2.5 space-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-8 bg-eddo-green rounded-xl flex items-center justify-center shrink-0">
              <BookOpen className="size-3.5 text-eddo-cream" strokeWidth={2.5} />
            </div>
            <div className="flex items-baseline gap-2 min-w-0 flex-wrap">
              <span className="font-display text-lg leading-none text-eddo-green tracking-wide shrink-0">
                eddo
              </span>
              <span className="text-eddo-green/35 text-sm leading-none select-none" aria-hidden>
                ·
              </span>
              <span className="text-sm font-semibold text-eddo-navy leading-none">
                Assessment Library
              </span>
              <span className="inline-flex items-center rounded-full border border-border bg-card/80 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-eddo-green">
                OpenSciEd
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-x-2.5 gap-y-2">
            <div className="space-y-0.5 shrink-0">
              <span className="text-[10px] font-semibold text-eddo-green uppercase tracking-wider block">
                Level
              </span>
              <div
                className="inline-flex h-9 items-center rounded-2xl border border-input bg-card p-0.5 shadow-sm"
                role="group"
                aria-label="School level"
              >
                {schoolLevels.map((level) => (
                  <button
                    key={level.id}
                    type="button"
                    onClick={() => handleSchoolLevelChange(level.id)}
                    className={cn(
                      "h-full rounded-[14px] px-2.5 text-sm font-medium leading-none transition-colors whitespace-nowrap",
                      schoolLevel === level.id
                        ? "bg-background text-eddo-navy shadow-sm"
                        : "text-muted-foreground hover:text-eddo-green",
                    )}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              <label
                htmlFor="grade-select"
                className="text-[10px] font-semibold text-eddo-green uppercase tracking-wider"
              >
                {gradePickerLabel(schoolLevel)}
              </label>
              <Select value={gradeId} onValueChange={handleGradeChange}>
                <SelectTrigger
                  id="grade-select"
                  className="h-9 w-[148px] bg-card text-sm"
                  aria-label={gradePickerLabel(schoolLevel)}
                >
                  <SelectValue placeholder={gradePickerLabel(schoolLevel)} />
                </SelectTrigger>
                <SelectContent>
                  {gradeOptions.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5">
              <label
                htmlFor="unit-select"
                className="text-[10px] font-semibold text-eddo-green uppercase tracking-wider"
              >
                Unit
              </label>
              <Select key={gradeId} value={unit.id} onValueChange={handleUnitChange}>
                <SelectTrigger
                  id="unit-select"
                  className="h-9 w-[min(100%,240px)] bg-card text-sm"
                  aria-label="Select unit"
                >
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {grade.units.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.id} — {u.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-0.5 min-w-[160px] flex-1 sm:max-w-[220px]">
              <label htmlFor="unit-search" className="text-[10px] font-semibold text-eddo-green uppercase tracking-wider">
                Search
              </label>
              <div className="relative">
                <Search className="absolute inset-y-0 left-2.5 my-auto size-3.5 text-muted-foreground pointer-events-none" />
                <input
                  id="unit-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="This unit…"
                  aria-label="Search assessments in this unit"
                  className="font-ui h-9 w-full bg-card border border-border rounded-2xl pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
                />
              </div>
            </div>

            {isSearching && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="h-9 self-end text-xs text-primary underline underline-offset-2 hover:text-primary/80 px-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-medium tracking-tight text-eddo-green font-ui">
              Unit {unit.id}: {unit.title}
            </h1>
            <p className="text-muted-foreground text-sm text-pretty font-body">{unit.description}</p>
            <UnitOrganizationSummary unit={unit} />
            {isSearching && (
              <p className="text-xs text-muted-foreground font-ui">Showing search results</p>
            )}
          </div>
          <Button type="button" onClick={openExportUnit} className="shrink-0">
            Export unit
          </Button>
        </div>

        <UnitRhythmOverview unit={unit} />

        <UnitAssessmentTable
          unit={unit}
          query={query}
          onOpenDetail={openDetail}
          onExport={openExport}
          onAddToWorkspace={openAdd}
          onOpenTeacherEdition={setTeLessonNum}
        />
      </main>

      <TeacherEditionDialog
        unit={unit}
        lessonNum={teLessonNum}
        open={teLessonNum != null}
        onOpenChange={(open) => !open && setTeLessonNum(null)}
      />

      <AssessmentDetailDialog
        assessment={selectedAssessment}
        unit={unit}
        open={dialog === "detail"}
        onOpenChange={(open) => !open && closeDialog()}
        onExport={() => {
          closeDialog();
          if (selectedAssessment) openExport(selectedAssessment);
        }}
        onAddToWorkspace={() => {
          closeDialog();
          if (selectedAssessment) openAdd(selectedAssessment);
        }}
      />

      <ExportAssessmentDialog
        assessment={selectedAssessment}
        unit={unit}
        open={dialog === "export"}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <AddToWorkspaceDialog
        assessment={selectedAssessment}
        open={dialog === "add"}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <ExportUnitDialog
        unit={unit}
        open={dialog === "export-unit"}
        onOpenChange={(open) => !open && closeDialog()}
      />
    </div>
  );
}
