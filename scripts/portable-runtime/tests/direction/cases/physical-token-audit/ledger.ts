import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { classifySections, type SourceSection } from "./ownership.js";

// Class variants can be nested inside arbitrary Tailwind selectors. CSS, SVG and imperative
// coordinates have their own vocabulary; preserve occurrences as well as distinct spellings.
const families = {
  "reading-edge":
    /(?<![\w-])-?(?:m[selr]|p[selr]|space-x|divide-x|(?:margin|padding|border)-(?:left|right|inline(?:-start|-end)?)|rounded-(?:s[se]?|e[se]?|l|r|tl|tr|bl|br)|border-(?:s|e|l|r)|text-(?:left|right|start|end)|(?:inset-)?inline-(?:start|end)|(?:start|end)(?=-))(?=[-:\s"'()[\]{};,]|$)(?:-[\w.[\]()%/+-]+)?/g,
  "anchor-and-translation":
    /(?<![\w-])-?(?:inset-x|left|right|translate-[xy]|origin-(?:left|right|top|bottom|center)|slide-(?:in-from|out-to)-(?:right|left|top|bottom))(?=[-:\s"',)[\]{};]|$)(?:-[\w.[\]()%/+-]+)?|\b(?:translate[XY3]d?|translate|transformOrigin|transform-origin|rotate(?:[XYZ]|-\d+)?|transform|scaleX|matrix3?d?)\b/gi,
  "physical-coordinate":
    /\b(?:client[XY]|page[XY]|screen[XY]|offset(?:Left|Top|[XY])|scroll(?:Left|Top|Width|Height)|getBoundingClientRect|movement[XY]|delta[XY]|touches|changedTouches|physical[XY]|page[XY]Offset|client(?:Width|Height))\b|\.(?:[xy]|left|right|top|bottom)\b|--[\w-]*-(?:x|y|left|right|top|bottom|offset|origin|width|height|position|ratio|progress)(?:-[\w-]+)?/g,
  "orientation-and-motion":
    /\b(?:Arrow(?:Left|Right|Up|Down)|horizontal|vertical|to (?:left|right|top|bottom)|linear-gradient|radial-gradient|conic-gradient|direction(?:-aware)?|rtl|ltr|[Nn]ext|[Pp]revious)\b|\b(?:flex-row-reverse|flex-col-reverse|row-reverse|column-reverse|animate-[\w-]+|motion-(?:safe|reduce)|data-(?:side|align|motion|orientation)|touch-action|writing-mode)\b/g,
  glyph:
    /\b(?:[A-Z]\w*(?:Icon|Chevron|Arrow)\w*|(?:Arrow|Chevron|Caret|Check|CircleCheck|Selector|DeviceDesktop|Sun|Moon|Icon)[A-Z]\w*|viewBox|styledSvgAssets)\b|(?:@tabler\/icons\/|lucide[-\w]*\/)[\w./-]+|<\/?(?:svg|path|polygon|polyline)\b|\b(?:icon|fallbackIcon|startIcon|endIcon)\b|\b[MLHVCSQTAmlhvcsqta]-?\d+(?:[ .,-][^"'<>]{1,130})?(?=["'])/g,
  "edge-and-axis-vocabulary":
    /--[\w-]*(?:inline|block|physical|thumb|indicator|distance|travel|shift|turn|fill|alignment|swipe|drag|inset|offset|angle|ratio|position|coordinate|gradient)[\w-]*|\b[a-zA-Z]*(?:Left|Right|Start|End|Offset|Position|Angle|Gradient|(?:client|physical|pointer|thumb|drag|delta)[XY])\b|(?<![\w-])(?:top|bottom|before|after|pl|pr|ml|mr|mx|px|inset|end|start|end-0|scroll-[mp][lrx]|[ew]-resize|row-reverse|col-reverse|inline-size|block-size|padding-inline|margin-inline|justify-(?:start|end)|float-(?:left|right))(?=[-:'")\s,;\]}]|$)(?:-[\w.[\]()%/+-]+)?/g,
  "dynamic-paint":
    /\.style(?:\.[A-Za-z][A-Za-z0-9]*|\s*\[)|\b(?:setProperty|removeProperty|CSSProperties|classVariant|classJoin)\b|\b(?:style|transform|background|origin)\s*=|(?:\[[^\]\s]*(?:calc\(|var\(|:[^\s]*?)[^\]\s]*\])/g,
  "physical-alignment":
    /(?<![\w-])(?:object|bg|origin|float|clear|caption|snap)-(?:left|right|top|bottom|center)(?:-(?:left|right|top|bottom|center))?\b|\b(?:background-position(?:-[xy])?|object-position|transform-origin|perspective-origin|offset-anchor|offset-position|text-indent|vertical-align|align-items|align-self|justify-content|place-items|place-self)\s*:|\b(?:backgroundPosition[XY]?|objectPosition|transformOrigin|perspectiveOrigin|FloatingSide|FloatingAlign|getSideIntent|contextMenuEntryRoom|entryRoom|menuEntry|--sw-context-menu-entry-room|data-sw-context-menu-entry)\b/g,
  "physical-css":
    /\b(?:padding|margin|border|inset|background|text-align|float|clear|order|grid-column|list-style(?:-position)?|border-radius|border-(?:top|bottom)-(?:left|right)-radius|overscroll-behavior-x)\s*:|\b(?:paddingLeft|paddingRight|marginLeft|marginRight|borderLeftWidth|borderRightWidth|textAlign|paddingInlineStart|paddingInlineEnd|insetInlineStart|insetInlineEnd|backgroundPosition)\b/g,
};
// `sites` is computed fresh on each scan for failure messages. The reviewed ledger stores only
// the count, spellings and the statement signature, so an edit that only moves lines passes.
export type TokenSite = { line: number; column: number; token: string; statement: string };
export type LedgerGroup = { count: number; terms: string[]; signature: string };
export type TokenGroup = LedgerGroup & { sites: TokenSite[] };
export type SourceGroups = Record<string, TokenGroup>;
export type SourceInventory = Record<string, SourceGroups>;
export type LedgerInventory = Record<string, Record<string, LedgerGroup>>;
export const hash = (source: string) =>
  createHash("sha256").update(source).digest("hex").slice(0, 24);

export function inspectSource(source: string): SourceGroups {
  const groups: SourceGroups = {};
  for (const [category, pattern] of Object.entries(families)) {
    const matches = [];
    const sites: TokenSite[] = [];
    const spellings = new Set<string>();
    const code = source.replace(/\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->/g, (comment) =>
      comment.replace(/[^\r\n]/g, " "),
    );
    for (const [index, line] of code.split(/\r?\n/).entries()) {
      const statement = line.trim();
      if (!statement || statement.startsWith("//")) continue;
      for (const match of statement.matchAll(pattern)) {
        const token = match[0];
        matches.push(token + "\t" + statement);
        spellings.add(token);
        sites.push({
          line: index + 1,
          column: (match.index ?? 0) + line.indexOf(statement) + 1,
          token,
          statement,
        });
      }
    }
    if (matches.length)
      groups[category] = {
        count: matches.length,
        terms: [...spellings].sort(),
        // Sort the token and statement pairs so that moving code inside the file keeps the hash.
        signature: hash(matches.sort().join("\n")),
        sites,
      };
  }
  return groups;
}

const authoredRoots = [
  "scripts/portable-runtime/contracts/styled",
  "scripts/portable-runtime/contracts/primitive",
  "scripts/portable-runtime/renderers",
  "packages/runtime/src",
  "apps/demo/src/components/starwind",
  "apps/demo/src/lib/utils/starwind",
];
async function files(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map(async (entry) => {
        const file = path.join(folder, entry.name);
        if (entry.isDirectory()) return files(file);
        return /\.(?:[cm]?[jt]sx?|css|svg|astro|vue|svelte)$/.test(file) ? [file] : [];
      }),
    )
  )
    .flat()
    .sort();
}
export async function collectSources(repo: string, candidate: string) {
  const entries: [string, string][] = [];
  for (const root of authoredRoots) {
    for (const file of await files(path.join(repo, root)))
      entries.push([path.relative(repo, file), file]);
  }
  for (const group of ["packages", "styled"]) {
    for (const file of await files(path.join(candidate, group)))
      entries.push(["candidate/" + path.relative(candidate, file), file]);
  }
  entries.push([
    "apps/demo/src/styles/starwind.css",
    path.join(repo, "apps/demo/src/styles/starwind.css"),
  ]);
  const manifest: SourceInventory = {};
  const sources = new Map<string, string>();
  for (const [key, file] of entries) {
    const source = await readFile(file, "utf8");
    sources.set(key, source);
    const result = inspectSource(source);
    if (Object.keys(result).length) manifest[key] = result;
  }
  return { occurrences: manifest, sections: classifySections(sources, manifest) };
}

const describeSites = (group: TokenGroup | undefined) =>
  group?.sites?.map((site) => site.line + ":" + site.column + " " + site.token).join(", ") ||
  "none";

/** Compares token content per file and category. Line and column numbers are never compared. */
export function compareLedger(
  expected: LedgerInventory,
  actual: SourceInventory | LedgerInventory,
) {
  for (const name of new Set([...Object.keys(expected), ...Object.keys(actual)])) {
    assert(Object.hasOwn(expected, name), "Unclassified physical source " + name);
    assert(Object.hasOwn(actual, name), "Orphan physical source " + name);
    for (const key of new Set([...Object.keys(expected[name]!), ...Object.keys(actual[name]!)])) {
      const reviewed = expected[name]![key];
      const current = actual[name]![key] as TokenGroup | undefined;
      if (
        reviewed &&
        current &&
        reviewed.count === current.count &&
        reviewed.signature === current.signature &&
        reviewed.terms.join("\n") === current.terms.join("\n")
      )
        continue;
      const before = new Set(reviewed?.terms ?? []);
      const after = new Set(current?.terms ?? []);
      const details = [
        "count " + (reviewed?.count ?? 0) + " -> " + (current?.count ?? 0),
        "added terms: " + ([...after].filter((t) => !before.has(t)).join(", ") || "none"),
        "removed terms: " + ([...before].filter((t) => !after.has(t)).join(", ") || "none"),
        "current sites: " + describeSites(current),
      ];
      assert.fail(name + " / " + key + " changed a reviewed occurrence; " + details.join("; "));
    }
  }
}

export function toLedgerSources(
  occurrences: SourceInventory,
  sections: Record<string, SourceSection[]>,
) {
  return Object.fromEntries(
    Object.entries(occurrences).map(([file, groups]) => [
      file,
      {
        sections: sections[file]!.map(({ lines: _lines, ...section }) => section),
        occurrences: Object.fromEntries(
          Object.entries(groups).map(([key, { sites: _sites, ...group }]) => [key, group]),
        ),
      },
    ]),
  );
}

/** Keeps one source per line so a reviewed change shows as a one-line diff. */
export function serializeLedger(ledger: { sources: Record<string, unknown> }) {
  const { sources, ...rest } = ledger;
  const head = JSON.stringify(rest, null, 2).slice(0, -2);
  const body = Object.entries(sources)
    .map(([file, record]) => "    " + JSON.stringify(file) + ": " + JSON.stringify(record))
    .join(",\n");
  return head + ',\n  "sources": {\n' + body + "\n  }\n}\n";
}

export async function refreshLedger(ledgerFile: string, repo: string, candidate: string) {
  const ledger = JSON.parse(await readFile(ledgerFile, "utf8"));
  const { occurrences, sections } = await collectSources(repo, candidate);
  ledger.sources = toLedgerSources(occurrences, sections);
  await writeFile(ledgerFile, serializeLedger(ledger));
  return Object.keys(occurrences).length;
}
// Direction inventory imports all case modules.
export const expectations = [];
