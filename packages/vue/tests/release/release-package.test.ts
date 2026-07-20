import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import {
  vueGeneratedSourceFiles,
  vuePackageSubpaths,
  vueRuntimePrimitiveComponents,
} from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));

const EXPECTED_SELECT_EXPORTS = [
  "Select",
  "SelectContext",
  "SelectGroup",
  "SelectGroupLabel",
  "SelectIcon",
  "SelectItem",
  "SelectItemContext",
  "SelectItemIndicator",
  "SelectItemText",
  "SelectLabel",
  "SelectList",
  "SelectPopup",
  "SelectPortal",
  "SelectPositioner",
  "SelectRoot",
  "SelectScrollDownArrow",
  "SelectScrollUpArrow",
  "SelectSeparator",
  "SelectTrigger",
  "SelectValue",
  "default",
  "useSelectContext",
  "useSelectItemContext",
].sort();
const EXPECTED_AVATAR_EXPORTS = [
  "Avatar",
  "AvatarFallback",
  "AvatarImage",
  "AvatarRoot",
  "default",
].sort();
const EXPECTED_BUTTON_EXPORTS = ["Button", "ButtonRoot", "default"].sort();
const EXPECTED_CHECKBOX_EXPORTS = [
  "Checkbox",
  "CheckboxIndicator",
  "CheckboxRoot",
  "default",
].sort();
const EXPECTED_PROGRESS_EXPORTS = [
  "Progress",
  "ProgressIndicator",
  "ProgressLabel",
  "ProgressRoot",
  "ProgressTrack",
  "ProgressValue",
  "default",
].sort();
const EXPECTED_SCROLL_AREA_EXPORTS = [
  "ScrollArea",
  "ScrollAreaContent",
  "ScrollAreaCorner",
  "ScrollAreaRoot",
  "ScrollAreaScrollbar",
  "ScrollAreaThumb",
  "ScrollAreaViewport",
  "default",
].sort();
const EXPECTED_ENTRY_JAVA_SCRIPT = vuePackageSubpaths
  .map(({ exportTarget }) => exportTarget.import.replace("./dist/", ""))
  .sort();

