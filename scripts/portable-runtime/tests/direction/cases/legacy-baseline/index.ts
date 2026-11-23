import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { DirectionCase, DirectionExpectation } from "../../inventory.js";
import { ROOT } from "../../inventory.js";

const legacyRoot = path.join(ROOT, "apps/demo/src/components/starwind");
const currentRevision = execFileSync("git", ["rev-parse", "HEAD"], {
  cwd: ROOT,
  encoding: "utf8",
}).trim();
const staticOwner = new Set([
  "accordion",
  "alert",
  "aspect-ratio",
  "avatar",
  "badge",
  "breadcrumb",
  "button",
  "button-group",
  "card",
  "checkbox",
  "collapsible",
  "dropzone",
  "image",
  "input",
  "input-group",
  "item",
  "kbd",
  "label",
  "native-select",
  "pagination",
  "prose",
  "separator",
  "skeleton",
  "spinner",
  "table",
  "textarea",
  "theme-toggle",
  "toggle",
  "video",
]);
const interactiveOwner = new Set([
  "alert-dialog",
  "carousel",
  "color-picker",
  "context-menu",
  "dialog",
  "dropdown",
  "hover-card",
  "input-otp",
  "popover",
  "progress",
  "radio-group",
  "scroll-area",
  "select",
  "sheet",
  "sidebar",
  "slider",
  "switch",
  "tabs",
  "toast",
  "tooltip",
]);
const scopes = [
  { id: "ordinary-ltr", direction: "ltr", outer: "ltr", inner: "ltr" },
  { id: "ordinary-rtl", direction: "rtl", outer: "rtl", inner: "rtl" },
  { id: "nested-ltr-in-rtl", direction: "ltr", outer: "rtl", inner: "ltr" },
  { id: "nested-rtl-in-ltr", direction: "rtl", outer: "ltr", inner: "rtl" },
] as const;
const scopeAssertionNames: Record<string, string> = {
  "ordinary-ltr": "ordinary-ltr-inherited-bounds-focus-values",
  "ordinary-rtl": "ordinary-rtl-inherited-bounds-focus-values",
  "nested-ltr-in-rtl": "nested-ltr-island-in-rtl-bounds-focus-values",
  "nested-rtl-in-ltr": "nested-rtl-island-in-ltr-bounds-focus-values",
};

assert.equal(staticOwner.size, 29, "Legacy static/layout owner count");
assert.equal(interactiveOwner.size, 20, "Legacy interactive owner count");
assert.equal(
  [...staticOwner, ...interactiveOwner].length,
  49,
  "Every legacy component needs exactly one later owner",
);

