import path from "node:path";

import type { FrameworkAdapterTargetManualPrimitiveGenerators } from "../types.js";
import { writeAstroPrimitiveFile } from "./primitive-output-writer.js";

const generateAstroPrimitiveTheme: FrameworkAdapterTargetManualPrimitiveGenerators["theme"] =
  async ({ componentHeader = "", moduleHeader, outputRoot }) => {
    const dir = path.join(outputRoot, "theme");

    await Promise.all([
      writeAstroPrimitiveFile(
        dir,
        "ThemeInitScript.astro",
        `${componentHeader}import { getThemeInitScript, type ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";

type Props = ThemeInitScriptOptions;

const themeInitScript = getThemeInitScript(Astro.props);
---

<script is:inline data-starwind-theme-init set:html={themeInitScript} />
`,
      ),
      writeAstroPrimitiveFile(
        dir,
        "index.ts",
        `${moduleHeader}import ThemeInitScript from "./ThemeInitScript.astro";

export { ThemeInitScript };
export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";
export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";
`,
      ),
    ]);
  };

export const astroManualPrimitiveGenerators = {
  theme: generateAstroPrimitiveTheme,
} satisfies FrameworkAdapterTargetManualPrimitiveGenerators;
