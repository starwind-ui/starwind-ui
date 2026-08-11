import { describe, expect, it } from "vitest";

import {
  addReactCssImport,
  addVueCssImport,
  updateViteConfigContent,
  updateVueViteConfigContent,
} from "../../src/utils/vite-config.js";

describe("React Vite setup", () => {
  const template = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;

  it("adds Tailwind, Theme prepaint, and the source alias idempotently", () => {
    const updated = updateViteConfigContent(template);

    expect(updated).not.toBeNull();
    expect(updated).toContain('import tailwindcss from "@tailwindcss/vite"');
    expect(updated).toContain('getThemeInitScript } from "@starwind-ui/react/theme"');
    expect(updated).toContain("plugins: [starwindThemeInitPlugin(), tailwindcss(), react()]");
    expect(updated).toContain('"@": fileURLToPath(new URL("./src", import.meta.url))');
    expect(updated).toContain('injectTo: "head-prepend"');
    expect(updateViteConfigContent(updated!)).toBe(updated);
  });

  it("rejects function-style configs instead of reporting false success", () => {
    expect(updateViteConfigContent("export default defineConfig(() => ({}));")).toBeNull();
  });

  it("adds the configured stylesheet to the React entry idempotently", () => {
    const source = 'import { StrictMode } from "react";\n';
    const updated = addReactCssImport(source, "src/main.tsx", "src/styles/starwind.css");

    expect(updated).toBe('import "./styles/starwind.css";\n' + source);
    expect(addReactCssImport(updated, "src/main.tsx", "src/styles/starwind.css")).toBe(updated);
  });
});

describe("Vue Vite setup", () => {
  const template = `import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: { port: 4173 },
});
`;

  it("adds Tailwind and the source alias while preserving host settings", () => {
    const updated = updateVueViteConfigContent(template);

    expect(updated).not.toBeNull();
    expect(updated).toContain('import tailwindcss from "@tailwindcss/vite"');
    expect(updated).toContain("plugins: [tailwindcss(), vue()]");
    expect(updated).toContain('"@": fileURLToPath(new globalThis.URL("./src", import.meta.url))');
    expect(updated).toContain("server: { port: 4173 }");
    expect(updateVueViteConfigContent(updated!)).toBe(updated);
  });

  it("rejects configs without the official Vue plugin before mutation", () => {
    expect(
      updateVueViteConfigContent(
        'import { defineConfig } from "vite";\nexport default defineConfig({ plugins: [] });',
      ),
    ).toBeNull();
  });

  it("edits only top-level plugins and aliases when nested decoys exist", () => {
    const source = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const decoy = { plugins: [], resolve: { alias: {} } };
export default defineConfig({
  server: { plugins: [], resolve: { alias: {} } },
  plugins: [vue()],
});
`;
    const updated = updateVueViteConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated).toContain("server: { plugins: [], resolve: { alias: {} } }");
    expect(updated).toContain("const decoy = { plugins: [], resolve: { alias: {} } }");
    expect(updated).toContain("plugins: [tailwindcss(), vue()]");
    expect(updated).toContain(
      'export default defineConfig({\n  resolve: { alias: { "@": fileURLToPath',
    );
  });

  it("rejects a nested vue() decoy and unsafe computed config keys", () => {
    const nestedCall = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [wrapper(vue())],
});
`;
    const computedKey = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
const key = "server";
export default defineConfig({
  plugins: [vue()],
  [key]: {},
});
`;

    const spread = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
export default defineConfig({
  plugins: [vue()],
  ...sharedConfig,
});
`;

    expect(updateVueViteConfigContent(nestedCall)).toBeNull();
    expect(updateVueViteConfigContent(computedKey)).toBeNull();
    expect(updateVueViteConfigContent(spread)).toBeNull();
  });

  it.each([
    `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
const alias = {};
export default defineConfig({ plugins: [vue()], resolve: { alias } });`,
    `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
const resolve = { alias: {} };
export default defineConfig({ plugins: [vue()], resolve });`,
  ])("rejects shorthand config before adding an alias", (source) => {
    expect(updateVueViteConfigContent(source)).toBeNull();
  });

  it("uses collision-free local bindings for generated imports", () => {
    const source = `import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const tailwindcss = createLocalPlugin();
const fileURLToPath = createLocalResolver();
const URL = createLocalUrl();
export default defineConfig({
  plugins: [vue()],
});
`;

    const updated = updateVueViteConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated).toContain('import starwindTailwindcss from "@tailwindcss/vite"');
    expect(updated).toContain('import { fileURLToPath as starwindFileURLToPath } from "node:url"');
    expect(updated).toContain("plugins: [starwindTailwindcss(), vue()]");
    expect(updated).toContain(
      '"@": starwindFileURLToPath(new globalThis.URL("./src", import.meta.url))',
    );

    const executable = updated!
      .replace(/^import .*;\n/gm, "")
      .replace("export default defineConfig(", "return defineConfig(")
      .replaceAll("import.meta.url", '"file:///project/vite.config.ts"');
    const evaluate = new Function(
      "defineConfig",
      "vue",
      "createLocalPlugin",
      "createLocalResolver",
      "createLocalUrl",
      "starwindTailwindcss",
      "starwindFileURLToPath",
      executable,
    );
    const config = evaluate(
      (value: unknown) => value,
      () => "vue",
      () => "local-plugin",
      () => "local-resolver",
      () => class LocalURL {},
      () => "tailwind",
      (url: URL) => url.pathname,
    ) as { resolve: { alias: Record<string, string> } };

    expect(config.resolve.alias["@"]).toBe("/project/src");
    expect(updateVueViteConfigContent(updated!)).toBe(updated);
  });
  it("adds the Starwind stylesheet to a Vue entry idempotently", () => {
    const source = 'import { createApp } from "vue";\n';
    const updated = addVueCssImport(source, "src/main.ts", "src/styles/starwind.css");

    expect(updated).toBe('import "./styles/starwind.css";\n' + source);
    expect(addVueCssImport(updated, "src/main.ts", "src/styles/starwind.css")).toBe(updated);
  });
});

describe("Vite runtime syntax boundaries", () => {
  it("rejects a type-only named runtime import without changing source", () => {
    const source = `import type { getThemeInitScript } from "@starwind-ui/react/theme";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [] });`;
    const original = source;
    expect(updateViteConfigContent(source)).toBeNull();
    expect(source).toBe(original);
  });

  it("rejects a type-only Vue runtime import without changing source", () => {
    const source = `import type vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
export default defineConfig({ plugins: [vue()] });`;
    const original = source;
    expect(updateVueViteConfigContent(source)).toBeNull();
    expect(source).toBe(original);
  });

  it.each([
    `export default (defineConfig)({ plugins: [] });`,
    String.raw`export default \u0064efineConfig({ plugins: [] });`,
  ])("rejects a non-direct default-export callee token", (source) => {
    expect(updateViteConfigContent(source)).toBeNull();
  });
});
