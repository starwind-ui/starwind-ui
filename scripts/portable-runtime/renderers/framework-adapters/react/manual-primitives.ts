import path from "node:path";

import type { FrameworkAdapterTargetManualPrimitiveGenerators } from "../types.js";
import { writeReactPrimitiveFile } from "./primitive-output-writer.js";

const generateReactPrimitiveTheme: FrameworkAdapterTargetManualPrimitiveGenerators["theme"] =
  async ({ moduleHeader, outputRoot }) => {
    const dir = path.join(outputRoot, "theme");

    await writeReactPrimitiveFile(
      dir,
      "index.ts",
      `${moduleHeader}export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";
export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";
`,
    );
  };

export const reactManualPrimitiveGenerators = {
  theme: generateReactPrimitiveTheme,
} satisfies FrameworkAdapterTargetManualPrimitiveGenerators;
