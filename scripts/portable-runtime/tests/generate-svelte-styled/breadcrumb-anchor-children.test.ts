import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { afterEach, describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

import { createStyledBreadcrumbConsumer } from "../../../../packages/svelte/tests/styled-breadcrumb-consumer.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import path from "node:path";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((entry) => entry.dispose()));
});
async function consumer() {
  const fixture = await createStyledBreadcrumbConsumer(process.cwd());
  consumers.push(fixture);
  return fixture;
}

describe("Breadcrumb native and custom links", () => {
  it("projects and compiles every public part and its contract icon assets", () => {
    const contract = starwindStyledContracts.find((entry) => entry.component === "breadcrumb")!;
    const group = projectStyledOutputComponentGroup(contract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((entry) => entry.exportName).sort()).toEqual(
      [...contract.publicExports].sort(),
    );
    for (const file of renderSvelteStyledFiles(projection).filter((entry) =>
      entry.relativePath.endsWith(".svelte"),
    )) {
      for (const generate of ["client", "server"] as const)
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
    }
  });
});

it("preserves native SSR hydration and consumer-owned custom link props and cleanup", async () => {
  const { verifyStyledBreadcrumbBrowser } =
    await import("../../../../packages/svelte/tests/styled-breadcrumb-browser.js");
  await verifyStyledBreadcrumbBrowser(await consumer());
});

it("regenerates the nine Breadcrumb files deterministically", async () => {
  const { generateSvelteStyled } = await import("../../generate-svelte-styled.js");
  const { readSvelteStyledTree } = await import("../../check-svelte-styled.js");
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-breadcrumb-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["breadcrumb"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["breadcrumb"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(9);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map([...committed].filter(([file]) => file.startsWith("breadcrumb/"))),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

const malformed = [
  {
    name: "child branch",
    mutate: (contract: StyledAdapterContract) => {
      const branch = contract.components.find((c) => c.exportName === "BreadcrumbLink")!.render[0]!;
      if (branch.type !== "conditional") throw new Error("changed contract");
      branch.condition = "unknown";
    },
  },
  {
    name: "anchor owner",
    mutate: (contract: StyledAdapterContract) => {
      const branch = contract.components.find((c) => c.exportName === "BreadcrumbLink")!.render[0]!;
      if (branch.type !== "conditional" || branch.else?.[0]?.type !== "element")
        throw new Error("changed contract");
      branch.else[0].tag = "button";
    },
  },
  {
    name: "multiple anchors",
    mutate: (contract: StyledAdapterContract) => {
      const branch = contract.components.find((c) => c.exportName === "BreadcrumbLink")!.render[0]!;
      if (branch.type !== "conditional") throw new Error("changed contract");
      branch.else!.push({ type: "element", tag: "a" });
    },
  },
  {
    name: "anchor props",
    mutate: (contract: StyledAdapterContract) => {
      const branch = contract.components.find((c) => c.exportName === "BreadcrumbLink")!.render[0]!;
      if (branch.type !== "conditional" || branch.else?.[0]?.type !== "element")
        throw new Error("changed contract");
      branch.else[0].attrs = branch.else[0].attrs!.filter((a) => a.name !== "spread");
    },
  },
  {
    name: "unknown icon import",
    mutate: (contract: StyledAdapterContract) => {
      contract.components.find((c) => c.exportName === "BreadcrumbSeparator")!.imports![0]!.source =
        "unsupported-module";
    },
  },
  {
    name: "missing icon asset",
    mutate: (contract: StyledAdapterContract) => {
      contract.components.find((c) => c.exportName === "BreadcrumbSeparator")!.imports![0]!.source =
        "@tabler/icons/outline/unknown-breadcrumb-icon.svg";
    },
  },
  {
    name: "native part identity",
    mutate: (contract: StyledAdapterContract) => {
      const root = contract.components.find((c) => c.exportName === "BreadcrumbEllipsis")!
        .render[0]!;
      if (root.type !== "element") throw new Error("changed contract");
      root.attrs = root.attrs!.filter((a) => a.name !== "data-slot");
    },
  },
];
it.each(malformed)("rejects unsupported $name before replacing output", async ({ mutate }) => {
  const { generateSvelteStyled } = await import("../../generate-svelte-styled.js");
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-breadcrumb-invalid-"));
  try {
    await mkdir(path.join(root, "breadcrumb"));
    await writeFile(path.join(root, "breadcrumb/retained.txt"), "prior output");
    const contract = structuredClone(
      starwindStyledContracts.find((c) => c.component === "breadcrumb")!,
    );
    mutate(contract);
    await expect(
      generateSvelteStyled({ outputRoot: root, roots: ["breadcrumb"], contracts: [contract] }),
    ).rejects.toThrow();
    expect(await readFile(path.join(root, "breadcrumb/retained.txt"), "utf8")).toBe("prior output");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
