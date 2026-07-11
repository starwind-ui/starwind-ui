import { describe, expect, it } from "vitest";

import { addReactCssImport, updateViteConfigContent } from "../../src/utils/vite-config.js";

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
