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

import semver from "semver";
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
  description?: string;
  exports?: Record<string, unknown>;
  name?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  version?: string;
};

type TextSurface = {
  path: string;
  source: string;
};

const boundaryAwareVuePattern = /(^|[^a-z0-9])vue(?=$|[^a-z0-9])/i;
const approvedVueCliManifestPath = "packages/cli/package.json";
const approvedVueCliDescription =
  "Install and manage Starwind UI components in Astro, React, and Vue (beta) applications";
const approvedVueScriptNames = [
  "build:public",
  "l",
  "publish:vue-beta",
  "publish:vue-beta:dry-run",
  "release:gate",
  "release:pack:vue-beta-artifacts",
  "release:vue-beta:artifacts",
  "release:vue-beta:artifacts:record",
  "release:vue-beta:finalize",
  "runtime:generate:all",
  "runtime:generate:vue",
  "runtime:generate:vue:check",
  "runtime:generate:vue:test",
  "runtime:perf:vue",
  "runtime:perf:vue:baseline",
  ...(existsSync("packages/svelte/package.json")
    ? ["runtime:perf:vue:evidence:check", "runtime:perf:vue:check"]
    : []),
  "runtime:size",
  "runtime:size:baseline:vue",
  "runtime:size:check",
  "runtime:size:check:prepared",
  "runtime:size:check:prepared:private",
  "runtime:size:starwind",
  "test:vue-cli-host-acceptance",
  "test:vue-cli-local-link",
  "test:all",
  "typecheck:public",
  "ul",
  "vue:build",
  "vue:link",
  "vue:test",
  "vue:typecheck",
  "vue:unlink",
  "vue:verify",
  "vue-demo:build",
  "vue-demo:dev",
  "vue-demo:smoke",
] as const;
const approvedVueScriptNameSet = new Set<string>(approvedVueScriptNames);
const approvedVueReleaseScriptNames = new Set([
  "publish:vue-beta",
  "publish:vue-beta:dry-run",
  "release:gate",
  "release:pack:vue-beta-artifacts",
  "release:vue-beta:artifacts",
  "release:vue-beta:artifacts:record",
  "release:vue-beta:finalize",
]);
const forbiddenPublicVueScriptCommandPatterns = [
  /\b(?:npm|pnpm|yarn)\b[^\n;&|]*\b(?:pack|publish)\b/i,
  /\bchangeset\b[^\n;&|]*\bpublish\b/i,
  /(?:pack-public-release-artifacts|published-release-acceptance|release-candidate-acceptance|release-packages)\.mjs\b/i,
  /(?:runtime:registry(?::|\b)|generate-cli-registry|packages\/cli\/(?:registry|src\/registry))/i,
] as const;
const approvedChangesetIgnore = [
  "demo",
  "react-demo",
  "vue-demo",
  ...(existsSync(join(process.cwd(), "packages/svelte/package.json"))
    ? ["@starwind-ui/svelte"]
    : []),
];
const approvedProductPositioningVueClaim =
  /Current first-party Primitive adapter packages are Astro, React, and the Vue 3\.5 public beta\.\s+Runtime adapter contract types also allow future targets such as Svelte and Solid\. Claim support\s+only after generated package output, demos, host checks, and release metadata exist\./;
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

