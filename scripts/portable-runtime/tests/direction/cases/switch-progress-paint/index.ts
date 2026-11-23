import assert from "node:assert/strict";
import type { Page } from "playwright";
import {
  type DirectionCase,
  type DirectionExpectation,
  TARGETS,
  type Target,
} from "../../inventory.js";
import { FIRST_PAINT_PARITY, withFirstPaintParity } from "../../paint-parity.js";

type Row = "switch" | "progress";
const rows: Row[] = ["switch", "progress"];
const scopes = ["ordinary", "explicit", "auto", "nested-ltr", "nested-rtl"];
const assertions = [
  "disabled-server-paint",
  "delayed-server-paint",
  "hydrated-paint",
  "live-paint",
  FIRST_PAINT_PARITY,
];

function source(row: Row, target: Target) {
  const component = row === "switch" ? "Switch" : "Progress";
  const primitive =
    row === "progress"
      ? ` import { ProgressRoot, ProgressTrack, ProgressIndicator } from "@starwind-ui/${target}/progress";`
      : "";
  const imports = `import { ${component} } from "@direction/styled-${target}/${row}";${primitive} import "@direction/sheet";`;
  const bind = (prop: string, value: number | boolean | string) =>
    target === "vue" ? `:${prop}="${value}"` : `${prop}={${value}}`;
  const contents = scopes.map((scope) => {
    const controls: string[] = [];
    if (row === "switch") {
      for (const size of ["sm", "md", "lg"]) {
        for (const checked of [false, true]) {
          const id = `${scope}-${size}-${checked}`;
          const controlled = size === "lg" && checked;
          const checkedValue =
            controlled && scope === "ordinary" && target !== "astro" ? "commandChecked" : checked;
          const disabled = size === "sm" && checked;
          const padding = size === "lg" ? bind("padding", 5) : "";
          const border = size === "lg" ? 'class="border-2 [--border-offset:2px]!"' : "";
          controls.push(
            `<form data-example="${id}"><Switch id="${id}" name="toggle" value="yes" uncheckedValue="no" label="Enable" size="${size}" ${bind(controlled ? "checked" : "defaultChecked", checkedValue)} ${padding} ${border} ${disabled ? "disabled" : ""} /></form>`,
          );
        }
      }
    } else {
      for (const value of [0, 25, 30, 50, 100, 33.333, null]) {
        const val = value === null ? "" : bind("value", value + 10);
        controls.push(
          `<div data-example="${scope}-${value}" class="w-80 h-5"><Progress label="Completion" ${bind("min", 10)} ${bind("max", 110)} ${val} /></div>`,
        );
      }
    }
    const body = `<section data-scope="${scope}" ${scope === "explicit" ? 'dir="rtl"' : ""}>${controls.join("")}</section>`;
    if (scope === "auto") return `<div dir="rtl"><div dir="auto">العربية${body}</div></div>`;
    if (scope === "nested-ltr") return `<div dir="rtl"><div dir="ltr">${body}</div></div>`;
    if (scope === "nested-rtl") return `<div dir="ltr"><div dir="rtl">${body}</div></div>`;
    return body;
  });
  const commandEvent = {
    astro: "",
    react: "onClick={() => setChecked(v => !v)}",
    vue: '@click="commandChecked = !commandChecked"',
    svelte: "onclick={() => commandChecked = !commandChecked}",
  };
  const command =
    row === "switch"
      ? `<button type="button" id="command" ${commandEvent[target]}>Set checked</button>`
      : "";
  const body = `<main data-direction-scope="paint" class="p-4">${contents.join("")}${row === "progress" ? copies(target) : ""}${command}</main>`;
  if (target === "astro") {
    const script =
      row === "switch"
        ? `<script>
      import { createSwitch } from "@starwind-ui/runtime/switch";
      document.getElementById("command")?.addEventListener("click", () => {
        const instance = createSwitch(document.getElementById("ordinary-lg-true")!);
        instance.setChecked(!instance.getChecked(), {emit:false});
      });
    </script>`
        : "";
    return `---\n${imports}\n---\n<html><head><meta charset="utf-8" /><link rel="icon" href="data:," /><title>${component} paint</title></head><body>${body}${script}</body></html>`;
  }
  if (target === "react") {
    const state = row === "switch" ? "const [commandChecked,setChecked] = useState(true);" : "";
    return `${imports}\nimport {useState} from "react"; export default function Page(){ ${state} return (${body.replaceAll("class=", "className=")}); }`;
  }
  if (target === "vue")
    return `<script setup lang="ts">\n${imports}\n${row === "switch" ? 'import {ref} from "vue"; const commandChecked = ref(true);' : ""}\n</script><template>${body}</template>`;
  return `<script lang="ts">\n${imports}\n${row === "switch" ? "let commandChecked = $state(true);" : ""}\n</script>${body}`;
}

