import { mkdtemp, realpath, rm } from "node:fs/promises";
import os from "node:os";

import { afterEach, beforeEach, describe } from "vitest";

import { moveAstroElementSpreadsFirst } from "../../renderers/framework-adapters/astro/spread-attribute-order.js";
import {
  expect,
  generateAstroPrimitiveWrappers,
  generateStarwindAstroWrappers,
  it,
  path,
  readGeneratedTree,
} from "./shared.js";

const frontmatter = "---\nconst { href, ...rest } = Astro.props;\n---\n\n";

describe("moveAstroElementSpreadsFirst", () => {
  it("moves a native element spread ahead of its default attributes", () => {
    expect(
      moveAstroElementSpreadsFirst(
        `${frontmatter}<button type="button" data-state="closed" {...rest}>\n  <slot />\n</button>\n`,
      ),
    ).toBe(
      `${frontmatter}<button {...rest} type="button" data-state="closed">\n  <slot />\n</button>\n`,
    );
  });

  it("keeps the attributes that already follow the spread in their order", () => {
    expect(
      moveAstroElementSpreadsFirst(`${frontmatter}<div class="a" {...rest} data-slot="b" />\n`),
    ).toBe(`${frontmatter}<div {...rest} class="a" data-slot="b" />\n`);
  });

  it("keeps several spreads in source order", () => {
    expect(
      moveAstroElementSpreadsFirst(`${frontmatter}<a {...first} href={href} {...rest}></a>\n`),
    ).toBe(`${frontmatter}<a {...first} {...rest} href={href}></a>\n`);
  });

  it("handles expression branches and values that hold tag and brace characters", () => {
    const source = `${frontmatter}{
  asChild ? (
    <div
      data-a={a > 1 ? "}" : "{"}
      data-b="<x>"
      {...rest}
    >
      <slot />
    </div>
  ) : (
    <span title={\`\${a}>\`} {...rest} />
  )
}
`;

    expect(moveAstroElementSpreadsFirst(source)).toBe(`${frontmatter}{
  asChild ? (
    <div
      {...rest}
      data-a={a > 1 ? "}" : "{"}
      data-b="<x>"
    >
      <slot />
    </div>
  ) : (
    <span {...rest} title={\`\${a}>\`} />
  )
}
`);
  });

  it("leaves components, frontmatter, and scripts unchanged because they merge props in order", () => {
    const source = `---
const value = <div a="1" {...rest} />;
---

<Primitive.Trigger class="a" {...rest} data-slot="b">
  <slot />
</Primitive.Trigger>

<script>
  const element = <div a="1" {...rest} />;
</script>
`;

    expect(moveAstroElementSpreadsFirst(source)).toBe(source);
  });
});

describe("generated Astro output", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await realpath(await mkdtemp(path.join(os.tmpdir(), "starwind-astro-spreads-")));
  });

  afterEach(async () => {
    await rm(tempRoot, { force: true, recursive: true });
  });

  function expectConsumerSpreadsFirst(tree: Record<string, string>): void {
    const astroFiles = Object.entries(tree).filter(([name]) => name.endsWith(".astro"));
    expect(astroFiles.length).toBeGreaterThan(0);
    const misordered = astroFiles
      .filter(([, source]) => moveAstroElementSpreadsFirst(source) !== source)
      .map(([name]) => name);
    expect(misordered).toEqual([]);
  }

  it("prints every Primitive element spread first so a consumer attribute wins", async () => {
    await generateAstroPrimitiveWrappers({
      outputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    expectConsumerSpreadsFirst(
      await readGeneratedTree(path.join(tempRoot, "generated/primitives/astro")),
    );
  });

  it("prints every Styled element spread first so a consumer attribute wins", async () => {
    await generateStarwindAstroWrappers({
      outputDir: "generated/starwind-runtime",
      primitiveOutputDir: "generated/starwind-runtime/primitives/astro",
      repoRoot: tempRoot,
    });

    expectConsumerSpreadsFirst(
      await readGeneratedTree(path.join(tempRoot, "generated/starwind-runtime")),
    );
  });
});
