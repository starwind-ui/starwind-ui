import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe } from "vitest";

import { defineAstroCarouselOutputTests } from "./generate-astro-wrappers/carousel-output.cases.js";
import { defineAstroCompositionOutputTests } from "./generate-astro-wrappers/composition-output.cases.js";
import { defineAstroDropzoneOutputTests } from "./generate-astro-wrappers/dropzone-output.cases.js";
import { defineAstroPreviewCardOutputTests } from "./generate-astro-wrappers/preview-card-output.cases.js";
import { defineAstroPrimitiveOutputTests } from "./generate-astro-wrappers/primitive-output.cases.js";
import { defineAstroRuntimeSubpathOutputTests } from "./generate-astro-wrappers/runtime-subpath-output.cases.js";
import { defineAstroScopedInitOutputTests } from "./generate-astro-wrappers/scoped-init-output.cases.js";
import { defineAstroStabilityTests } from "./generate-astro-wrappers/stability.cases.js";
import { defineAstroStyledOutputTests } from "./generate-astro-wrappers/styled-output.cases.js";
import { defineAstroVariantParityTests } from "./generate-astro-wrappers/variant-parity.cases.js";

describe("generateAstroWrappers", () => {
  let tempRoot: string;
  const getTempRoot = () => tempRoot;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-runtime-generator-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  defineAstroPrimitiveOutputTests(getTempRoot);
  defineAstroCarouselOutputTests(getTempRoot);
  defineAstroPreviewCardOutputTests(getTempRoot);
  defineAstroDropzoneOutputTests(getTempRoot);
  defineAstroStyledOutputTests(getTempRoot);
  defineAstroCompositionOutputTests(getTempRoot);
  defineAstroVariantParityTests(getTempRoot);
  defineAstroScopedInitOutputTests(getTempRoot);
  defineAstroRuntimeSubpathOutputTests(getTempRoot);
  defineAstroStabilityTests(getTempRoot);
});
