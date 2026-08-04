import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const navigationMenuDemoPath = fileURLToPath(
  new URL(
    "../../../apps/demo/src/components/runtime-prototype/NavigationMenuDemo.astro",
    import.meta.url,
  ),
);
const reactNavigationMenuDemoPath = fileURLToPath(
  new URL(
    "../../../apps/react-demo/src/runtime-prototype/demos/NavigationMenuDemo.tsx",
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

  it("keeps matching Astro and React sizing and visual-ownership showcases", async () => {
    const [astroSource, reactSource] = await Promise.all([
      readFile(navigationMenuDemoPath, "utf8"),
      readFile(reactNavigationMenuDemoPath, "utf8"),
    ]);

    for (const [framework, source] of [
      ["Astro", astroSource],
      ["React", reactSource],
    ] as const) {
      expect(source, `${framework} small size`).toContain('size="sm"');
      expect(source, `${framework} medium size`).toContain('size="md"');
      expect(source, `${framework} independent popup size`).toContain('contentSize="md"');
      expect(source, `${framework} removed large size`).not.toContain('size="lg"');
      expect(source, `${framework} trigger-style link`).toContain("navigationMenuTriggerStyle()");
      expect(source, `${framework} explicit icon size`).toContain("size-6");
      expect(source, `${framework} asChild composition`).toContain("NavigationMenuTrigger asChild");
      expect(source, `${framework} delegated consumer class`).toContain("uppercase");
      expect(source, `${framework} composed Button size`).toContain('size="sm"');
      expect(source, `${framework} composed Button class`).toContain("tracking-wide");
    }

    expect(astroSource).toContain('id="runtime-navigation-menu-size-default"');
    expect(astroSource).toContain('id="runtime-navigation-menu-composed-trigger"');
    expect(reactSource).toContain('id="react-runtime-navigation-menu-size-default"');
    expect(reactSource).toContain('id="react-runtime-navigation-menu-composed-trigger"');
  });

  it("keeps the Astro shadcn-style docs navigation available at both supported sizes", async () => {
    const source = await readFile(navigationMenuDemoPath, "utf8");

    expect(source).toContain('id="runtime-navigation-menu-shadcn-style-sm"');
    expect(source).toContain('id="runtime-navigation-menu-shadcn-style-md"');
    expect(source).toContain('size="sm"');
    expect(source).toContain('size="md"');
    expect(source).not.toContain('size="lg"');
    expect(source).toContain("Getting started");
    expect(source).toContain("Components");
    expect(source).toContain("With Icon");
    expect(source).toContain('href="#docs"');
    expect(source).toContain("class={navigationMenuTriggerStyle()}");
    expect(source).not.toContain("docsNavigationSizes.map");
  });
});
