import {
  type Dirent,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";

import { describe, expect, it } from "vitest";

import { PUBLIC_FRAMEWORK_TARGET_POLICY } from "../../../packages/cli/src/utils/framework-target-policy.js";

import {
  createVueContractFixtureFiles,
  runVueContractGate,
  VUE_CONTRACT_COMPILE_HARNESS_PATHS,
  VUE_CONTRACT_FIXTURE_PATHS,
} from "../check-vue-tracer-fixtures.js";
import {
  astroFrameworkAdapter,
  primitiveFrameworkAdapterTargets,
  printFrameworkAdapterConformanceFixture,
  reactFrameworkAdapter,
  vueFrameworkAdapterReadiness,
} from "../renderers/framework-adapters/index.js";
import {
  projectVueDetailedEvent,
  vueAdapterPublicContract,
} from "../renderers/framework-adapters/vue/index.js";
import { vuePackageExports } from "../renderers/framework-adapters/vue/inventory.js";

function getFixture(path: (typeof VUE_CONTRACT_FIXTURE_PATHS)[number]): string {
  const fixture = createVueContractFixtureFiles().find((file) => file.path === path);
  if (!fixture) throw new Error(`Missing Vue contract fixture: ${path}`);
  return fixture.contents;
}

type ReadDirectoryEntries = (directory: string) => Dirent[];

// primitive-docs-examples.test.ts creates and removes these repo-local homes while the
// portable Runtime suite is running. They are test fixtures, never public app surfaces.
const ephemeralGeneratorTestHomePrefixes = [".tmp-starwind-react-doc-examples-"] as const;

function isEphemeralGeneratorTestHome(name: string): boolean {
  return ephemeralGeneratorTestHomePrefixes.some((prefix) => name.startsWith(prefix));
}

function isMissingPathError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function readDirectoryEntries(directory: string): Dirent[] {
  return readdirSync(directory, { withFileTypes: true });
}

function listFiles(root: string, readDirectory = readDirectoryEntries): string[] {
  const files: string[] = [];

  const visit = (directory: string, relativeDirectory: string): void => {
    let entries: Dirent[];
    try {
      entries = readDirectory(directory);
    } catch (error) {
      if (isMissingPathError(error)) return;
      throw error;
    }

    for (const entry of entries) {
      const relativePath = relativeDirectory ? join(relativeDirectory, entry.name) : entry.name;
      if (entry.isDirectory()) {
        // Do not return files from an ephemeral home: callers read the returned paths later.
        if (isEphemeralGeneratorTestHome(entry.name)) continue;
        visit(join(directory, entry.name), relativePath);
      } else if (entry.isFile()) {
        files.push(relativePath.split(sep).join("/"));
      }
    }
  };

  visit(root, "");
  return files.sort();
}

function readSnapshot(root: string): Record<string, string> {
  return Object.fromEntries(
    listFiles(root).map((file) => [file, readFileSync(join(root, file), "utf8")]),
  );
}

const manifestDependencySections = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
] as const;

type PackageManifest = Partial<
  Record<(typeof manifestDependencySections)[number], Record<string, string>>
> & {
  exports?: Record<string, unknown>;
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
};

type TextSurface = {
  path: string;
  source: string;
};