// Consumer-owned Progress markup in both directions. An edited copy of the released Styled
// indicator keeps its server transform. A custom Primitive indicator relies on Runtime alone.
function copies(target: Target) {
  const bind = (prop: string, value: number) =>
    target === "vue" ? `:${prop}="${value}"` : `${prop}={${value}}`;
  const style =
    target === "react"
      ? 'style={{ transform: "translateX(-70%)" }}'
      : 'style="transform: translateX(-70%)"';
  const sections = ["ltr", "rtl"].map((dir) => {
    const edited = `<ProgressRoot data-copy="edited-${dir}" data-slot="progress" class="bg-muted h-2 w-80 overflow-hidden rounded-full" ${bind("value", 30)}><ProgressTrack data-slot="progress-track" class="h-full w-full"><ProgressIndicator data-slot="progress-indicator" class="h-full w-full flex-1 transition-all bg-foreground" ${style} /></ProgressTrack></ProgressRoot>`;
    const custom = `<ProgressRoot data-copy="custom-${dir}" ${bind("value", 30)}><ProgressTrack class="bg-muted h-2 w-80 overflow-hidden"><ProgressIndicator class="h-full w-full transition-transform bg-foreground" /></ProgressTrack></ProgressRoot>`;
    return `<section dir="${dir}" data-copies="${dir}">${edited}${custom}</section>`;
  });
  return sections.join("");
}

export const cases: DirectionCase[] = rows.map((row) => ({
  id: `${row}-paint-styled`,
  row,
  acceptance: [
    "SPEC-AC-02",
    "SPEC-AC-03",
    "SPEC-AC-04",
    row === "switch" ? "SPEC-AC-08" : "SPEC-AC-09",
    "SPEC-AC-14",
  ],
  fixtures: Object.fromEntries(
    TARGETS.map((target) => [
      target,
      {
        source: source(row, target),
        ssr: target !== "astro",
        exports: [row === "switch" ? "Switch" : "Progress"],
        assertions,
      },
    ]),
  ),
}));

