import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { CandidatePacks } from "./candidate-packs.js";

const frameworks = ["astro", "react", "vue", "svelte"] as const;
type Framework = (typeof frameworks)[number];
type CopiedFile = { path: string; content: string };
type StyledEntry = {
  name: string;
  version: string;
  sourceVersion: string;
  targets: Partial<Record<Framework, { files: CopiedFile[] }>>;
};
type StyledRegistry = { components: StyledEntry[] };
type PrimitiveEntry = {
  component: string;
  framework: Framework;
  version: string;
  files: CopiedFile[];
};
type PrimitiveArtifacts = { primitives: PrimitiveEntry[] };
type InstalledConfig = {
  components: { name: string; framework: Framework; version: string; sourceVersion?: string }[];
  primitives: { name: string; framework: Framework; version: string }[];
};

const widgets = ["switch", "slider", "tabs"];
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function run(cwd: string, name: string, executable: string, args: string[]) {
  const output: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd,
      env: { ...process.env, CI: "1", ASTRO_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.on("data", (part) => output.push(String(part)));
    child.stderr.on("data", (part) => output.push(String(part)));
    child.once("error", reject);
    child.once("close", (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              `${name}: ${executable} ${args.join(" ")} exited ${code}\n${output.join("").slice(-7000)}`,
            ),
          ),
    );
  });
  await writeFile(path.join(cwd, `${name}.log`), output.join(""));
}

function installedPackage(file: string) {
  return `file:${file}`;
}

// The packed adapters depend on the exact Runtime version of this release. Before publication that
// version is not on npm yet, so the overrides resolve every Starwind package to its local archive.
function workspace(framework: Framework, packs: CandidatePacks) {
  const overrides = {
    "@starwind-ui/runtime": installedPackage(packs.files.runtime),
    [`@starwind-ui/${framework}`]: installedPackage(packs.files[framework]),
    starwind: installedPackage(packs.files.cli),
  };
  return [
    "packages: []",
    "allowBuilds:",
    "  esbuild: true",
    "  sharp: true",
    "overrides:",
    ...Object.entries(overrides).map(
      ([name, spec]) => `  ${JSON.stringify(name)}: ${JSON.stringify(spec)}`,
    ),
    "",
  ].join("\n");
}

function manifest(framework: Framework, packs: CandidatePacks) {
  const dependencies: Record<string, string> = {
    "@starwind-ui/runtime": installedPackage(packs.files.runtime),
    [`@starwind-ui/${framework}`]: installedPackage(packs.files[framework]),
    starwind: installedPackage(packs.files.cli),
    "@tailwindcss/forms": "^0.5.10",
    "@tailwindcss/vite": "^4.1.18",
    tailwindcss: "^4.1.18",
    "tw-animate-css": "^1.4.0",
  };
  const devDependencies: Record<string, string> = { typescript: "^5.9.3", vite: "^7.3.0" };
  if (framework === "astro") dependencies.astro = "^5.2.0";
  if (framework === "react") {
    dependencies.react = "^19.2.0";
    dependencies["react-dom"] = "^19.2.0";
    devDependencies["@types/react"] = "^19.2.0";
    devDependencies["@types/react-dom"] = "^19.2.0";
  }
  if (framework === "vue") {
    dependencies.vue = "^3.5.0";
    devDependencies["@vitejs/plugin-vue"] = "^6.0.0";
  }
  if (framework === "svelte") {
    dependencies.svelte = "^5.29.0";
    devDependencies["@sveltejs/vite-plugin-svelte"] = "^6.0.0";
  }
  return {
    name: `candidate-${framework}`,
    private: true,
    type: "module",
    scripts: {
      build: framework === "astro" ? "astro build" : "vite build",
      preview: framework === "astro" ? "astro preview" : "vite preview",
    },
    dependencies,
    devDependencies,
  };
}

