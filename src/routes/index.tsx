import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, FileText, ClipboardList, KeyRound, BookOpen } from "lucide-react";
import {
  gradeLevels,
  gradeGroups,
  lessonNumber,
  type Assessment,
  type GradeLevel,
} from "@/lib/assessment-data";
import { AssessmentCard } from "@/components/AssessmentCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Assessment Library — OpenSciEd" },
      {
        name: "description",
        content:
          "Browse OpenSciEd assessments by grade level, unit, and lesson. Access Google Doc, Google Form, standards, and answer key for each assessment.",
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
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  component: AssessmentLibrary,
});

function AssessmentLibrary() {
  const [gradeId, setGradeId] = useState<string>("grade-8");
  const [unitId, setUnitId] = useState<string>("8.1");
  const [query, setQuery] = useState("");

  const grade: GradeLevel =
    gradeLevels.find((g) => g.id === gradeId) ?? gradeLevels[0];

  // ensure selected unit belongs to current grade
  const unit = useMemo(() => {
    const found = grade.units.find((u) => u.id === unitId);
    return found ?? grade.units[0];
  }, [grade, unitId]);

  type Slot =
    | { kind: "lesson"; lessonNum: number; assessments: Assessment[] }
    | { kind: "final"; assessment: Assessment };

  const slots: Slot[] = useMemo(() => {
    const total = unit.lessonCount ?? 8;
    const byLesson = new Map<number, Assessment[]>();
    const finals: Assessment[] = [];
    for (const a of unit.assessments) {
      const n = lessonNumber(a.lesson);
      if (n == null) {
        finals.push(a);
      } else {
        const arr = byLesson.get(n) ?? [];
        arr.push(a);
        byLesson.set(n, arr);
      }
    }
    const lessonSlots: Slot[] = Array.from({ length: total }, (_, i) => ({
      kind: "lesson" as const,
      lessonNum: i + 1,
      assessments: byLesson.get(i + 1) ?? [],
    }));
    const finalSlots: Slot[] = finals.map((a) => ({ kind: "final" as const, assessment: a }));
    return [...lessonSlots, ...finalSlots];
  }, [unit]);

  const matches = (a: Assessment, q: string) =>
    a.title.toLowerCase().includes(q) ||
    a.standards.some((s) => s.toLowerCase().includes(q)) ||
    a.type.toLowerCase().includes(q) ||
    a.lesson.toLowerCase().includes(q);

  const filteredSlots = useMemo(() => {
    if (!query.trim()) return slots;
    const q = query.toLowerCase();
    const out: Slot[] = [];
    for (const s of slots) {
      if (s.kind === "final") {
        if (matches(s.assessment, q)) out.push(s);
      } else {
        const filtered = s.assessments.filter((a) => matches(a, q));
        if (filtered.length > 0) {
          out.push({ ...s, assessments: filtered });
        }
      }
    }
    return out;
  }, [slots, query]);

  const summativeCount = unit.assessments.filter((a) => a.isSummative).length;
  const formativeCount = unit.assessments.length - summativeCount;
  const lessonCount = unit.lessonCount ?? 8;
  const coveredLessons = new Set(
    unit.assessments
      .map((a) => lessonNumber(a.lesson))
      .filter((n): n is number => n != null),
  );
  const coveredCount = coveredLessons.size;



  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/10">
      {/* Header */}
      <nav className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="size-8 bg-foreground rounded flex items-center justify-center">
                <BookOpen className="size-4 text-background" strokeWidth={2.5} />
              </div>
              <span className="font-bold tracking-tight text-lg">OpenSciEd</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <span>Resources</span>
              <span className="text-border">/</span>
              <span className="text-foreground">Assessment Library</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute inset-y-0 left-3 my-auto size-3.5 text-muted-foreground" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search standards, lessons..."
                className="bg-card border border-border rounded-md pl-9 pr-4 py-1.5 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <button
              type="button"
              className="text-xs font-mono bg-card border border-border px-2 py-1 rounded shadow-sm text-muted-foreground"
            >
              ⌘K
            </button>
          </div>
        </div>

        {/* Grade Level Scroller */}
        <div className="border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 overflow-x-auto no-scrollbar flex items-center gap-1 py-2">
            {gradeGroups.map((group, gi) => (
              <div key={group.label} className="flex items-center gap-1">
                {gi > 0 && <div className="w-px h-4 bg-border mx-2" />}
                {group.ids.map((id) => {
                  const g = gradeLevels.find((x) => x.id === id);
                  if (!g) return null;
                  const active = g.id === gradeId;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        setGradeId(g.id);
                        setUnitId(g.units[0].id);
                      }}
                      className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        active
                          ? "bg-foreground text-background"
                          : "text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {g.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-10">
        {/* Unit Sidebar */}
        <aside className="w-full lg:w-64 lg:flex-shrink-0 flex flex-col gap-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Current Level: {grade.label}
            </h3>
            <div className="space-y-1">
              {grade.units.map((u) => {
                const active = u.id === unit.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => setUnitId(u.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                      active
                        ? "bg-card border border-border shadow-sm"
                        : "text-muted-foreground hover:bg-secondary border border-transparent"
                    }`}
                  >
                    <span
                      className={`font-mono text-[10px] ${
                        active ? "text-primary" : ""
                      }`}
                    >
                      {u.id}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        active ? "text-foreground" : ""
                      }`}
                    >
                      {u.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-xs text-primary/80 leading-relaxed font-medium">
              Unit {unit.id} includes {formativeCount} formative{" "}
              {formativeCount === 1 ? "assessment" : "assessments"}
              {summativeCount > 0 && (
                <>
                  {" "}and {summativeCount} summative{" "}
                  {summativeCount === 1 ? "task" : "tasks"}
                </>
              )}
              .
            </p>
          </div>
        </aside>

        {/* Assessment List */}
        <section className="flex-1 flex flex-col gap-8 min-w-0">
          <header className="flex items-end justify-between border-b border-border pb-4 gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Unit {unit.id}: {unit.title}
              </h1>
              <p className="text-muted-foreground text-sm mt-1 text-pretty">
                {unit.description}
              </p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 bg-foreground text-background px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              Export Unit
            </button>
          </header>

          <div className="flex items-center justify-between text-xs text-muted-foreground -mt-4">
            <span>
              <span className="font-mono text-foreground">{coveredCount}</span> of{" "}
              <span className="font-mono">{lessonCount}</span> lessons have an assessment
              {summativeCount > 0 && (
                <>
                  {" "}· <span className="font-mono text-foreground">{summativeCount}</span>{" "}
                  summative
                </>
              )}
            </span>
          </div>

          <div className="grid gap-3">
            {filteredSlots.length === 0 ? (
              <div className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-xl">
                No assessments match "{query}".
              </div>
            ) : (
              (() => {
                let idx = 0;
                return filteredSlots.map((slot) => {
                  if (slot.kind === "final") {
                    const delay = 60 + idx++ * 30;
                    return (
                      <AssessmentCard
                        key={slot.assessment.id}
                        assessment={slot.assessment}
                        delayMs={delay}
                      />
                    );
                  }
                  if (slot.assessments.length === 0) {
                    const delay = 60 + idx++ * 30;
                    return (
                      <EmptyLessonRow
                        key={`empty-${slot.lessonNum}`}
                        lessonNum={slot.lessonNum}
                        delayMs={delay}
                      />
                    );
                  }
                  if (slot.assessments.length === 1) {
                    const a = slot.assessments[0];
                    const delay = 60 + idx++ * 30;
                    return (
                      <AssessmentCard key={a.id} assessment={a} delayMs={delay} />
                    );
                  }
                  // Multiple assessments for the same lesson — group them.
                  const groupDelay = 60 + idx++ * 30;
                  return (
                    <LessonGroup
                      key={`group-${slot.lessonNum}`}
                      lessonNum={slot.lessonNum}
                      assessments={slot.assessments}
                      delayMs={groupDelay}
                    />
                  );
                });
              })()
            )}
          </div>

        </section>
      </main>


      {/* Legend Overlay */}
      <div className="fixed bottom-6 right-6 hidden md:flex items-center gap-1 bg-card border border-border p-2 rounded-lg shadow-xl animate-reveal" style={{ animationDelay: "500ms" }}>
        <LegendItem Icon={FileText} label="Google Doc" color="text-primary" />
        <LegendItem Icon={ClipboardList} label="Google Form" color="text-[color:var(--form)]" />
        <LegendItem Icon={KeyRound} label="Answer Key" color="text-[color:var(--key)]" />
      </div>
    </div>
  );
}

function LegendItem({
  Icon,
  label,
  color,
}: {
  Icon: typeof FileText;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-2">
      <Icon className={`size-3.5 ${color}`} strokeWidth={2} />
      <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
    </div>
  );
}

function EmptyLessonRow({ lessonNum, delayMs = 0 }: { lessonNum: number; delayMs?: number }) {
  const padded = String(lessonNum).padStart(2, "0");
  return (
    <div
      className="animate-reveal flex items-center justify-between rounded-lg border border-dashed border-border bg-card/40 px-5 py-3"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
          Lesson {padded}
        </span>
        <span className="text-sm text-muted-foreground truncate">
          No assessment for this lesson
        </span>
      </div>
      <span className="text-[10px] uppercase tracking-tighter font-bold text-muted-foreground/60">
        —
      </span>
    </div>
  );
}

function LessonGroup({
  lessonNum,
  assessments,
  delayMs = 0,
}: {
  lessonNum: number;
  assessments: Assessment[];
  delayMs?: number;
}) {
  const padded = String(lessonNum).padStart(2, "0");
  return (
    <div
      className="animate-reveal rounded-xl border border-border bg-card/30 p-3"
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-center gap-2 px-2 pb-2">
        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-secondary text-muted-foreground">
          Lesson {padded}
        </span>
        <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
          {assessments.length} assessments
        </span>
      </div>
      <div className="grid gap-2">
        {assessments.map((a, i) => (
          <AssessmentCard key={a.id} assessment={a} delayMs={i * 30} />
        ))}
      </div>
    </div>
  );
}

