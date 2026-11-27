import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Page } from "playwright";
import ts from "typescript";
import { starwindStyledContracts } from "../../../../contracts/styled/starwind.js";
import {
  type DirectionCase,
  type DirectionExpectation,
  ROOT,
  readMatrixRows,
  type Target,
  validateGeneratedIndex,
} from "../../inventory.js";
import * as chart from "../chart-direction/index.js";
import * as spatial from "../collection-keys/index.js";
import * as colorPaint from "../color-paint/index.js";
import * as composites from "../fixtures-composites/index.js";
import * as controls from "../fixtures-controls/controls.js";
import * as surfaceChecks from "../fixtures-surfaces/expectations.js";
import * as raw from "../fixtures-surfaces/raw.js";
import * as rawChecks from "../fixtures-surfaces/raw-expectations.js";
import * as surfaces from "../fixtures-surfaces/surfaces.js";
import * as legacyControls from "../legacy-controls/index.js";
import * as legacyLayout from "../legacy-layout/index.js";
import * as branches from "../menu-branches/index.js";
import * as motion from "../motion-controls/index.js";
import * as otp from "../navigation-otp/index.js";
import * as overlayPages from "../overlay-chrome/fixtures.js";
import * as reading from "../reading-layout/index.js";
import * as scroll from "../scroll-geometry/index.js";
import * as select from "../select-alignment/index.js";
import * as sliderPaint from "../slider-paint/index.js";
import * as statusPaint from "../switch-progress-paint/index.js";
import { collectSources, compareLedger, inspectSource, type LedgerGroup } from "./ledger.js";

import { compareClassifications, type SourceSection } from "./ownership.js";

type RowRecord = {
  case: string;
  decision: string;
  assertions: string[];
  parts?: Record<string, string | null>;
  targetParts?: Partial<Record<Target, Record<string, string | null>>>;
  measurements?: string[];
};
const ledger = JSON.parse(
  await readFile(new URL("../../inventory/physical-tokens.json", import.meta.url), "utf8"),
) as {
  rows: Record<string, RowRecord>;
  sources: Record<string, { sections: SourceSection[]; occurrences: Record<string, LedgerGroup> }>;
  dispositions: Record<string, string>;
  classes: Record<string, string>;
};

const originals: DirectionCase[] = [
  ...controls.cases,
  ...composites.cases,
  ...surfaces.cases,
  ...raw.cases,
  ...legacyLayout.cases,
  ...legacyControls.cases,
  ...chart.cases,
];
const probes = new Map(
  [
    ...controls.expectations,
    ...composites.expectations,
    ...surfaceChecks.expectations,
    ...rawChecks.expectations,
    ...legacyLayout.expectations,
    ...legacyControls.expectations,
    ...chart.expectations,
  ].map((probe) => [probe.id, probe]),
);
const matrix = new Map((await readMatrixRows()).map((row) => [row.id, row]));
const id = (item: DirectionCase) => "audit-" + item.row.replace(":", "-");
assert.equal(new Set(originals.map((item) => item.row)).size, 143);
assert.equal(originals.length, 143);