function findVueScriptPolicyViolations(scripts: Record<string, string>): string[] {
  const actualVueScripts = getBoundaryAwareVueScripts(scripts);
  const violations: string[] = [];

  for (const name of approvedVueScriptNames) {
    if (!(name in actualVueScripts)) violations.push(`missing:${name}`);
  }
  for (const [name, command] of Object.entries(actualVueScripts)) {
    if (!approvedVueScriptNameSet.has(name)) {
      violations.push(`unexpected:${name}`);
      continue;
    }
    if (
      !approvedVueReleaseScriptNames.has(name) &&
      forbiddenPublicVueScriptCommandPatterns.some((pattern) => pattern.test(command))
    ) {
      violations.push(`forbidden:${name}`);
    }
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
  if (path === "docs/release/versioning.md") return true;
  if (path === approvedVueArchitectureDoc) return true;
  if (path !== "docs/product/positioning.md") return false;

  return approvedProductPositioningVueClaim.test(source);
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

function isApprovedVueAwarePackageManifest(path: string, manifest: PackageManifest): boolean {
  if (!containsBoundaryAwareVue(JSON.stringify(manifest))) return true;
  if (path !== approvedVueCliManifestPath || manifest.description !== approvedVueCliDescription) {
    return false;
  }

  const { description: _approvedDescription, ...manifestWithoutDescription } = manifest;
  return !containsBoundaryAwareVue(JSON.stringify(manifestWithoutDescription));
}

describe("Vue public-beta contract gate", () => {
  it("keeps the human review Styled-only and the full adapter review internal", () => {
    const demoRoot = join(process.cwd(), "apps/vue-demo/src");
    const app = readFileSync(join(demoRoot, "App.vue"), "utf8");
    const styledReview = readFileSync(
      join(demoRoot, "components/StyledCatalogReviewPage.vue"),
      "utf8",
    );
    const catalogSource = styledReview.match(
      /const styledComponents = \[([\s\S]*?)\] as const;/,
    )?.[1];
    const catalog = [...(catalogSource?.matchAll(/"([^"]+)"/g) ?? [])]
      .map((match) => match[1]!)
      .sort();
    const generated = readdirSync(join(demoRoot, "components/starwind-runtime"), {
      withFileTypes: true,
    })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();

    expect(app).toContain("route === '/review'");
    expect(app).toContain("route === '/internal/adapter-review'");
    expect(catalog).toEqual(generated);
    expect(catalog).toHaveLength(54);
    expect(styledReview).toContain("<AccordionReview styled-only />");
    expect(styledReview).toContain("<AvatarReview styled-only />");
    expect(styledReview).toContain("<ProgressReview styled-only />");
    expect(styledReview).toContain("<ScrollAreaReview styled-only />");
    expect(styledReview).not.toContain("@starwind-ui/vue/");
  });

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

  it("keeps Vue public-beta support enabled across public surfaces", () => {
    expect(vueFrameworkAdapterReadiness.publicSupport).toBe(vueAdapterPublicContract.publicSupport);
    expect(vueAdapterPublicContract.publicSupport.status).toBe("public-beta");
    expect(
      Object.entries(vueAdapterPublicContract.publicSupport)
        .filter(([key]) => key !== "status")
        .map(([, value]) => value),
    ).toEqual([true, true, true, true]);
    expect(primitiveFrameworkAdapterTargets.map(({ target }) => target)).toEqual([
      "astro",
      "react",
      "vue",
      ...(existsSync("packages/svelte/package.json") ? ["svelte"] : []),
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
        const manifestPath = `${root}/${normalizedFile}`;
        expect(findForbiddenVueDependencies(manifest), manifestPath).toEqual([]);
        expect(isApprovedVueAwarePackageManifest(manifestPath, manifest), manifestPath).toBe(true);
      }
    }

    const runtimeManifest = JSON.parse(
      readFileSync(join(process.cwd(), "packages/runtime/package.json"), "utf8"),
    ) as PackageManifest;
    const runtimeVersion = runtimeManifest.version ?? "";
    expect(runtimeManifest).toMatchObject({
      name: "@starwind-ui/runtime",
    });
    expect(semver.valid(runtimeVersion)).toBe(runtimeVersion);

    const vueManifest = JSON.parse(
      readFileSync(join(process.cwd(), "packages/vue/package.json"), "utf8"),
    ) as PackageManifest;
    const vueVersion = vueManifest.version ?? "";
    expect(vueManifest).toMatchObject({
      dependencies: { "@starwind-ui/runtime": runtimeVersion },
      name: "@starwind-ui/vue",
      peerDependencies: { vue: ">=3.5" },
    });
    expect(semver.valid(vueVersion)).toBe(vueVersion);
    expect(vueManifest.private).not.toBe(true);
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
    expect(findVueScriptPolicyViolations(rootManifest.scripts ?? {})).toEqual([]);

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
    // Public beta fixes may describe Vue in Changesets. Package eligibility and fixed-group
    // membership are enforced by the configuration checks above, not by release-note wording.

    const publicCliSurfaces = readTextSurfaces(publicCliTextSurfacePaths);
    expect(findBoundaryAwareVueSurfaces(publicCliSurfaces)).toEqual([
      "packages/cli/registry/README.md",
      "packages/cli/src/program.ts",
      "packages/cli/src/registry/bundled-registry.json",
      "packages/cli/src/registry/primitive-vendoring-artifacts.json",
    ]);
    expect(PUBLIC_FRAMEWORK_TARGET_POLICY).toEqual({
      cacheKey: "public",
      configTargets: ["astro", "react", "vue"],
      labels: { astro: "Astro", react: "React", vue: "Vue (beta)" },
      primitiveArtifactIntegrity: undefined,
      registryTargets: ["legacy-astro", "astro", "react", "vue"],
      requiredAdapterPackages: {
        "legacy-astro": [],
        astro: ["@starwind-ui/astro"],
        react: ["@starwind-ui/react"],
        vue: ["@starwind-ui/vue"],
      },
      setupTargets: ["astro", "react", "vue"],
    });

    const publicReleaseSurfaces = readTextSurfaces(publicReleaseSurfacePaths);
    expect(findBoundaryAwareVueSurfaces(publicReleaseSurfaces)).toEqual([
      "scripts/check-release-artifacts.mjs",
      "scripts/pack-public-release-artifacts.mjs",
      "scripts/published-release-acceptance.mjs",
      "scripts/release-candidate-acceptance.mjs",
      "scripts/release-packages.mjs",
    ]);

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
    expect(findBoundaryAwareVueSurfaces(publicReadmeSurfaces)).toEqual([
      "README.md",
      "packages/vue/README.md",
    ]);

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
            path === "docs/release/versioning.md" ||
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

  it("rejects unregistered Vue scripts and invalid private-package policy", () => {
    const rootManifest = JSON.parse(
      readFileSync(join(process.cwd(), "package.json"), "utf8"),
    ) as PackageManifest;
    const rootScripts = rootManifest.scripts ?? {};
    expect(
      Object.fromEntries(
        [
          "runtime:perf:vue",
          "runtime:perf:vue:baseline",
          "runtime:perf:vue:evidence:check",
          "runtime:perf:vue:check",
        ].map((name) => [name, rootScripts[name]]),
      ),
    ).toEqual({
      "runtime:perf:vue":
        "pnpm runtime:build && pnpm vue:build && node scripts/portable-runtime/measure-vue-runtime-performance.mjs",
      "runtime:perf:vue:baseline":
        "pnpm runtime:build && pnpm vue:build && node scripts/portable-runtime/measure-vue-runtime-performance.mjs --baseline",
      "runtime:perf:vue:evidence:check": existsSync("packages/svelte/package.json")
        ? "node scripts/portable-runtime/measure-vue-runtime-performance.mjs --check"
        : undefined,
      "runtime:perf:vue:check": existsSync("packages/svelte/package.json")
        ? "pnpm runtime:perf:vue:evidence:check"
        : undefined,
    });
    expect(findVueScriptPolicyViolations(rootScripts)).toEqual([]);
    expect(
      findVueScriptPolicyViolations({
        ...rootScripts,
        "runtime:size:starwind":
          "pnpm vue:build && node scripts/portable-runtime/another-size-runner.mjs",
      }),
    ).toEqual([]);
    expect(
      findVueScriptPolicyViolations({
        ...rootScripts,
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
      findVueScriptPolicyViolations({
        ...rootScripts,
        "vue:build": "pnpm --filter=@starwind-ui/vue publish",
      }),
    ).toEqual(["forbidden:vue:build"]);
    expect(
      findVueScriptPolicyViolations(
        Object.fromEntries(
          Object.entries(rootScripts).filter(([name]) => name !== "vue:typecheck"),
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
    expect(
      isApprovedVueAwarePackageManifest(approvedVueCliManifestPath, {
        description: approvedVueCliDescription,
      }),
    ).toBe(true);
    expect(
      isApprovedVueAwarePackageManifest(approvedVueCliManifestPath, {
        description: approvedVueCliDescription,
        scripts: { prepare: "vue-tsc" },
      }),
    ).toBe(false);
    expect(
      isApprovedVueAwarePackageManifest("packages/runtime/package.json", {
        description: approvedVueCliDescription,
      }),
    ).toBe(false);
  });
});
