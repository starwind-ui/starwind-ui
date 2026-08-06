import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { comboboxStyledContract } from "../../contracts/styled/components/combobox.js";
import { contextMenuStyledContract } from "../../contracts/styled/components/context-menu.js";
import { dropdownStyledContract } from "../../contracts/styled/components/dropdown.js";
import { hoverCardStyledContract } from "../../contracts/styled/components/hover-card.js";
import { navigationMenuStyledContract } from "../../contracts/styled/components/navigation-menu.js";
import { tooltipStyledContract } from "../../contracts/styled/components/tooltip.js";
import { renderIndex } from "../../renderers/framework-adapters/vue/styled/index-output.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { renderVariants } from "../../renderers/framework-adapters/vue/styled/variants.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const FIXTURE_ROOT = path.join(
  process.cwd(),
  "scripts/portable-runtime/tests/generate-vue-wrappers/fixtures/styled-public-contract",
);
const VUE_TSC_TIMEOUT_MS = 30_000;
const MENUS_FLOATING_FIXTURES = [
  ["Tooltip open model", "invalid-tooltip-open-model.vue", /string.*boolean/s],
  ["Hover Card open event", "invalid-hover-card-open-event.vue", /PreviewCardOpenChangeDetails/],
  ["Dropdown open model", "invalid-dropdown-open-model.vue", /string.*boolean/s],
  [
    "Context Menu open event",
    "invalid-context-menu-open-event.vue",
    /(?:ContextMenu|Menu)OpenChangeDetails/,
  ],
  ["Navigation Menu value model", "invalid-navigation-menu-value-model.vue", /number.*string/s],
  ["Combobox input model", "invalid-combobox-input-model.vue", /number.*string/s],
] as const;

const INVALID_CONTRACT_CASES = [
  ["button native attributes", "invalid-button-native.vue", /email/],
  ["image native attributes", "invalid-image-native.vue", /href/],
  ["Dropzone id attribute", "invalid-dropzone-id.vue", /number.*string/s],
  [
    "Dropzone aria-invalid attribute",
    "invalid-dropzone-aria-invalid.vue",
    /invalid.*Booleanish|boolean.*Booleanish/s,
  ],
  ["Checkbox model payload", "invalid-checkbox-model.vue", /string.*boolean/s],
  [
    "Checkbox Group model payload",
    "invalid-checkbox-group-model.vue",
    /string.*CheckboxGroupValue/s,
  ],
  ["Select value model payload", "invalid-select-value-model.vue", /number.*string/s],
  ["Select open model payload", "invalid-select-open-model.vue", /string.*boolean/s],
  ["Checkbox detailed event payload", "invalid-checkbox-event.vue", /CheckboxCheckedChangeDetails/],
  ["Select open event payload", "invalid-select-open-event.vue", /SelectOpenChangeDetails/],
  ["Select value event payload", "invalid-select-value-event.vue", /SelectValueChangeDetails/],
  ["Select slot payload", "invalid-select-slot.vue", /missing/],
  ["Checkbox semantic ref element", "invalid-checkbox-ref.vue", /HTMLInputElement/],
] as const;

describe("Vue Styled public-contract diagnostic attribution", () => {
  const fixtureRoot = path.join(process.cwd(), "synthetic-vue-diagnostics");
  const cases = [
    ["first contract", "invalid-first.vue", /first mismatch/],
    ["second contract", "invalid-second.vue", /second mismatch/],
  ] as const;

  it("rejects diagnostics from an unexpected path", () => {
    const diagnostics = `${path.join(fixtureRoot, "unexpected.vue")}(1,1): error TS2322: unexpected`;

    expect(() => assertExpectedInvalidVueDiagnostics(diagnostics, fixtureRoot, cases)).toThrow(
      "Unexpected Vue diagnostic path",
    );
  });

  it("does not let one fixture borrow another fixture's expected diagnostic", () => {
    const diagnostics = [
      `${path.join(fixtureRoot, "invalid-first.vue")}(1,1): error TS2322: second mismatch`,
      `${path.join(fixtureRoot, "invalid-second.vue")}(1,1): error TS2322: first mismatch`,
    ].join("\n");

    expect(() => assertExpectedInvalidVueDiagnostics(diagnostics, fixtureRoot, cases)).toThrow(
      'Vue diagnostic for "first contract" did not match',
    );
  });
});

