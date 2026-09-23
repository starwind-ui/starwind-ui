import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
describe("Prose and Spinner", () => {
  it.each(["prose", "spinner"])("projects and compiles contract-owned %s output", (root) => {
    const contract = starwindStyledContracts.find((c) => c.component === root)!;
    const group = projectStyledOutputComponentGroup(contract),
      before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((c) => c.exportName)).toEqual(contract.publicExports);
    for (const file of renderSvelteStyledFiles(projection).filter((f) =>
      f.relativePath.endsWith(".svelte"),
    ))
      for (const generate of ["client", "server"] as const)
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
  });
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledProseSpinnerConsumer } from "../../../../packages/svelte/tests/styled-prose-spinner-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((c) => c.dispose()));
});
async function consumer() {
  const result = await createStyledProseSpinnerConsumer(process.cwd());
  consumers.push(result);
  return result;
}

import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
it("rejects malformed Prose CSS before replacing prior output", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-prose-invalid-"));
  try {
    await mkdir(path.join(root, "prose"));
    await writeFile(path.join(root, "prose/retained.txt"), "prior output");
    const contract = structuredClone(starwindStyledContracts.find((c) => c.component === "prose")!);
    contract.styles!.content = [".sw-prose {"];
    await expect(
      generateSvelteStyled({ outputRoot: root, roots: ["prose"], contracts: [contract] }),
    ).rejects.toThrow();
    expect(await readFile(path.join(root, "prose/retained.txt"), "utf8")).toBe("prior output");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

it("includes Prose CSS in consumer builds and hydrates native HTML/SVG ownership", async () => {
  const { verifyStyledProseSpinnerBrowser } =
    await import("../../../../packages/svelte/tests/styled-prose-spinner-browser.js");
  await verifyStyledProseSpinnerBrowser(await consumer());
});

import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { proseStyles } from "../../contracts/styled/styles/prose.js";
it("serializes owned Prose CSS and Spinner SVG deterministically", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-prose-spinner-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["prose", "spinner"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["prose", "spinner"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(7);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map(
        [...committed].filter(([file]) => ["prose", "spinner"].includes(file.split("/")[0]!)),
      ),
    );
    expect(first.get("prose/styles.css")).toBe(
      proseStyles.map((line) => line.trimEnd()).join("\n") + "\n",
    );
    expect(first.get("prose/Prose.svelte")).toContain('import "./styles.css";');
    const group = projectStyledOutputComponentGroup(
      starwindStyledContracts.find((c) => c.component === "spinner")!,
    );
    const asset = group.components[0]!.imports[0]!.svg!;
    const svg = first.get("spinner/Spinner.svelte")!;
    expect(svg).toContain("<svg");
    expect(svg).toContain('role={"status"}');
    expect(svg).toContain('aria-label={"Loading"}');
    expect(svg).toContain('data-slot={"spinner"}');
    expect(svg).toContain("bind:this={ref}");
    expect(svg).not.toContain("@tabler/icons");
    expect(svg).toContain('d={"M12 3a9 9 0 1 0 9 9"}');
    expect(asset).toBeDefined();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
const malformed: {
  name: string;
  root: "prose" | "spinner";
  mutate: (c: StyledAdapterContract) => void;
}[] = [
  {
    name: "missing Prose stylesheet",
    root: "prose",
    mutate: (c) => {
      delete c.styles;
    },
  },
  {
    name: "wrong Prose stylesheet owner",
    root: "prose",
    mutate: (c) => {
      c.styles!.importFrom = ["Missing"];
    },
  },
  {
    name: "unsafe Prose stylesheet path",
    root: "prose",
    mutate: (c) => {
      c.styles!.fileName = "../styles.css";
    },
  },
  {
    name: "unknown Spinner SVG",
    root: "spinner",
    mutate: (c) => {
      c.components[0]!.imports![0]!.source = "@tabler/icons/outline/missing-spinner.svg";
    },
  },
  {
    name: "missing Spinner prop spread",
    root: "spinner",
    mutate: (c) => {
      const node = c.components[0]!.render[0]!;
      if (node.type !== "icon") throw new Error("contract changed");
      node.attrs = node.attrs!.filter((a) => a.name !== "spread");
    },
  },
  {
    name: "wrong Spinner native props",
    root: "spinner",
    mutate: (c) => {
      const base = c.components[0]!.props!.extends![0]!;
      if (base.type !== "omitHtmlAttributes") throw new Error("contract changed");
      base.element = "button";
    },
  },
];
it.each(malformed)(
  "rejects $name before replacing prior output",
  async ({ root: component, mutate }) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-prose-spinner-invalid-"));
    try {
      await mkdir(path.join(root, component));
      await writeFile(path.join(root, component, "retained.txt"), "prior output");
      const contract = structuredClone(
        starwindStyledContracts.find((c) => c.component === component)!,
      );
      mutate(contract);
      await expect(
        generateSvelteStyled({ outputRoot: root, roots: [component], contracts: [contract] }),
      ).rejects.toThrow();
      expect(await readFile(path.join(root, component, "retained.txt"), "utf8")).toBe(
        "prior output",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
