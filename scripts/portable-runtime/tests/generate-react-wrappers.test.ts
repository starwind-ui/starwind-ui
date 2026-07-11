import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe } from "vitest";

import { defineReactCarouselOutputTests } from "./generate-react-wrappers/carousel-output.cases.js";
import { defineReactCompositionOutputTests } from "./generate-react-wrappers/composition-output.cases.js";
import { defineReactDropzoneOutputTests } from "./generate-react-wrappers/dropzone-output.cases.js";
import { defineReactFamilyOutputTests } from "./generate-react-wrappers/family-output.cases.js";
import { defineReactLayoutEffectOutputTests } from "./generate-react-wrappers/layout-effect-output.cases.js";
import { defineReactPreviewCardOutputTests } from "./generate-react-wrappers/preview-card-output.cases.js";
import { defineReactPrimitiveOutputTests } from "./generate-react-wrappers/primitive-output.cases.js";
import { defineReactRuntimeSubpathOutputTests } from "./generate-react-wrappers/runtime-subpath-output.cases.js";
import { defineReactStabilityTests } from "./generate-react-wrappers/stability.cases.js";
import { defineReactStyledOutputTests } from "./generate-react-wrappers/styled-output.cases.js";
import { defineReactUncontrolledDefaultOutputTests } from "./generate-react-wrappers/uncontrolled-default-output.cases.js";

describe("generateReactWrappers", () => {
  let tempRoot: string;
  const getTempRoot = () => tempRoot;

  beforeEach(async () => {
    tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-react-generator-"));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  defineReactPrimitiveOutputTests(getTempRoot);
  defineReactCarouselOutputTests(getTempRoot);
  defineReactPreviewCardOutputTests(getTempRoot);
  defineReactDropzoneOutputTests(getTempRoot);
  defineReactStyledOutputTests(getTempRoot);
  defineReactCompositionOutputTests(getTempRoot);
  defineReactFamilyOutputTests(getTempRoot);
  defineReactLayoutEffectOutputTests(getTempRoot);
  defineReactUncontrolledDefaultOutputTests(getTempRoot);
  defineReactRuntimeSubpathOutputTests(getTempRoot);
  defineReactStabilityTests(getTempRoot);
});
