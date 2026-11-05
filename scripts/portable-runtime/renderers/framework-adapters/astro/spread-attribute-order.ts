// Astro prints a native element's attributes in source order, and an HTML parser keeps the first
// duplicate. A spread must come first so a consumer attribute beats a default, as it does in React.
// Components need no change, because Astro merges their props in order and the last value wins.

const SKIPPED_ELEMENT_BODY = /^(?:script|style)$/;

type ParsedTag = {
  attributes: Array<{ end: number; start: number }>;
  end: number;
  name: string;
};

export function moveAstroElementSpreadsFirst(source: string): string {
  const templateStart = findTemplateStart(source);
  let output = source.slice(0, templateStart);
  let index = templateStart;

  while (index < source.length) {
    const tagStart = source.indexOf("<", index);
    if (tagStart === -1) break;

    const tag = parseOpeningTag(source, tagStart);
    if (!tag) {
      output += source.slice(index, tagStart + 1);
      index = tagStart + 1;
      continue;
    }

    output += source.slice(index, tagStart) + printTag(source, tagStart, tag);
    index = tag.end;

    if (SKIPPED_ELEMENT_BODY.test(tag.name)) {
      const bodyEnd = source.indexOf(`</${tag.name}>`, index);
      if (bodyEnd === -1) break;
      output += source.slice(index, bodyEnd);
      index = bodyEnd;
    }
  }

  return output + source.slice(index);
}

function findTemplateStart(source: string): number {
  if (!source.startsWith("---\n")) return 0;
  const fence = source.indexOf("\n---", 3);
  return fence === -1 ? 0 : fence + "\n---".length;
}

function printTag(source: string, tagStart: number, tag: ParsedTag): string {
  const text = ({ end, start }: { end: number; start: number }) => source.slice(start, end);
  const isSpread = (attribute: { end: number; start: number }) =>
    source.startsWith("{...", attribute.start);
  const ordered = [
    ...tag.attributes.filter(isSpread),
    ...tag.attributes.filter((attribute) => !isSpread(attribute)),
  ];

  if (!/^[a-z]/.test(tag.name) || !tag.attributes.some(isSpread)) {
    return source.slice(tagStart, tag.end);
  }

  // Only the attributes change places. The whitespace between them keeps the printed layout.
  let printed = "";
  let cursor = tagStart;
  tag.attributes.forEach((attribute, position) => {
    printed += source.slice(cursor, attribute.start) + text(ordered[position]);
    cursor = attribute.end;
  });
  return printed + source.slice(cursor, tag.end);
}

function parseOpeningTag(source: string, tagStart: number): ParsedTag | null {
  const name = /^[a-zA-Z][\w.:-]*/.exec(source.slice(tagStart + 1, tagStart + 80))?.[0];
  if (!name) return null;

  const attributes: ParsedTag["attributes"] = [];
  let index = tagStart + 1 + name.length;

  while (index < source.length) {
    while (/\s/.test(source[index] ?? "")) index += 1;

    if (source[index] === ">") return { attributes, end: index + 1, name };
    if (source.startsWith("/>", index)) return { attributes, end: index + 2, name };

    const start = index;
    index = source[index] === "{" ? skipBraces(source, index) : skipNamedAttribute(source, index);
    if (index <= start) return null;
    attributes.push({ end: index, start });
  }

  return null;
}

function skipNamedAttribute(source: string, start: number): number {
  let index = start;
  while (
    index < source.length &&
    !/[\s=>]/.test(source[index]) &&
    !source.startsWith("/>", index)
  ) {
    index += 1;
  }
  if (source[index] !== "=") return index;

  index += 1;
  if (source[index] === "{") return skipBraces(source, index);
  if (source[index] === '"' || source[index] === "'") return skipString(source, index);
  return -1;
}

function skipBraces(source: string, start: number): number {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    const character = source[index];
    if (character === '"' || character === "'" || character === "`") {
      index = skipString(source, index) - 1;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) return index + 1;
    }
  }
  return -1;
}

function skipString(source: string, start: number): number {
  for (let index = start + 1; index < source.length; index += 1) {
    if (source[index] === "\\") index += 1;
    else if (source[index] === source[start]) return index + 1;
  }
  return -1;
}