async function measure(page: Page, row: Row) {
  const samples = await page.locator("[data-example]").evaluateAll(
    (elements, row) =>
      elements.map((element) => {
        const track = element.querySelector<HTMLElement>(
          row === "switch" ? "[data-slot=switch-button]" : "[data-slot=progress-track]",
        )!;
        const part = track.querySelector<HTMLElement>(
          row === "switch" ? "[data-slot=switch-toggle]" : "[data-slot=progress-indicator]",
        )!;
        const t = track.getBoundingClientRect(),
          raw = part.getBoundingClientRect();
        // A Progress fill is translated inside a clipping track, so only its visible part counts.
        const left = row === "progress" ? Math.max(t.left, raw.left) : raw.left;
        const right = row === "progress" ? Math.min(t.right, raw.right) : raw.right;
        const p = {
          left,
          right,
          top: raw.top,
          bottom: raw.bottom,
          width: Math.max(0, right - left),
        };
        const dir = getComputedStyle(track).direction;
        const label = element.querySelector<HTMLLabelElement>("label");
        const l = label?.getBoundingClientRect();
        return {
          id: element.getAttribute("data-example")!,
          scope: element.closest("[data-scope]")!.getAttribute("data-scope"),
          dir,
          start: dir === "rtl" ? t.right - p.right : p.left - t.left,
          end: dir === "rtl" ? p.left - t.left : t.right - p.right,
          top: p.top - t.top,
          bottom: t.bottom - p.bottom,
          width: p.width,
          trackWidth: t.width,
          checked: track.getAttribute("aria-checked"),
          disabled: track.hasAttribute("disabled"),
          label: label?.htmlFor ?? null,
          labelGap: l ? (dir === "rtl" ? t.left - l.right : l.left - t.right) : null,
          border: Number.parseFloat(getComputedStyle(track).borderLeftWidth),
          native: track.tagName === "BUTTON",
          transform: part.style.transform,
          scale: getComputedStyle(track).scale,
          indeterminate:
            element.querySelector("[data-slot=progress]")?.hasAttribute("data-indeterminate") ??
            null,
        };
      }),
    row,
  );
  assert.equal(samples.length, row === "switch" ? 30 : 35);
  for (const s of samples) {
    const close = (a: number, b: number) =>
      assert(Math.abs(a - b) <= 1, `${s.id}: expected ${b} got ${a}`);
    assert.equal(s.dir, ["ordinary", "nested-ltr"].includes(s.scope!) ? "ltr" : "rtl", s.id);
    if (row === "switch") {
      const [, size, checked] = s.id.match(/-(sm|md|lg)-(true|false)$/)!;
      const padding = size === "sm" ? 2.5 : size === "md" ? 3 : 5;
      assert.equal(s.checked, checked, s.id);
      close(checked === "true" ? s.end : s.start, padding);
      assert.equal(s.border, size === "lg" ? 2 : 1);
      close(s.top, padding);
      close(s.bottom, padding);
      close(s.width, size === "sm" ? 16 : size === "md" ? 20 : 24);
      assert(s.start >= 0 && s.end >= 0);
      assert.equal(s.native, true);
      assert.equal(s.label, s.id);
      close(s.labelGap!, 8);
      assert.equal(s.disabled, size === "sm" && checked === "true");
    } else {
      const value = s.id.split("-").at(-1)!;
      assert.equal(s.indeterminate, value === "null");
      assert(s.trackWidth >= 300);
      close(s.start, 0);
      close(s.width, s.trackWidth * (value === "null" ? 0.75 : Math.round(Number(value)) / 100));
      // The Styled track mirrors in RTL so the released physical transform fills from the right.
      assert.equal(s.scale, s.dir === "rtl" ? "-1 1" : "none", s.id);
      if (value === "null") assert.equal(s.transform, "", s.id);
      else close(translatePercent(s.transform), Math.round(Number(value)) - 100);
    }
  }
  return samples;
}

function translatePercent(transform: string) {
  const match = transform.match(/^translateX\((-?[\d.]+)%\)$/);
  assert(match, `expected a percentage translateX, got ${transform}`);
  return Number(match[1]);
}

