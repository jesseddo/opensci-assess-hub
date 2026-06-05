import type { Assessment } from "@/lib/assessment-data";
import {
  guidanceBody,
  guidancePanelEyebrow,
  guidancePanelIntro,
  guidancePanelShell,
  guidanceSectionDivider,
  guidanceSectionTitle,
  guidanceSubheading,
} from "@/components/guidance-panel-ui";
import {
  parseOseGuidanceBlocks,
  type OseGuidanceBlock,
  type OseGuidanceSection,
} from "@/lib/ose-guidance-text";
import { cn } from "@/lib/utils";

const SECTIONS: {
  key: OseGuidanceSection;
  title: string;
  getValue: (a: Assessment) => string | undefined;
}[] = [
  {
    key: "buildingTowards",
    title: "Building towards",
    getValue: (a) => a.buildingTowards,
  },
  {
    key: "lookListenFor",
    title: "What to look / listen for",
    getValue: (a) => a.lookListenFor,
  },
  {
    key: "whatToDo",
    title: "What to do",
    getValue: (a) => a.whatToDo,
  },
];

function GuidanceBulletList({ items }: { items: string[] }) {
  return (
    <ul className={cn("list-disc pl-4 space-y-1.5 mt-2", guidanceBody)}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function GuidanceBlock({ block }: { block: OseGuidanceBlock }) {
  if (block.isTopicLine) {
    return <p className={guidanceSubheading}>{block.body}</p>;
  }

  if (block.label) {
    return (
      <div className="space-y-1.5">
        <p className={guidanceSubheading}>{block.label}</p>
        {block.body ? <p className={guidanceBody}>{block.body}</p> : null}
        {block.listItems && block.listItems.length > 0 ? (
          <GuidanceBulletList items={block.listItems} />
        ) : null}
      </div>
    );
  }

  if (block.listItems && block.listItems.length > 0) {
    return <GuidanceBulletList items={block.listItems} />;
  }

  if (!block.body) return null;

  return <p className={guidanceBody}>{block.body}</p>;
}

function GuidanceSection({
  title,
  sectionKey,
  text,
}: {
  title: string;
  sectionKey: OseGuidanceSection;
  text: string;
}) {
  const blocks = parseOseGuidanceBlocks(text, sectionKey);
  if (blocks.length === 0) return null;

  return (
    <section className={guidanceSectionDivider}>
      <h3 className={guidanceSectionTitle}>{title}</h3>
      <div className="space-y-4">
        {blocks.map((block, index) => (
          <GuidanceBlock key={index} block={block} />
        ))}
      </div>
    </section>
  );
}

interface Props {
  assessment: Assessment;
}

export function TeacherEditionGuidancePanel({ assessment }: Props) {
  const sections = SECTIONS.filter((s) => Boolean(s.getValue(assessment)?.trim()));
  if (sections.length === 0) return null;

  return (
    <section className={guidancePanelShell}>
      <div className="space-y-1.5">
        <p className={guidancePanelEyebrow}>From Teacher Edition</p>
        <p className={guidancePanelIntro}>
          Facilitation guidance from the lesson plan — what to notice in student thinking and
          how to respond while teaching.
        </p>
      </div>

      <div className="space-y-1">
        {sections.map((section) => (
          <GuidanceSection
            key={section.key}
            title={section.title}
            sectionKey={section.key}
            text={section.getValue(assessment)!}
          />
        ))}
      </div>
    </section>
  );
}