const boundaryAwareVuePattern = /(^|[^a-z0-9])vue(?=$|[^a-z0-9])/i;
const boundaryAwareVueGlobalPattern = /(^|[^a-z0-9])vue(?=$|[^a-z0-9])/gi;
const approvedPrivateVueScripts = {
  l: "pnpm runtime:build && pnpm react:build && pnpm vue:build && pnpm cli:build && pnpm runtime:link && pnpm astro:link && pnpm react:link && pnpm vue:link && pnpm cli:link",
  "runtime:generate:vue": "tsx scripts/portable-runtime/generate-vue-wrappers.ts",
  "runtime:generate:vue:check": "tsx scripts/portable-runtime/check-vue-tracer-fixtures.ts",
  "runtime:generate:vue:test": "vitest run --project=portable-vue",
  "test:vue-cli-host-acceptance":
    "pnpm exec tsx --tsconfig packages/cli/tsconfig.json scripts/vue-cli-host-acceptance.mjs",
  "test:vue-cli-local-link":
    "pnpm exec tsx --tsconfig packages/cli/tsconfig.json scripts/vue-cli-host-acceptance.mjs --local-link-only",
  ul: String.raw`node -e "const { spawnSync } = require(\"node:child_process\"); const command = process.platform === \"win32\" ? \"pnpm.cmd\" : \"pnpm\"; const scripts = [\"astro:unlink\", \"react:unlink\", \"vue:unlink\", \"runtime:unlink\", \"cli:unlink\"]; let failed = false; for (const script of scripts) { const result = spawnSync(command, [script], { stdio: \"inherit\" }); failed ||= result.status !== 0; } process.exitCode = failed ? 1 : 0;"`,
  "vue:build": "pnpm --filter=@starwind-ui/vue build",
  "vue:link": "pnpm --dir packages/vue add --global . --ignore-scripts",
  "vue:test": "pnpm --filter=@starwind-ui/vue test:all",
  "vue:typecheck": "pnpm --filter=@starwind-ui/vue typecheck",
  "vue:unlink": "pnpm unlink:global @starwind-ui/vue",
  "vue:verify": "pnpm runtime:generate:vue:test && pnpm vue:typecheck && pnpm vue:test",
  "vue-demo:build": "pnpm --filter=vue-demo build",
  "vue-demo:dev": "pnpm --filter=vue-demo dev",
  "vue-demo:smoke": "pnpm --filter=vue-demo smoke",
} as const;
const approvedChangesetIgnore = [
  "demo",
  "react-demo",
  "vue-demo",
  "@starwind-ui/vue",
  "@starwind-ui/svelte",
];
const approvedProductPositioningVueClaim =
  /Current first-party Primitive adapter packages are Astro and React\. Runtime adapter contract types\s+already allow future targets such as Vue, Svelte, and Solid, but do not claim those adapters are\s+shipped until generated package output and demos exist\./;
const approvedVueArchitectureDoc = "docs/adr/0011-use-idiomatic-vue-adapter-semantics.md";

const publicCliTextSurfacePaths = [
  "packages/cli/src/index.ts",
  "packages/cli/src/program.ts",
  "packages/cli/src/utils/config.ts",
  "packages/cli/registry/README.md",
  "packages/cli/registry/primitive-versions.json",
  "packages/cli/registry/styled-component-versions.json",
  "packages/cli/src/registry/bundled-registry.json",
  "packages/cli/src/registry/primitive-vendoring-artifacts.json",
] as const;

const publicReleaseSurfacePaths = [
  "scripts/check-release-artifacts.mjs",
  "scripts/pack-public-release-artifacts.mjs",
  "scripts/published-release-acceptance.mjs",
  "scripts/release-candidate-acceptance.mjs",
  "scripts/release-packages.mjs",
] as const;

function containsBoundaryAwareVue(value: string): boolean {
  return boundaryAwareVuePattern.test(value);
}

function getBoundaryAwareVueScripts(scripts: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(scripts).filter(
      ([name, command]) => containsBoundaryAwareVue(name) || containsBoundaryAwareVue(command),
    ),
  );
}

function findVueScriptAllowlistViolations(scripts: Record<string, string>): string[] {
  const actualVueScripts = getBoundaryAwareVueScripts(scripts);
  const violations: string[] = [];

  for (const [name, approvedCommand] of Object.entries(approvedPrivateVueScripts)) {
    if (!(name in actualVueScripts)) violations.push(`missing:${name}`);
    else if (actualVueScripts[name] !== approvedCommand) violations.push(`mutated:${name}`);
  }
  for (const name of Object.keys(actualVueScripts)) {
    if (!(name in approvedPrivateVueScripts)) violations.push(`unexpected:${name}`);
  }

  return violations.sort();
}

function findBoundaryAwareVueSurfaces(surfaces: TextSurface[]): string[] {
  return surfaces
    .filter(({ source }) => containsBoundaryAwareVue(source))
    .map(({ path }) => path)
    .sort();
}

function readTextSurfaces(paths: readonly string[]): TextSurface[] {
  return paths.map((path) => ({
    path,
    source: readFileSync(join(process.cwd(), path), "utf8"),
  }));
}

function isApprovedVueDocumentation({ path, source }: TextSurface): boolean {
  if (!containsBoundaryAwareVue(source)) return true;
  if (path.startsWith("docs/portable-runtime/")) return true;
  if (path === "docs/agents/test-health.md") return true;
  if (path === approvedVueArchitectureDoc) return true;
  if (path !== "docs/product/positioning.md") return false;

  return (
    (source.match(boundaryAwareVueGlobalPattern) ?? []).length === 1 &&
    approvedProductPositioningVueClaim.test(source)
  );
}