const neutral = new Set(
  "alert aspect-ratio badge button card checkbox-group collapsible dropzone image item kbd label separator skeleton spinner textarea theme-toggle toggle video".split(
    " ",
  ),
);
function tagParts(source: string, names: string[], row: string) {
  if (row === "toast")
    source = source.replace(
      /<section data-direction-scope="(?!ordinary-ltr")[^"]+"[^>]*>[\s\S]*?<\/section>/g,
      "",
    );
  const markup = source.replace(/<([A-Z]\w*)\b/g, (tag, name: string) =>
    names.includes(name) ? tag + ' data-audit-export="' + name + '"' : tag,
  );
  return markup;
}
const identity = "public-export-instance";
const geometry = "ordinary-and-rtl-geometry";
// Runtime, legacy and theme rows have no Styled export audit. Their ledger rows name the source
// case, which runs in its own cohort.
const styledOriginals = originals.filter((item) => matrix.has(item.row));
export const cases: DirectionCase[] = styledOriginals.map((item) => {
  const row = matrix.get(item.row)!;
  const fixtures: DirectionCase["fixtures"] = {};
  for (const target of Object.keys(item.fixtures) as Target[]) {
    const fixture = item.fixtures[target]!;
    assert.deepEqual([...fixture.exports].sort(), [...row.exports].sort(), item.row + "/" + target);
    fixtures[target] = {
      ...fixture,
      ...(composites.cases.includes(item) ? { buildAs: item.id } : {}),
      source: composites.cases.includes(item)
        ? fixture.source
        : tagParts(fixture.source, fixture.exports, item.row),
      assertions: [
        identity,
        geometry,
        ...(item.row === "button" ? ["missing-authored-instance-rejected"] : []),
        ...(neutral.has(item.row) || item.row === "form" ? fixture.assertions : []),
      ],
    };
  }
  return { ...item, id: id(item), fixtures };
});
/** Each chart part, the parts chart that holds it, and the start of the TanStack key it draws. */
const chartPartDrawings = [
  ["ChartBar", "cartesian", "bars:"],
  ["ChartLine", "cartesian", "lines:"],
  ["ChartArea", "cartesian", "areas"],
  ["ChartXAxis", "cartesian", "x-tick-label"],
  ["ChartYAxis", "cartesian", "y-tick-label"],
  ["ChartGrid", "cartesian", "x-grid"],
  ["ChartRadar", "radar", "radar"],
  ["ChartPolarGrid", "radar", "ring"],
  ["ChartPolarAngleAxis", "radar", "angle-label"],
  ["ChartPie", "pie", "slices"],
  ["ChartLabel", "pie", "visible-total"],
  ["ChartRadialBar", "radial-bar", "bars"],
  ["ChartLinearGradient", "cartesian", "gradient:"],
] as const;

