import { describe, expect, it } from "vitest";

import {
  asAstArrayExpression,
  countAstTopLevelDirectCalls,
  getAstDefaultExportCallObject,
  getAstDefaultImportBinding,
  getAstNodeRange,
  getAstNamedImportBinding,
  getAstObjectProperty,
  hasAstDirectCall,
  hasAstEscapedObjectKey,
  hasAstSoleNamedImport,
  parseSourceModule,
} from "../../src/utils/source-shape.js";

describe("Babel source shape parsing", () => {
  it("uses module facts and exclusive node ranges for supported TypeScript configs", () => {
    const source = `const port: number = 4173;
import renderer from "@astrojs/react";
export default defineConfig({ integrations: [renderer({ port })] });`;
    const module = parseSourceModule(source)!;
    const config = getAstDefaultExportCallObject(module, "defineConfig")!;
    const integrations = getAstObjectProperty(config, "integrations");

    expect(integrations.status).toBe("found");
    if (integrations.status !== "found") return;
    const array = asAstArrayExpression(integrations.value)!;
    const range = getAstNodeRange(array)!;
    expect(source.slice(range.start, range.end)).toBe("[renderer({ port })]");
    expect(hasAstDirectCall(array, "renderer")).toBe(true);
    expect(getAstDefaultImportBinding(module, "@astrojs/react")).toEqual({
      status: "found",
      localName: "renderer",
    });
  });

  it.each([
    "export default defineConfig({",
    "export default defineConfig(() => ({}));",
    "export default defineConfig({ ...shared });",
    "export default defineConfig({ [key]: true });",
  ])("rejects a parse error or unsupported default-export shape", (source) => {
    const module = parseSourceModule(source);
    expect(module && getAstDefaultExportCallObject(module, "defineConfig")).toBeUndefined();
  });

  it("rejects duplicate and ambiguous managed properties", () => {
    const duplicate = parseSourceModule(
      "export default defineConfig({ integrations: [], integrations: [] });",
    )!;
    const shorthand = parseSourceModule(
      "const integrations = []; export default defineConfig({ integrations });",
    )!;
    expect(
      getAstObjectProperty(
        getAstDefaultExportCallObject(duplicate, "defineConfig")!,
        "integrations",
      ),
    ).toEqual({ status: "unsafe" });
    expect(
      getAstObjectProperty(
        getAstDefaultExportCallObject(shorthand, "defineConfig")!,
        "integrations",
      ),
    ).toEqual({ status: "unsafe" });
  });

  it("uses decoded static import values and preserves exact named-import contracts", () => {
    const escapedModule = parseSourceModule(
      String.raw`import tailwindcss from "@tailwindcss\x2fvite"; export default defineConfig({});`,
    )!;
    expect(getAstDefaultImportBinding(escapedModule, "@tailwindcss/vite")).toEqual({
      status: "found",
      localName: "tailwindcss",
    });

    const exact = parseSourceModule(
      `import { createInertiaApp } from "@inertiajs/vue3"; createInertiaApp({});`,
    )!;
    const aliased = parseSourceModule(
      `import { createInertiaApp as boot } from "@inertiajs/vue3"; boot({});`,
    )!;
    expect(hasAstSoleNamedImport(exact, "@inertiajs/vue3", "createInertiaApp")).toBe(true);
    expect(hasAstSoleNamedImport(aliased, "@inertiajs/vue3", "createInertiaApp")).toBe(false);
  });

  it("counts only direct top-level calls with an exact identifier token", () => {
    const module = parseSourceModule(String.raw`
import { createInertiaApp } from "@inertiajs/vue3";
"createInertiaApp()";
foo.createInertiaApp({});
\u0063reateInertiaApp({});
createInertiaApp({});
`)!;
    expect(countAstTopLevelDirectCalls(module, "createInertiaApp")).toBe(1);
  });

  it("reports escaped object keys from Babel ranges", () => {
    const module = parseSourceModule(
      String.raw`export default defineConfig({ c\u0073s: [], plain: true });`,
    )!;
    const config = getAstDefaultExportCallObject(module, "defineConfig")!;
    expect(hasAstEscapedObjectKey(module, config)).toBe(true);
  });

  it.each([
    "export default (defineConfig)({ plugins: [] });",
    String.raw`export default \u0064efineConfig({ plugins: [] });`,
  ])("rejects a non-direct default-export callee token", (source) => {
    const module = parseSourceModule(source)!;
    expect(getAstDefaultExportCallObject(module, "defineConfig")).toBeUndefined();
  });

  it("rejects declaration-level and specifier-level type-only runtime imports", () => {
    const defaultType = parseSourceModule(`import type tailwindcss from "@tailwindcss/vite";`)!;
    const namedDeclarationType = parseSourceModule(
      `import type { getThemeInitScript } from "@starwind-ui/react/theme";`,
    )!;
    const namedSpecifierType = parseSourceModule(
      `import { type getThemeInitScript } from "@starwind-ui/react/theme";`,
    )!;

    expect(getAstDefaultImportBinding(defaultType, "@tailwindcss/vite")).toEqual({
      status: "unsafe",
    });
    expect(
      getAstNamedImportBinding(
        namedDeclarationType,
        "@starwind-ui/react/theme",
        "getThemeInitScript",
      ),
    ).toEqual({ status: "unsafe" });
    expect(
      getAstNamedImportBinding(
        namedSpecifierType,
        "@starwind-ui/react/theme",
        "getThemeInitScript",
      ),
    ).toEqual({ status: "unsafe" });
  });
});
