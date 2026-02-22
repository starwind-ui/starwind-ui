import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@starwind-ui/core", () => ({
  registry: [
    {
      name: "tooltip",
      version: "1.5.0",
      type: "component",
      dependencies: [],
      fileDependencies: ["positioning.ts"],
    },
    {
      name: "button",
      version: "2.3.1",
      type: "component",
      dependencies: [],
    },
  ],
}));

import { clearRegistryCache, getComponent, getRegistry, setRegistrySource } from "../registry.js";

describe("registry fileDependencies support", () => {
  beforeEach(() => {
    clearRegistryCache();
    setRegistrySource("local");
  });

  it("parses fileDependencies from local registry", async () => {
    const components = await getRegistry(true);
    const tooltip = components.find((component) => component.name === "tooltip");

    expect(tooltip?.fileDependencies).toEqual(["positioning.ts"]);
  });

  it("returns fileDependencies from getComponent", async () => {
    const tooltip = await getComponent("tooltip", true);

    expect(tooltip?.fileDependencies).toEqual(["positioning.ts"]);
  });
});