async function partReceipts(page: Page, item: DirectionCase, target: Target) {
  const row = matrix.get(item.row)!;
  const composite = composites.cases.includes(item);
  const surface = surfaces.cases.includes(item);
  const hostSelector = composite
    ? '[data-direction-scope="live-inherited-ltr"]'
    : surface
      ? '[data-direction-scope="ordinary-ltr"]'
      : "[data-direction-primary]";
  const host = page.locator(hostSelector).first();
  await host.waitFor({ state: "attached" });
  if (composite) {
    const check = probes.get(item.id)!;
    let evidence: Record<string, string[]> | undefined;
    await check.run(page, target, {
      async check(name, run) {
        if (name === "public-parts-and-data-slot-identity") await run();
      },
      observe(name, value) {
        if (name === "public-parts-and-data-slot-identity")
          evidence = value as Record<string, string[]>;
      },
    });
    assert(evidence, "Missing public identity receipt");
    if (item.row === "navigation-menu") {
      const trigger = host.locator("[data-direction-part=NavigationMenuTrigger]").first();
      await trigger.focus();
      await trigger.press("ArrowDown");
      const content = page
        .locator(
          '[data-direction-copy="live-inherited-ltr"][data-direction-part=NavigationMenuContent]:visible',
        )
        .first();
      await content.waitFor({ state: "visible" });
      assert.equal(
        await content.locator('xpath=ancestor::*[@data-slot="navigation-menu-positioner"]').count(),
        1,
      );
      evidence["live-inherited-ltr"]!.push("NavigationMenuPositioner:navigation-menu-positioner");
    }
    return row.exports.map((name) => {
      const slots = evidence!
        ["live-inherited-ltr"]!.filter((part) => part.startsWith(name + ":"))
        .map((part) => part.slice(name.length + 1));
      assert(slots.length, item.row + "/" + name + " is missing");
      return { name, slot: slots.find(Boolean) ?? null };
    });
  }
  const trigger = {
    select: "SelectTrigger",
    sheet: "SheetTrigger",
    tooltip: "TooltipTrigger",
    "alert-dialog": "AlertDialogTrigger",
    dialog: "DialogTrigger",
    "color-picker": "ColorPickerTrigger",
    "context-menu": "ContextMenuTrigger",
    combobox: "ComboboxInput",
  }[item.row];
  if (trigger) {
    const opener = host.locator('[data-audit-export="' + trigger + '"]').first();
    if (item.row === "tooltip") await opener.hover();
    else if (item.row === "context-menu") await opener.click({ button: "right" });
    else if (item.row === "combobox") {
      await opener.focus();
      await opener.press("ArrowDown");
    } else await opener.click();
  }
  if (item.row === "select") {
    const popup = page.locator('[data-audit-export="SelectContent"]:visible').first();
    await popup.waitFor();
    const up = popup.locator('[data-audit-export="SelectScrollUpButton"]'),
      down = popup.locator('[data-audit-export="SelectScrollDownButton"]');
    await popup.evaluate((n) => {
      const list = (n.querySelector("[data-sw-select-list]") ?? n) as HTMLElement;
      list.style.height = "48px";
      list.style.overflowY = "auto";
      if (list.scrollHeight <= list.clientHeight)
        throw Error("Select must overflow to exercise scroll arrows");
      list.scrollTop = 0;
      list.dispatchEvent(new Event("scroll"));
    });
    await down.and(page.locator("[data-visible]")).waitFor({ state: "attached" });
    await popup.evaluate((n) => {
      const list = (n.querySelector("[data-sw-select-list]") ?? n) as HTMLElement;
      list.scrollTop = list.scrollHeight;
      list.dispatchEvent(new Event("scroll"));
    });
    await up.and(page.locator("[data-visible]")).waitFor({ state: "attached" });
  }
  if (item.row === "context-menu") {
    const sub = page.locator('[data-audit-export="ContextMenuSubTrigger"]:visible').first();
    await sub.focus();
    await sub.press("ArrowRight");
    await page.locator('[data-audit-export="ContextMenuSubContent"]:visible').first().waitFor();
  }
  if (item.row === "chart") {
    // ChartTooltip and ChartLegend render no element. ChartTooltip owns the TanStack tooltip host
    // that shows its body, and ChartLegend renders the authored legend content.
    const root = host.locator('[data-audit-export="ChartContainer"]');
    const box = (await root.locator("svg").first().boundingBox())!;
    await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.5, { steps: 4 });
    await root.locator('.ts-chart-tooltip [data-audit-export="ChartTooltipContent"]').waitFor();
    const authored = await root.evaluate((node) => {
      const tooltip = node.querySelector(".ts-chart-tooltip");
      const content = tooltip?.querySelector('[data-audit-export="ChartTooltipContent"]');
      const legend = node.querySelector('[data-audit-export="ChartLegendContent"]');
      if (!tooltip || !content || !legend) throw Error("chart is missing authored parts");
      return [
        { name: "ChartContainer", slot: node.getAttribute("data-slot") },
        { name: "ChartTooltip", slot: ".ts-chart-tooltip" },
        { name: "ChartTooltipContent", slot: content.getAttribute("data-slot") },
        { name: "ChartLegend", slot: "[data-slot=chart-legend]" },
        { name: "ChartLegendContent", slot: legend.getAttribute("data-slot") },
      ];
    });
    // Chart parts render no element. Each part is proven by the drawing it adds to its own parts
    // chart, which the chart-direction fixture authors outside the audit host.
    const drawn = [];
    for (const [name, kind, key] of chartPartDrawings) {
      const selector = `[data-ts-key^="${key}"]`;
      await page
        .locator(`[data-direction-parts="${kind}"] [data-slot="chart"] svg ${selector}`)
        .first()
        .waitFor({ state: "attached" });
      drawn.push({ name, slot: selector });
    }
    return [...authored, ...drawn];
  }
  if (item.row === "toast") {
    const template = host
      .locator('template[data-sw-toast-template="default"]')
      .filter({ visible: false })
      .first();
    const contents = await template.evaluate((node: HTMLTemplateElement) =>
      [...node.content.querySelectorAll("[data-audit-export]")].map((n) =>
        n.getAttribute("data-audit-export"),
      ),
    );
    const viewport = host.locator('[data-audit-export="Toaster"]');
    await host.locator("[data-toast-fire]").click();
    const toast = viewport.locator('[data-audit-export="ToastItem"]:visible').last();
    await toast.waitFor();
    const emitted = await toast.evaluate((n) =>
      [n, ...n.querySelectorAll("[data-audit-export]")].map((el) =>
        el.getAttribute("data-audit-export"),
      ),
    );
    const expected = row.exports
      .filter((name) => !["ToastTemplate", "Toaster"].includes(name))
      .sort();
    assert.deepEqual([...new Set(contents)].sort(), expected);
    assert.deepEqual([...new Set(emitted)].sort(), expected);
    return [
      { name: "ToastTemplate", slot: "template[data-sw-toast-template=default]" },
      { name: "Toaster", slot: await viewport.getAttribute("data-slot") },
      ...(await toast.evaluate((n) =>
        [n, ...n.querySelectorAll("[data-audit-export]")].map((el) => ({
          name: el.getAttribute("data-audit-export")!,
          slot: el.getAttribute("data-slot"),
        })),
      )),
    ];
  }
  const parts = await host.evaluate(
    (root, { row, names }) => {
      const attributed = [...document.querySelectorAll<HTMLElement>("[data-audit-export]")];
      // The opening trigger owns an active portal after its content leaves the fixture copy.
      const linked = new Set(
        [...root.querySelectorAll("[aria-controls],[aria-describedby],[aria-owns]")]
          .flatMap((n) =>
            ["aria-controls", "aria-describedby", "aria-owns"].flatMap((a) =>
              (n.getAttribute(a) ?? "").split(/\s+/),
            ),
          )
          .filter(Boolean),
      );
      const portalRoots = [...linked].map((id) => document.getElementById(id)).filter(Boolean);
      for (let i = 0; i < portalRoots.length; i++)
        for (const opener of portalRoots[i]?.querySelectorAll("[aria-controls]") ?? []) {
          const child = document.getElementById(opener.getAttribute("aria-controls") ?? "");
          if (child && !portalRoots.includes(child)) portalRoots.push(child);
        }
      const owned = attributed.filter(
        (n) => root.contains(n) || portalRoots.some((owner) => owner?.contains(n)),
      );
      if (row === "scroll-area") {
        const bars = owned.filter((n) => n.dataset.auditExport === "ScrollBar");
        const thumbs = owned.filter((n) => n.dataset.auditExport === "ScrollAreaThumb");
        if (
          bars.length !== 2 ||
          thumbs.length !== 2 ||
          !bars.every((bar) => thumbs.filter((thumb) => bar.contains(thumb)).length === 1)
        )
          throw Error("Each real scrollbar must own one thumb");
      }
      return names.map((name) => {
        const node = owned.find((n) => n.dataset.auditExport === name);
        return { name, tag: node?.localName ?? null, slot: node?.dataset.slot ?? null };
      });
    },
    { row: item.row, names: row.exports },
  );
  const missing = parts.filter((p) => !p.tag || !p.slot).map((p) => p.name);
  assert.deepEqual(
    missing,
    [],
    item.row + "/" + target + " missing authored parts: " + missing.join(","),
  );
  return parts;
}

