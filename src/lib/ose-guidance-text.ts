export type OseGuidanceSection = "buildingTowards" | "lookListenFor" | "whatToDo";

const SECTION_PREFIXES: Record<OseGuidanceSection, RegExp[]> = {
  buildingTowards: [/^Building towards:\s*/i],
  lookListenFor: [
    /^What to look\/listen for:?\s*/i,
    /^What to look for\/listen for:?\s*/i,
    /^What to look for:?\s*/i,
    /^What to listen for:?\s*/i,
  ],
  whatToDo: [/^What to do:?\s*/i],
};

/** Remove OSE header text duplicated by UI section labels. */
export function cleanOseGuidanceText(text: string, section: OseGuidanceSection): string {
  let result = text.trim();
  for (const pattern of SECTION_PREFIXES[section]) {
    result = result.replace(pattern, "");
  }
  return result.trim();
}

export interface OseGuidanceBlock {
  /** Short inline label when the source line uses "Label: body" form. */
  label?: string;
  body: string;
  /** Consecutive short statements from TE — rendered as bullets. */
  listItems?: string[];
  /** Standalone topic line without a colon (e.g. "Factors or variables…"). */
  isTopicLine?: boolean;
}

function isListItemLine(line: string): boolean {
  const t = line.trim();
  if (t.length < 24 || t.length > 320) return false;
  if (!/\.$/.test(t)) return false;
  return t.split(/\.\s+/).filter(Boolean).length <= 2;
}

function isTopicLine(line: string): boolean {
  const t = line.trim();
  return t.length >= 15 && t.length <= 200 && !/\.$/.test(t) && !t.includes(":");
}

/** Merge consecutive list-like lines into one bullet group. */
function groupListItems(blocks: OseGuidanceBlock[]): OseGuidanceBlock[] {
  const result: OseGuidanceBlock[] = [];
  let i = 0;

  while (i < blocks.length) {
    const block = blocks[i];
    if (block.label || block.isTopicLine || !isListItemLine(block.body)) {
      result.push(block);
      i++;
      continue;
    }

    const items: string[] = [];
    while (i < blocks.length && !blocks[i].label && isListItemLine(blocks[i].body)) {
      items.push(blocks[i].body);
      i++;
    }

    if (items.length >= 2) {
      result.push({ body: "", listItems: items });
    } else {
      result.push({ body: items[0] ?? block.body });
    }
  }

  return result;
}

/** Split TE prose into readable blocks (paragraphs, labels, and bullet groups). */
export function parseOseGuidanceBlocks(
  text: string,
  section: OseGuidanceSection,
): OseGuidanceBlock[] {
  const cleaned = cleanOseGuidanceText(text, section);
  if (!cleaned) return [];

  const raw = cleaned
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const inline = line.match(/^([^:]{3,56}):\s+(.+)$/);
      if (inline && !inline[1].includes(".")) {
        return { label: inline[1].trim(), body: inline[2].trim() };
      }
      if (isTopicLine(line)) {
        return { body: line, isTopicLine: true };
      }
      return { body: line };
    });

  return attachListsToLabels(groupListItems(raw));
}

/** Attach a following bullet group to the preceding labeled block (e.g. CCC connections). */
function attachListsToLabels(blocks: OseGuidanceBlock[]): OseGuidanceBlock[] {
  const result: OseGuidanceBlock[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const next = blocks[i + 1];

    if (
      block.label &&
      next?.listItems &&
      next.listItems.length >= 2 &&
      !next.body &&
      !next.label
    ) {
      result.push({ ...block, listItems: next.listItems });
      i++;
    } else {
      result.push(block);
    }
  }

  return result;
}
