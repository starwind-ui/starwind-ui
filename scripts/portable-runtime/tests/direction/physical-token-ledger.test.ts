import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

import {
  compareLedger,
  inspectSource,
  type SourceInventory,
  serializeLedger,
  toLedgerSources,
} from "./cases/physical-token-audit/ledger.js";
import {
  classifySections,
  compareClassifications,
} from "./cases/physical-token-audit/ownership.js";

const floating = "packages/runtime/src/internal/floating.ts";
const tooltip = "packages/runtime/src/components/tooltip/tooltip.ts";
const legacy = "apps/demo/src/components/starwind/button/Button.astro";

const sources = {
  [floating]: [
    "export function place(rect: DOMRect, options: Options) {",
    "  const a = rect.left;",
    "  const b = rect.right;",
    "  const entryRoom = rect.top - 4;",
    "  if (options.contextMenuEntryRoom) {",
    "    options.limit = rect.bottom;",
    "  }",
    "  return { a, b, entryRoom };",
    "}",
  ].join("\n"),
  [tooltip]: [
    'import { place } from "../../internal/floating";',
    "export const side = (node: HTMLElement) => node.offsetLeft;",
  ].join("\n"),
  [legacy]: '<button class="absolute left-0 top-0">Go</button>',
};

function scan(files: Record<string, string>) {
  const occurrences: SourceInventory = {};
  for (const [file, source] of Object.entries(files)) {
    const groups = inspectSource(source);
    if (Object.keys(groups).length) occurrences[file] = groups;
  }
  const sections = classifySections(new Map(Object.entries(files)), occurrences);
  return { occurrences, sections, ledger: toLedgerSources(occurrences, sections) };
}

const reviewed = scan(sources).ledger;
const reviewedOccurrences = Object.fromEntries(
  Object.entries(reviewed).map(([file, record]) => [file, record.occurrences]),
);
const reviewedSections = Object.fromEntries(
  Object.entries(reviewed).map(([file, record]) => [file, record.sections]),
);

function verify(files: Record<string, string>) {
  const { occurrences, sections } = scan(files);
  compareLedger(reviewedOccurrences, occurrences);
  compareClassifications(reviewedSections, sections);
}

describe("physical-token ledger", () => {
  it("stores no line or column data", () => {
    expect(JSON.stringify(reviewed)).not.toMatch(/"(?:sites|lines)"/);
    expect(reviewed[floating]!.sections.length).toBeGreaterThan(1);
  });

  it("passes when blank lines or unrelated statements move the tokens", () => {
    const shifted = {
      [floating]: sources[floating]
        .replace("export function", "\n\nconst unrelated = 1;\n\nexport function")
        .replace("  const a", "  const spacer = 2;\n\n  const a"),
      [tooltip]: sources[tooltip].replace("export const", "// A comment\n\n\nexport const"),
      [legacy]: "---\nconst label = 'Go';\n---\n\n" + sources[legacy],
    };
    expect(() => verify(shifted)).not.toThrow();
  });

  it("names the file and token when a token changes to a new spelling", () => {
    const changed = { ...sources, [legacy]: sources[legacy].replace("left-0", "right-0") };
    expect(() => verify(changed)).toThrow(
      new RegExp(
        legacy +
          " / anchor-and-translation changed a reviewed occurrence.*added terms: right-0.*removed terms: left-0",
      ),
    );
  });

  it("fails when tokens swap and the spellings and count stay equal", () => {
    const swapped = {
      ...sources,
      [floating]: sources[floating]
        .replace("rect.left;", "rect.RIGHT;")
        .replace("rect.right;", "rect.left;")
        .replace("rect.RIGHT;", "rect.right;"),
    };
    expect(() => verify(swapped)).toThrow(
      new RegExp(
        floating +
          " / [\\w-]+ changed a reviewed occurrence; count 2 -> 2; added terms: none; removed terms: none; current sites: 2:\\d+ right, 3:\\d+ left",
      ),
    );
  });

  it("names the file and token when a new physical token appears", () => {
    const added = {
      ...sources,
      [tooltip]:
        sources[tooltip] +
        '\nexport const pad = (node: HTMLElement) => (node.style.paddingLeft = "4px");',
    };
    expect(() => verify(added)).toThrow(
      new RegExp(tooltip + " / [\\w-]+ changed a reviewed occurrence.*added terms: paddingLeft"),
    );
  });

  it("fails when a section changes owner and its tokens stay the same", () => {
    const moved = {
      ...sources,
      "packages/runtime/src/components/popover/popover.ts": sources[tooltip],
    };
    delete (moved as Record<string, string>)[tooltip];
    const { occurrences, sections } = scan(moved);
    expect(() => compareClassifications(reviewedSections, sections)).toThrow(
      new RegExp(floating + " changed reviewed ownership or disposition.*runtime:popover.*lines"),
    );
    expect(() =>
      compareLedger(
        { [floating]: reviewedOccurrences[floating]! },
        { [floating]: occurrences[floating]! },
      ),
    ).not.toThrow();
  });

  it("passes when a token line moves inside one section", () => {
    const reordered = {
      ...sources,
      [floating]: sources[floating].replace(
        "  const a = rect.left;\n  const b = rect.right;",
        "  const b = rect.right;\n  const a = rect.left;",
      ),
    };
    expect(() => verify(reordered)).not.toThrow();
    const helperFirst = {
      ...sources,
      [tooltip]: [
        "export const side = (node: HTMLElement) => node.offsetLeft;",
        'import { place } from "../../internal/floating";',
      ].join("\n"),
    };
    expect(() => verify(helperFirst)).not.toThrow();
  });

  it("fails when a token line moves to another section of the same file", () => {
    const moved = {
      ...sources,
      [floating]: sources[floating]
        .replace("  const a = rect.left;\n", "")
        .replace(
          "  if (options.contextMenuEntryRoom) {\n",
          "  if (options.contextMenuEntryRoom) {\n  const a = rect.left;\n",
        ),
    };
    expect(() => verify(moved)).toThrow(
      new RegExp(floating + " changed reviewed ownership or disposition.*runtime:context-menu"),
    );
  });

  it("names the file and token when a token is removed", () => {
    const removed = {
      ...sources,
      [floating]: sources[floating].replace("  const b = rect.right;\n", ""),
    };
    expect(() => verify(removed)).toThrow(
      new RegExp(
        floating +
          " / [\\w-]+ changed a reviewed occurrence; count 2 -> 1; added terms: none; removed terms: \\.?right",
      ),
    );
  });

  it("fails when a new file holds physical tokens", () => {
    const popover = "packages/runtime/src/components/popover/popover.ts";
    const added = {
      ...sources,
      [popover]: "export const x = (node: HTMLElement) => node.offsetLeft;",
    };
    expect(() => verify(added)).toThrow("Unclassified physical source " + popover);
  });

  it("fails when a scanned file is dropped", () => {
    const dropped: Record<string, string> = { ...sources };
    delete dropped[legacy];
    expect(() => verify(dropped)).toThrow("Orphan physical source " + legacy);
  });

  it("keeps the committed ledger in its one-line-per-source format without positions", async () => {
    const text = await readFile(
      new URL("./inventory/physical-tokens.json", import.meta.url),
      "utf8",
    );
    const ledger = JSON.parse(text);
    expect(ledger.schema).toBe(3);
    expect(text).not.toMatch(/"(?:sites|lines)":/);
    expect(serializeLedger(ledger)).toBe(text);
  });
});