async function measureCopies(page: Page, kinds: string[], value = 30) {
  const samples = await page.locator("[data-copy]").evaluateAll((roots) =>
    roots.map((root) => {
      const track = root.firstElementChild as HTMLElement;
      const part = track.firstElementChild as HTMLElement;
      const t = track.getBoundingClientRect(),
        p = part.getBoundingClientRect();
      const left = Math.max(t.left, p.left),
        right = Math.min(t.right, p.right);
      return {
        id: root.getAttribute("data-copy")!,
        dir: getComputedStyle(track).direction,
        width: Math.max(0, right - left),
        trackWidth: t.width,
        leftGap: left - t.left,
        rightGap: t.right - right,
        transform: part.style.transform,
        status: root.getAttribute("data-status"),
      };
    }),
  );
  const checked = samples.filter((s) => kinds.some((kind) => s.id.startsWith(kind)));
  assert.equal(checked.length, kinds.length * 2);
  for (const s of checked) {
    assert.equal(s.dir, s.id.endsWith("rtl") ? "rtl" : "ltr", s.id);
    assert(s.trackWidth >= 300, s.id);
    assert(Math.abs(s.width - (s.trackWidth * value) / 100) <= 1, JSON.stringify(s));
    // Consumer markup has no mirror class, so it keeps the released physical left anchor.
    assert(Math.abs(s.leftGap) <= 1, JSON.stringify(s));
    close1(translatePercent(s.transform), value - 100, s.id);
  }
  return samples;
}

function close1(a: number, b: number, id: string) {
  assert(Math.abs(a - b) <= 1, `${id}: expected ${b} got ${a}`);
}

async function liveSwitch(page: Page, reduced: boolean, size: "sm" | "md" | "lg") {
  const form = page.locator(`[data-example=ordinary-${size}-false]`);
  const samples = await form.evaluate(async (node: HTMLFormElement) => {
    const button = node.querySelector("button")!;
    const thumb = button.querySelector<HTMLElement>("[data-slot=switch-toggle]")!;
    button.click();
    const frames = [];
    for (let i = 0; i < 120; i++) {
      await new Promise(requestAnimationFrame);
      if (i === 2) node.dir = "rtl";
      const t = button.getBoundingClientRect(),
        p = thumb.getBoundingClientRect();
      const style = getComputedStyle(thumb);
      frames.push({
        border: Number.parseFloat(getComputedStyle(button).borderLeftWidth),
        ltr: getComputedStyle(button).direction === "ltr",
        left: p.left - t.left,
        right: t.right - p.right,
        offset: Number.parseFloat(style.getPropertyValue("--sw-switch-thumb-offset")),
        transition: style.transitionProperty,
      });
      if (i >= 3 && thumb.getAnimations().length === 0) break;
    }
    const value = new FormData(node).get("toggle");
    node.removeAttribute("dir");
    node.reset();
    return { frames, value };
  });
  assert.equal(samples.value, "yes");
  for (const frame of samples.frames) {
    assert(frame.left >= 0 && frame.right >= 0, JSON.stringify(frame));
    assert(
      Math.abs((frame.ltr ? frame.left : frame.right) - frame.border - frame.offset) <= 1,
      JSON.stringify(frame),
    );
  }
  const last = samples.frames.at(-1)!;
  assert(Math.abs(last.left - (size === "sm" ? 2.5 : size === "lg" ? 5 : 3)) <= 1);
  assert.equal(last.transition, reduced ? "none" : "--sw-switch-thumb-offset");
  await page.waitForFunction(
    (id) => document.getElementById(id)?.getAttribute("aria-checked") === "false",
    `ordinary-${size}-false`,
  );
  await form
    .locator("[data-slot=switch-toggle]")
    .evaluate((node) => Promise.all(node.getAnimations().map((a) => a.finished)));
  return samples;
}

