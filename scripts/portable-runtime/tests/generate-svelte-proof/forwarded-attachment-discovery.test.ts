import { expect, it } from "vitest";
import {
  buildPrimitiveVendoringArtifacts,
  createCliRegistryBuildPolicy,
} from "../../generate-cli-registry.js";
import { svelteFrameworkAdapterTarget } from "../../renderers/framework-adapters/svelte/index.js";

it("omits forwarding helpers after every generated caller uses native attachment spread", async () => {
  const artifacts = await buildPrimitiveVendoringArtifacts({
    targetPolicy: createCliRegistryBuildPolicy([svelteFrameworkAdapterTarget]),
  });
  for (const name of ["button", "checkbox", "dialog", "select", "toast"]) {
    const artifact = artifacts.primitives.find(
      (item) => item.component === name && item.framework === "svelte",
    )!;
    expect(
      artifact.files.some((file) => file.path.includes("forwarded-attachment-discovery")),
    ).toBe(false);
    expect(artifact.files.some((file) => file.path.includes("attachment-execution"))).toBe(false);
  }
});
