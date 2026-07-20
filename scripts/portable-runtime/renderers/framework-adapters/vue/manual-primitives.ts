import path from "node:path";

import type { FrameworkAdapterTargetManualPrimitiveGenerators } from "../types.js";
import { writeVuePrimitiveFile } from "./primitive-output-writer.js";

const generateVuePrimitiveTheme: FrameworkAdapterTargetManualPrimitiveGenerators["theme"] = async ({
  moduleHeader,
  outputRoot,
}) => {
  const dir = path.join(outputRoot, "theme");

  await writeVuePrimitiveFile(
    dir,
    "index.ts",
    `${moduleHeader}export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";
export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";
`,
  );
};

export const vueManualPrimitiveGenerators = {
  theme: generateVuePrimitiveTheme,
} satisfies FrameworkAdapterTargetManualPrimitiveGenerators;
