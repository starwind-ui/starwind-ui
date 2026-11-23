import assert from "node:assert/strict";

import type { DirectionCase, DirectionExpectation, Target } from "../../inventory.js";

const families = [
  { row: "dropdown", name: "Dropdown", open: "click" },
  { row: "context-menu", name: "ContextMenu", open: "contextmenu" },
] as const;

function markup(name: string, target: Target): string {
  const modal = target === "vue" ? ':modal="false"' : "modal={false}";
  const collisions = target === "vue" ? ':avoid-collisions="false"' : "avoidCollisions={false}";
  const style =
    target === "react"
      ? 'style={{ position: "fixed", left: 450, top: 100, width: 200 }}'
      : 'style="position:fixed;left:450px;top:100px;width:200px"';
  return `<div data-direction-scope="ordinary-rtl" data-menu-scope dir="rtl" ${style}>
    <${name} ${modal}>
      <${name}Trigger data-menu-trigger>Open menu</${name}Trigger>
      <${name}Content ${collisions}>
        <${name}Sub>
          <${name}SubTrigger data-branch-trigger="implicit">Implicit child</${name}SubTrigger>
          <${name}SubContent data-branch-content="implicit" dir="ltr" ${collisions}>
            <${name}Item>First child</${name}Item>
          </${name}SubContent>
        </${name}Sub>
        <${name}Sub>
          <${name}SubTrigger data-branch-trigger="explicit">Explicit child</${name}SubTrigger>
          <${name}SubContent data-branch-content="explicit" side="right" ${collisions}>
            <${name}Item>Second child</${name}Item>
          </${name}SubContent>
        </${name}Sub>
      </${name}Content>
    </${name}>
  </div>`;
}

function source(row: string, name: string, target: Target): string {
  const imports = `import { ${[name, `${name}Trigger`, `${name}Content`, `${name}Sub`, `${name}SubTrigger`, `${name}SubContent`, `${name}Item`].join(", ")} } from "@direction/styled-${target}/${row}";\nimport "@direction/sheet";`;
  const body = markup(name, target);
  if (target === "astro") {
    return `---\n${imports}\n---\n<html dir="ltr"><body>${body}</body></html>`;
  }
  if (target === "react") {
    return `import { createRoot } from "react-dom/client";\n${imports}\ncreateRoot(document.getElementById("app")!).render(${body});`;
  }
  if (target === "vue") {
    return `<script setup lang="ts">\n${imports}\n</script>\n<template>${body}</template>`;
  }
  return `<script lang="ts">\n${imports}\n</script>\n${body}`;
}

export const cases: DirectionCase[] = families.map(({ row, name }) => ({
  id: `menu-branches-${row}`,
  row,
  acceptance: ["SPEC-AC-04", "SPEC-AC-05", "SPEC-AC-06", "SPEC-AC-11"],
  physicalExceptions: ["An explicit submenu side and resolved data-side retain physical meaning."],
  fixtures: Object.fromEntries(
    (["astro", "react", "vue", "svelte"] as const).map((target) => [
      target,
      {
        source: source(row, name, target),
        exports: [
          name,
          `${name}Trigger`,
          `${name}Content`,
          `${name}Sub`,
          `${name}SubTrigger`,
          `${name}SubContent`,
          `${name}Item`,
        ],
        assertions: ["side-intent-before-measurement", "owner-keys-and-live-default"],
      },
    ]),
  ),
}));

export const expectations: DirectionExpectation[] = families.map(({ row, open }) => ({
  id: `menu-branches-${row}`,
  layer: "styled",
  async run(page, target, ctx) {
    const scope = page.locator("[data-menu-scope]");
    const root = page
      .locator(row === "dropdown" ? "[data-sw-menu]" : "[data-sw-context-menu]")
      .first();
    const trigger = page.locator("[data-menu-trigger]");
    const implicit = page.locator('[data-branch-content="implicit"]');
    const explicit = page.locator('[data-branch-content="explicit"]');
    await root.waitFor();

    await ctx.check("side-intent-before-measurement", async () => {
      const observation = {
        implicitIntent: await implicit.getAttribute("data-sw-menu-side-intent"),
        explicitIntent: await explicit.getAttribute("data-sw-menu-side-intent"),
        implicitSide: await implicit.getAttribute("data-side"),
      };
      ctx.observe("initialSideIntent", observation);
      assert.equal(observation.implicitIntent, "", `${target} omitted side must stay omitted`);
      assert.equal(
        observation.explicitIntent,
        "right",
        `${target} explicit side must remain physical`,
      );
      assert.equal(
        observation.implicitSide,
        "left",
        `${target} implicit side starts at the RTL owner's inline end before opening`,
      );
    });

    await ctx.check("owner-keys-and-live-default", async () => {
      if (open === "click") await trigger.click();
      else await trigger.dispatchEvent("contextmenu", { clientX: 500, clientY: 120 });
      await page.locator('[data-branch-trigger="implicit"]').focus();
      await page.keyboard.press("ArrowLeft");
      await implicit.waitFor({ state: "visible" });
      await page.waitForFunction(
        () =>
          document.querySelector('[data-branch-content="implicit"]')?.getAttribute("data-side") ===
          "left",
      );
      const first = {
        side: await implicit.getAttribute("data-side"),
        surfaceDir: await implicit.evaluate((element) => getComputedStyle(element).direction),
        ownerDir: await root.evaluate((element) => getComputedStyle(element).direction),
      };
      await scope.evaluate((element) => {
        (element as HTMLElement).dir = "ltr";
        element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
      });
      await page.waitForFunction(
        () =>
          document.querySelector('[data-branch-content="implicit"]')?.getAttribute("data-side") ===
          "right",
      );
      const afterFlip = await implicit.getAttribute("data-side");
      await implicit.press("ArrowLeft");
      const closed = await implicit.getAttribute("data-state");
      await page.locator('[data-branch-trigger="explicit"]').focus();
      await page.keyboard.press("ArrowRight");
      await explicit.waitFor({ state: "visible" });
      const explicitSide = await explicit.getAttribute("data-side");
      await scope.evaluate((element) => {
        (element as HTMLElement).dir = "rtl";
        element.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
      });
      await page.waitForFunction(
        () =>
          document.querySelector('[data-branch-content="explicit"]')?.getAttribute("data-side") ===
          "right",
      );
      await explicit.evaluate((element) => element.setAttribute("data-sw-menu-side-intent", ""));
      await page.waitForFunction(
        () =>
          document.querySelector('[data-branch-content="explicit"]')?.getAttribute("data-side") ===
          "left",
      );
      const clearedSide = await explicit.getAttribute("data-side");
      await explicit.press("ArrowRight");
      await page.locator('[data-branch-trigger="explicit"]').focus();
      await page.keyboard.press("ArrowLeft");
      await explicit.waitFor({ state: "visible" });
      const reopenedSide = await explicit.getAttribute("data-side");
      ctx.observe("branchDirection", {
        first,
        afterFlip,
        closed,
        explicitSide,
        clearedSide,
        reopenedSide,
      });
      assert.deepEqual(first, { side: "left", surfaceDir: "ltr", ownerDir: "rtl" });
      assert.equal(afterFlip, "right");
      assert.equal(closed, "closed");
      assert.equal(explicitSide, "right");
      assert.equal(clearedSide, "left");
      assert.equal(reopenedSide, "left");
    });
  },
}));