function findUnexpectedVueDocumentation(surfaces: TextSurface[]): string[] {
  return surfaces
    .filter((surface) => !isApprovedVueDocumentation(surface))
    .map(({ path }) => path)
    .sort();
}

function findChangesetConfigVueViolations(
  config: Record<string, unknown> & { ignore?: unknown },
): string[] {
  const violations: string[] = [];
  if (JSON.stringify(config.ignore) !== JSON.stringify(approvedChangesetIgnore)) {
    violations.push("ignore");
  }
  const { ignore: _approvedIgnore, ...configWithoutIgnore } = config;
  if (containsBoundaryAwareVue(JSON.stringify(configWithoutIgnore))) {
    violations.push("config");
  }
  return violations;
}

function findForbiddenVueDependencies(manifest: PackageManifest): string[] {
  return manifestDependencySections
    .flatMap((section) =>
      Object.keys(manifest[section] ?? {}).map((dependency) => `${section}:${dependency}`),
    )
    .filter((entry) => {
      const dependency = entry.slice(entry.indexOf(":") + 1);
      return (
        dependency === "vue" ||
        dependency === "vue-tsc" ||
        dependency === "@starwind-ui/vue" ||
        dependency === "@vitejs/plugin-vue" ||
        dependency.startsWith("@vue/")
      );
    })
    .sort();
}

