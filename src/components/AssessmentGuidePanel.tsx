import type { AssessmentGuide } from "@/lib/assessment-guide";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-4 space-y-1 text-sm text-foreground/90">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function AssessmentGuidePanel({ guide }: { guide: AssessmentGuide }) {
  return (
    <section className="rounded-lg border border-eddo-green/25 bg-eddo-green/5 p-4 space-y-4">
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-eddo-green font-ui">
          Assessment guide
        </p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          How to read student work on this assessment — standards alignment, what strong
          understanding looks like, and common gaps.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-ui font-medium text-eddo-navy">Learning progression</p>
        <p className="text-xs text-muted-foreground font-medium">Early understanding</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{guide.progression.early}</p>
        <p className="text-xs text-muted-foreground font-medium pt-1">Target understanding</p>
        <p className="text-sm text-foreground/90 leading-relaxed">{guide.progression.target}</p>
      </div>

      <div className="space-y-1.5">
        <p className="text-[10px] font-ui font-medium text-eddo-navy">Standards alignment</p>
        <div className="flex flex-wrap gap-1">
          {guide.alignment.performanceExpectations.map((pe) => (
            <span
              key={pe}
              className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded bg-card"
            >
              {pe}
            </span>
          ))}
          {guide.alignment.lessonPe && (
            <span className="font-mono text-[10px] px-1.5 py-0.5 border border-border rounded bg-card">
              {guide.alignment.lessonPe}
            </span>
          )}
        </div>
        {guide.alignment.note && (
          <p className="text-sm text-foreground/90 leading-relaxed">{guide.alignment.note}</p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[10px] font-ui font-medium text-eddo-navy">What understanding looks like</p>
        <p className="text-xs text-muted-foreground">Strong</p>
        <BulletList items={guide.understanding.strong} />
        <p className="text-xs text-muted-foreground pt-1">Emerging</p>
        <BulletList items={guide.understanding.emerging} />
        <p className="text-xs text-muted-foreground pt-1">Gaps</p>
        <BulletList items={guide.understanding.gaps} />
      </div>

      {guide.misconceptions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] font-ui font-medium text-eddo-navy">Common misconceptions</p>
          <BulletList items={guide.misconceptions} />
        </div>
      )}

      {guide.studentSamples.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-ui font-medium text-eddo-navy">Example student responses</p>
          {guide.studentSamples.map((sample) => (
            <div
              key={sample.label}
              className="rounded-md border border-border bg-card/80 p-3 space-y-1"
            >
              <p className="text-xs font-medium text-foreground">{sample.label}</p>
              <p className="text-sm text-foreground/90 italic leading-relaxed">{sample.excerpt}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
