import { rm } from "node:fs/promises";

import { appendRuntimeTypeFacades, renderPrimitiveIndex } from "../../primitive-index.js";
import { createTsHeader, writeGeneratedFile } from "../../shared.js";
import type { FrameworkAdapterTargetPrimitivePackageGenerator } from "../types.js";
import { createAstroHeader } from "./headers.js";
import { renderAstroControllerLifecycleFile } from "./primitive-output-writer.js";

export const generateAstroPrimitivePackage: FrameworkAdapterTargetPrimitivePackageGenerator =
  async ({ generatePrimitiveEntries, generatedBy, outputRoot }) => {
    const componentHeader = createAstroHeader(generatedBy);
    const moduleHeader = createTsHeader(generatedBy);

    await rm(outputRoot, { force: true, recursive: true });

    await Promise.all([
      generatePrimitiveEntries({
        componentHeader,
        moduleHeader,
        outputRoot,
      }),
      writeGeneratedFile(
        `${outputRoot}/internal`,
        "controller-lifecycle.ts",
        renderAstroControllerLifecycleFile(moduleHeader),
      ),
      writeGeneratedFile(outputRoot, "index.ts", renderPrimitiveIndex(moduleHeader)),
    ]);

    await appendRuntimeTypeFacades(outputRoot);
  };