describe("release-like @starwind-ui/vue package", () => {
  it("imports the exact built root and component subpath values", async () => {
    const modules = await importVuePackageSubpaths();
    const root = modules["."]!;
    const avatar = modules["./avatar"]!;
    const button = modules["./button"]!;
    const checkbox = modules["./checkbox"]!;
    const progress = modules["./progress"]!;
    const scrollArea = modules["./scroll-area"]!;
    const select = modules["./select"]!;
    const theme = modules["./theme"]!;

    expect(Object.keys(avatar).sort()).toEqual(EXPECTED_AVATAR_EXPORTS);
    expect(Object.keys(button).sort()).toEqual(EXPECTED_BUTTON_EXPORTS);
    expect(Object.keys(checkbox).sort()).toEqual(EXPECTED_CHECKBOX_EXPORTS);
    expect(Object.keys(progress).sort()).toEqual(EXPECTED_PROGRESS_EXPORTS);
    expect(Object.keys(scrollArea).sort()).toEqual(EXPECTED_SCROLL_AREA_EXPORTS);
    expect(Object.keys(select).sort()).toEqual(EXPECTED_SELECT_EXPORTS);
    expect(Object.keys(theme).sort()).toEqual(["getThemeInitScript", "initThemeController"]);
    expect(avatar.default).toBe(avatar.Avatar);
    expect(avatar.Avatar).toEqual({
      Fallback: avatar.AvatarFallback,
      Image: avatar.AvatarImage,
      Root: avatar.AvatarRoot,
    });
    expect(button.default).toBe(button.Button);
    expect(button.Button).toEqual({ Root: button.ButtonRoot });
    expect(checkbox.default).toBe(checkbox.Checkbox);
    expect(checkbox.Checkbox).toEqual({
      Indicator: checkbox.CheckboxIndicator,
      Root: checkbox.CheckboxRoot,
    });
    expect(progress.default).toBe(progress.Progress);
    expect(progress.Progress).toEqual({
      Indicator: progress.ProgressIndicator,
      Label: progress.ProgressLabel,
      Root: progress.ProgressRoot,
      Track: progress.ProgressTrack,
      Value: progress.ProgressValue,
    });
    expect(scrollArea.default).toBe(scrollArea.ScrollArea);
    expect(scrollArea.ScrollArea).toEqual({
      Content: scrollArea.ScrollAreaContent,
      Corner: scrollArea.ScrollAreaCorner,
      Root: scrollArea.ScrollAreaRoot,
      Scrollbar: scrollArea.ScrollAreaScrollbar,
      Thumb: scrollArea.ScrollAreaThumb,
      Viewport: scrollArea.ScrollAreaViewport,
    });
    expect(select.default).toBe(select.Select);
    expect(select.Select).toEqual({
      Group: select.SelectGroup,
      GroupLabel: select.SelectGroupLabel,
      Icon: select.SelectIcon,
      Item: select.SelectItem,
      ItemIndicator: select.SelectItemIndicator,
      ItemText: select.SelectItemText,
      Label: select.SelectLabel,
      List: select.SelectList,
      Popup: select.SelectPopup,
      Portal: select.SelectPortal,
      Positioner: select.SelectPositioner,
      Root: select.SelectRoot,
      ScrollDownArrow: select.SelectScrollDownArrow,
      ScrollUpArrow: select.SelectScrollUpArrow,
      Separator: select.SelectSeparator,
      Trigger: select.SelectTrigger,
      Value: select.SelectValue,
    });
    expect(Object.keys(root).sort()).toEqual(
      [
        ...new Set([
          "AvatarFallback",
          "AvatarImage",
          "AvatarRoot",
          "Avatar",
          "Button",
          "ButtonRoot",
          "Checkbox",
          "CheckboxIndicator",
          "CheckboxRoot",
          ...EXPECTED_PROGRESS_EXPORTS,
          ...EXPECTED_SCROLL_AREA_EXPORTS,
          ...EXPECTED_SELECT_EXPORTS,
          "getThemeInitScript",
          "initThemeController",
        ]),
      ]
        .filter((name) => name !== "default")
        .sort(),
    );
  });

  it("ships declarations for every export-map entry and typechecks a public consumer", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(repoRoot, "packages/vue/package.json"), "utf8"),
    );
    for (const contract of Object.values(packageJson.exports) as Array<{ types: string }>) {
      const declaration = path.join(repoRoot, "packages/vue", contract.types.replace(/^\.\//, ""));
      expect((await stat(declaration)).isFile(), declaration).toBe(true);
      expect(await readFile(declaration, "utf8"), declaration).not.toHaveLength(0);
    }

    const tsc = path.join(repoRoot, "node_modules/typescript/bin/tsc");
    const result = spawnSync(
      process.execPath,
      [tsc, "-p", path.join(repoRoot, "packages/vue/tests/release/tsconfig.json")],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );
    const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    expect(result.error, diagnostics).toBeUndefined();
    expect(result.status, diagnostics).toBe(0);
  });

  it("contains the exact normalized built inventory with no stale or unreachable output", async () => {
    const distRoot = path.join(repoRoot, "packages/vue/dist");
    const files = await readFileTree(distRoot);
    const declarationBases = vueGeneratedSourceFiles.map((file) => file.replace(/\.ts$/, ""));
    const expectedInventory = [
      ...EXPECTED_ENTRY_JAVA_SCRIPT,
      ...declarationBases.flatMap((base) => [`${base}.d.ts`, `${base}.d.ts.map`]),
      ...Array.from({ length: vuePackageSubpaths.length - 1 }, () => "chunk-<hash>.js"),
    ].sort();
    const normalizedInventory = files
      .map((file) => file.replace(/^chunk-[A-Z0-9]+\.js$/, "chunk-<hash>.js"))
      .sort();

    expect(normalizedInventory).toEqual(expectedInventory);
    expect(files.filter((file) => /^chunk-[A-Z0-9]+\.js$/.test(file))).toHaveLength(
      vuePackageSubpaths.length - 1,
    );

    for (const sourceFile of vueGeneratedSourceFiles) {
      const base = sourceFile.replace(/\.ts$/, "");
      const declarationPath = `${base}.d.ts`;
      const declaration = await readFile(path.join(distRoot, declarationPath), "utf8");
      expect(declaration, declarationPath).not.toHaveLength(0);
      expect(declaration, declarationPath).toContain(
        `//# sourceMappingURL=${path.posix.basename(declarationPath)}.map`,
      );

      const mapPath = `${declarationPath}.map`;
      const declarationMap = JSON.parse(await readFile(path.join(distRoot, mapPath), "utf8")) as {
        file: string;
        sources: string[];
        version: number;
      };
      expect(declarationMap.version, mapPath).toBe(3);
      expect(declarationMap.file, mapPath).toBe(path.posix.basename(declarationPath));
      expect(declarationMap.sources, mapPath).toHaveLength(1);
      expect(declarationMap.sources[0]?.replaceAll("\\", "/"), mapPath).toMatch(
        new RegExp(`/src/${escapeRegExp(sourceFile)}$`),
      );
    }

    const javaScriptFiles = files.filter((file) => file.endsWith(".js"));
    const reachable = await findReachableJavaScript(distRoot, EXPECTED_ENTRY_JAVA_SCRIPT);
    expect([...reachable].sort()).toEqual(javaScriptFiles.sort());
  });

  it("server-renders every built Primitive export in valid public trees", async () => {
    const modules = await importVuePackageSubpaths();
    expect(
      vueRuntimePrimitiveComponents.map((component) => modules[`./${component}`]),
    ).not.toContain(undefined);
    const avatar = modules["./avatar"]!;
    const button = modules["./button"]!;
    const checkbox = modules["./checkbox"]!;
    const progress = modules["./progress"]!;
    const scrollArea = modules["./scroll-area"]!;
    const select = modules["./select"]!;
    const render = () =>
      renderToString(
        createSSRApp({
          render: () =>
            h("main", null, [
              h(avatar.AvatarRoot, null, {
                default: () => [
                  h(avatar.AvatarImage, { alt: "Profile", src: "/avatar.png" }),
                  h(avatar.AvatarFallback, null, { default: () => "AB" }),
                ],
              }),
              h(button.ButtonRoot, null, { default: () => "Save" }),
              h(
                checkbox.CheckboxRoot,
                { defaultChecked: true },
                {
                  default: () => h(checkbox.CheckboxIndicator, { keepMounted: true }),
                },
              ),
              h(
                progress.ProgressRoot,
                { value: 50 },
                {
                  default: () => [
                    h(progress.ProgressLabel, null, { default: () => "Progress" }),
                    h(progress.ProgressTrack, null, {
                      default: () => h(progress.ProgressIndicator),
                    }),
                    h(progress.ProgressValue),
                  ],
                },
              ),
              h(scrollArea.ScrollAreaRoot, null, {
                default: () => [
                  h(scrollArea.ScrollAreaViewport, null, {
                    default: () => h(scrollArea.ScrollAreaContent),
                  }),
                  h(
                    scrollArea.ScrollAreaScrollbar,
                    { keepMounted: true },
                    {
                      default: () => h(scrollArea.ScrollAreaThumb),
                    },
                  ),
                  h(scrollArea.ScrollAreaCorner),
                ],
              }),
              renderBuiltSelect(select),
            ]),
        }),
      );

    const first = await render();
    expect(await render()).toBe(first);
    for (const marker of [
      "avatar",
      "avatar-image",
      "avatar-fallback",
      "button",
      "checkbox",
      "checkbox-indicator",
      "progress",
      "progress-label",
      "progress-track",
      "progress-indicator",
      "progress-value",
      "scroll-area",
      "scroll-area-viewport",
      "scroll-area-content",
      "scroll-area-scrollbar",
      "scroll-area-thumb",
      "scroll-area-corner",
      "select",
      "select-label",
      "select-trigger",
      "select-value",
      "select-icon",
      "select-portal",
      "select-positioner",
      "select-popup",
      "select-list",
      "select-group",
      "select-group-label",
      "select-item",
      "select-item-text",
      "select-item-indicator",
      "select-separator",
      "select-scroll-up-arrow",
      "select-scroll-down-arrow",
    ]) {
      expect(first, marker).toContain(`data-sw-${marker}`);
    }
  });

  it("keeps Runtime declared and Vue external across built ESM chunks", async () => {
    const packageJson = JSON.parse(
      await readFile(path.join(repoRoot, "packages/vue/package.json"), "utf8"),
    );
    expect(packageJson.dependencies).toEqual({ "@starwind-ui/runtime": "workspace:*" });
    expect(packageJson.peerDependencies).toEqual({ vue: ">=3.5" });

    const javaScript = await readJavaScriptTree(path.join(repoRoot, "packages/vue/dist"));
    expect(javaScript).toMatch(/from\s*["']vue["']/);
    expect(javaScript).toContain("@starwind-ui/runtime");
    expect(javaScript).not.toContain("vue.runtime.esm");
    expect(javaScript).not.toContain("@vue/runtime-core");
    expect(javaScript).not.toContain("class ReactiveEffect");
  });
});

async function readJavaScriptTree(directory: string): Promise<string> {
  const entries = await readdir(directory, { withFileTypes: true });
  const sources = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readJavaScriptTree(candidate);
      return entry.isFile() && entry.name.endsWith(".js") ? readFile(candidate, "utf8") : "";
    }),
  );
  return sources.join("\n");
}

