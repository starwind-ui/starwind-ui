import { execFileSync, spawn } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { afterAll, describe, expect, it } from "vitest";

import {
  checkPackageDocs,
  PACKAGE_DOCS_KEYS,
  PACKAGE_DOCS_PACKAGES,
  type PackageDocsKey,
  renderPackageDocs,
  writePackageDocs,
} from "../generate-package-docs.js";
import {
  readDeclaredType,
  readSveltePropTypes,
  readSvelteWrappedComponentSource,
  readVueComponentFacts,
} from "../package-docs/source-facts.js";
import {
  absolutizeSiteLinks,
  findBrokenPackageDocsLinks,
  findSiteRelativePackageDocsLinks,
  validatePackageDocs,
} from "../package-docs/validate-docs.mjs";
import {
  measurePackedDocs,
  PACKAGE_DOCS_BUDGET,
  verifyPackedPackageDocs,
} from "../package-docs/verify-packed-docs.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const temporaryRoots: string[] = [];

const makeTemporaryRoot = (prefix: string) => {
  const root = mkdtempSync(path.join(os.tmpdir(), prefix));
  temporaryRoots.push(root);
  return root;
};

afterAll(() => {
  for (const root of temporaryRoots) rmSync(root, { recursive: true, force: true });
});

const readManifest = (key: PackageDocsKey) =>
  JSON.parse(
    readFileSync(
      path.join(REPO_ROOT, PACKAGE_DOCS_PACKAGES[key].directory, "package.json"),
      "utf8",
    ),
  ) as { name: string; version: string; exports?: Record<string, unknown> };

const rendered = new Map(PACKAGE_DOCS_KEYS.map((key) => [key, renderPackageDocs({ key }).files]));

const docsText = (key: PackageDocsKey) => [...rendered.get(key)!.values()].join("\n");

/** Copies only the inputs that the generator reads, so a test can change one manifest. */
const copyGeneratorInputs = (root: string, keys: readonly PackageDocsKey[]) => {
  const manifest = "scripts/portable-runtime/framework-surface-manifest.json";
  mkdirSync(path.join(root, path.dirname(manifest)), { recursive: true });
  cpSync(path.join(REPO_ROOT, manifest), path.join(root, manifest));
  for (const key of new Set<PackageDocsKey>(["runtime", ...keys])) {
    const directory = PACKAGE_DOCS_PACKAGES[key].directory;
    cpSync(path.join(REPO_ROOT, directory, "src"), path.join(root, directory, "src"), {
      recursive: true,
    });
    cpSync(
      path.join(REPO_ROOT, directory, "package.json"),
      path.join(root, directory, "package.json"),
    );
  }
};

const createArchive = (files: ReadonlyMap<string, string>) => {
  const root = makeTemporaryRoot("package-docs-archive-");
  const stage = path.join(root, "package");
  for (const [file, contents] of files) {
    mkdirSync(path.dirname(path.join(stage, file)), { recursive: true });
    writeFileSync(path.join(stage, file), contents);
  }
  const archive = path.join(root, "package.tgz");
  execFileSync("tar", ["-czf", archive, "-C", root, "package"]);
  return archive;
};

