import type { Assessment, ResourceType } from "@/lib/assessment-data";
import { FileText, ClipboardList, KeyRound, Download } from "lucide-react";

interface Props {
  assessment: Assessment;
  delayMs?: number;
}

const resourceMeta: Record<
  ResourceType,
  { label: string; Icon: typeof FileText; color: string }
> = {
  doc: { label: "Google Doc", Icon: FileText, color: "text-primary" },
  form: { label: "Google Form", Icon: ClipboardList, color: "text-[color:var(--form)]" },
  key: { label: "Answer Key", Icon: KeyRound, color: "text-[color:var(--key)]" },
};

export function AssessmentCard({ assessment, delayMs = 0 }: Props) {
  const highlight = assessment.isSummative;
  return (
    <div
      className={`animate-reveal group rounded-xl p-5 transition-all hover:shadow-md ${
        highlight
          ? "bg-primary/5 border border-primary/20"
          : "bg-card border border-border hover:border-primary/40"
      }`}
      style={{ animationDelay: `${delayMs}ms` }}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex items-center gap-3">
            <span
              className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                highlight ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              {assessment.lesson}
            </span>
            <h4 className="font-semibold text-lg leading-tight">{assessment.title}</h4>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {assessment.standards.map((s) => (
              <span
                key={s}
                className={`text-[10px] font-mono font-medium px-1.5 py-0.5 border rounded ${
                  highlight
                    ? "bg-card border-primary/20 text-primary"
                    : "border-border text-muted-foreground"
                }`}
              >
                {s}
              </span>
            ))}
            <span
              className={`text-xs ml-1 ${
                highlight ? "text-primary/80 font-medium" : "text-muted-foreground"
              }`}
            >
              {assessment.type}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-1">
              {(["doc", "form", "key"] as ResourceType[]).map((r) => {
                const available = assessment.resources.includes(r);
                const meta = resourceMeta[r];
                const Icon = meta.Icon;
                return (
                  <button
                    key={r}
                    type="button"
                    title={available ? `Open ${meta.label}` : `${meta.label} unavailable`}
                    disabled={!available}
                    className={`p-2 rounded-md border transition-colors ${
                      available
                        ? `border-transparent hover:bg-secondary hover:border-border ${
                            highlight ? "bg-card border-primary/20" : ""
                          }`
                        : "opacity-25 cursor-not-allowed border-transparent"
                    }`}
                  >
                    <Icon className={`size-4 ${meta.color}`} strokeWidth={2} />
                  </button>
                );
              })}
            </div>
            <span
              className={`text-[9px] uppercase tracking-tighter font-bold ${
                highlight ? "text-primary" : "text-muted-foreground"
              }`}
            >
              Resources
            </span>
          </div>
          <div className={`h-10 w-px ${highlight ? "bg-primary/20" : "bg-border"}`} />
          <button
            type="button"
            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold transition-colors ${
              highlight
                ? "bg-foreground text-background hover:opacity-90"
                : "border border-border hover:bg-secondary"
            }`}
          >
            <Download className="size-3.5" />
            EXPORT
          </button>
        </div>
      </div>
    </div>
  );
}