const folders = (await readdir(legacyRoot, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
assert.equal(folders.length, 49, "Legacy baseline expects 49 source folders");
for (const id of folders)
  assert(
    staticOwner.has(id) !== interactiveOwner.has(id),
    `${id} must map to one legacy implementation owner`,
  );

type LegacyEvidence = {
  id: string;
  sourceRevision: string;
  sourceDigest: string;
  sourcePaths: string[];
  hooks: string[];
  parts: string[];
  owner: "legacy-static-layout" | "legacy-interactive";
  laterTicket: "26-legacy-layout" | "27-legacy-controls";
  physicalTokens: string[];
  physicalDecision: string;
};

type LegacyBrowserObservation = {
  scope: string;
  dir: "ltr" | "rtl";
  bounds: { x: number; y: number; width: number; height: number } | null;
  initialFocus: string;
  hooks: string[];
  focusTarget: string;
  activeFocus: string;
  values: Record<string, unknown>[];
  paint?: Record<string, unknown>;
};

type LegacyObservedDefect = {
  caseId: string;
  owningTicket: "27-legacy-controls";
  scopes: string[];
  measuredEdges: Record<string, { expected: string; observed: string }>;
};

export function validateLegacyPaintMeasurements(
  id: "switch" | "progress",
  defect: LegacyObservedDefect,
  measurements: LegacyBrowserObservation[],
): void {
  const expectedField = id === "switch" ? "expectedInlineEnd" : "expectedInlineStart";
  const observedField = id === "switch" ? "actualEdge" : "actualAnchor";
  for (const [scopeId, baseline] of Object.entries(defect.measuredEdges)) {
    const measurement = measurements.find((scope) => scope.scope === scopeId);
    assert(measurement?.paint, `${scopeId} current paint measurement is available`);
    const expected = measurement.paint[expectedField];
    const actual = measurement.paint[observedField];
    assert.equal(expected, baseline.expected, `${scopeId} desired physical edge`);
    assert(
      ["physical-left", "physical-right", "interior"].includes(String(actual)),
      `${scopeId} current physical edge`,
    );
    assert.equal(measurement.paint.defect, actual !== expected, `${scopeId} current defect flag`);
  }
  for (const measurement of measurements)
    if (!defect.measuredEdges[measurement.scope])
      assert.equal(measurement.paint?.defect, false, `${measurement.scope} has correct LTR paint`);
}

type LegacyBrowserEvidence = {
  measuredFromCommit: string;
  geometryTolerancePx: number;
  scopeIds: string[];
  rows: { caseId: string; scopes: LegacyBrowserObservation[] }[];
};

async function sourceFiles(id: string): Promise<{ paths: string[]; texts: string[] }> {
  const pending = [id];
  const visited = new Set<string>();
  const absolutePaths: string[] = [];
  while (pending.length > 0) {
    const current = pending.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const folder = path.join(legacyRoot, current);
    const entries = await readdir(folder, { withFileTypes: true });
    const localPaths = entries
      .filter((entry) => entry.isFile() && /\.(?:astro|ts)$/.test(entry.name))
      .map((entry) => path.join(folder, entry.name));
    absolutePaths.push(...localPaths);
    const localSources = await Promise.all(localPaths.map((file) => readFile(file, "utf8")));
    for (const source of localSources)
      for (const match of source.matchAll(/@\/components\/starwind\/([a-z-]+)/g))
        if (!visited.has(match[1]!)) pending.push(match[1]!);
  }
  absolutePaths.sort();
  return {
    paths: absolutePaths.map((file) => path.relative(ROOT, file).replaceAll(path.sep, "/")),
    texts: await Promise.all(absolutePaths.map((file) => readFile(file, "utf8"))),
  };
}

function namedParts(indexSource: string): string[] {
  const parts = new Set<string>();
  for (const match of indexSource.matchAll(
    /\bexport\s*\{([\s\S]*?)\}\s*(?:from\s*["'][^"']+["'])?\s*;/g,
  )) {
    for (const entry of match[1]!.split(",")) {
      const value = entry.trim();
      if (/^type\s+/.test(value)) continue;
      const exported = value.split(/\s+as\s+/).at(-1) ?? value;
      if (/^[A-Z][A-Za-z0-9]*$/.test(exported) && !exported.endsWith("Variants"))
        parts.add(exported);
    }
  }
  return [...parts].sort();
}

function scanHooks(texts: string[]): string[] {
  const hooks = new Set<string>();
  for (const source of texts) {
    for (const match of source.matchAll(/data-slot\s*=\s*["']([^"']+)["']/g))
      hooks.add(`data-slot=${match[1]}`);
    for (const match of source.matchAll(/\bdata-(?:part|sw-[a-z0-9-]+)\b/g)) hooks.add(match[0]);
    for (const match of source.matchAll(/\bstarwind-[a-z0-9:-]+/g)) hooks.add(match[0]);
  }
  return [...hooks].sort();
}

function scanPhysicalTokens(texts: string[]): string[] {
  const tokens = new Set<string>();
  const expression =
    /(?<![\w-])-?(?:left|right|inset-x|translate-x|ml|mr|pl|pr|border-l|border-r|rounded-l|rounded-r)(?:-[A-Za-z0-9()[\]_%./:+-]+)?(?![\w-])|\b(?:translateX|scrollLeft|clientX|clientY)\b/g;
  for (const source of texts)
    for (const match of source.matchAll(expression)) tokens.add(match[0].replace(/[;,:]+$/, ""));
  return [...tokens].sort();
}

function componentName(id: string): string {
  if (id === "toast") return "Toaster";
  return id
    .split("-")
    .map((part) => part[0]!.toUpperCase() + part.slice(1))
    .join("");
}

function extraParts(id: string): string[] {
  return (
    (
      {
        accordion: ["AccordionItem", "AccordionTrigger", "AccordionContent"],
        "alert-dialog": ["AlertDialogTrigger", "AlertDialogContent"],
        carousel: ["CarouselContent", "CarouselItem", "CarouselPrevious", "CarouselNext"],
        collapsible: ["CollapsibleTrigger", "CollapsibleContent"],
        "context-menu": ["ContextMenuTrigger", "ContextMenuContent", "ContextMenuItem"],
        dialog: ["DialogTrigger", "DialogContent"],
        dropdown: ["DropdownTrigger", "DropdownContent", "DropdownItem"],
        "hover-card": ["HoverCardTrigger", "HoverCardContent"],
        "input-otp": ["InputOtpGroup", "InputOtpSlot"],
        popover: ["PopoverTrigger", "PopoverContent"],
        "radio-group": ["RadioGroupItem"],
        select: ["SelectTrigger", "SelectContent", "SelectItem", "SelectValue"],
        sheet: ["SheetTrigger", "SheetContent"],
        sidebar: ["SidebarProvider", "SidebarMenu", "SidebarMenuItem", "SidebarMenuButton"],
        tabs: ["TabsList", "TabsTrigger", "TabsContent"],
        tooltip: ["TooltipTrigger", "TooltipContent"],
      } as Record<string, string[]>
    )[id] ?? []
  );
}

function importBindings(id: string): string {
  const rootName = componentName(id);
  return [rootName, ...extraParts(id)]
    .map((name) => `${name} as ${name === rootName ? "LegacyRoot" : `Legacy${name}`}`)
    .join(", ");
}

function propsFor(id: string, suffix: string): string {
  switch (id) {
    case "switch":
      return `id="legacy-switch-${suffix}" label="Legacy switch 42" checked={true}`;
    case "checkbox":
      return `id="legacy-checkbox-${suffix}" label="Legacy checkbox 42" checked={true}`;
    case "progress":
      return `value={37} max={100}`;
    case "slider":
      return `defaultValue={42} min={0} max={100} name="legacy-slider-${suffix}" aria-label="Legacy slider"`;
    case "input":
      return `id="legacy-input-${suffix}" name="legacy-input-${suffix}" type="text" value="Legacy value 42" aria-label="Legacy input"`;
    case "textarea":
      return `id="legacy-textarea-${suffix}" name="legacy-textarea-${suffix}" value="Legacy value 42" aria-label="Legacy textarea"`;
    case "input-otp":
      return `id="legacy-otp-${suffix}" name="legacy-otp-${suffix}" maxLength={4} defaultValue="2942"`;
    case "color-picker":
      return `id="legacy-color-${suffix}" name="legacy-color-${suffix}" defaultValue="#336699"`;
    case "native-select":
      return `id="legacy-select-${suffix}" name="legacy-select-${suffix}" value="second" aria-label="Legacy native select"`;
    case "image":
      return `src={legacyImage} alt="Legacy image sample"`;
    case "video":
      return `src="data:video/mp4;base64," title="Legacy video sample" controls={true}`;
    default:
      return "";
  }
}

function componentMarkup(id: string, suffix: string): string {
  const props = propsFor(id, suffix);
  const root = "LegacyRoot";
  if (id === "accordion")
    return `<${root}><LegacyAccordionItem value="first"><LegacyAccordionTrigger>Legacy ${id} 42</LegacyAccordionTrigger><LegacyAccordionContent>Accordion value 42</LegacyAccordionContent></LegacyAccordionItem></${root}>`;
  if (id === "alert-dialog")
    return `<${root}><LegacyAlertDialogTrigger>Review value 42</LegacyAlertDialogTrigger><LegacyAlertDialogContent><h2>Legacy alert dialog</h2><p>Arabic العربية 42</p></LegacyAlertDialogContent></${root}>`;
  if (id === "carousel")
    return `<${root}><LegacyCarouselContent><LegacyCarouselItem>Slide one 42</LegacyCarouselItem><LegacyCarouselItem>Slide two العربية 43</LegacyCarouselItem></LegacyCarouselContent><LegacyCarouselPrevious /><LegacyCarouselNext /></${root}>`;
  if (id === "collapsible")
    return `<${root}><LegacyCollapsibleTrigger>Reveal details</LegacyCollapsibleTrigger><LegacyCollapsibleContent>Legacy details 42</LegacyCollapsibleContent></${root}>`;
  if (id === "context-menu")
    return `<${root}><LegacyContextMenuTrigger>Open context</LegacyContextMenuTrigger><LegacyContextMenuContent><LegacyContextMenuItem>Context action 42</LegacyContextMenuItem></LegacyContextMenuContent></${root}>`;
  if (id === "dialog")
    return `<${root}><LegacyDialogTrigger>Open dialog</LegacyDialogTrigger><LegacyDialogContent><h2>Legacy dialog</h2><p>Dialog value 42</p></LegacyDialogContent></${root}>`;
  if (id === "dropdown")
    return `<${root}><LegacyDropdownTrigger>Open menu</LegacyDropdownTrigger><LegacyDropdownContent><LegacyDropdownItem>Menu item 42</LegacyDropdownItem></LegacyDropdownContent></${root}>`;
  if (id === "hover-card")
    return `<${root}><LegacyHoverCardTrigger>Hover details</LegacyHoverCardTrigger><LegacyHoverCardContent>Hover value 42</LegacyHoverCardContent></${root}>`;
  if (id === "input-otp")
    return `<${root} ${props}><LegacyInputOtpGroup><LegacyInputOtpSlot index={0} /><LegacyInputOtpSlot index={1} /><LegacyInputOtpSlot index={2} /><LegacyInputOtpSlot index={3} /></LegacyInputOtpGroup></${root}>`;
  if (id === "popover")
    return `<${root}><LegacyPopoverTrigger>Open popover</LegacyPopoverTrigger><LegacyPopoverContent>Popover value 42</LegacyPopoverContent></${root}>`;
  if (id === "radio-group")
    return `<${root} defaultValue="second"><LegacyRadioGroupItem id="legacy-radio-${suffix}-first" name="legacy-radio-${suffix}" value="first" /><label for="legacy-radio-${suffix}-first">First</label><LegacyRadioGroupItem id="legacy-radio-${suffix}-second" name="legacy-radio-${suffix}" value="second" checked={true} /><label for="legacy-radio-${suffix}-second">Second</label></${root}>`;
  if (id === "select")
    return `<${root} name="legacy-select-${suffix}" defaultValue="second"><LegacySelectTrigger><LegacySelectValue placeholder="Choose a value" /></LegacySelectTrigger><LegacySelectContent><LegacySelectItem value="first">First 41</LegacySelectItem><LegacySelectItem value="second">Second 42</LegacySelectItem></LegacySelectContent></${root}>`;
  if (id === "sheet")
    return `<${root}><LegacySheetTrigger>Open sheet</LegacySheetTrigger><LegacySheetContent><h2>Legacy sheet</h2><p>Sheet value 42</p></LegacySheetContent></${root}>`;
  if (id === "sidebar")
    return `<LegacySidebarProvider><${root} collapsible="none"><LegacySidebarMenu><LegacySidebarMenuItem><LegacySidebarMenuButton>Legacy menu item 42</LegacySidebarMenuButton></LegacySidebarMenuItem></LegacySidebarMenu></${root}></LegacySidebarProvider>`;
  if (id === "tabs")
    return `<${root} defaultValue="first"><LegacyTabsList><LegacyTabsTrigger value="first">First tab</LegacyTabsTrigger><LegacyTabsTrigger value="second">Second tab</LegacyTabsTrigger></LegacyTabsList><LegacyTabsContent value="first">First panel 42</LegacyTabsContent><LegacyTabsContent value="second">Second panel 43</LegacyTabsContent></${root}>`;
  if (id === "tooltip")
    return `<${root}><LegacyTooltipTrigger><button type="button">Tooltip trigger</button></LegacyTooltipTrigger><LegacyTooltipContent>Tooltip value 42</LegacyTooltipContent></${root}>`;
  if (["input", "textarea", "image", "video"].includes(id)) return `<${root} ${props} />`;
  if (id === "native-select")
    return `<${root} ${props}><option value="first">First 1</option><option value="second" selected>Second 2</option></${root}>`;
  if (id === "progress" || id === "slider") return `<${root} ${props} />`;
  if (id === "checkbox") return `<${root} ${props} />`;
  if (id === "switch") return `<${root} ${props} />`;
  if (id === "color-picker") return `<${root} ${props} />`;
  if (id === "skeleton") return `<${root} class="h-8 w-32" />`;
  return `<${root} ${props}><span>العربية Legacy ${id} 42</span></${root}>`;
}

async function evidenceFor(id: string): Promise<LegacyEvidence> {
  const { paths, texts } = await sourceFiles(id);
  const digest = createHash("sha256");
  for (let index = 0; index < paths.length; index++)
    digest.update(paths[index]!).update("\0").update(texts[index]!).update("\0");
  if (id === "image")
    digest
      .update("apps/demo/src/assets/images/pricing-9.jpg\0")
      .update(await readFile(path.join(ROOT, "apps/demo/src/assets/images/pricing-9.jpg")));
  const indexPath = path.join(legacyRoot, id, "index.ts");
  const index = await readFile(indexPath, "utf8");
  const parts = namedParts(index);
  const tokens = scanPhysicalTokens(texts);
  const laterTicket = staticOwner.has(id) ? "26-legacy-layout" : "27-legacy-controls";
  const physicalDecision =
    id === "switch" || id === "progress"
      ? `The old ${id} component owns its initial paint formula; its physical tokens (${tokens.join(", ") || "none found"}) are not public coordinate APIs. Record its measured LTR/RTL edge in this fixture. Ticket 27 owns any RTL paint correction.`
      : tokens.length
        ? `Preserve the old physical meaning of ${tokens.join(", ")} in the baseline. The ${laterTicket} owner may change a token only when its matching browser observation proves a directional paint defect.`
        : `No physical-side or coordinate token was found in this legacy folder. Preserve native geometry and data order. The ${laterTicket} owner records any browser-measured exception.`;
  return {
    id,
    sourceRevision: currentRevision,
    sourceDigest: digest.digest("hex"),
    sourcePaths:
      id === "image" ? [...paths, "apps/demo/src/assets/images/pricing-9.jpg"].sort() : paths,
    hooks: scanHooks(texts),
    parts,
    owner: staticOwner.has(id) ? "legacy-static-layout" : "legacy-interactive",
    laterTicket,
    physicalTokens: tokens,
    physicalDecision,
  };
}

function sourceFor(id: string, evidence: LegacyEvidence): string {
  const assetImport =
    id === "image"
      ? `import legacyImage from ${JSON.stringify(path.join(ROOT, "apps/demo/src/assets/images/pricing-9.jpg"))};`
      : "";
  const evidenceJson = JSON.stringify(evidence).replaceAll("<", "\\u003c");
  const panels = scopes
    .map((scope) => {
      const content = componentMarkup(id, scope.id);
      return `<div dir="${scope.outer}"><section data-legacy-scope="${scope.id}" dir="${scope.inner}" data-legacy-expected-direction="${scope.direction}"><div data-legacy-component="${id}" data-legacy-owner="${evidence.owner}">${content}</div></section></div>`;
    })
    .join("\n");
  return `---
import { ${importBindings(id)} } from "@direction/legacy-astro/${id}";
import "@direction/sheet";
${assetImport}
const legacyEvidence = ${evidenceJson};
---
<html><head><meta charset="utf-8" /><title>Legacy ${id} direction baseline</title></head><body>
  <main data-legacy-case="${id}" data-legacy-owner="${evidence.owner}">
    ${panels}
  </main>
  <div hidden data-legacy-evidence={JSON.stringify(legacyEvidence)}></div>
  <style is:global>
    body { margin: 0; padding: 24px; }
    [data-legacy-scope] { margin-block-end: 16px; }
    [data-legacy-component] { width: 20rem; min-height: 3rem; }
  </style>
</body></html>`;
}

const evidence = await Promise.all(folders.map(evidenceFor));
const ledger = JSON.parse(
  await readFile(
    path.join(ROOT, "scripts/portable-runtime/tests/direction/staging/legacy-baseline.json"),
    "utf8",
  ),
) as {
  baselineRevision: string;
  caseIds: string[];
  componentEvidence: LegacyEvidence[];
  browserEvidence: LegacyBrowserEvidence;
  observedDefects: LegacyObservedDefect[];
};
assert.equal(ledger.baselineRevision, "d2720e94f8c50f251e13ca8af2ba3a336b56e740");
assert.deepEqual(
  ledger.caseIds,
  evidence.map((item) => `legacy-${item.id}`),
);
assert.deepEqual(
  ledger.componentEvidence.map((item) => item.id),
  evidence.map((item) => item.id),
  "Historical ledger must retain all legacy groups",
);
assert.deepEqual(
  ledger.browserEvidence.rows.map((row) => row.caseId),
  evidence.map((item) => `legacy-${item.id}`),
  "Browser baseline must include every legacy folder",
);
assert.deepEqual(
  ledger.browserEvidence.scopeIds,
  scopes.map((scope) => scope.id),
);
for (const row of ledger.browserEvidence.rows) {
  assert.equal(row.scopes.length, scopes.length, `${row.caseId} measured scope count`);
  assert.deepEqual(
    row.scopes.map((scope) => scope.scope),
    ledger.browserEvidence.scopeIds,
    `${row.caseId} measured scope order`,
  );
}
assert(
  ledger.browserEvidence.geometryTolerancePx > 0,
  "Browser geometry tolerance must be positive",
);
assert.deepEqual(
  ledger.observedDefects.map((defect) => defect.caseId).sort(),
  ["legacy-progress", "legacy-switch"],
  "Known legacy paint defects must stay linked to their measured fixtures",
);

export const legacyEvidence = evidence;

export const cases: DirectionCase[] = evidence.map((item) => {
  const assertions = [
    "legacy-source-paths-and-hooks",
    "legacy-supported-parts",
    "ordinary-ltr-inherited-bounds-focus-values",
    "ordinary-rtl-inherited-bounds-focus-values",
    "nested-ltr-island-in-rtl-bounds-focus-values",
    "nested-rtl-island-in-ltr-bounds-focus-values",
    "physical-token-decision",
    ...(item.id === "switch" ? ["checked-switch-thumb-edge-observation"] : []),
    ...(item.id === "progress" ? ["progress-fill-anchor-observation"] : []),
  ];
  return {
    id: `legacy-${item.id}`,
    row: `legacy:${item.id}`,
    acceptance: ["SPEC-AC-01", "SPEC-AC-12", "SPEC-AC-14"],
    physicalExceptions: [item.physicalDecision],
    fixtures: {
      astro: {
        source: sourceFor(item.id, item),
        exports: item.parts,
        assertions,
      },
    },
  };
});

export const expectations: DirectionExpectation[] = evidence.map((item) => ({
  id: `legacy-${item.id}`,
  layer: "legacy",
  async run(page, target, ctx) {
    const baselineRow = ledger.browserEvidence.rows.find(
      (row) => row.caseId === `legacy-${item.id}`,
    );
    assert(baselineRow, `${item.id} durable browser baseline`);
    const defect = ledger.observedDefects.find((entry) => entry.caseId === `legacy-${item.id}`);
    const expectsPaintDefect = item.id === "switch" || item.id === "progress";
    const provenance = (await page
      .locator("[data-legacy-evidence]")
      .evaluate((node) =>
        JSON.parse(node.getAttribute("data-legacy-evidence") ?? "{}"),
      )) as LegacyEvidence;

    const observed = await page.evaluate((componentId) => {
      const initial = document.activeElement;
      const initialFocus = initial
        ? `${initial.tagName.toLowerCase()}${initial.id ? `#${initial.id}` : ""}`
        : "none";
      return [...document.querySelectorAll<HTMLElement>("[data-legacy-scope]")].map((scope) => {
        const host = scope.querySelector<HTMLElement>("[data-legacy-component]");
        const liveHooks = new Set<string>();
        const liveElements = [
          ...(host ? [host] : []),
          ...(host?.querySelectorAll<HTMLElement>("*") ?? []),
        ];
        for (const element of liveElements) {
          const slot = element.getAttribute("data-slot");
          if (slot) liveHooks.add(`data-slot=${slot}`);
          if (element.hasAttribute("data-part")) liveHooks.add("data-part");
          for (const attribute of element.attributes)
            if (attribute.name.startsWith("data-sw-")) liveHooks.add(attribute.name);
          for (const className of element.classList)
            if (className.startsWith("starwind-")) liveHooks.add(className);
        }
        const part =
          host?.querySelector<HTMLElement>("[data-slot], [data-part], [class*='starwind-']") ??
          (host?.firstElementChild as HTMLElement | null);
        // An endless animation such as a spinner's rotation changes the transformed box on each
        // frame. Hold those animations at their first frame while reading the box.
        const endless = (part?.getAnimations() ?? []).filter(
          (animation) => animation.effect?.getTiming().iterations === Infinity,
        );
        const times = endless.map((animation) => animation.currentTime);
        for (const animation of endless) animation.currentTime = 0;
        const rect = part?.getBoundingClientRect();
        endless.forEach((animation, index) => (animation.currentTime = times[index]!));
        const controls = [
          ...(host?.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
            "input, textarea, select",
          ) ?? []),
        ];
        const stateNodes = [
          ...(host?.querySelectorAll<HTMLElement>(
            "[role='switch'], [role='slider'], [role='progressbar'], [aria-pressed]",
          ) ?? []),
        ];
        const values = [
          ...controls.map((control) => ({
            tag: control.tagName.toLowerCase(),
            type: control instanceof HTMLInputElement ? control.type : undefined,
            value: control.value,
            checked: control instanceof HTMLInputElement ? control.checked : undefined,
          })),
          ...stateNodes.map((node) => ({
            tag: node.tagName.toLowerCase(),
            role: node.getAttribute("role"),
            value: node.getAttribute("aria-valuenow"),
            checked: node.getAttribute("aria-checked") ?? node.getAttribute("aria-pressed"),
          })),
        ];
        const focusable = [
          ...(host?.querySelectorAll<HTMLElement>(
            "button:not([disabled]), input:not([disabled]):not([tabindex='-1']), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])",
          ) ?? []),
        ].find((element) => element.getClientRects().length > 0);
        focusable?.setAttribute("data-legacy-capture-focus", scope.dataset.legacyScope ?? "");
        let paint: Record<string, unknown> | undefined;
        if (componentId === "switch") {
          const track = host?.querySelector<HTMLElement>("[role='switch']");
          const thumb = track?.querySelector<HTMLElement>("[data-slot='switch-toggle']");
          const trackRect = track?.getBoundingClientRect();
          const thumbRect = thumb?.getBoundingClientRect();
          if (track && trackRect && thumbRect) {
            const actualEdge =
              thumbRect.left + thumbRect.width / 2 < trackRect.left + trackRect.width / 2
                ? "physical-left"
                : "physical-right";
            paint = {
              kind: "checked-switch-thumb",
              checked: track.getAttribute("aria-checked"),
              track: { x: trackRect.x, width: trackRect.width },
              thumb: { x: thumbRect.x, width: thumbRect.width },
              expectedInlineEnd:
                getComputedStyle(scope).direction === "rtl" ? "physical-left" : "physical-right",
              actualEdge,
              defect:
                actualEdge !==
                (getComputedStyle(scope).direction === "rtl" ? "physical-left" : "physical-right"),
            };
          }
        }
        if (componentId === "progress") {
          const track = host?.querySelector<HTMLElement>("[role='progressbar']");
          const indicator = track?.firstElementChild as HTMLElement | null;
          const trackRect = track?.getBoundingClientRect();
          const indicatorRect = indicator?.getBoundingClientRect();
          if (track && trackRect && indicatorRect) {
            const visibleLeft = Math.max(trackRect.left, indicatorRect.left);
            const visibleRight = Math.min(trackRect.right, indicatorRect.right);
            const actualAnchor =
              visibleLeft <= trackRect.left + 1
                ? "physical-left"
                : visibleRight >= trackRect.right - 1
                  ? "physical-right"
                  : "interior";
            const expectedAnchor =
              getComputedStyle(scope).direction === "rtl" ? "physical-right" : "physical-left";
            paint = {
              kind: "progress-fill",
              value: track.getAttribute("aria-valuenow"),
              track: { x: trackRect.x, width: trackRect.width },
              indicator: { x: indicatorRect.x, width: indicatorRect.width },
              visible: { left: visibleLeft, right: visibleRight },
              expectedInlineStart: expectedAnchor,
              actualAnchor,
              defect: actualAnchor !== expectedAnchor,
            };
          }
        }
        const bounds = rect
          ? {
              x: Math.round(rect.x * 100) / 100,
              y: Math.round(rect.y * 100) / 100,
              width: Math.round(rect.width * 100) / 100,
              height: Math.round(rect.height * 100) / 100,
            }
          : null;
        return {
          id: scope.dataset.legacyScope,
          expectedDirection: scope.dataset.legacyExpectedDirection,
          computedDirection: getComputedStyle(scope).direction,
          initialFocus,
          hooks: [...liveHooks].sort(),
          componentHook: liveHooks.size > 0,
          bounds,
          values,
          paint,
          focusTarget: focusable
            ? `${focusable.tagName.toLowerCase()}${focusable.id ? `#${focusable.id}` : ""}`
            : "none",
          hasFocusable: Boolean(focusable),
        };
      });
    }, item.id);

    await ctx.check("legacy-source-paths-and-hooks", () => {
      assert.equal(provenance.id, item.id, "Legacy fixture source row");
      assert.deepEqual(provenance.sourcePaths, item.sourcePaths, "Legacy source paths");
      assert.deepEqual(provenance.hooks, item.hooks, "Legacy hook inventory");
      assert.equal(observed.length, 4, "Four independent legacy direction scopes");
      assert.deepEqual(
        observed.map((sample) => sample.id),
        ledger.browserEvidence.scopeIds,
        "Four ordinary and nested direction scopes stay ordered",
      );
    });
    await ctx.check("legacy-supported-parts", () => {
      assert.deepEqual(provenance.parts, item.parts, "Legacy supported parts");
    });
    await ctx.check("physical-token-decision", () => {
      assert.equal(provenance.sourceRevision, item.sourceRevision, "Legacy source revision");
      assert.equal(provenance.sourceDigest, item.sourceDigest, "Legacy source content digest");
      assert.equal(provenance.laterTicket, item.laterTicket, "Legacy remediation owner");
      assert.equal(provenance.physicalDecision, item.physicalDecision, "Physical token decision");
      assert.equal(Boolean(defect), expectsPaintDefect, `${item.id} defect record`);
      if (defect) {
        assert.equal(defect.owningTicket, item.laterTicket, `${item.id} defect owner`);
        assert.deepEqual(
          [...defect.scopes].sort(),
          Object.keys(defect.measuredEdges).sort(),
          `${item.id} defect scopes match measured edges`,
        );
      }
    });
    const measurements: LegacyBrowserObservation[] = [];
    for (const sample of observed) {
      const baseline = baselineRow.scopes.find((scope) => scope.scope === sample.id);
      if (sample.hasFocusable) {
        const focusTarget = page.locator(`[data-legacy-capture-focus="${sample.id}"]`);
        await focusTarget.focus();
      }
      const activeFocus = await page
        .locator(`[data-legacy-scope="${sample.id}"]`)
        .evaluate((scope) => {
          const active = document.activeElement;
          return scope.contains(active) && active
            ? `${active.tagName.toLowerCase()}${(active as HTMLElement).id ? `#${(active as HTMLElement).id}` : ""}`
            : "outside-scope";
        });
      const scopeCheck = scopeAssertionNames[sample.id ?? ""];
      assert(scopeCheck, `Legacy scope assertion for ${sample.id}`);
      await ctx.check(scopeCheck, async () => {
        assert(baseline, `${sample.id} durable scope observation`);
        assert.equal(sample.computedDirection, sample.expectedDirection, `${sample.id} direction`);
        assert(sample.componentHook, `${sample.id} must render an existing Starwind hook`);
        assert(
          sample.hooks.some((hook) => item.hooks.includes(hook)),
          `${sample.id} must render a hook from its legacy source inventory`,
        );
        assert(
          sample.bounds && sample.bounds.width > 0 && sample.bounds.height > 0,
          `${sample.id} component bounds`,
        );
        assert.equal(sample.computedDirection, baseline.dir, `${sample.id} measured direction`);
        assert.equal(
          sample.initialFocus,
          baseline.initialFocus,
          `${sample.id} initial focus baseline`,
        );
        assert.deepEqual(sample.hooks, baseline.hooks, `${sample.id} live hook baseline`);
        assert.equal(
          sample.focusTarget,
          baseline.focusTarget,
          `${sample.id} focus target baseline`,
        );
        assert.deepEqual(
          JSON.parse(JSON.stringify(sample.values)),
          baseline.values,
          `${sample.id} native value baseline`,
        );
        assert(baseline.bounds, `${sample.id} durable bounds`);
        const tolerance = ledger.browserEvidence.geometryTolerancePx;
        assert(
          Math.abs(sample.bounds.width - baseline.bounds.width) <= tolerance,
          `${sample.id} width stays within ${tolerance}px of measured baseline`,
        );
        assert(
          Math.abs(sample.bounds.height - baseline.bounds.height) <= tolerance,
          `${sample.id} height stays within ${tolerance}px of measured baseline`,
        );
        assert(
          Number.isFinite(baseline.bounds.x) && Number.isFinite(baseline.bounds.y),
          `${sample.id} raw bounds`,
        );
        if (sample.hasFocusable)
          assert.notEqual(
            activeFocus,
            "outside-scope",
            `${sample.id} focus stays inside the legacy composition`,
          );
        else assert.equal(activeFocus, "outside-scope", `${sample.id} has no focusable child`);
        assert.equal(activeFocus, baseline.activeFocus, `${sample.id} active focus baseline`);
      });
      measurements.push({
        scope: sample.id ?? "unknown",
        dir: sample.computedDirection as "ltr" | "rtl",
        bounds: sample.bounds,
        initialFocus: sample.initialFocus,
        hooks: sample.hooks,
        focusTarget: sample.focusTarget,
        activeFocus,
        values: JSON.parse(JSON.stringify(sample.values)),
        paint: sample.paint,
      });
    }

    if (item.id === "switch" || item.id === "progress") {
      const assertionName =
        item.id === "switch"
          ? "checked-switch-thumb-edge-observation"
          : "progress-fill-anchor-observation";
      await ctx.check(assertionName, () => {
        assert(defect, `${item.id} RTL paint exception is linked to a measured defect`);
        validateLegacyPaintMeasurements(
          item.id === "switch" ? "switch" : "progress",
          defect,
          measurements,
        );
      });
    }

    ctx.observe(
      "legacy-browser-observations",
      JSON.parse(
        JSON.stringify({
          caseId: `legacy-${item.id}`,
          measuredFromCommit: ledger.browserEvidence.measuredFromCommit,
          target,
          sourceDigest: item.sourceDigest,
          scopes: measurements,
        }),
      ),
    );
  },
}));
