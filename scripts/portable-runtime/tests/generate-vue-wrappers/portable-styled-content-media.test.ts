import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { escapeVueAttribute } from "../../renderers/framework-adapters/vue/styled/render-tree.js";
import "../styled-contracts/vue-portable-styled-content-media.test.js";
import { EXPECTED_ELEMENT_TARGETS } from "../styled-contracts/vue-portable-styled-content-media.test.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GROUPS = ["breadcrumb", "card", "item", "prose", "table", "video"] as const;
const roots: string[] = [];

const EXPECTED_FILES = [
  "breadcrumb/Breadcrumb.vue",
  "breadcrumb/BreadcrumbEllipsis.vue",
  "breadcrumb/BreadcrumbItem.vue",
  "breadcrumb/BreadcrumbLink.vue",
  "breadcrumb/BreadcrumbList.vue",
  "breadcrumb/BreadcrumbPage.vue",
  "breadcrumb/BreadcrumbSeparator.vue",
  "breadcrumb/index.ts",
  "breadcrumb/variants.ts",
  "card/Card.vue",
  "card/CardAction.vue",
  "card/CardContent.vue",
  "card/CardDescription.vue",
  "card/CardFooter.vue",
  "card/CardHeader.vue",
  "card/CardTitle.vue",
  "card/index.ts",
  "card/variants.ts",
  "item/Item.vue",
  "item/ItemActions.vue",
  "item/ItemContent.vue",
  "item/ItemDescription.vue",
  "item/ItemFooter.vue",
  "item/ItemGroup.vue",
  "item/ItemHeader.vue",
  "item/ItemMedia.vue",
  "item/ItemSeparator.vue",
  "item/ItemTitle.vue",
  "item/index.ts",
  "item/variants.ts",
  "prose/Prose.vue",
  "prose/index.ts",
  "prose/styles.css",
  "prose/variants.ts",
  "separator/Separator.vue",
  "separator/index.ts",
  "separator/variants.ts",
  "table/Table.vue",
  "table/TableBody.vue",
  "table/TableCaption.vue",
  "table/TableCell.vue",
  "table/TableFoot.vue",
  "table/TableHead.vue",
  "table/TableHeader.vue",
  "table/TableRow.vue",
  "table/index.ts",
  "table/variants.ts",
  "video/Video.vue",
  "video/index.ts",
  "video/variants.ts",
].sort();

describe("generated Vue portable Styled content and media groups", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("generates the exact public file inventories and compiler-valid SFCs", async () => {
    const outputRoot = await generateGroups();
    const files = await listGeneratedFiles(outputRoot);

    expect(files).toEqual(EXPECTED_FILES);
    const proseStyles = await readFile(path.join(outputRoot, "prose/styles.css"), "utf8");
    expect(proseStyles).toContain("var(--foreground)");
    expect(proseStyles).not.toContain("var(--color-");
    for (const file of files.filter((candidate) => candidate.endsWith(".vue"))) {
      const source = await readFile(path.join(outputRoot, file), "utf8");
      expect(() => assertVueSfcCompiles(source, file)).not.toThrow();
      assertExpectedElementExposure(source, file);
    }
  });

  it("keeps Video branch semantics separate in generated Vue output", async () => {
    const outputRoot = await generateGroups(["video"]);
    const files = await listGeneratedFiles(outputRoot);
    expect(files).toContain("video/Video.vue");
    if (!files.includes("video/Video.vue")) return;
    const source = await readFile(path.join(outputRoot, "video/Video.vue"), "utf8");
    const native = extractConditionalBranch(source, 'videoType === "native" || !embedUrl', "if");
    const iframe = extractConditionalBranch(source, 'videoType === "native" || !embedUrl', "else");

    expect(readOpeningTag(native, "video")).toEqual(
      expect.stringContaining(':autoplay="autoplay"'),
    );
    expect(readOpeningTag(native, "video")).toEqual(expect.stringContaining('v-bind="attrs"'));
    expect(readOpeningTag(native, "video")).toEqual(expect.stringContaining('ref="element"'));
    expect(readOpeningTag(native, "video")).toEqual(expect.stringContaining('data-slot="video"'));
    expect(readOpeningTag(native, "track")).toEqual(expect.stringContaining('kind="captions"'));

    expect(readOpeningTag(iframe, "iframe")).toEqual(expect.stringContaining(':srcdoc="srcdoc"'));
    expect(readOpeningTag(iframe, "iframe")).toEqual(
      expect.stringContaining('referrerpolicy="strict-origin-when-cross-origin"'),
    );
    expect(readOpeningTag(iframe, "iframe")).toEqual(expect.stringContaining("allowfullscreen"));
    expect(readOpeningTag(iframe, "iframe")).toEqual(expect.stringContaining('v-bind="attrs"'));
    expect(readOpeningTag(iframe, "iframe")).toEqual(expect.stringContaining('ref="element"'));
    expect(readOpeningTag(iframe, "iframe")).toEqual(expect.stringContaining('data-slot="video"'));
  });

  it("extracts v-if and v-else branches after Vue attribute escaping", () => {
    const source = `<template>
  <template v-if="videoType === &quot;native&quot; || !embedUrl"><video /></template>
  <template v-else><iframe /></template>
</template>`;

    expect(extractConditionalBranch(source, 'videoType === "native" || !embedUrl', "if")).toContain(
      "<video />",
    );
    expect(
      extractConditionalBranch(source, 'videoType === "native" || !embedUrl', "else"),
    ).toContain("<iframe />");
  });
});