async function rowGeometry(page: Page, item: DirectionCase) {
  const composite = composites.cases.includes(item),
    surface = surfaces.cases.includes(item);
  const selector = composite
    ? '[data-direction-copy="live-inherited-ltr"][data-direction-part]'
    : surface
      ? '[data-direction-scope="ordinary-ltr"] [data-audit-export]'
      : "[data-direction-primary] [data-audit-export]";
  if (item.row === "toast") {
    await page.locator("[data-toast-fire]").first().click();
    await page.locator('[data-audit-export="ToastItem"]:visible').first().waitFor();
  }
  const el = page.locator(selector).first();
  await el.waitFor({ state: "attached" });
  return el.evaluate(async (n) => {
    const scope = n.closest("[data-direction-scope]")!;
    const original = scope.getAttribute("dir");
    const snapshots = [];
    for (const dir of ["ltr", "rtl"]) {
      scope.setAttribute("dir", dir);
      scope.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
      await new Promise(requestAnimationFrame);
      const visible = [n, ...n.querySelectorAll("*")].find((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      if (!visible)
        throw Error("Missing visible rendered root or child for " + n.outerHTML.slice(0, 100));
      const r = visible.getBoundingClientRect(),
        css = getComputedStyle(visible);
      snapshots.push({
        dir: css.direction,
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
        textAlign: css.textAlign,
        inlineStart: css.insetInlineStart,
        inlineEnd: css.insetInlineEnd,
        padding: [css.paddingLeft, css.paddingRight],
        margin: [css.marginLeft, css.marginRight],
        border: [css.borderLeftWidth, css.borderRightWidth],
        corners: [css.borderTopLeftRadius, css.borderTopRightRadius],
        transform: css.transform,
        translate: css.translate,
        rotate: css.rotate,
        origin: css.transformOrigin,
        position: css.position,
        backgroundImage: css.backgroundImage,
      });
      if (css.direction !== dir)
        throw Error("Scope did not reach measured part " + n.outerHTML.slice(0, 100));
    }
    if (original === null) scope.removeAttribute("dir");
    else scope.setAttribute("dir", original);
    scope.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    return snapshots;
  });
}

export const expectations: DirectionExpectation[] = styledOriginals.map((item) => {
  const original = probes.get(item.id)!;
  assert(original, item.id);
  return {
    ...original,
    id: id(item),
    async run(page, target, ctx) {
      await ctx.check(geometry, async () => {
        ctx.observe(geometry, await rowGeometry(page, item));
      });
      await ctx.check(identity, async () => {
        const parts = await partReceipts(page, item, target);
        const actual = Object.fromEntries(parts.map((part) => [part.name, part.slot]));
        const record = ledger.rows[item.row]!;
        assert.deepEqual(
          actual,
          { ...record.parts, ...record.targetParts?.[target] },
          item.row + "/" + target + " exact authored slot identity",
        );
        ctx.observe(identity, actual);
      });
      if (item.row === "button")
        await ctx.check("missing-authored-instance-rejected", async () => {
          const host = page.locator("[data-direction-primary]");
          await host
            .locator('[data-audit-export="Button"]')
            .evaluateAll((nodes) =>
              nodes.forEach((node) => node.removeAttribute("data-audit-export")),
            );
          assert(
            (await host.locator('[data-slot="button"]').count()) > 0,
            "Negative control retains a public slot",
          );
          await assert.rejects(partReceipts(page, item, target), /missing authored parts: Button/);
          ctx.observe("missing-authored-instance-rejected", { unmarkedSlotStillConnected: true });
        });
      if (neutral.has(item.row) || item.row === "form") {
        await page.reload();
        await original.run(page, target, ctx);
      }
    },
  };
});

// Ledger proofs and measurements name the component or Runtime case that exercises each
// physical exception. Those cases run in their own cohorts. This list only resolves the links.
const measured: DirectionCase[] = [
  reading,
  motion,
  colorPaint,
  sliderPaint,
  statusPaint,
  scroll,
  select,
  branches,
  spatial,
  otp,
  overlayPages,
].flatMap((cohort) => cohort.cases);
function verifyAliases(text: string, row: string, target: Target) {
  const contract = starwindStyledContracts.find((c) => c.component === row)!;
  const source = ts.createSourceFile("index.ts", text, ts.ScriptTarget.Latest, true);
  const assignment = source.statements.find(ts.isExportAssignment);
  assert(
    assignment && ts.isIdentifier(assignment.expression),
    target + "/" + row + " default export",
  );
  const binding = assignment.expression.text;
  if (contract.publicExports.includes(binding)) {
    assert.equal(binding, contract.defaultExport.Root ?? contract.publicExports[0]);
    return;
  }
  const declarations = source.statements
    .filter(ts.isVariableStatement)
    .flatMap((s) => [...s.declarationList.declarations]);
  const object = declarations.find(
    (d) => ts.isIdentifier(d.name) && d.name.text === binding,
  )?.initializer;
  assert(object && ts.isObjectLiteralExpression(object), binding + " missing namespace");
  const parts = Object.fromEntries(
    object.properties.map((property) => {
      if (ts.isShorthandPropertyAssignment(property))
        return [property.name.text, property.name.text];
      assert(
        ts.isPropertyAssignment(property) && ts.isIdentifier(property.initializer),
        target + "/" + row + " unsupported alias " + property.getText(source),
      );
      return [property.name.getText(source), property.initializer.text];
    }),
  );
  assert.deepEqual(parts, contract.defaultExport, target + "/" + row + " namespace aliases");
}
const sourceCase = "audit-source-occurrences";
cases.push({
  id: sourceCase,
  row: "theme",
  acceptance: ["SPEC-AC-01", "SPEC-AC-12", "SPEC-AC-14"],
  fixtures: {
    astro: {
      source: `---
import {srcDir} from "astro:config/server";
import {fileURLToPath} from "node:url";
const candidate=fileURLToPath(new URL("../../candidate/",srcDir));
---
<html><head><title>Physical source ledger</title></head><body><main data-candidate={candidate}>Source inventory</main></body></html>`,
      exports: [],
      assertions: ["reviewed-sources", "public-coverage", "negative-probes"],
    },
  },
});
expectations.push({
  id: sourceCase,
  layer: "harness",
  async run(page, _target, ctx) {
    const candidate = await page.locator("[data-candidate]").getAttribute("data-candidate");
    assert(candidate);
    const report = JSON.parse(await readFile(path.join(candidate, "../build.json"), "utf8"));
    assert.equal(path.resolve(candidate), report.generated);
    const byId = new Map([...cases, ...originals, ...measured].map((item) => [item.id, item]));
    await ctx.check("reviewed-sources", async () => {
      const { occurrences: actual, sections } = await collectSources(ROOT, candidate);
      compareLedger(
        Object.fromEntries(
          Object.entries(ledger.sources).map(([name, src]) => [name, src.occurrences]),
        ),
        actual,
      );
      compareClassifications(
        Object.fromEntries(
          Object.entries(ledger.sources).map(([name, record]) => [name, record.sections]),
        ),
        sections,
      );
      let count = 0;
      for (const [file, groups] of Object.entries(actual)) {
        for (const section of sections[file]!) {
          assert(ledger.dispositions[section.disposition], file);
          assert(section.owners.length || section.disposition === "printer", file);
          for (const owner of section.owners)
            assert(ledger.rows[owner], file + " missing owner " + owner);
          if (section.proof) {
            const [id, name] = section.proof.split("#");
            const linked = byId.get(id!);
            assert(
              linked && Object.values(linked.fixtures).every((f) => f.assertions.includes(name!)),
              file + " missing " + section.proof,
            );
          }
        }
        for (const [kind, result] of Object.entries(groups)) {
          assert(ledger.classes[kind], kind);
          count += result.count;
        }
      }
      ctx.observe("reviewed-sources", {
        revision: report.sha,
        files: Object.keys(actual).length,
        occurrences: count,
        sections: Object.values(sections).reduce((count, group) => count + group.length, 0),
        classes: Object.keys(ledger.classes),
      });
    });
    await ctx.check("public-coverage", async () => {
      assert.deepEqual(Object.keys(ledger.rows).sort(), originals.map((o) => o.row).sort());
      let tuples = 0;
      for (const [row, record] of Object.entries(ledger.rows)) {
        assert(record.decision, row);
        const fixture = byId.get(record.case);
        assert(fixture?.row === row, row);
        for (const [target, pageFixture] of Object.entries(fixture.fixtures)) {
          for (const name of record.assertions)
            assert(pageFixture.assertions.includes(name), row + " missing " + name);
          if (!matrix.has(row)) continue;
          const contract = matrix.get(row)!;
          assert.deepEqual(
            Object.keys(record.parts ?? {}).sort(),
            [...contract.exports].sort(),
            row + " public exports",
          );
          const index = await readFile(
            path.join(candidate, "styled", target, row, "index.ts"),
            "utf8",
          );
          validateGeneratedIndex(index, contract, target as Target);
          verifyAliases(index, row, target as Target);
          tuples += contract.exports.length;
        }
        for (const link of record.measurements ?? []) {
          const [caseId, name] = link.split("#"),
            linked = byId.get(caseId!);
          assert(
            linked && Object.values(linked.fixtures).every((f) => f.assertions.includes(name!)),
            row + " unknown measurement " + link,
          );
        }
      }
      assert.equal(tuples, 1177);
      ctx.observe("public-coverage", {
        styled: matrix.size,
        named: [...matrix.values()].reduce((n, r) => n + r.exports.length, 0),
        tuples,
        runtime: originals.filter((x) => x.row.startsWith("runtime:")).length,
        theme: 1,
        legacy: originals.filter((x) => x.row.startsWith("legacy:")).length,
      });
    });
    await ctx.check("negative-probes", () => {
      const before = { test: inspectSource("const x = node.clientX;") };
      for (const added of [
        "padding-left: 3px",
        "object-left",
        "bg-right",
        "background-position-x:20px",
        "* { padding-left: 3px; }",
        "transform-origin: right 5px",
        "pos.style.left = point.clientX",
        "rotate-180",
        '<svg><path d="M8 0L0 4" /></svg>',
        "rtl:group-data-[side=left]:-translate-x-px",
        "--sw-indicator-x: 2px",
      ]) {
        const after = { test: inspectSource("const x = node.clientX;\n" + added) };
        assert.throws(() => compareLedger(before, after), /changed a reviewed occurrence/);
      }
      for (const helper of ["direction", "positioning"]) {
        const file = "apps/demo/src/lib/utils/starwind/" + helper + ".ts";
        assert(
          ledger.sources[file]?.sections.some((s) => s.owners.includes("legacy:context-menu")),
          file,
        );
        assert.throws(
          () => compareLedger({ [file]: ledger.sources[file]!.occurrences }, {}),
          /Orphan/,
        );
      }
      for (const [file, owner, proof] of [
        [
          "scripts/portable-runtime/renderers/framework-adapters/vue/styled/expressions.ts",
          "slider",
          "slider-paint-styled#server-html-no-js",
        ],
        [
          "packages/runtime/src/internal/floating.ts",
          "runtime:context-menu",
          "chrome-overlay-styled#context-entry-bounds",
        ],
      ] as const) {
        const reviewed = ledger.sources[file]!.sections;
        const group = reviewed.find((s) => s.proof === proof);
        assert.deepEqual(group?.owners, [owner]);
        const wrong = reviewed.map((s) => (s === group ? { ...s, owners: ["button"] } : s));
        assert.throws(
          () => compareClassifications({ [file]: reviewed }, { [file]: wrong }),
          /changed reviewed ownership/,
        );
        assert.throws(
          () =>
            compareClassifications(
              { [file]: reviewed },
              { [file]: reviewed.filter((s) => s !== group) },
            ),
          /changed reviewed ownership/,
        );
      }
      assert.throws(() => compareLedger(before, {}), /Orphan/);
      assert.throws(() => compareLedger({}, before), /Unclassified/);
      assert.throws(
        () => validateGeneratedIndex("export { ButtonVariants };", matrix.get("button")!, "react"),
        /Button is missing/,
      );
      ctx.observe("negative-probes", [
        "object-left and bg-right",
        "raw CSS background-position-x, transform-origin and universal selector",
        "removed shared legacy direction and positioning sources",
        "unrelated or removed Vue Slider and Context Menu clearance owners",
        "dynamic pointer",
        "transform",
        "glyph",
        "arbitrary variant",
        "coordinate variable",
        "removed source",
        "new source",
        "missing named export",
      ]);
    });
  },
});