describe("generated Vue Styled public contracts", () => {
  const outputRoot = path.join(process.cwd(), "apps/vue-demo/src/components/starwind-runtime");
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-contract-"));
  });

  afterAll(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it("projects precise native attrs, models, detailed events, slots, and semantic refs", async () => {
    const sources = await Promise.all(
      [
        "avatar/AvatarImage.vue",
        "button/Button.vue",
        "checkbox/Checkbox.vue",
        "checkbox-group/CheckboxGroup.vue",
        "progress/Progress.vue",
        "radio-group/RadioGroup.vue",
        "scroll-area/ScrollArea.vue",
        "select/Select.vue",
        "select/SelectTrigger.vue",
        "select/SelectValue.vue",
        "theme-toggle/ThemeToggle.vue",
        "toggle/Toggle.vue",
        "toggle-group/ToggleGroup.vue",
      ].map(
        async (relativePath) =>
          [relativePath, await readFile(path.join(outputRoot, relativePath), "utf8")] as const,
      ),
    );
    const sourceByPath = Object.fromEntries(sources);

    for (const [relativePath, source] of sources) {
      expect(source, relativePath).not.toContain("Record<string, unknown>");
    }
    expect(sourceByPath["button/Button.vue"]).toContain("ButtonHTMLAttributes");
    expect(sourceByPath["button/Button.vue"]).toContain("AnchorHTMLAttributes");
    expect(sourceByPath["avatar/AvatarImage.vue"]).toContain("ImgHTMLAttributes");
    expect(sourceByPath["progress/Progress.vue"]).toContain("HTMLAttributes");
    expect(sourceByPath["checkbox/Checkbox.vue"]).toContain('"update:checked"');
    expect(sourceByPath["checkbox/Checkbox.vue"]).toContain("checkedChange:");
    expect(sourceByPath["checkbox/Checkbox.vue"]).toContain(':checked="checked"');
    expect(sourceByPath["checkbox-group/CheckboxGroup.vue"]).toContain('"update:modelValue"');
    expect(sourceByPath["checkbox-group/CheckboxGroup.vue"]).toContain(':model-value="modelValue"');
    expect(sourceByPath["checkbox-group/CheckboxGroup.vue"]).not.toContain("update:value");
    expect(sourceByPath["select/Select.vue"]).toContain('"update:modelValue"');
    expect(sourceByPath["select/Select.vue"]).toContain('"update:open"');
    expect(sourceByPath["select/Select.vue"]).toContain("openChange:");
    expect(sourceByPath["select/Select.vue"]).toContain("valueChange:");
    expect(sourceByPath["avatar/AvatarImage.vue"]).toContain("loadingStatusChange:");
    expect(sourceByPath["avatar/AvatarImage.vue"]).not.toContain("onLoadingStatusChange");
    expect(sourceByPath["toggle/Toggle.vue"]).toContain('"update:pressed"');
    expect(sourceByPath["toggle/Toggle.vue"]).toContain("pressedChange:");
    expect(sourceByPath["toggle/Toggle.vue"]).toContain(':pressed="pressed"');
    expect(sourceByPath["select/SelectValue.vue"]).toContain(
      "default?: (props: { label: string | null; value: string | null }) => unknown;",
    );
    for (const relativePath of [
      "avatar/AvatarImage.vue",
      "button/Button.vue",
      "checkbox/Checkbox.vue",
      "progress/Progress.vue",
      "scroll-area/ScrollArea.vue",
      "select/Select.vue",
      "select/SelectTrigger.vue",
      "theme-toggle/ThemeToggle.vue",
      "toggle/Toggle.vue",
    ]) {
      expect(sourceByPath[relativePath], relativePath).toContain("defineExpose({ element });");
    }
  });

  it("checks valid and invalid native/model/event/slot/ref usage in one compile", async () => {
    const invalidFixtureNames = INVALID_CONTRACT_CASES.map(([, fixtureName]) => fixtureName);
    const result = await runVueTypecheck(
      root,
      outputRoot,
      ["valid.vue", ...invalidFixtureNames],
      "public-contract",
    );

    expect(result.status, result.diagnostics).not.toBe(0);
    assertExpectedInvalidVueDiagnostics(result.diagnostics, root, INVALID_CONTRACT_CASES);
  });
});