type VuePackageModule = typeof import("@starwind-ui/vue") &
  typeof import("@starwind-ui/vue/avatar") &
  typeof import("@starwind-ui/vue/button") &
  typeof import("@starwind-ui/vue/checkbox") &
  typeof import("@starwind-ui/vue/progress") &
  typeof import("@starwind-ui/vue/scroll-area") &
  typeof import("@starwind-ui/vue/select") &
  typeof import("@starwind-ui/vue/theme");

async function importVuePackageSubpaths(): Promise<Record<string, VuePackageModule>> {
  return Object.fromEntries(
    await Promise.all(
      vuePackageSubpaths.map(async ({ subpath }) => {
        const specifier =
          subpath === "." ? "@starwind-ui/vue" : `@starwind-ui/vue/${subpath.slice(2)}`;
        return [subpath, (await import(specifier)) as VuePackageModule] as const;
      }),
    ),
  );
}

async function readFileTree(directory: string, root: string = directory): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const candidate = path.join(directory, entry.name);
      if (entry.isDirectory()) return readFileTree(candidate, root);
      return entry.isFile() ? [path.relative(root, candidate).replaceAll("\\", "/")] : [];
    }),
  );
  return files.flat().sort();
}

async function findReachableJavaScript(
  distRoot: string,
  entryFiles: readonly string[],
): Promise<Set<string>> {
  const reachable = new Set<string>();
  const pending = [...entryFiles];

  while (pending.length > 0) {
    const file = pending.pop();
    if (!file || reachable.has(file)) continue;
    reachable.add(file);
    const source = await readFile(path.join(distRoot, file), "utf8");
    for (const match of source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)) {
      const dependency = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]!));
      expect(dependency, `${file} import`).toMatch(/\.js$/);
      pending.push(dependency);
    }
  }

  return reachable;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderBuiltSelect(select: typeof import("@starwind-ui/vue/select")) {
  return h(
    select.SelectRoot,
    { defaultValue: "apple", modal: false },
    {
      default: () => [
        h(select.SelectLabel, null, { default: () => "Fruit" }),
        h(select.SelectTrigger, null, {
          default: () => [
            h(select.SelectValue, { placeholder: "Choose fruit" }),
            h(select.SelectIcon, null, { default: () => "Open" }),
          ],
        }),
        h(
          select.SelectPortal,
          { disabled: true },
          {
            default: () =>
              h(
                select.SelectPositioner,
                { alignItemWithTrigger: false },
                {
                  default: () =>
                    h(select.SelectPopup, null, {
                      default: () => [
                        h(select.SelectScrollUpArrow),
                        h(select.SelectList, null, {
                          default: () => [
                            h(select.SelectGroup, null, {
                              default: () => [
                                h(select.SelectGroupLabel, null, { default: () => "Available" }),
                                h(
                                  select.SelectItem,
                                  { value: "apple" },
                                  {
                                    default: () => [
                                      h(select.SelectItemText, null, { default: () => "Apple" }),
                                      h(select.SelectItemIndicator),
                                    ],
                                  },
                                ),
                              ],
                            }),
                            h(select.SelectSeparator),
                          ],
                        }),
                        h(select.SelectScrollDownArrow),
                      ],
                    }),
                },
              ),
          },
        ),
      ],
    },
  );
}
