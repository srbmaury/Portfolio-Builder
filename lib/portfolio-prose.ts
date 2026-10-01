export type ProseBlock =
  | { type: "paragraph"; text: string }
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] };

/** Explicit editor action: turn each nonempty line into one achievement. */
export function formatExperienceBullets(text: string): string {
  return text.split(/\r?\n/).map(line => line.trim()).filter(Boolean)
    .map(line => `- ${line.replace(/^[-*•]\s+/, "")}`).join("\n");
}

/** A small, plain-text format; no HTML or arbitrary Markdown is interpreted. */
export function parsePortfolioProse(text: string): ProseBlock[] {
  const blocks: ProseBlock[] = [];
  for (const line of text.trim().split(/\r?\n/)) {
    const value = line.trim();
    if (!value) {
      // Blank lines separate consecutive paragraphs and lists.
      blocks.push({ type: "paragraph", text: "" });
      continue;
    }
    const heading = /^#{1,3}\s+(.+)$/.exec(value);
    if (heading) {
      blocks.push({ type: "heading", text: heading[1] });
      continue;
    }
    const bullet = /^[-*•]\s+(.+)$/.exec(value);
    const last = blocks.at(-1);
    if (bullet) {
      if (last?.type === "list") last.items.push(bullet[1]);
      else blocks.push({ type: "list", items: [bullet[1]] });
    } else if (last?.type === "paragraph" && last.text) {
      last.text += ` ${value}`;
    } else {
      blocks.push({ type: "paragraph", text: value });
    }
  }
  return blocks.filter(block => block.type !== "paragraph" || block.text);
}

export function splitProjectDescription(description: string) {
  const [overview = "", ...details] = description.split(/\r?\n\s*\r?\n/);
  return { overview, details: details.join("\n\n") };
}

export function joinProjectDescription(overview: string, details: string) {
  return details.trim() ? `${overview.trim()}\n\n${details}` : overview;
}
