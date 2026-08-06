import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import {
  CONTROL_GROUPS,
  CONTROL_OUTPUT_FILES,
} from "../styled-contracts/vue-portable-styled-controls.test.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATABLE_CONTROL_GROUPS = [
  "button-group",
  "input-group",
  "native-select",
  "textarea",
] as const;
const roots: string[] = [];

describe("generated Vue portable Styled control groups", () => {
  afterEach(async () => {
    await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
  });

  it("generates the exact public files and compiler-valid SFCs before Pagination", async () => {
    const outputRoot = await generateControls(GENERATABLE_CONTROL_GROUPS);

    for (const group of GENERATABLE_CONTROL_GROUPS) {
      expect((await readdir(path.join(outputRoot, group))).sort()).toEqual(
        [...CONTROL_OUTPUT_FILES[group]].sort(),
      );
      for (const file of CONTROL_OUTPUT_FILES[group].filter((name) => name.endsWith(".vue"))) {
        const source = await read(outputRoot, `${group}/${file}`);
        expect(() => assertVueSfcCompiles(source, `${group}/${file}`)).not.toThrow();
      }
    }
  });

  it("keeps lazy slots and established Input Group composition", async () => {
    const outputRoot = await generateControls(GENERATABLE_CONTROL_GROUPS);
    const buttonGroup = await read(outputRoot, "button-group/ButtonGroup.vue");
    const nativeSelect = await read(outputRoot, "native-select/NativeSelect.vue");
    const inputButton = await read(outputRoot, "input-group/InputGroupButton.vue");
    const input = await read(outputRoot, "input-group/InputGroupInput.vue");
    const textarea = await read(outputRoot, "input-group/InputGroupTextarea.vue");

    expect(buttonGroup).toContain('"default"?: () => unknown;');
    expect(buttonGroup).toContain("<slot />");
    expect(nativeSelect).toContain('"icon"?: () => unknown;');
    expect(nativeSelect).toContain('<slot name="icon">');
    expect(inputButton).toContain('import { Button } from "../button";');
    expect(inputButton).toContain("<Button");
    expect(input).toContain('import { Input } from "../input";');
    expect(input).toContain('data-slot="input-group-control"');
    expect(textarea).toContain('import { Textarea } from "../textarea";');
    expect(textarea).toContain('data-slot="input-group-control"');
  });

  it("forwards attrs and native listeners once to each generated semantic control", async () => {
    const outputRoot = await generateControls(GENERATABLE_CONTROL_GROUPS);
    const inputButton = await read(outputRoot, "input-group/InputGroupButton.vue");
    const input = await read(outputRoot, "input-group/InputGroupInput.vue");
    const inputTextarea = await read(outputRoot, "input-group/InputGroupTextarea.vue");
    const nativeSelect = await read(outputRoot, "native-select/NativeSelect.vue");
    const option = await read(outputRoot, "native-select/NativeSelectOption.vue");
    const optgroup = await read(outputRoot, "native-select/NativeSelectOptGroup.vue");
    const textarea = await read(outputRoot, "textarea/Textarea.vue");

    assertSingleAttrsBinding(inputButton, "Button");
    assertSingleAttrsBinding(input, "Input");
    assertSingleAttrsBinding(inputTextarea, "Textarea");
    assertSingleAttrsBinding(nativeSelect, "select");
    expect(openingTag(nativeSelect, "div")).not.toContain("v-bind=");
    assertSingleAttrsBinding(option, "option");
    assertSingleAttrsBinding(optgroup, "optgroup");
    assertSingleAttrsBinding(textarea, "textarea");

    expect(openingTag(inputButton, "Button")).toContain(':type="type"');
    expect(input).toContain('data-slot="input-group-control"');
    expect(inputTextarea).toContain('data-slot="input-group-control"');
    expect(openingTag(nativeSelect, "select")).toContain('data-slot="native-select"');
    expect(openingTag(textarea, "textarea")).toContain("data-sw-textarea");
    expect(openingTag(textarea, "textarea")).toContain(':data-slot="dataSlot"');
  });

  it("renders Pagination composition and semantic attrs through the generic projector", () => {
    const sources = Object.fromEntries(
      [
        "Pagination",
        "PaginationContent",
        "PaginationItem",
        "PaginationLink",
        "PaginationNext",
        "PaginationPrevious",
      ].map((exportName) => [exportName, renderPagination(exportName)]),
    );

    for (const [exportName, source] of Object.entries(sources)) {
      expect(() => assertVueSfcCompiles(source, `pagination/${exportName}.vue`)).not.toThrow();
    }

    assertSingleAttrsBinding(sources.Pagination!, "nav");
    expect(openingTag(sources.Pagination!, "nav")).toContain('role="navigation"');
    expect(openingTag(sources.Pagination!, "nav")).toContain('aria-label="pagination"');
    expect(openingTag(sources.Pagination!, "nav")).toContain('data-slot="pagination"');
    expect(sources.PaginationLink).toContain('import { Button } from "../button";');
    const paginationLinkButton = componentBlock(sources.PaginationLink!, "Button");
    expect(paginationLinkButton).toContain('as="a"');
    expect(paginationLinkButton).toContain(':data-slot="dataSlot"');
    expect(sources.PaginationNext).toContain('import PaginationLink from "./PaginationLink.vue";');
    expect(sources.PaginationPrevious).toContain(
      'import PaginationLink from "./PaginationLink.vue";',
    );
    expect(sources.PaginationNext).toContain('<slot name="icon">');
    expect(sources.PaginationPrevious).toContain('<slot name="icon">');
  });

  it("generates Pagination after shared Dots asset facts are available", async () => {
    await generateControls(["pagination"]);
  });
});

async function generateControls(groups: readonly (typeof CONTROL_GROUPS)[number][]) {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-controls-"));
  roots.push(root);
  return generateSelectedVueStyledGroups({ groups, outputDir: "styled", repoRoot: root });
}

function renderPagination(exportName: string): string {
  const contract = starwindStyledContracts.find(({ component }) => component === "pagination");
  if (!contract) throw new TypeError("Missing Styled pagination contract.");
  const group = projectStyledOutputComponentGroup(contract);
  const component = group.components.find((candidate) => candidate.exportName === exportName);
  if (!component) throw new TypeError(`Missing pagination.${exportName}.`);
  return renderVueComponent(group, component, {
    directory: "/tmp/styled/pagination",
    outputRoot: "/tmp/styled",
    primitiveOutputRoot: "/tmp/primitives",
  });
}

function assertSingleAttrsBinding(source: string, tag: string): void {
  expect(source.match(/\bv-bind=/g), source).toHaveLength(1);
  expect(openingTag(source, tag)).toContain("v-bind=");
}

function openingTag(source: string, tag: string): string {
  const match = source.match(new RegExp(`<${tag}\\b[\\s\\S]*?>`));
  if (!match) throw new TypeError(`Missing <${tag}> opening tag.`);
  return match[0];
}

function componentBlock(source: string, tag: string): string {
  const match = source.match(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`));
  if (!match) throw new TypeError(`Missing <${tag}> component block.`);
  return match[0];
}

function read(root: string, file: string): Promise<string> {
  return readFile(path.join(root, file), "utf8");
}
