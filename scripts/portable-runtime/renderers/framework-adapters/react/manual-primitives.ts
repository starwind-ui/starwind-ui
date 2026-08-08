import path from "node:path";

import type { FrameworkAdapterTargetManualPrimitiveGenerators } from "../types.js";
import { writeReactPrimitiveFile } from "./primitive-output-writer.js";

const generateReactPrimitiveTheme: FrameworkAdapterTargetManualPrimitiveGenerators["theme"] =
  async ({ moduleHeader, outputRoot }) => {
    const dir = path.join(outputRoot, "theme");

    await writeReactPrimitiveFile(
      dir,
      "index.ts",
      `${moduleHeader}import * as React from "react";
import { getThemeInitScript, type ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";

export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";
export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";

export function ThemeInitScript(options: ThemeInitScriptOptions = {}): React.ReactElement {
  return React.createElement("script", {
    "data-starwind-theme-init": "",
    dangerouslySetInnerHTML: { __html: getThemeInitScript(options) },
  });
}
`,
    );
  };

export const reactManualPrimitiveGenerators = {
  theme: generateReactPrimitiveTheme,
} satisfies FrameworkAdapterTargetManualPrimitiveGenerators;
