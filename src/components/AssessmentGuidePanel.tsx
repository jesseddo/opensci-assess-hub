import type { ReactNode } from "react";

import type { AssessmentGuide } from "@/lib/assessment-guide";
import {
  guidanceBlockStack,
  guidanceBody,
  guidancePanelEyebrow,
  guidancePanelIntro,
  guidancePanelShell,
  guidanceSectionDivider,
  guidanceSectionStack,
  guidanceSectionTitle,
  guidanceSubheading,
} from "@/components/guidance-panel-ui";
import { cn } from "@/lib/utils";

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className={cn("list-disc pl-4 space-y-1.5", guidanceBody)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function GuideSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className={guidanceSectionDivider}>
      <h3 className={guidanceSectionTitle}>{title}</h3>
      <div className={guidanceSectionStack}>{children}</div>
    </section>
  );
}

export function AssessmentGuidePanel({ guide }: { guide: AssessmentGuide }) {
  return (
    <section className={guidancePanelShell}>
      <div className="space-y-1.5">
        <p className={guidancePanelEyebrow}>Assessment guide</p>
        <p className={guidancePanelIntro}>
          How to read student work on this assessment — standards alignment, what strong
          understanding looks like, and common gaps.
        </p>
      </div>

      <div className={guidanceBlockStack}>
        <GuideSection title="Learning progression">
          <div>
            <p className={guidanceSubheading}>Early understanding</p>
            <p className={guidanceBody}>{guide.progression.early}</p>
          </div>
          <div>
            <p className={guidanceSubheading}>Target understanding</p>
            <p className={guidanceBody}>{guide.progression.target}</p>
          </div>
        </GuideSection>

        <GuideSection title="Standards alignment">
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
          {guide.alignment.note && <p className={guidanceBody}>{guide.alignment.note}</p>}
        </GuideSection>

        <GuideSection title="What understanding looks like">
          <div>
            <p className={guidanceSubheading}>Strong</p>
            <BulletList items={guide.understanding.strong} />
          </div>
          <div>
            <p className={guidanceSubheading}>Emerging</p>
            <BulletList items={guide.understanding.emerging} />
          </div>
          <div>
            <p className={guidanceSubheading}>Gaps</p>
            <BulletList items={guide.understanding.gaps} />
          </div>
        </GuideSection>

        {guide.misconceptions.length > 0 && (
          <GuideSection title="Common misconceptions">
            <BulletList items={guide.misconceptions} />
          </GuideSection>
        )}

        {guide.studentSamples.length > 0 && (
          <GuideSection title="Example student responses">
            {guide.studentSamples.map((sample) => (
              <div
                key={sample.label}
                className="rounded-md border border-border bg-card/80 p-3 space-y-1.5"
              >
                <p className={guidanceSubheading}>{sample.label}</p>
                <p className={cn(guidanceBody, "italic")}>{sample.excerpt}</p>
              </div>
            ))}
          </GuideSection>
        )}
      </div>
    </section>
  );
}