function hostFiles(framework: Framework): Record<string, string> {
  const common = `<div id="ordinary" data-app-scope><span class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6" data-probe="ordinary">Ordinary</span><span id="custom-probe" class="app-scope:bg-[rgb(7,11,13)]">Custom</span></div>
<div id="page-rtl" dir="rtl"><span class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6" data-probe="rtl">RTL</span><span id="merge-probe" class="ml-2 ms-4 rtl:mr-6">Merge</span><div id="nested" dir="ltr"><span class="ltr:rotate-0 rtl:rotate-180 ml-2 rtl:mr-6" data-probe="nested">Nested</span></div></div>`;
  if (framework === "astro")
    return {
      "astro.config.mjs": `import { defineConfig } from "astro/config"; import tailwindcss from "@tailwindcss/vite"; export default defineConfig({ output: "static", vite: { plugins: [tailwindcss()] } });\n`,
      "src/pages/index.astro": `---\nimport "../styles/starwind.css";\nimport { Switch } from "@starwind-ui/astro/switch";\nimport { Switch as VendoredSwitch } from "../vendored/primitives/switch";\nimport { Switch as StyledSwitch } from "../components/starwind/switch";\n---\n<html><head><title>Candidate Astro</title></head><body><main>${common}<form id="candidate-form"><Switch.Root id="package-switch" name="package" defaultChecked><Switch.Thumb /></Switch.Root><VendoredSwitch.Root id="vendored-switch" name="vendored" defaultChecked><VendoredSwitch.Thumb /></VendoredSwitch.Root><StyledSwitch id="styled-switch" name="styled" defaultChecked label="Styled switch" /></form></main></body></html>`,
    };
  if (framework === "react")
    return {
      "tsconfig.json": `{ "compilerOptions": { "target": "ES2022", "module": "ESNext", "moduleResolution": "Bundler", "jsx": "react-jsx", "allowImportingTsExtensions": true, "noEmit": true } }`,
      "index.html": `<html><head><title>Candidate React</title></head><body><div id="app"></div><script type="module" src="/src/main.tsx"></script></body></html>`,
      "vite.config.ts": `import { defineConfig } from "vite"; import tailwindcss from "@tailwindcss/vite"; export default defineConfig({ plugins: [tailwindcss()] });`,
      "src/main.tsx": `import React from "react"; import { createRoot } from "react-dom/client"; import "./styles/starwind.css"; import { Switch } from "@starwind-ui/react/switch"; import { Switch as VendoredSwitch } from "./vendored/primitives/switch"; import { Switch as StyledSwitch } from "./components/starwind/switch";\nfunction App(){return <main>${common}<form id="candidate-form"><Switch.Root id="package-switch" name="package" defaultChecked><Switch.Thumb /></Switch.Root><VendoredSwitch.Root id="vendored-switch" name="vendored" defaultChecked><VendoredSwitch.Thumb /></VendoredSwitch.Root><StyledSwitch id="styled-switch" name="styled" defaultChecked label="Styled switch" /></form></main>} createRoot(document.getElementById("app")!).render(<App />);`,
    };
  if (framework === "vue")
    return {
      "index.html": `<html><head><title>Candidate Vue</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
      "vite.config.ts": `import { defineConfig } from "vite"; import vue from "@vitejs/plugin-vue"; import tailwindcss from "@tailwindcss/vite"; export default defineConfig({ plugins: [vue(), tailwindcss()] });`,
      "src/main.ts": `import { createApp } from "vue"; import "./styles/starwind.css"; import App from "./App.vue"; createApp(App).mount("#app");`,
      "src/App.vue": `<script setup lang="ts">import { Switch } from "@starwind-ui/vue/switch"; import { Switch as VendoredSwitch } from "./vendored/primitives/switch"; import { Switch as StyledSwitch } from "./components/starwind/switch";</script><template><main>${common}<form id="candidate-form"><Switch.Root id="package-switch" name="package" default-checked><Switch.Thumb /></Switch.Root><VendoredSwitch.Root id="vendored-switch" name="vendored" default-checked><VendoredSwitch.Thumb /></VendoredSwitch.Root><StyledSwitch id="styled-switch" name="styled" default-checked label="Styled switch" /></form></main></template>`,
    };
  return {
    "index.html": `<html><head><title>Candidate Svelte</title></head><body><div id="app"></div><script type="module" src="/src/main.ts"></script></body></html>`,
    "vite.config.ts": `import { defineConfig } from "vite"; import { svelte } from "@sveltejs/vite-plugin-svelte"; import tailwindcss from "@tailwindcss/vite"; export default defineConfig({ plugins: [svelte(), tailwindcss()] });`,
    "src/main.ts": `import { mount } from "svelte"; import "./styles/starwind.css"; import App from "./App.svelte"; mount(App, { target: document.getElementById("app")! });`,
    "src/App.svelte": `<script lang="ts">import Switch from "@starwind-ui/svelte/switch"; import VendoredSwitch from "./vendored/primitives/switch/index.js"; import StyledSwitch from "./components/starwind/switch/index.js";</script><main>${common}<form id="candidate-form"><Switch.Root id="package-switch" name="package" defaultChecked><Switch.Thumb /></Switch.Root><VendoredSwitch.Root id="vendored-switch" name="vendored" defaultChecked><VendoredSwitch.Thumb /></VendoredSwitch.Root><StyledSwitch id="styled-switch" name="styled" defaultChecked label="Styled switch" /></form></main>`,
  };
}

function withCompensatedControls(framework: Framework, entries: Record<string, string>) {
  const imports =
    framework === "astro"
      ? `import { Slider as StyledSlider } from "../components/starwind/slider";\nimport Tabs from "../components/starwind/tabs";\n`
      : framework === "react"
        ? `import { Slider as StyledSlider } from "./components/starwind/slider"; import Tabs from "./components/starwind/tabs";\n`
        : framework === "vue"
          ? `import { Slider as StyledSlider } from "./components/starwind/slider"; import Tabs from "./components/starwind/tabs"; `
          : `import StyledSlider from "./components/starwind/slider/index.js"; import Tabs from "./components/starwind/tabs/index.js"; `;
  const sliderValue = framework === "vue" ? `:default-value="25"` : `defaultValue={25}`;
  const tabValue = framework === "vue" ? `default-value="one"` : `defaultValue="one"`;
  const className = framework === "react" ? "className" : "class";
  const controls = `<StyledSlider id="ltr-slider" aria-label="LTR slider" dir="ltr" ${sliderValue} ${className}="w-64" /><StyledSlider id="rtl-slider" aria-label="RTL slider" dir="rtl" ${sliderValue} ${className}="w-64" />
<Tabs.Root id="rtl-tabs" dir="rtl" ${tabValue}><Tabs.List><Tabs.Trigger value="one">One</Tabs.Trigger><Tabs.Trigger value="two">Two</Tabs.Trigger></Tabs.List><Tabs.Content value="one">First</Tabs.Content><Tabs.Content value="two">Second</Tabs.Content></Tabs.Root>`;
  const filename =
    framework === "astro"
      ? "src/pages/index.astro"
      : framework === "react"
        ? "src/main.tsx"
        : framework === "vue"
          ? "src/App.vue"
          : "src/App.svelte";
  const source = entries[filename];
  assert(source, `${framework} fixture missing`);
  const withImports =
    framework === "astro"
      ? source.replace(`---\n<html>`, `${imports}---\n<html>`)
      : framework === "react"
        ? source.replace("function App()", `${imports}function App()`)
        : source.replace("</script>", `${imports}</script>`);
  const updated = withImports.replace("</form></main>", `</form>${controls}</main>`);
  assert(updated !== source && updated.includes(controls), `${framework} controls did not mount`);
  return { ...entries, [filename]: updated };
}

async function files(root: string, entries: Record<string, string>) {
  for (const [name, contents] of Object.entries(entries)) {
    const target = path.join(root, name);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
}

function historicalRegistry<T>(repoRoot: string, revision: string, file: string): T {
  return JSON.parse(
    execFileSync("git", ["show", `${revision}:${file}`], {
      cwd: repoRoot,
      encoding: "utf8",
      maxBuffer: 64 * 1024 * 1024,
    }),
  ) as T;
}

// The public sync uses its own commit history. Both revisions must identify the same shipped Switch entries.
function reachableRevision(repo: string, revisions: string[]) {
  const match = revisions.find(
    (revision) =>
      spawnSync("git", ["merge-base", "--is-ancestor", revision, "HEAD"], { cwd: repo }).status ===
      0,
  );
  assert(match, "Full history required for historical Switch registry: " + revisions.join(", "));
  return match;
}
function stableReleaseRevision(repo: string) {
  const revision = execFileSync("git", ["rev-parse", "--verify", "refs/tags/v3.3.2^{commit}"], {
    cwd: repo,
    encoding: "utf8",
  }).trim();
  assert.equal(revision, "862ae09802a105d06d7e4a50b8ef992b33203d57", "Pinned v3.3.2 release");
  return revision;
}

export function loadHistoricalSwitchRegistries(repo: string) {
  const revisions = {
    styled: reachableRevision(repo, [
      "0a993768904c7670e73537c77910a6f84bc58df3",
      "12ad6b079af0919897676211fa25a3ae5669f567",
    ]),
    stable: stableReleaseRevision(repo),
    svelte: reachableRevision(repo, [
      "a88da326b0b7c63a2147a0305879f5d7a2c57ff8",
      "eae0233c05ae6cdef4978787fc4a202beb1eb023",
    ]),
  };
  const styled = historicalRegistry<StyledRegistry>(
    repo,
    revisions.styled,
    "packages/cli/src/registry/bundled-registry.json",
  ).components.filter((c) => c.name === "switch");
  const primitiveFile = "packages/cli/src/registry/primitive-vendoring-artifacts.json";
  const stable = historicalRegistry<PrimitiveArtifacts>(
    repo,
    revisions.stable,
    primitiveFile,
  ).primitives.filter(
    (c) => c.component === "switch" && ["astro", "react", "vue"].includes(c.framework),
  );
  const svelte = historicalRegistry<PrimitiveArtifacts>(
    repo,
    revisions.svelte,
    primitiveFile,
  ).primitives.filter((c) => c.component === "switch" && c.framework === "svelte");
  const digests = {
    styled: hash(JSON.stringify(styled)),
    stable: hash(JSON.stringify(stable)),
    svelte: hash(JSON.stringify(svelte)),
  };
  assert.deepEqual(
    digests,
    {
      styled: "2cad8ac32ab3797d08790e3e7c68933ade4c3603ef4f95ff7f833944a5c857dc",
      stable: "c13762b3be223ab5a08facd4e6c46c45a565e0203761edcd8353122630809acc",
      svelte: "c1015f3700933481c1f66fce314c2e7af32baf82456bf93048b0e25524f4d826",
    },
    "Historical Switch registry bytes",
  );
  return {
    oldRegistry: { components: styled },
    oldStablePrimitives: { primitives: stable },
    oldSveltePrimitives: { primitives: svelte },
    revisions,
    digests,
  };
}

async function seedRetainedSource(root: string, framework: Framework, registry: StyledRegistry) {
  const switchEntry = registry.components.find((component) => component.name === "switch");
  const oldTarget = switchEntry?.targets[framework];
  assert(switchEntry && oldTarget, `Historical ${framework} Switch source is missing`);
  for (const file of oldTarget.files) {
    const target = path.join(root, file.path);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, file.content);
  }
  const configPath = path.join(root, "starwind.config.json");
  const config = JSON.parse(await readFile(configPath, "utf8")) as InstalledConfig;
  const item = config.components.find(
    (component) => component.name === "switch" && component.framework === framework,
  );
  assert(item, `${framework} installed Switch config is missing`);
  item.version = switchEntry.version;
  item.sourceVersion = switchEntry.sourceVersion;
  await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  return { sourceVersion: switchEntry.sourceVersion, version: switchEntry.version };
}

export async function installCandidateHosts(repoRoot: string, root: string, packs: CandidatePacks) {
  const { oldRegistry, oldStablePrimitives, oldSveltePrimitives, revisions, digests } =
    loadHistoricalSwitchRegistries(repoRoot);
  const currentRegistry = JSON.parse(
    await readFile(
      path.join(packs.root, "packages/cli/src/registry/bundled-registry.json"),
      "utf8",
    ),
  ) as StyledRegistry;
  const currentPrimitives = JSON.parse(
    await readFile(
      path.join(packs.root, "packages/cli/src/registry/primitive-vendoring-artifacts.json"),
      "utf8",
    ),
  ) as PrimitiveArtifacts;
  const results: Record<string, unknown>[] = [];
  for (const framework of frameworks) {
    for (const mode of ["fresh", "retained"] as const) {
      const host = path.join(root, `${framework}-${mode}`);
      await mkdir(host, { recursive: true });
      await files(host, {
        "package.json": `${JSON.stringify(manifest(framework, packs), null, 2)}\n`,
        "pnpm-workspace.yaml": workspace(framework, packs),
        ...withCompensatedControls(framework, hostFiles(framework)),
      });
      await run(host, "install", "pnpm", ["install"]);
      const cli = path.join(host, "node_modules/starwind/dist/index.js");
      await run(host, "init", process.execPath, [
        cli,
        "init",
        "--defaults",
        "--framework",
        framework,
      ]);
      const cssPath = path.join(host, "src/styles/starwind.css");
      const initializedCss = await readFile(cssPath, "utf8");
      const oldCss = initializedCss.replace(/^@custom-variant (rtl|ltr) .*\n/gm, "");
      assert.notEqual(oldCss, initializedCss, "Expected two scoped direction definitions");
      const authoredCss = `\n@custom-variant app-scope (&:where([data-app-scope], [data-app-scope] *));\n`;
      await writeFile(cssPath, `${mode === "retained" ? oldCss : initializedCss}${authoredCss}`);
      const preservedCss = await readFile(cssPath, "utf8");
      await run(host, "styled-add", process.execPath, [cli, "add", ...widgets, "--yes"]);
      await run(host, "primitive-add", process.execPath, [
        cli,
        "primitives",
        "add",
        ...widgets,
        "--yes",
        "--framework",
        framework,
        "--to",
        "src/vendored/primitives",
      ]);
      let oldSource: unknown;
      let oldPrimitive: unknown;
      if (mode === "retained") {
        oldSource = await seedRetainedSource(host, framework, oldRegistry);
        const oldSwitch = oldRegistry.components.find((component) => component.name === "switch");
        const currentSwitch = currentRegistry.components.find(
          (component) => component.name === "switch",
        );
        const oldFiles = oldSwitch?.targets[framework]?.files;
        const currentFiles = currentSwitch?.targets[framework]?.files;
        assert(oldFiles && currentFiles && currentSwitch, `${framework} Switch files missing`);
        const changedFiles = currentFiles.filter(
          (file) =>
            oldFiles.find((oldFile) => oldFile.path === file.path)?.content !== file.content,
        );
        assert(changedFiles.length > 0, `${framework} old and current Switch source are identical`);
        await run(host, "styled-update", process.execPath, [
          cli,
          "update",
          "switch",
          "--yes",
          "--framework",
          framework,
        ]);
        const config = JSON.parse(
          await readFile(path.join(host, "starwind.config.json"), "utf8"),
        ) as InstalledConfig;
        const switchEntry = config.components.find(
          (component) => component.name === "switch" && component.framework === framework,
        );
        assert.equal(switchEntry?.version, currentSwitch.version);
        for (const file of currentFiles)
          assert.equal(
            await readFile(path.join(host, file.path), "utf8"),
            file.content,
            `${framework} ${file.path} copied update differs`,
          );
        oldSource = {
          ...(oldSource as object),
          currentVersion: currentSwitch.version,
          currentSourceVersion: currentSwitch.sourceVersion,
          changedFiles: changedFiles.map((file) => ({
            path: file.path,
            oldHash: hash(oldFiles.find((oldFile) => oldFile.path === file.path)?.content ?? ""),
            newHash: hash(file.content),
          })),
        };
        const oldPrimitiveRevision = framework === "svelte" ? revisions.svelte : revisions.stable;
        const oldPrimitiveArtifacts =
          framework === "svelte" ? oldSveltePrimitives : oldStablePrimitives;
        const oldPrimitiveEntry = oldPrimitiveArtifacts.primitives.find(
          (entry) => entry.component === "switch" && entry.framework === framework,
        );
        const currentPrimitiveEntry = currentPrimitives.primitives.find(
          (entry) => entry.component === "switch" && entry.framework === framework,
        );
        assert(
          oldPrimitiveEntry && currentPrimitiveEntry,
          `${framework} historical Primitive Switch missing`,
        );
        const oldPrimitiveFiles = oldPrimitiveEntry.files.filter((file) =>
          file.path.includes("/switch/"),
        );
        const currentPrimitiveFiles = currentPrimitiveEntry.files.filter((file) =>
          file.path.includes("/switch/"),
        );
        const vendoredPath = (file: string) =>
          path.join(
            host,
            file.replace("src/components/starwind-primitives/", "src/vendored/primitives/"),
          );
        for (const file of oldPrimitiveFiles)
          await writeFile(vendoredPath(file.path), file.content);
        const primitiveConfig = JSON.parse(
          await readFile(path.join(host, "starwind.config.json"), "utf8"),
        ) as InstalledConfig;
        const installedPrimitive = primitiveConfig.primitives.find(
          (entry) => entry.name === "switch" && entry.framework === framework,
        );
        assert(installedPrimitive, `${framework} vendored Switch config missing`);
        installedPrimitive.version = oldPrimitiveEntry.version;
        await writeFile(
          path.join(host, "starwind.config.json"),
          `${JSON.stringify(primitiveConfig, null, 2)}\n`,
        );
        await run(host, "primitive-update", process.execPath, [
          cli,
          "primitives",
          "update",
          "switch",
          "--yes",
          "--framework",
          framework,
        ]);
        const upgradedConfig = JSON.parse(
          await readFile(path.join(host, "starwind.config.json"), "utf8"),
        ) as InstalledConfig;
        assert.equal(
          upgradedConfig.primitives.find(
            (entry) => entry.name === "switch" && entry.framework === framework,
          )?.version,
          currentPrimitiveEntry.version,
        );
        for (const file of currentPrimitiveFiles)
          assert.equal(
            await readFile(vendoredPath(file.path), "utf8"),
            file.content,
            `${framework} ${file.path} vendored update differs`,
          );
        const changedPrimitiveFiles = currentPrimitiveFiles
          .filter(
            (file) =>
              oldPrimitiveFiles.find((old) => old.path === file.path)?.content !== file.content,
          )
          .map((file) => file.path);
        assert(
          changedPrimitiveFiles.length > 0,
          `${framework} vendored Switch source did not change`,
        );
        oldPrimitive = {
          revision: oldPrimitiveRevision,
          oldVersion: oldPrimitiveEntry.version,
          currentVersion: currentPrimitiveEntry.version,
          changedFiles: changedPrimitiveFiles,
        };
      }
      assert.equal(
        await readFile(cssPath, "utf8"),
        preservedCss,
        `${framework} ${mode} stylesheet changed during install/update`,
      );
      await run(host, "build", "pnpm", ["build"]);
      results.push({
        framework,
        mode,
        host,
        stylesheetHash: hash(preservedCss),
        oldSource,
        oldPrimitive,
        build: "passed",
      });
      await writeFile(
        path.join(root, "installed-hosts.json"),
        `${JSON.stringify({ sourceSha: packs.sourceSha, archiveHashes: packs.archiveHashes, historicalRevisions: revisions, historicalDigests: digests, results }, null, 2)}\n`,
      );
    }
  }
  return results;
}
