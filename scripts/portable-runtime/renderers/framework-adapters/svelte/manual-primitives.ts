import path from "node:path";
import { writeGeneratedFile } from "../../shared.js";
import type { FrameworkAdapterTargetManualPrimitiveGenerators } from "../types.js";

export const svelteManualPrimitiveGenerators = {
  theme: async ({ moduleHeader, outputRoot }) => {
    await writeGeneratedFile(
      path.join(outputRoot, "theme"),
      "index.ts",
      `${moduleHeader}export type { ThemeInitScriptOptions } from "@starwind-ui/runtime/theme";
/** The document owner destroys the shared controller on teardown. Mounted controls only resynchronize it. */
export { getThemeInitScript, initThemeController } from "@starwind-ui/runtime/theme";
`,
    );
  },
} satisfies FrameworkAdapterTargetManualPrimitiveGenerators;