async function generateGroups(groups: readonly string[] = GROUPS): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-content-media-"));
  roots.push(root);
  return generateSelectedVueStyledGroups({
    groups,
    outputDir: "styled",
    repoRoot: root,
  });
}

async function listGeneratedFiles(root: string, prefix = ""): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw error;
  }
  const files = await Promise.all(
    entries.map(async (entry) => {
      const relative = path.posix.join(prefix.replaceAll("\\", "/"), entry.name);
      if (entry.isDirectory()) return listGeneratedFiles(root, relative);
      return entry.isFile() ? [relative] : [];
    }),
  );
  return files.flat().sort();
}

function extractConditionalBranch(
  source: string,
  condition: string,
  branch: "else" | "if",
): string {
  const escapedCondition = escapeRegularExpression(escapeVueAttribute(condition));
  const pattern =
    branch === "if"
      ? new RegExp(`<template v-if="${escapedCondition}">([\\s\\S]*?)</template>`)
      : new RegExp(
          `<template v-if="${escapedCondition}">[\\s\\S]*?</template>\\s*<template v-else>([\\s\\S]*?)</template>`,
        );
  const match = source.match(pattern);
  if (!match?.[1]) throw new TypeError(`Missing Video ${branch} branch.`);
  return match[1];
}

function assertExpectedElementExposure(source: string, file: string): void {
  const [group, name] = file.split("/");
  const exportName = name?.replace(/\.vue$/, "");
  const targets = group
    ? EXPECTED_ELEMENT_TARGETS[group as keyof typeof EXPECTED_ELEMENT_TARGETS]
    : undefined;
  const target = targets && exportName ? targets[exportName as keyof typeof targets] : undefined;

  if (target === undefined) return;
  if (target === null) {
    expect(source, file).not.toContain("defineExpose({ element });");
    expect(source, file).not.toMatch(/\b(?:ref|:ref)=\"(?:element|setElement)\"/);
    return;
  }

  expect(source, file).toContain("defineExpose({ element });");
  expect(source, file).toMatch(/\b(?:ref|:ref)=\"(?:element|setElement)\"/);
}

function readOpeningTag(source: string, tag: string): string {
  const match = source.match(new RegExp(`<${tag}\\b([\\s\\S]*?)(?:/?)>`));
  if (!match) throw new TypeError(`Missing <${tag}> in expected Video branch.`);
  return match[0];
}

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
