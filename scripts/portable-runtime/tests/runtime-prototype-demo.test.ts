import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const navigationMenuDemoPath = fileURLToPath(
  new URL(
    "../../../apps/demo/src/components/runtime-prototype/NavigationMenuDemo.astro",
    import.meta.url,
  ),
);

describe("runtime prototype Navigation Menu demo", () => {
  it("keeps the supported default-value example but does not advertise static Astro controlled value", async () => {
    const source = await readFile(navigationMenuDemoPath, "utf8");

    expect(source).toContain('id="runtime-navigation-menu-default-value"');
    expect(source).toContain('defaultValue="docs"');
    expect(source).not.toContain('id="runtime-navigation-menu-controlled-value"');
    expect(source).not.toContain(">Controlled value</h3>");
    expect(source).not.toContain('value="suite"');
  });
});
