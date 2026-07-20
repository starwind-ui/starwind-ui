import { readFile } from "node:fs/promises";

import { compileScript, compileTemplate, parse } from "vue/compiler-sfc";
import { defineConfig, type Options } from "tsup";

import { vueBuildEntryPoints } from "../../scripts/portable-runtime/renderers/framework-adapters/vue/inventory.js";

export function createVueEntryPoints(): Record<string, string> {
  return { ...vueBuildEntryPoints };
}

export const vueEntryPoints = createVueEntryPoints();

export const vueSfcPlugin: NonNullable<Options["esbuildPlugins"]>[number] = {
  name: "starwind-vue-sfc",
  setup(build) {
    build.onLoad({ filter: /\.vue$/ }, async ({ path }) => ({
      contents: compileVueSfc(await readFile(path, "utf8"), path),
      loader: "ts",
    }));
  },
};

export function compileVueSfc(source: string, filename: string): string {
  const parsed = parse(source, { filename });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map(String).join("\n"));
  }
  const { descriptor } = parsed;
  const id = createScopeId(filename);
  const script = compileScript(descriptor, { genDefaultAs: "__sfc__", id });
  const template = descriptor.template
    ? compileTemplate({
        compilerOptions: { bindingMetadata: script.bindings },
        filename,
        id,
        source: descriptor.template.content,
      })
    : undefined;
  if (template?.errors.length) {
    throw new Error(template.errors.map(String).join("\n"));
  }

  const render = template?.code.replace("export function render", "function render") ?? "";
  return `${script.content}\n${render}\n${template ? "__sfc__.render = render;" : ""}\nexport default __sfc__;\n`;
}

function createScopeId(filename: string): string {
  let hash = 2166136261;
  for (const character of filename) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return `starwind-${(hash >>> 0).toString(16)}`;
}

export default defineConfig({
  clean: false,
  dts: false,
  entry: vueEntryPoints,
  esbuildPlugins: [vueSfcPlugin],
  external: ["@starwind-ui/runtime", /^@starwind-ui\/runtime\//, "vue"],
  format: ["esm"],
  outDir: "dist",
  splitting: true,
  target: "es2022",
});