describe("candidate Vue Styled menus and floating public contracts", () => {
  let root: string;
  let outputRoot: string;

  beforeAll(async () => {
    root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-menus-floating-"));
    outputRoot = path.join(root, "styled");
    await writeCandidateMenusAndFloatingComponents(outputRoot);
  });

  afterAll(async () => {
    await rm(root, { force: true, recursive: true });
  });

  it("projects idiomatic models, detailed events, slots, attrs, and provider-owned updates", async () => {
    const sources = await Promise.all(
      [
        "tooltip/Tooltip.vue",
        "hover-card/HoverCard.vue",
        "dropdown/Dropdown.vue",
        "dropdown/DropdownRadioGroup.vue",
        "context-menu/ContextMenu.vue",
        "context-menu/ContextMenuRadioGroup.vue",
        "navigation-menu/NavigationMenu.vue",
        "combobox/Combobox.vue",
      ].map(
        async (relativePath) =>
          [relativePath, await readFile(path.join(outputRoot, relativePath), "utf8")] as const,
      ),
    );
    const sourceByPath = Object.fromEntries(sources);

    expect(sourceByPath["tooltip/Tooltip.vue"]).toContain('"update:open"');
    expect(sourceByPath["hover-card/HoverCard.vue"]).toContain('"openChange":');
    expect(sourceByPath["dropdown/Dropdown.vue"]).toContain('"closeComplete":');
    expect(sourceByPath["dropdown/DropdownRadioGroup.vue"]).toContain('"update:modelValue"');
    expect(sourceByPath["context-menu/ContextMenu.vue"]).toContain('"openChange":');
    expect(sourceByPath["context-menu/ContextMenuRadioGroup.vue"]).toContain('"valueChange":');
    expect(sourceByPath["navigation-menu/NavigationMenu.vue"]).toContain('"update:modelValue"');
    expect(sourceByPath["combobox/Combobox.vue"]).toContain('"update:inputValue"');
    expect(sourceByPath["combobox/Combobox.vue"]).toContain('"update:open"');
    expect(sourceByPath["combobox/Combobox.vue"]).toContain('"update:modelValue"');

    for (const [relativePath, source] of sources) {
      expect(source, relativePath).not.toMatch(
        /\bon(?:CloseComplete|InputValueChange|OpenChange|ValueChange)\??:/,
      );
      expect(source, relativePath).toContain("defineSlots");
      expect(source, relativePath).toContain('v-bind="attrs"');
      expect(source, relativePath).not.toContain(".value =");
    }

    expect(sourceByPath["combobox/Combobox.vue"]).toContain(
      '@input-value-change="handleInputValueChange"',
    );
    expect(sourceByPath["combobox/Combobox.vue"]).toMatch(
      /function handleInputValueChange[\s\S]*emit\("inputValueChange", inputValue, detail\);/,
    );
  });

  it("accepts valid APIs and rejects invalid model and detailed-event payloads", async () => {
    const valid = await runVueTypecheck(
      root,
      outputRoot,
      ["valid-menus-floating.vue"],
      "valid-menus-floating-public-contract",
    );
    expect(valid.status, valid.diagnostics).toBe(0);

    const invalid = await runVueTypecheck(
      root,
      outputRoot,
      MENUS_FLOATING_FIXTURES.map(([, file]) => file),
      "invalid-menus-floating-public-contract",
    );

    expect(invalid.status, invalid.diagnostics).not.toBe(0);
    assertExpectedInvalidVueDiagnostics(invalid.diagnostics, root, MENUS_FLOATING_FIXTURES);
  });
});

type ExpectedInvalidVueDiagnostic = readonly [
  caseName: string,
  fixtureName: string,
  diagnostic: RegExp,
];

function assertExpectedInvalidVueDiagnostics(
  diagnostics: string,
  fixtureRoot: string,
  expectedCases: readonly ExpectedInvalidVueDiagnostic[],
): void {
  const expectedByPath = new Map(
    expectedCases.map(([caseName, fixtureName, diagnostic]) => [
      normalizeDiagnosticPath(path.join(fixtureRoot, fixtureName)),
      { caseName, diagnostic, fixtureName, lines: [] as string[] },
    ]),
  );
  let current:
    | { caseName: string; diagnostic: RegExp; fixtureName: string; lines: string[] }
    | undefined;

  for (const line of diagnostics.split(/\r?\n/)) {
    if (line.trim() === "") continue;
    const header = /^(.*\.vue)\(\d+,\d+\): error TS\d+: .+$/.exec(line);
    if (header) {
      current = expectedByPath.get(normalizeDiagnosticPath(header[1]));
      if (!current) {
        throw new Error(`Unexpected Vue diagnostic path "${header[1]}".`);
      }
      current.lines.push(line);
      continue;
    }
    if (current && /^\s+/.test(line)) {
      current.lines.push(line);
      continue;
    }
    throw new Error(`Unattributed Vue diagnostic line: ${line}`);
  }

  for (const { caseName, diagnostic, fixtureName, lines } of expectedByPath.values()) {
    if (lines.length === 0) {
      throw new Error(`Missing Vue diagnostic for "${caseName}" (${fixtureName}).`);
    }
    const fixtureDiagnostics = lines.join("\n");
    diagnostic.lastIndex = 0;
    if (!diagnostic.test(fixtureDiagnostics)) {
      throw new Error(
        `Vue diagnostic for "${caseName}" did not match ${diagnostic}: ${fixtureDiagnostics}`,
      );
    }
  }
}

