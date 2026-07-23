import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

const FIXTURE_ROOT = path.join(
  process.cwd(),
  "scripts/portable-runtime/tests/generate-vue-wrappers/fixtures/styled-public-contract",
);

const INVALID_CONTRACT_CASES = [
  ["button native attributes", "invalid-button-native.vue", /email/],
  ["image native attributes", "invalid-image-native.vue", /href/],
  ["Checkbox model payload", "invalid-checkbox-model.vue", /string.*boolean/s],
  ["Select value model payload", "invalid-select-value-model.vue", /number.*string/s],
  ["Select open model payload", "invalid-select-open-model.vue", /string.*boolean/s],
  ["Checkbox detailed event payload", "invalid-checkbox-event.vue", /CheckboxCheckedChangeDetails/],
  ["Select open event payload", "invalid-select-open-event.vue", /SelectOpenChangeDetails/],
  ["Select value event payload", "invalid-select-value-event.vue", /SelectValueChangeDetails/],
  ["Select slot payload", "invalid-select-slot.vue", /missing/],
  ["Checkbox semantic ref element", "invalid-checkbox-ref.vue", /HTMLInputElement/],
] as const;

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
        "progress/Progress.vue",
        "scroll-area/ScrollArea.vue",
        "select/Select.vue",
        "select/SelectTrigger.vue",
        "select/SelectValue.vue",
        "theme-toggle/ThemeToggle.vue",
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
    expect(sourceByPath["select/Select.vue"]).toContain('"update:modelValue"');
    expect(sourceByPath["select/Select.vue"]).toContain('"update:open"');
    expect(sourceByPath["select/Select.vue"]).toContain("openChange:");
    expect(sourceByPath["select/Select.vue"]).toContain("valueChange:");
    expect(sourceByPath["avatar/AvatarImage.vue"]).toContain("loadingStatusChange:");
    expect(sourceByPath["avatar/AvatarImage.vue"]).not.toContain("onLoadingStatusChange");
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
    ]) {
      expect(sourceByPath[relativePath], relativePath).toContain("defineExpose({ element });");
    }
  });

  it("accepts valid native/model/event/slot/ref usage", async () => {
    const valid = await runVueTypecheck(root, outputRoot, ["valid.vue"], "valid");
    expect(valid.status, valid.diagnostics).toBe(0);
  });

  it("rejects every invalid native/model/event/slot/ref contract in one compile", async () => {
    const fixtureNames = INVALID_CONTRACT_CASES.map(([, fixtureName]) => fixtureName);
    const invalid = await runVueTypecheck(root, outputRoot, fixtureNames, "invalid");

    expect(invalid.status, invalid.diagnostics).not.toBe(0);
    for (const [caseName, fixtureName, diagnostic] of INVALID_CONTRACT_CASES) {
      expect(invalid.diagnostics, caseName).toContain(fixtureName);
      expect(invalid.diagnostics, caseName).toMatch(diagnostic);
    }
  });
});

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
        include: [
          ...fixturePaths.map((fixturePath) => fixturePath.split(path.sep).join("/")),
          `${outputRoot.split(path.sep).join("/")}/**/*`,
        ],
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
    timeout: 30_000,
  });
  return {
    diagnostics: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    status: result.status,
  };
}
