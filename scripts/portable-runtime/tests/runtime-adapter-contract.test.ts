import { describe } from "vitest";

import { defineRuntimeCollectionStaticTests } from "./runtime-adapter-contract/collection-static.cases.js";
import { defineRuntimeFormControlTests } from "./runtime-adapter-contract/form-control.cases.js";
import { defineRuntimeInventoryValidationTests } from "./runtime-adapter-contract/inventory-validation.cases.js";
import { defineRuntimeOverlayFloatingTests } from "./runtime-adapter-contract/overlay-floating.cases.js";

describe("RuntimeAdapterContract inventory", () => {
  defineRuntimeInventoryValidationTests();
  defineRuntimeFormControlTests();
  defineRuntimeCollectionStaticTests();
  defineRuntimeOverlayFloatingTests();
});