describe("installed package docs", () => {
  it.each(PACKAGE_DOCS_KEYS)("renders valid docs for %s at the manifest version", (key) => {
    const { name, version } = readManifest(key);
    const files = rendered.get(key)!;
    expect(files.has("docs/README.md")).toBe(true);
    expect(files.has("docs/llms.txt")).toBe(true);
    expect(validatePackageDocs({ files, name, version })).toEqual([]);
    for (const [file, contents] of files) {
      expect(contents, file).toContain(`- Version: ${version}\n`);
      expect(contents, file).not.toContain("::example");
    }
  });

  it.each(PACKAGE_DOCS_KEYS)("opens %s component pages with shared usage copy", (key) => {
    const directory = key === "runtime" ? "docs/controllers/" : "docs/primitives/";
    for (const [file, contents] of rendered.get(key)!) {
      if (!file.startsWith(directory)) continue;
      const introduction = contents.split("\n\n")[1];
      expect(introduction, file).toMatch(/^Use /);
      expect(introduction, file).not.toContain("contract family");
    }
  });

  it.each(PACKAGE_DOCS_KEYS)("starts the %s Select examples with two choices", (key) => {
    const file = key === "runtime" ? "docs/controllers/select.md" : "docs/primitives/select.md";
    const contents = rendered.get(key)!.get(file)!;
    const firstExample = contents.split(/^```[^\n]*\n/m)[1];
    const secondChoice = key === "svelte" ? "svelte" : "react";
    expect(firstExample).toContain(`value="astro"`);
    expect(firstExample).toContain(`value="${secondChoice}"`);
    if (key === "runtime") expect(firstExample).toContain('data-sw-select-input type="hidden"');
    expect(contents.match(/^## Examples$/gm)?.length ?? 0).toBe(key === "runtime" ? 0 : 1);
  });

  it("renders the same output twice", () => {
    for (const key of PACKAGE_DOCS_KEYS) {
      expect(renderPackageDocs({ key }).files).toEqual(rendered.get(key));
    }
  });

  it("reads the version from the package manifest at generation time", () => {
    const root = makeTemporaryRoot("package-docs-version-");
    copyGeneratorInputs(root, ["vue"]);
    const manifestPath = path.join(root, "packages/vue/package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, version: "0.99.0-next.1" }));
    const { files } = renderPackageDocs({ key: "vue", repoRoot: root });
    expect(files.get("docs/README.md")).toContain("- Version: 0.99.0-next.1\n");
    expect(
      validatePackageDocs({ files, name: "@starwind-ui/vue", version: manifest.version }),
    ).toContain(
      `@starwind-ui/vue: docs/README.md documents version 0.99.0-next.1, expected ${manifest.version}`,
    );
  });

  it("refuses a package that does not allowlist its docs folder", () => {
    const root = makeTemporaryRoot("package-docs-files-");
    copyGeneratorInputs(root, ["react"]);
    const manifestPath = path.join(root, "packages/react/package.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    writeFileSync(manifestPath, JSON.stringify({ ...manifest, files: ["dist"] }));
    expect(() => renderPackageDocs({ key: "react", repoRoot: root })).toThrow(
      'must list "docs" in package files',
    );
  });

  it("reports missing, stale, and unexpected files on disk", () => {
    const root = makeTemporaryRoot("package-docs-check-");
    copyGeneratorInputs(root, ["svelte"]);
    writePackageDocs({ key: "svelte", repoRoot: root });
    expect(checkPackageDocs({ key: "svelte", repoRoot: root })).toEqual([]);
    const docs = path.join(root, "packages/svelte/docs");
    rmSync(path.join(docs, "theme.md"));
    writeFileSync(path.join(docs, "README.md"), "- Version: 0.0.1\n");
    writeFileSync(path.join(docs, "old.md"), "old");
    expect(checkPackageDocs({ key: "svelte", repoRoot: root })).toEqual([
      "@starwind-ui/svelte: missing docs/theme.md",
      "@starwind-ui/svelte: stale docs/README.md",
      "@starwind-ui/svelte: unexpected docs/old.md",
    ]);
  });

  it("documents every published Primitive family and Runtime controller", () => {
    for (const key of ["vue", "svelte"] as const) {
      const exported = Object.keys(readManifest(key).exports ?? {})
        .map((subpath) => subpath.replace(/^\.\//, ""))
        .filter((subpath) => subpath !== "." && subpath !== "theme" && subpath !== "package.json");
      for (const family of exported) {
        expect(rendered.get(key)!.has(`docs/primitives/${family}.md`), `${key}/${family}`).toBe(
          true,
        );
      }
    }
    const surface = JSON.parse(
      readFileSync(
        path.join(REPO_ROOT, "scripts/portable-runtime/framework-surface-manifest.json"),
        "utf8",
      ),
    ) as { targets: Record<string, { familySubpaths: string[] }> };
    for (const key of ["astro", "react", "vue", "svelte"] as const) {
      const families = surface.targets[key]!.familySubpaths.filter(
        (subpath) => subpath !== "./theme",
      );
      expect(
        [...rendered.get(key)!.keys()].filter((file) => file.startsWith("docs/primitives/")),
      ).toHaveLength(families.length);
    }
    const runtimeSubpaths = Object.keys(readManifest("runtime").exports ?? {})
      .map((subpath) => subpath.replace(/^\.\//, ""))
      .filter((subpath) => ![".", "init-starwind", "theme", "package.json"].includes(subpath));
    for (const subpath of runtimeSubpaths) {
      expect(rendered.get("runtime")!.has(`docs/controllers/${subpath}.md`), subpath).toBe(true);
    }
  });

  it("labels stable packages and keeps framework syntax in its own package", () => {
    for (const key of ["vue", "svelte"] as const) {
      const text = docsText(key);
      expect(rendered.get(key)!.get("docs/README.md")).toContain("- Status: stable");
      expect(text).not.toContain("public beta");
      expect(text).not.toContain(`@starwind-ui/${key}@beta`);
      for (const other of ["astro", "react", key === "vue" ? "svelte" : "vue"]) {
        expect(text).not.toContain(`@starwind-ui/${other}/`);
      }
      expect(text).not.toContain("className=");
      expect(text).not.toMatch(/\bThemeInitScript\b(?!Options)/);
    }
    expect(docsText("vue")).toContain("`v-model:open`");
    expect(docsText("vue")).toContain("`@open-change`");
    expect(docsText("svelte")).toContain("`bind:open`");
    expect(docsText("svelte")).not.toContain("v-model");
    for (const key of ["astro", "react"] as const) {
      expect(rendered.get(key)!.get("docs/README.md")).toContain("- Status: stable");
      expect(docsText(key)).not.toContain("public beta");
      expect(rendered.get(key)!.get("docs/theme.md")).toContain("ThemeInitScript");
    }
    for (const key of ["astro", "react", "vue", "svelte"] as const) {
      const install = /^npm install .+$/m.exec(rendered.get(key)!.get("docs/README.md")!)?.[0];
      // Shell operators in peer ranges, such as ">=", must stay inside quotes.
      expect(install?.replace(/"[^"]*"/g, "")).not.toMatch(/[<>]/);
    }
    // Astro components emit DOM events and take no callback props.
    expect(rendered.get("astro")!.get("docs/primitives/dialog.md")).not.toContain(
      "| `onOpenChange` |",
    );
    expect(rendered.get("astro")!.get("docs/primitives/dialog.md")).toContain(
      "`starwind:open-change`",
    );
    expect(rendered.get("react")!.get("docs/primitives/dialog.md")).toContain("| `onOpenChange` |");
  });

  it("reads Runtime option and callback types from source", () => {
    const dialog = rendered.get("runtime")!.get("docs/controllers/dialog.md")!;
    expect(dialog).toContain(
      "createDialog(root: HTMLElement, options?: DialogOptions): DialogInstance",
    );
    expect(dialog).toContain("`(details: DialogCloseCompleteDetails) => void`");
    expect(rendered.get("svelte")!.get("docs/primitives/dialog.md")).toContain(
      "`(open: boolean, detail: DialogOpenChangeDetails) => void`",
    );
  });

  it("reads declared types that a formatter wrapped across lines", () => {
    const source = [
      "type Props = {",
      "  side?:",
      '    | "top"',
      '    | "bottom";',
      '  align?: "start" | "end";',
      "  onOpenChange?: (open: boolean, details: Details) => void;",
      "};",
    ].join("\n");
    expect(readDeclaredType(source, "side")).toBe('"top" | "bottom"');
    expect(readDeclaredType(source, "align")).toBe('"start" | "end"');
    expect(readDeclaredType(source, "onOpenChange")).toBe(
      "(open: boolean, details: Details) => void",
    );
    expect(readDeclaredType(source, "missing")).toBeUndefined();
  });

  it("finds relative links that leave the package or miss a file", () => {
    const files = new Map([
      ["package.json", "{}"],
      [
        "docs/README.md",
        [
          "[ok](theme.md) [up](../package.json) [site](https://starwind.dev/) [anchor](#top)",
          "[missing](primitives/none.md) [escape](../../outside.md)",
          "```ts\nconst value = list[0](input);\n```",
        ].join("\n"),
      ],
      ["docs/theme.md", ""],
    ]);
    expect(findBrokenPackageDocsLinks(files)).toEqual([
      "docs/README.md -> primitives/none.md",
      "docs/README.md -> ../../outside.md",
    ]);
  });

  it("checks packed archives for docs, their version, links, and size budget", () => {
    const { name, version } = readManifest("svelte");
    const docs = rendered.get("svelte")!;
    const manifest = JSON.stringify({ name, version });
    const complete = new Map([["package.json", manifest], ...docs]);
    const completeArchive = createArchive(complete);
    const report = verifyPackedPackageDocs({ archive: completeArchive, name, version });
    expect(report.docs).toEqual([...docs.keys()].sort());
    expect(report.docsFileCount).toBe(docs.size);
    expect(report.docsRawBytes).toBe(
      [...docs.values()].reduce((total, text) => total + Buffer.byteLength(text), 0),
    );
    expect(report.docsGzipBytes).toBeGreaterThan(0);
    expect(report.archiveBytes).toBeGreaterThan(0);
    expect(report.failures).toEqual([]);

    const missing = new Map([["package.json", manifest]]);
    expect(() =>
      verifyPackedPackageDocs({ archive: createArchive(missing), name, version }),
    ).toThrow(`${name}: missing docs/README.md`);

    const newer = new Map([["package.json", JSON.stringify({ name, version: "9.0.0" })], ...docs]);
    expect(() =>
      verifyPackedPackageDocs({ archive: createArchive(newer), name, version: "9.0.0" }),
    ).toThrow(`docs/README.md documents version ${version}, expected 9.0.0`);

    const broken = new Map(complete);
    broken.delete("docs/theme.md");
    expect(() =>
      verifyPackedPackageDocs({ archive: createArchive(broken), name, version }),
    ).toThrow("broken relative link docs/README.md -> theme.md");

    const siteRelative = new Map(complete);
    siteRelative.set(
      "docs/theme.md",
      `${docs.get("docs/theme.md")}\n[guide](/docs/getting-started/dark-mode/)\n`,
    );
    expect(() =>
      verifyPackedPackageDocs({ archive: createArchive(siteRelative), name, version }),
    ).toThrow(
      "site-relative link docs/theme.md -> /docs/getting-started/dark-mode/; use https://starwind.dev/docs/getting-started/dark-mode/",
    );

    expect(() =>
      verifyPackedPackageDocs({
        archive: completeArchive,
        name,
        version,
        budget: { maxGzipBytes: 1024, maxRawBytes: 4096 },
      }),
    ).toThrow(/docs gzip estimate \d+ B exceeds 1024 B[\s\S]*docs unpacked \d+ B exceeds 4096 B/);
  });

  it.each(PACKAGE_DOCS_KEYS)("keeps %s docs inside the docs budget", (key) => {
    const contents = new Map(
      [...rendered.get(key)!].map(([file, text]) => [file, Buffer.from(text)] as const),
    );
    const report = measurePackedDocs({ archiveBytes: 0, contents });
    expect(report.failures).toEqual([]);
    expect(report.docsGzipBytes).toBeLessThanOrEqual(PACKAGE_DOCS_BUDGET.maxGzipBytes);
    expect(report.docsRawBytes).toBeLessThanOrEqual(PACKAGE_DOCS_BUDGET.maxRawBytes);
  });

  it("rewrites site-relative links to the Starwind website and leaves code alone", () => {
    const text = [
      "[tabs](/docs/components/tabs/#animated-panels) [kept](https://starwind.dev/) [local](theme.md)",
      "`[code](/docs/inline/)`",
      "```md\n[fenced](/docs/fenced/)\n```",
      "[protocol](//cdn.example.com/x)",
      "[`Tabs` example](/docs/components/tabs/)",
    ].join("\n");
    expect(absolutizeSiteLinks(text)).toBe(
      [
        "[tabs](https://starwind.dev/docs/components/tabs/#animated-panels) [kept](https://starwind.dev/) [local](theme.md)",
        "`[code](/docs/inline/)`",
        "```md\n[fenced](/docs/fenced/)\n```",
        "[protocol](//cdn.example.com/x)",
        "[`Tabs` example](https://starwind.dev/docs/components/tabs/)",
      ].join("\n"),
    );
  });

  it.each(PACKAGE_DOCS_KEYS)("links %s docs to the website with absolute URLs", (key) => {
    const files = rendered.get(key)!;
    expect(findSiteRelativePackageDocsLinks(files)).toEqual([]);
  });

  it.each(PACKAGE_DOCS_KEYS)("links the %s Tabs page to the website example", (key) => {
    const page = key === "runtime" ? "docs/controllers/tabs.md" : "docs/primitives/tabs.md";
    const tabs = rendered.get(key)!.get(page)!;
    expect(tabs).toContain("(https://starwind.dev/docs/components/tabs/#animated-panels)");
    expect(tabs).not.toContain("](/docs/");
  });

  it("reads Svelte prop types from the instance Props declaration", () => {
    const button = rendered.get("svelte")!.get("docs/primitives/button.md")!;
    expect(button).toContain("| `children` | `Snippet` |");
    expect(button).not.toContain("ChildSnippet");
    expect(button).toContain("| `disabled` | `boolean` |");
    expect(button).toContain("| `focusableWhenDisabled` | `boolean` |");
    expect(button).toContain('| `type` | `HTMLButtonAttributes["type"]` |');

    const source = [
      '<script module lang="ts">',
      "export type ChildPayload = { children?: ChildSnippet; disabled?: string };",
      "</script>",
      '<script lang="ts">',
      "type Props = Omit<HTMLAttributes, 'children'> & { children?: Snippet; \"disabled\"?: boolean }",
      "  & ((Span & { nativeButton?: false; ref?: (node: HTMLSpanElement | null) => void })",
      "  | (Button & { nativeButton: true; ref?: (node: HTMLButtonElement | null) => void }));",
      "let { children, disabled, ...rest }: Props = $props();",
      "</script>",
    ].join("\n");
    expect(Object.fromEntries(readSveltePropTypes(source))).toEqual({
      children: "Snippet",
      disabled: "boolean",
      nativeButton: "boolean",
      ref: "((node: HTMLSpanElement | null) => void) | ((node: HTMLButtonElement | null) => void)",
    });
  });

  it("reads Vue props, models, and events from every declaration form", () => {
    const scriptSetup = [
      '<script setup lang="ts">',
      "type NativeElementProps = /* @vue-ignore */ HTMLAttributes;",
      "const props = defineProps<{ disabled?: boolean } & NativeElementProps>();",
      "const modelValue = defineModel<SliderValue>();",
      'const open = defineModel<boolean>("open");',
      "const emit = defineEmits<{",
      '  "update:open": [open: boolean];',
      "  valueChange: [value: SliderValue, detail: SliderValueChangeDetails];",
      "}>();",
      "</script>",
    ].join("\n");
    expect(readVueComponentFacts(scriptSetup)).toEqual({
      props: [
        { name: "disabled", type: "boolean" },
        { name: "modelValue", type: "SliderValue" },
        { name: "open", type: "boolean" },
      ],
      emits: [
        { name: "valueChange", args: "[value: SliderValue, detail: SliderValueChangeDetails]" },
      ],
      models: ["open", "modelValue"],
    });

    const objectOptions = [
      '<script lang="ts">',
      "const Inner = defineComponent({ props: { ignored: String } });",
      "export default defineComponent({",
      "  props: {",
      "    id: { type: String, default: undefined },",
      "    chart: { type: [Object, Function] as PropType<ChartSource<any>>, default: undefined },",
      "    interactive: Boolean,",
      "    visible: { type: Array as PropType<readonly string[]>, default: undefined },",
      "    formatter: {",
      "      type: Function as PropType<",
      "        (",
      "          value: unknown,",
      "          name: string,",
      "        ) => VNodeChild",
      "      >,",
      "    },",
      "  },",
      "  emits: {",
      '    "update:visible": (_visible: string[]) => true,',
      "    visibleChange: (_visible: string[], _details: ChartVisibleChangeDetails) => true,",
      "  },",
      "});",
      "</script>",
    ].join("\n");
    expect(readVueComponentFacts(objectOptions)).toEqual({
      props: [
        { name: "id", type: "string" },
        { name: "chart", type: "ChartSource<any>" },
        { name: "interactive", type: "boolean" },
        { name: "visible", type: "readonly string[]" },
        { name: "formatter", type: "(value: unknown, name: string) => VNodeChild" },
      ],
      emits: [
        { name: "visibleChange", args: "[visible: string[], details: ChartVisibleChangeDetails]" },
      ],
      models: ["visible"],
    });
  });

  it("documents every Vue model as a v-model binding row", () => {
    const docs = rendered.get("vue")!;
    for (const file of ["slider", "input", "input-otp"]) {
      const contents = docs.get(`docs/primitives/${file}.md`)!;
      expect(contents, file).toMatch(/^\| `modelValue` \| `[^`]+` \| `v-model` \|/m);
    }
  });

  it("shows the two-argument callback signature for every Svelte callback prop", () => {
    for (const [file, contents] of rendered.get("svelte")!) {
      for (const row of contents.match(/^\| `on[A-Z]\w*` \| .*$/gm) ?? []) {
        expect(row, file).toContain("=>");
      }
    }
    const colorPicker = rendered.get("svelte")!.get("docs/primitives/color-picker.md")!;
    expect(colorPicker).toContain(
      "| `onValueChange` | `(value: ColorPickerColor \\| null, details: ColorPickerValueChangeDetails) => void` |",
    );
  });

  it("lists the props a Svelte wrapper passes through to the wrapped component", () => {
    const root = makeTemporaryRoot("package-docs-svelte-wrapper-");
    mkdirSync(path.join(root, "src/input"), { recursive: true });
    writeFileSync(path.join(root, "src/input/InputRoot.svelte"), "<script>wrapped</script>");
    const wrapper = [
      '<script module lang="ts">',
      'import InputRoot from "../input/InputRoot.svelte";',
      "export interface FieldControlProps extends ComponentProps<typeof InputRoot> {}",
      "</script>",
    ].join("\n");
    expect(readSvelteWrappedComponentSource(root, "field", wrapper)).toBe(
      "<script>wrapped</script>",
    );
    expect(readSvelteWrappedComponentSource(root, "field", "<script></script>")).toBeUndefined();

    const field = rendered.get("svelte")!.get("docs/primitives/field.md")!;
    const control = field.slice(
      field.indexOf("### Field.Control"),
      field.indexOf("### Field.Description"),
    );
    expect(control).toContain("| `defaultValue` | `InputValue` |");
    expect(control).toContain(
      "| `onValueChange` | `(value: string, detail: InputValueChangeDetails) => void` |",
    );
  });

  it("lists the Field Control value props and PreviewCard Trigger delays for React", () => {
    const docs = rendered.get("react")!;
    const field = docs.get("docs/primitives/field.md")!;
    const control = field.slice(
      field.indexOf("### Field.Control"),
      field.indexOf("### Field.Description"),
    );
    for (const prop of ["value", "defaultValue", "onValueChange"]) {
      expect(control).toContain(`| \`${prop}\` |`);
    }
    const previewCard = docs.get("docs/primitives/preview-card.md")!;
    const trigger = previewCard.slice(
      previewCard.indexOf("### PreviewCard.Trigger"),
      previewCard.indexOf("### PreviewCard.Portal"),
    );
    // The Trigger inherits the Root delay, so it shows no default of its own.
    expect(trigger).toContain("| `openDelay` | `number` | - | Overrides the root open delay");
    expect(trigger).toContain("| `closeDelay` | `number` | - | Overrides the root close delay");
  });

  it("lets concurrent writers of one revision publish complete files and prune stale ones", async () => {
    const root = makeTemporaryRoot("package-docs-concurrent-");
    copyGeneratorInputs(root, ["vue"]);
    writePackageDocs({ key: "vue", repoRoot: root });
    const docs = path.join(root, "packages/vue/docs");
    const expected = rendered.get("vue")!;
    writeFileSync(path.join(docs, "README.md"), "stale\n");
    mkdirSync(path.join(docs, "old/nested"), { recursive: true });
    writeFileSync(path.join(docs, "old/nested/page.md"), "old");
    writeFileSync(path.join(docs, "old.md"), "old");

    const generator = path.join(REPO_ROOT, "scripts/portable-runtime/generate-package-docs.ts");
    const script = `const { writePackageDocs } = await import(${JSON.stringify(pathToFileURL(generator).href)}); writePackageDocs({ key: "vue", repoRoot: ${JSON.stringify(root)} });`;
    const runWriter = () =>
      new Promise<void>((resolve, reject) => {
        const child = spawn(
          process.execPath,
          ["--import", "tsx", "--input-type=module", "-e", script],
          { cwd: REPO_ROOT, stdio: ["ignore", "ignore", "pipe"] },
        );
        let stderr = "";
        child.stderr.on("data", (chunk) => (stderr += chunk));
        child.once("error", reject);
        child.once("exit", (code) =>
          code === 0 ? resolve() : reject(new Error(`writer exited ${code}: ${stderr}`)),
        );
      });

    // Read every expected file while the writers run. A reader must see a whole file.
    const partial: string[] = [];
    const missing: string[] = [];
    let reading = true;
    const reader = (async () => {
      while (reading) {
        for (const [file, contents] of expected) {
          const target = path.join(root, "packages/vue", file);
          if (!existsSync(target)) {
            missing.push(file);
            continue;
          }
          const text = readFileSync(target, "utf8");
          if (text !== contents && !(file === "docs/README.md" && text === "stale\n")) {
            partial.push(file);
          }
        }
        await new Promise((resolve) => setImmediate(resolve));
      }
    })();
    await Promise.all(Array.from({ length: 6 }, runWriter));
    reading = false;
    await reader;

    expect(partial).toEqual([]);
    expect(missing).toEqual([]);
    expect(checkPackageDocs({ key: "vue", repoRoot: root })).toEqual([]);
    expect(existsSync(path.join(docs, "old"))).toBe(false);
    const cache = path.join(root, "packages/vue/node_modules/.cache");
    expect(
      readdirSync(cache).filter((entry) => entry.startsWith("starwind-package-docs-")),
    ).toEqual([]);
  }, 60_000);
});