describe("Vue non-shipping public-contract gate", () => {
  it("excludes generator test homes and tolerates only disappearing paths", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "starwind-vue-surface-scan-"));
    const stableRoot = join(fixtureRoot, "stable");
    const disappearingRoot = join(fixtureRoot, "disappearing");
    const generatorTestHome = join(fixtureRoot, ".tmp-starwind-react-doc-examples-contract-gate");

    try {
      mkdirSync(stableRoot);
      mkdirSync(disappearingRoot);
      mkdirSync(generatorTestHome);
      writeFileSync(join(stableRoot, "package.json"), "{}\n");
      writeFileSync(join(disappearingRoot, "package.json"), "{}\n");
      writeFileSync(
        join(generatorTestHome, "package.json"),
        '{ "dependencies": { "vue": "*" } }\n',
      );

      let removedDisappearingRoot = false;
      expect(
        listFiles(fixtureRoot, (directory) => {
          if (directory === disappearingRoot) {
            rmSync(disappearingRoot, { force: true, recursive: true });
            removedDisappearingRoot = true;
          }
          return readDirectoryEntries(directory);
        }),
      ).toEqual(["stable/package.json"]);
      expect(removedDisappearingRoot).toBe(true);

      expect(() =>
        listFiles(fixtureRoot, (directory) => {
          if (directory === stableRoot) {
            throw Object.assign(new Error("synthetic access failure"), { code: "EACCES" });
          }
          return readDirectoryEntries(directory);
        }),
      ).toThrow("synthetic access failure");
    } finally {
      rmSync(fixtureRoot, { force: true, recursive: true });
    }
  });

  it("pins one deterministic synthetic and unsupported-only fixture set", () => {
    const firstRun = createVueContractFixtureFiles();
    const secondRun = createVueContractFixtureFiles();

    expect(secondRun).toEqual(firstRun);
    expect(firstRun.map((file) => file.path)).toEqual(VUE_CONTRACT_FIXTURE_PATHS);
    expect(new Set(firstRun.map((file) => file.path)).size).toBe(firstRun.length);
    expect(
      [
        ...new Set(
          firstRun
            .filter((file) => file.path.endsWith(".vue"))
            .map((file) => file.path.split("/")[2]),
        ),
      ].sort(),
    ).toEqual(["combobox", "conformance", "menu", "navigation-menu", "toggle"]);
    expect(firstRun.map((file) => file.path).join("\n")).not.toMatch(
      /\/vue\/(?:avatar|button|checkbox|progress|scroll-area|select|theme)\//,
    );
  });

  it("keeps unsupported tracers aligned with the typed public contract", () => {
    const valueModel = vueAdapterPublicContract.models.projections.value;
    const pressedModel = vueAdapterPublicContract.models.projections.pressed;
    const valueEvent = projectVueDetailedEvent("onValueChange");
    const conformance = getFixture("__future-fixtures/vue/conformance/ConformanceRoot.vue");
    const toggle = getFixture("__future-fixtures/vue/toggle/ToggleRoot.vue");
    const combobox = getFixture("__future-fixtures/vue/combobox/ComboboxRoot.vue");

    for (const source of [conformance, combobox]) {
      expect(source).toContain(`${valueModel.modelProp}?:`);
      expect(source).toContain(`"${valueModel.updateEvent}"`);
      expect(source).toContain(`${valueEvent.emit}: [`);
      expect(source).not.toContain(`${valueEvent.runtimeHandler}?:`);
    }
    expect(toggle).toContain(`${pressedModel.modelProp}?:`);
    expect(toggle).toContain(`${pressedModel.defaultProp}?:`);
    expect(toggle).toContain(`"${pressedModel.updateEvent}"`);

    const unsupportedSource = createVueContractFixtureFiles()
      .filter((file) => !file.path.includes("/conformance/"))
      .map((file) => file.contents)
      .join("\n");
    expect(unsupportedSource).not.toContain("queueMicrotask");
    expect(unsupportedSource).not.toMatch(/(?:provide|inject)\(\s*["']/);
    expect(unsupportedSource).toContain("InjectionKey<");
    expect(unsupportedSource).toContain("must be used within");
    for (const [source, detailedEmit, updateEmit] of [
      [toggle, 'emit("pressedChange"', 'emit("update:pressed"'],
      [combobox, 'emit("inputValueChange"', 'emit("update:inputValue"'],
      [combobox, 'emit("openChange"', 'emit("update:open"'],
      [combobox, 'emit("valueChange"', 'emit("update:modelValue"'],
      [
        getFixture("__future-fixtures/vue/menu/MenuRoot.vue"),
        'emit("openChange"',
        'emit("update:open"',
      ],
      [
        getFixture("__future-fixtures/vue/menu/MenuCheckboxItem.vue"),
        'emit("checkedChange"',
        'emit("update:checked"',
      ],
      [
        getFixture("__future-fixtures/vue/menu/MenuRadioGroup.vue"),
        'emit("valueChange"',
        'emit("update:modelValue"',
      ],
      [
        getFixture("__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue"),
        'emit("valueChange"',
        'emit("update:modelValue"',
      ],
    ] as const) {
      const detailedIndex = source.indexOf(detailedEmit);
      const cancellationIndex = source.indexOf("if (details.isCanceled) return;", detailedIndex);
      const updateIndex = source.indexOf(updateEmit, cancellationIndex);
      expect(detailedIndex).toBeGreaterThanOrEqual(0);
      expect(cancellationIndex).toBeGreaterThan(detailedIndex);
      expect(updateIndex).toBeGreaterThan(cancellationIndex);
    }

    for (const renderer of [
      "adapter.ts",
      "generic-future-framework-tracer.ts",
      "specialized-future-framework-tracer.ts",
    ]) {
      expect(
        readFileSync(
          join(
            process.cwd(),
            "scripts/portable-runtime/renderers/framework-adapters/vue",
            renderer,
          ),
          "utf8",
        ),
      ).toContain('from "./public-contract.js"');
    }
  });

  it("preserves controlled null for nullable Vue models", () => {
    for (const path of [
      "__future-fixtures/vue/combobox/ComboboxRoot.vue",
      "__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue",
    ]) {
      const source = getFixture(path as (typeof VUE_CONTRACT_FIXTURE_PATHS)[number]);
      expect(source).toContain(
        "props.modelValue !== undefined ? props.modelValue : uncontrolledValue.value",
      );
      expect(source).not.toContain("props.modelValue ?? uncontrolledValue.value");
    }
  });

  it("retains accepted controlled updates without mutating uncontrolled state", () => {
    for (const [path, modelProp, uncontrolledAssignment, updateEmit] of [
      [
        "__future-fixtures/vue/toggle/ToggleRoot.vue",
        "pressed",
        "uncontrolledPressed.value = details.pressed;",
        'emit("update:pressed", details.pressed);',
      ],
      [
        "__future-fixtures/vue/combobox/ComboboxRoot.vue",
        "inputValue",
        "uncontrolledInputValue.value = inputValue;",
        'emit("update:inputValue", inputValue);',
      ],
      [
        "__future-fixtures/vue/combobox/ComboboxRoot.vue",
        "open",
        "uncontrolledOpen.value = open;",
        'emit("update:open", open);',
      ],
      [
        "__future-fixtures/vue/combobox/ComboboxRoot.vue",
        "modelValue",
        "uncontrolledValue.value = value;",
        'emit("update:modelValue", value);',
      ],
      [
        "__future-fixtures/vue/menu/MenuRoot.vue",
        "open",
        "uncontrolledOpen.value = open;",
        'emit("update:open", open);',
      ],
      [
        "__future-fixtures/vue/menu/MenuCheckboxItem.vue",
        "checked",
        "uncontrolledChecked.value = details.checked;",
        'emit("update:checked", details.checked);',
      ],
      [
        "__future-fixtures/vue/menu/MenuRadioGroup.vue",
        "modelValue",
        "uncontrolledValue.value = details.value;",
        'emit("update:modelValue", details.value);',
      ],
      [
        "__future-fixtures/vue/navigation-menu/NavigationMenuRoot.vue",
        "modelValue",
        "uncontrolledValue.value = value;",
        'emit("update:modelValue", value);',
      ],
    ] as const) {
      const source = getFixture(path);
      const cancellation = source.indexOf("if (details.isCanceled) return;");
      const controlledGuard = source.indexOf(
        `if (props.${modelProp} === undefined) {`,
        cancellation,
      );
      const localMutation = source.indexOf(uncontrolledAssignment, controlledGuard);
      const update = source.indexOf(updateEmit, localMutation);
      expect(controlledGuard).toBeGreaterThan(cancellation);
      expect(localMutation).toBeGreaterThan(controlledGuard);
      expect(update).toBeGreaterThan(localMutation);
    }
  });

  it("writes and cleans identical temporary gates on repeat runs", async () => {
    const fixtureParent = mkdtempSync(join(tmpdir(), "starwind-vue-contract-gate-"));
    const snapshots: Record<string, string>[] = [];

    try {
      const compile = (fixtureRoot: string, tsconfigPath: string) => {
        expect(tsconfigPath).toBe(join(fixtureRoot, "tsconfig.json"));
        expect(listFiles(fixtureRoot)).toEqual(
          [
            ...VUE_CONTRACT_FIXTURE_PATHS,
            ...VUE_CONTRACT_COMPILE_HARNESS_PATHS,
            "tsconfig.json",
          ].sort(),
        );
        const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8")) as {
          compilerOptions?: {
            paths?: Record<string, string[]>;
            skipLibCheck?: boolean;
            strict?: boolean;
          };
          include?: string[];
          vueCompilerOptions?: {
            checkUnknownProps?: boolean;
            dataAttributes?: string[];
            strictTemplates?: boolean;
          };
        };
        expect(tsconfig).toMatchObject({
          compilerOptions: {
            paths: {
              "@starwind-ui/runtime/conformance": ["__future-fixtures/vue/conformance/runtime.ts"],
            },
            strict: true,
          },
          include: [
            "__future-fixtures/vue/combobox/**/*.{ts,vue}",
            "__future-fixtures/vue/conformance/**/*.{ts,vue}",
            "__future-fixtures/vue/menu/**/*.{ts,vue}",
            "__future-fixtures/vue/navigation-menu/**/*.{ts,vue}",
            "__future-fixtures/vue/toggle/**/*.vue",
          ],
          vueCompilerOptions: { dataAttributes: ["data-*"], strictTemplates: true },
        });
        expect(tsconfig.compilerOptions).not.toHaveProperty("skipLibCheck");
        expect(tsconfig.vueCompilerOptions).not.toHaveProperty("checkUnknownProps");
        snapshots.push(readSnapshot(fixtureRoot));
      };

      await runVueContractGate({ compile, fixtureParent });
      expect(readdirSync(fixtureParent)).toEqual([]);
      await runVueContractGate({ compile, fixtureParent });
      expect(readdirSync(fixtureParent)).toEqual([]);
      expect(snapshots).toHaveLength(2);
      expect(snapshots[1]).toEqual(snapshots[0]);
      const harness = snapshots[0]?.[VUE_CONTRACT_COMPILE_HARNESS_PATHS[0]] ?? "";
      expect(harness).toContain('import ConformanceRoot from "./ConformanceRoot.vue";');
      expect(harness).toContain(
        'import { normalizeConformanceValue } from "./normalizeConformanceValue";',
      );
      expect(harness).toContain(':model-value="normalizedValue"');
      expect(harness).toContain('@value-change="onValueChange"');
      expect(harness).toContain('@update:model-value="onModelUpdate"');
    } finally {
      rmSync(fixtureParent, { force: true, recursive: true });
    }
  });

  it("keeps every Vue support flag false and every public shipping surface absent", () => {
    expect(vueFrameworkAdapterReadiness.publicSupport).toBe(vueAdapterPublicContract.publicSupport);
    expect(vueAdapterPublicContract.publicSupport.status).toBe("non-shipping-tracer");
    expect(
      Object.entries(vueAdapterPublicContract.publicSupport)
        .filter(([key]) => key !== "status")
        .map(([, value]) => value),
    ).toEqual([false, false, false, false]);
    expect(primitiveFrameworkAdapterTargets.map(({ target }) => target)).toEqual([
      "astro",
      "react",
      "vue",
      "svelte",
    ]);
    expect(existsSync(join(process.cwd(), "packages/vue"))).toBe(true);
    expect(
      existsSync(
        join(process.cwd(), "apps/vue-demo/src/components/starwind-runtime/button/Button.vue"),
      ),
    ).toBe(true);

    for (const absentPath of [
      "packages/cli/registry/vue",
      "packages/cli/src/registry/vue",
      "docs/vue",
    ]) {
      expect(existsSync(join(process.cwd(), absentPath)), absentPath).toBe(false);
    }

    const rootManifest = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as PackageManifest;
    expect(findForbiddenVueDependencies(rootManifest)).toEqual([
      "devDependencies:@vue/compiler-sfc",
      "devDependencies:vue",
      "devDependencies:vue-tsc",
    ]);

    for (const root of ["apps", "packages"]) {
      for (const file of listFiles(join(process.cwd(), root)).filter(
        (candidate) => candidate.endsWith("package.json") && !candidate.includes("node_modules"),
      )) {
        const normalizedFile = file.replaceAll("\\", "/");
        if (
          (root === "apps" && normalizedFile === "vue-demo/package.json") ||
          (root === "packages" && normalizedFile === "vue/package.json")
        ) {
          continue;
        }
        const manifestSource = readFileSync(join(process.cwd(), root, file), "utf8");
        const manifest = JSON.parse(manifestSource) as PackageManifest;
        expect(findForbiddenVueDependencies(manifest), `${root}/${file}`).toEqual([]);
        expect(containsBoundaryAwareVue(manifestSource), `${root}/${file}`).toBe(false);
      }
    }

    const vueManifest = JSON.parse(
      readFileSync(join(process.cwd(), "packages/vue/package.json"), "utf8"),
    ) as PackageManifest;
    expect(vueManifest).toMatchObject({
      dependencies: { "@starwind-ui/runtime": "workspace:*" },
      name: "@starwind-ui/vue",
      peerDependencies: { vue: ">=3.5" },
      private: true,
      version: "0.0.0",
    });
    expect(Object.keys(vueManifest.exports ?? {}).sort()).toEqual(
      Object.keys(vuePackageExports).sort(),
    );
    const vueDemoManifest = JSON.parse(
      readFileSync(join(process.cwd(), "apps/vue-demo/package.json"), "utf8"),
    ) as PackageManifest;
    expect(vueDemoManifest).toMatchObject({
      dependencies: {
        "@starwind-ui/vue": "workspace:*",
        vue: expect.any(String),
      },
      devDependencies: {
        "@vitejs/plugin-vue": expect.any(String),
        "vue-tsc": expect.any(String),
      },
      name: "vue-demo",
      private: true,
      scripts: {
        build: "vue-tsc -b && vite build",
        dev: "vite",
        smoke: "pnpm build && node ../../scripts/portable-runtime/tests/smoke/vue/verify-demo.mjs",
      },
    });
    for (const cohortComponent of [
      "combobox",
      "context-menu",
      "menu",
      "navigation-menu",
      "preview-card",
      "tooltip",
    ]) {
      expect(
        existsSync(join(process.cwd(), "packages/vue/src", cohortComponent)),
        `packages/vue/src/${cohortComponent}`,
      ).toBe(true);
    }

    expect(rootManifest.private).toBe(true);
    expect(getBoundaryAwareVueScripts(rootManifest.scripts ?? {})).toEqual(
      approvedPrivateVueScripts,
    );
    expect(findVueScriptAllowlistViolations(rootManifest.scripts ?? {})).toEqual([]);

    const changesetConfig = JSON.parse(
      readFileSync(join(process.cwd(), ".changeset/config.json"), "utf8"),
    ) as Record<string, unknown> & { fixed: string[][]; ignore: string[] };
    expect(changesetConfig.ignore).toEqual(approvedChangesetIgnore);
    expect(changesetConfig.fixed.flat().filter(containsBoundaryAwareVue)).toEqual([]);
    expect(findChangesetConfigVueViolations(changesetConfig)).toEqual([]);
    const prereleaseStatePath = join(process.cwd(), ".changeset/pre.json");
    if (existsSync(prereleaseStatePath)) {
      const prereleaseState = JSON.parse(readFileSync(prereleaseStatePath, "utf8")) as {
        changesets: string[];
        initialVersions: Record<string, string>;
      };
      expect(prereleaseState.initialVersions["vue-demo"]).toBe("0.0.0");
      expect(prereleaseState.initialVersions["@starwind-ui/vue"]).toBe("0.0.0");
      expect(prereleaseState.changesets.filter(containsBoundaryAwareVue)).toEqual([]);
    }
    for (const file of listFiles(join(process.cwd(), ".changeset")).filter(
      (candidate) => candidate !== "config.json" && candidate !== "pre.json",
    )) {
      expect(
        containsBoundaryAwareVue(readFileSync(join(process.cwd(), ".changeset", file), "utf8")),
        `.changeset/${file}`,
      ).toBe(false);
    }

    const publicCliSurfaces = readTextSurfaces(publicCliTextSurfacePaths);
    expect(findBoundaryAwareVueSurfaces(publicCliSurfaces)).toEqual([]);
    expect(PUBLIC_FRAMEWORK_TARGET_POLICY).toEqual({
      cacheKey: "public",
      configTargets: ["astro", "react"],
      labels: { astro: "Astro", react: "React" },
      primitiveArtifactIntegrity: undefined,
      registryTargets: ["legacy-astro", "astro", "react"],
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
      },
      setupTargets: ["astro", "react"],
    });

    const publicReleaseSurfaces = readTextSurfaces(publicReleaseSurfacePaths);
    expect(findBoundaryAwareVueSurfaces(publicReleaseSurfaces)).toEqual([]);

    const publicReadmeSurfaces: TextSurface[] = [
      {
        path: "README.md",
        source: readFileSync(join(process.cwd(), "README.md"), "utf8"),
      },
    ];
    for (const packageDirectory of readdirSync(join(process.cwd(), "packages"), {
      withFileTypes: true,
    }).filter((entry) => entry.isDirectory())) {
      const packageRoot = join(process.cwd(), "packages", packageDirectory.name);
      const manifestPath = join(packageRoot, "package.json");
      const readmePath = join(packageRoot, "README.md");
      if (!existsSync(manifestPath) || !existsSync(readmePath)) continue;
      const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as PackageManifest;
      if (manifest.private === true) continue;
      publicReadmeSurfaces.push({
        path: `packages/${packageDirectory.name}/README.md`,
        source: readFileSync(readmePath, "utf8"),
      });
    }
    expect(findBoundaryAwareVueSurfaces(publicReadmeSurfaces)).toEqual([]);

    const documentationSurfaces = listFiles(join(process.cwd(), "docs")).map((file) => ({
      path: `docs/${file}`,
      source: readFileSync(join(process.cwd(), "docs", file), "utf8"),
    }));
    expect(findUnexpectedVueDocumentation(documentationSurfaces)).toEqual([]);
    const productPositioningPath = join(process.cwd(), "docs/product/positioning.md");
    if (existsSync(productPositioningPath)) {
      expect(readFileSync(productPositioningPath, "utf8")).toMatch(
        approvedProductPositioningVueClaim,
      );
    }
    expect(
      documentationSurfaces
        .filter(({ source }) => containsBoundaryAwareVue(source))
        .every(
          ({ path }) =>
            path.startsWith("docs/portable-runtime/") ||
            path === "docs/agents/test-health.md" ||
            path === approvedVueArchitectureDoc ||
            path === "docs/product/positioning.md",
        ),
    ).toBe(true);
  });

  it("pins established Astro and React generation output as regression oracles", () => {
    const astro = printFrameworkAdapterConformanceFixture(astroFrameworkAdapter);
    const react = printFrameworkAdapterConformanceFixture(reactFrameworkAdapter);

    expect(astro.map((file) => file.path)).toEqual([
      "conformance/ConformanceRoot.astro",
      "conformance/normalizeConformanceValue.ts",
      "conformance/index.ts",
      "conformance/types.ts",
    ]);
    expect(react.map((file) => file.path)).toEqual([
      "conformance/ConformanceRoot.tsx",
      "conformance/normalizeConformanceValue.ts",
      "conformance/index.ts",
      "conformance/types.ts",
    ]);
    expect(astro[0]?.contents).toContain(
      `<button data-slot="root" aria-disabled={disabled ? 'true' : undefined} data-sw-part="root" {...attrs}>`,
    );
    expect(astro[0]?.contents).toContain(
      `<template data-sw-portal-source="overlay" data-sw-portal-target="body">`,
    );
    expect(react[0]?.contents).toContain(
      `{ value = "initial", disabled, tone, onValueChange, overlay, children, ...props },`,
    );
    expect(react[0]?.contents).toContain(
      `<button data-slot="root" aria-disabled={disabled ? 'true' : undefined} data-sw-part="root" ref={setRootRef}>`,
    );
  });

  it("rejects synthetic Vue leaks across private-script, registry, docs, and manifests", () => {
    expect(
      findVueScriptAllowlistViolations({
        ...approvedPrivateVueScripts,
        "publish:vue": "pnpm publish",
        "runtime:registry:vue": "tsx scripts/portable-runtime/generate-cli-registry.ts",
        "shipping:adapter": "pnpm --filter=@starwind-ui/vue publish",
      }),
    ).toEqual([
      "unexpected:publish:vue",
      "unexpected:runtime:registry:vue",
      "unexpected:shipping:adapter",
    ]);
    expect(
      findVueScriptAllowlistViolations({
        ...approvedPrivateVueScripts,
        "vue:build": "pnpm --filter=@starwind-ui/vue publish",
      }),
    ).toEqual(["mutated:vue:build"]);
    expect(
      findVueScriptAllowlistViolations(
        Object.fromEntries(
          Object.entries(approvedPrivateVueScripts).filter(([name]) => name !== "vue:typecheck"),
        ),
      ),
    ).toEqual(["missing:vue:typecheck"]);
    expect(
      findChangesetConfigVueViolations({
        fixed: [],
        ignore: [...approvedChangesetIgnore, "future-vue-demo"],
      }),
    ).toEqual(["ignore"]);
    expect(
      findChangesetConfigVueViolations({
        fixed: [],
        ignore: approvedChangesetIgnore,
        registry: { framework: "vue" },
      }),
    ).toEqual(["config"]);
    expect(
      findBoundaryAwareVueSurfaces([
        { path: "registry/framework.json", source: '{ "framework": "vue" }' },
        { path: "registry/target.json", source: '{ "target": "VUE" }' },
      ]),
    ).toEqual(["registry/framework.json", "registry/target.json"]);
    expect(
      findUnexpectedVueDocumentation([
        {
          path: "README.md",
          source: "Vue is now a supported first-party adapter.",
        },
        {
          path: "docs/getting-started.md",
          source: "Install the Vue adapter.",
        },
        {
          path: "docs/product/positioning.md",
          source: "Vue is now a supported first-party adapter.",
        },
      ]),
    ).toEqual(["README.md", "docs/getting-started.md", "docs/product/positioning.md"]);
    expect(
      findForbiddenVueDependencies({
        dependencies: { "@starwind-ui/vue": "workspace:*", vue: "3.5.0" },
        devDependencies: {
          "@vitejs/plugin-vue": "6.0.0",
          "@vue/compiler-sfc": "3.5.0",
          "vue-tsc": "3.0.0",
        },
        optionalDependencies: { "@vue/server-renderer": "3.5.0" },
        peerDependencies: { "@vue/runtime-dom": "3.5.0" },
      }),
    ).toEqual([
      "dependencies:@starwind-ui/vue",
      "dependencies:vue",
      "devDependencies:@vitejs/plugin-vue",
      "devDependencies:@vue/compiler-sfc",
      "devDependencies:vue-tsc",
      "optionalDependencies:@vue/server-renderer",
      "peerDependencies:@vue/runtime-dom",
    ]);
  });
});
