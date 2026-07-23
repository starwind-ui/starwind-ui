import { describe, expect, it } from "vitest";

import { getRuntimeSetupPlan } from "../../src/utils/runtime-setup.js";
import type { StarwindRegistry } from "../../src/utils/registry.js";

const registry: StarwindRegistry = {
  version: "2.1.0",
  setup: {
    astro: {
      adapterPackage: { name: "@starwind-ui/astro", range: "^0.1.0-beta.3" },
      packageRequirements: [{ name: "@tabler/icons", range: "^3" }],
    },
    react: {
      adapterPackage: { name: "@starwind-ui/react", range: "^0.1.0-beta.3" },
      packageRequirements: [{ name: "@tabler/icons-react", range: "^3" }],
    },
  },
  components: [],
};

describe("Runtime setup plan", () => {
  it("returns install-ready packages for each framework", () => {
    expect(getRuntimeSetupPlan("astro", registry)).toEqual({
      adapterPackage: "@starwind-ui/astro@0.1.0-beta.3",
      packageRequirements: ["@tabler/icons@^3"],
    });
    expect(getRuntimeSetupPlan("react", registry)).toEqual({
      adapterPackage: "@starwind-ui/react@0.1.0-beta.3",
      packageRequirements: ["@tabler/icons-react@^3"],
    });
  });

  it("rejects registries without setup metadata for the selected framework", () => {
    expect(() => getRuntimeSetupPlan("react", { ...registry, setup: undefined })).toThrow(
      'Bundled registry 2.1.0 is missing setup metadata for framework "react".',
    );
  });
});
