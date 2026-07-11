import { rm } from "node:fs/promises";

import { appendRuntimeTypeFacades, renderPrimitiveIndex } from "../../primitive-index.js";
import { createTsHeader, writeGeneratedFile } from "../../shared.js";
import type { FrameworkAdapterTargetPrimitivePackageGenerator } from "../types.js";
import {
  renderComposeRefsFile,
  renderUseClosePresenceFile,
  renderUseIsomorphicLayoutEffectFile,
} from "./primitive-output-writer.js";

export const generateReactPrimitivePackage: FrameworkAdapterTargetPrimitivePackageGenerator =
  async ({ generatePrimitiveEntries, generatedBy, outputRoot }) => {
    const moduleHeader = createTsHeader(generatedBy);

    await rm(outputRoot, { force: true, recursive: true });

    await Promise.all([
      generatePrimitiveEntries({
        moduleHeader,
        outputRoot,
      }),
      writeGeneratedFile(
        `${outputRoot}/internal`,
        "use-isomorphic-layout-effect.ts",
        renderUseIsomorphicLayoutEffectFile(moduleHeader),
      ),
      writeGeneratedFile(
        `${outputRoot}/internal`,
        "compose-refs.ts",
        renderComposeRefsFile(moduleHeader),
      ),
      writeGeneratedFile(
        `${outputRoot}/internal`,
        "use-close-presence.ts",
        renderUseClosePresenceFile(moduleHeader),
      ),
      writeGeneratedFile(outputRoot, "index.ts", renderPrimitiveIndex(moduleHeader)),
    ]);

    await appendRuntimeTypeFacades(outputRoot);
  };