async function switchCommands(page: Page) {
  const disabled = page.locator("#ordinary-sm-true");
  const disabledInput = await disabled.evaluate((node: HTMLButtonElement) => {
    node.closest("form")!.dir = "rtl";
    node.click();
    const checked = node.getAttribute("aria-checked");
    const value = new FormData(node.closest("form")!).get("toggle");
    const edge =
      node.querySelector("[data-slot=switch-toggle]")!.getBoundingClientRect().left -
      node.getBoundingClientRect().left;
    node.closest("form")!.removeAttribute("dir");
    return { checked, value, edge };
  });
  assert.equal(disabledInput.checked, "true");
  assert.equal(disabledInput.value, null);
  assert(Math.abs(disabledInput.edge - 2.5) <= 1);
  const owned = page.locator("#ordinary-lg-true");
  const rejected = await owned.evaluate((node: HTMLButtonElement) => {
    let events = 0;
    node.addEventListener(
      "starwind:checked-change",
      (event) => {
        events++;
        event.preventDefault();
      },
      { once: true },
    );
    node.click();
    node.closest("form")!.dir = "rtl";
    return { events, checked: node.getAttribute("aria-checked") };
  });
  assert.deepEqual(rejected, { events: 1, checked: "true" });
  const commands = [];
  for (const value of [false, true]) {
    await page.locator("#command").click();
    await page.waitForFunction(
      (expected) =>
        document.getElementById("ordinary-lg-true")!.getAttribute("aria-checked") ===
        String(expected),
      value,
    );
    const state = await owned.evaluate(async (node: HTMLButtonElement) => {
      const thumb = node.querySelector<HTMLElement>("[data-slot=switch-toggle]")!;
      await Promise.all(thumb.getAnimations().map((a) => a.finished));
      const r = node.getBoundingClientRect(),
        p = thumb.getBoundingClientRect();
      return {
        left: p.left - r.left,
        right: r.right - p.right,
        checked: node.getAttribute("aria-checked"),
        value: new FormData(node.closest("form")!).get("toggle"),
      };
    });
    assert.equal(state.value, value ? "yes" : "no");
    assert(Math.abs((value ? state.left : state.right) - 5) <= 1);
    commands.push(state);
  }
  await owned.evaluate((node) => node.closest("form")!.removeAttribute("dir"));
  return { disabledInput, rejected, commands };
}

async function settleCopies(page: Page) {
  await page.locator("[data-copy]").evaluateAll(async (roots) => {
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await Promise.all(
      roots.flatMap((root) => root.getAnimations({ subtree: true }).map((a) => a.finished)),
    );
  });
}

async function liveProgress(page: Page, reduced: boolean) {
  const root = page.locator("[data-example=ordinary-25] [data-slot=progress]");
  const observations = [];
  for (const ratio of [75, null, 0, 100, 25]) {
    await root.evaluate((node, ratio) => {
      node.setAttribute("dir", ratio === 100 ? "ltr" : "rtl");
      node.toggleAttribute("data-indeterminate", ratio === null);
      if (ratio === null) node.removeAttribute("data-value");
      else node.setAttribute("data-value", String(ratio + 10));
    }, ratio);
    const result = await root.evaluate(async (node, ratio) => {
      const part = node.querySelector<HTMLElement>("[data-slot=progress-indicator]")!;
      await new Promise(requestAnimationFrame);
      // Measure only the visible part of the translated fill inside the clipping root.
      const firstTrack = node.getBoundingClientRect(),
        firstFill = part.getBoundingClientRect();
      const firstGap =
        ratio === 100
          ? Math.max(firstTrack.left, firstFill.left) - firstTrack.left
          : firstTrack.right - Math.min(firstTrack.right, firstFill.right);
      const transition = getComputedStyle(part).transitionProperty;
      await Promise.all(part.getAnimations().map((a) => a.finished));
      const r = node.getBoundingClientRect(),
        p = part.getBoundingClientRect();
      const left = Math.max(r.left, p.left),
        right = Math.min(r.right, p.right);
      return {
        value: node.getAttribute("aria-valuenow"),
        width: Math.max(0, right - left),
        track: r.width,
        firstGap,
        gap: ratio === 100 ? left - r.left : r.right - right,
        transition,
      };
    }, ratio);
    assert.equal(result.value, ratio === null ? null : String(ratio + 10));
    // Only attributes change here, so the null step keeps the determinate full-width classes.
    assert(
      Math.abs(result.width - (result.track * (ratio ?? 100)) / 100) <= 1,
      JSON.stringify(result),
    );
    assert(Math.abs(result.firstGap) <= 1 && Math.abs(result.gap) <= 1);
    if (reduced) assert.equal(result.transition, "none");
    observations.push(result);
  }
  await root.evaluate((node) => node.removeAttribute("dir"));
  return observations;
}