function normalizeDiagnosticPath(diagnosticPath: string): string {
  const absolutePath = path.isAbsolute(diagnosticPath)
    ? diagnosticPath
    : path.resolve(process.cwd(), diagnosticPath);
  const normalizedPath = path.normalize(absolutePath);
  return process.platform === "win32" ? normalizedPath.toLowerCase() : normalizedPath;
}

async function runVueTypecheck(
  root: string,
  outputRoot: string,
  fixtureNames: readonly string[],
  configName: string,
): Promise<{ diagnostics: string; status: number | null }> {
  const fixturePaths = await Promise.all(
    fixtureNames.map(async (fixtureName) => {
      const fixturePath = path.join(root, fixtureName);
      await writeFile(
        fixturePath,
        await readFile(path.join(FIXTURE_ROOT, fixtureName), "utf8"),
        "utf8",
      );
      return fixturePath;
    }),
  );
  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path
    .join(
      path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
      "dist/index.d.ts",
    )
    .split(path.sep)
    .join("/");
  const configPath = path.join(root, `${configName}.tsconfig.json`);
  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: workspaceRoot,
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: {
            "#candidate/*": [`${outputRoot.split(path.sep).join("/")}/*`],
            "#styled/*": [`${outputRoot.split(path.sep).join("/")}/*/index.ts`],
            "@starwind-ui/runtime": ["packages/runtime/src/index.ts"],
            "@starwind-ui/runtime/theme": ["packages/runtime/src/theme/theme.ts"],
            "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
            "@starwind-ui/vue": ["packages/vue/src/index.ts"],
            "@starwind-ui/vue/*": ["packages/vue/src/*/index.ts"],
            "tailwind-variants": [tailwindVariants],
            vue: ["node_modules/vue/dist/vue.d.mts"],
          },
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: fixturePaths.map((fixturePath) => fixturePath.split(path.sep).join("/")),
        vueCompilerOptions: { dataAttributes: ["data-*"], strictTemplates: true },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vueTsc = path.join(process.cwd(), "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", configPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: VUE_TSC_TIMEOUT_MS,
  });
  if (result.error) {
    const reason = result.error.message.includes("ETIMEDOUT")
      ? `timed out after ${VUE_TSC_TIMEOUT_MS}ms`
      : "failed to execute";
    throw new Error(`Vue Styled ${configName} typecheck ${reason}: ${result.error.message}`, {
      cause: result.error,
    });
  }
  return {
    diagnostics: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    status: result.status,
  };
}

async function writeCandidateMenusAndFloatingComponents(outputRoot: string): Promise<void> {
  const selections = [
    [tooltipStyledContract, ["Tooltip"]],
    [hoverCardStyledContract, ["HoverCard"]],
    [dropdownStyledContract, ["Dropdown", "DropdownRadioGroup"]],
    [contextMenuStyledContract, ["ContextMenu", "ContextMenuRadioGroup"]],
    [navigationMenuStyledContract, ["NavigationMenu", "NavigationMenuPositioner"]],
    [comboboxStyledContract, ["Combobox"]],
  ] as const;

  for (const [contract, exportNames] of selections) {
    const group = projectStyledOutputComponentGroup(contract);
    const directory = path.join(outputRoot, group.component);
    await mkdir(directory, { recursive: true });
    for (const exportName of exportNames) {
      const component = group.components.find((candidate) => candidate.exportName === exportName);
      if (!component) throw new Error(`Missing candidate Vue Styled ${exportName}.`);
      await writeFile(
        path.join(directory, `${exportName}.vue`),
        renderVueComponent(group, component, {
          directory,
          outputRoot,
          primitiveImportBase: "@starwind-ui/vue",
          primitiveOutputRoot: path.join(process.cwd(), "packages/vue/src"),
        }),
        "utf8",
      );
    }
    await writeFile(path.join(directory, "index.ts"), renderIndex(group), "utf8");
    await writeFile(path.join(directory, "variants.ts"), renderVariants(group), "utf8");
  }
}