const paintExpectations: DirectionExpectation[] = rows.map((row) => ({
  id: `${row}-paint-styled`,
  layer: "styled",
  async run(page, _target, ctx) {
    const selector =
      row === "switch" ? "[data-slot=switch-toggle]" : "[data-slot=progress-indicator]";
    const disabled = await page.context().browser()!.newContext({ javaScriptEnabled: false });
    try {
      await ctx.check(assertions[0]!, async () => {
        const staticPage = await disabled.newPage();
        const response = await staticPage.goto(page.url());
        assert(
          (await response!.text()).includes(
            row === "switch" ? 'data-slot="switch-toggle"' : 'data-slot="progress-indicator"',
          ),
        );
        ctx.observe("disabled", await measure(staticPage, row));
        if (row === "progress")
          ctx.observe("disabled-copies", await measureCopies(staticPage, ["edited"]));
      });
    } finally {
      await disabled.close();
    }
    await page.route(page.url(), async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replaceAll(/<script\b[^>]*>/gi, (tag) =>
          tag.replace(/type="module"/, 'type="application/x-held-module"'),
        ),
      });
    });
    await page.reload();
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const originals = await page.locator(selector).elementHandles();
    await ctx.check(assertions[1]!, async () => {
      assert(await page.locator('script[type="application/x-held-module"]').count());
      ctx.observe("first", await measure(page, row));
      if (row === "progress") ctx.observe("first-copies", await measureCopies(page, ["edited"]));
    });
    await page.evaluate(() => {
      for (const held of document.querySelectorAll<HTMLScriptElement>(
        'script[type="application/x-held-module"]',
      )) {
        const script = document.createElement("script");
        for (const attr of held.attributes) script.setAttribute(attr.name, attr.value);
        script.type = "module";
        script.textContent = held.textContent;
        held.replaceWith(script);
      }
    });
    await ctx.check(assertions[2]!, async () => {
      await page
        .locator(
          row === "switch" ? "button[aria-disabled=true]" : "[data-slot=progress][data-status]",
        )
        .first()
        .waitFor({ timeout: 5000 });
      for (const original of originals) assert(await original.evaluate((node) => node.isConnected));
      ctx.observe("hydrated", await measure(page, row));
      if (row === "progress") {
        await page.waitForFunction(
          () => document.querySelectorAll("[data-copy][data-status]").length === 4,
          undefined,
          { timeout: 5000 },
        );
        await settleCopies(page);
        ctx.observe("hydrated-copies", await measureCopies(page, ["edited", "custom"]));
      }
    });
    await ctx.check(assertions[3]!, async () => {
      for (const reduced of [false, true]) {
        await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
        ctx.observe(
          reduced ? "reduced" : "standard",
          row === "switch"
            ? {
                sm: await liveSwitch(page, reduced, "sm"),
                md: await liveSwitch(page, reduced, "md"),
                lg: await liveSwitch(page, reduced, "lg"),
                controls: await switchCommands(page),
              }
            : await liveProgress(page, reduced),
        );
      }
      if (row === "progress") {
        await page.emulateMedia({ reducedMotion: "no-preference" });
        await page
          .locator("[data-copy]")
          .evaluateAll((roots) => roots.forEach((root) => root.setAttribute("data-value", "60")));
        await settleCopies(page);
        ctx.observe("live-copies", await measureCopies(page, ["edited", "custom"], 60));
      }
      ctx.observe("restored", await measure(page, row));
    });
  },
}));

export const expectations = paintExpectations.map((expectation) =>
  withFirstPaintParity(expectation, "status", ["disabled", "first", "hydrated"]),
);
