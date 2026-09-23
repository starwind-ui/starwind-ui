import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("composed navigation", () => {
  it.each(["button-group", "pagination"])("projects and compiles every %s part", (root) => {
    const contract = starwindStyledContracts.find((c) => c.component === root)!;
    const group = projectStyledOutputComponentGroup(contract),
      before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((c) => c.exportName).sort()).toEqual(
      [...contract.publicExports].sort(),
    );
    for (const file of renderSvelteStyledFiles(projection).filter((f) =>
      f.relativePath.endsWith(".svelte"),
    )) {
      for (const generate of ["client", "server"] as const)
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
    }
  });
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledNavigationConsumer } from "../../../../packages/svelte/tests/styled-navigation-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((c) => c.dispose()));
});
async function consumer() {
  const result = await createStyledNavigationConsumer(process.cwd());
  consumers.push(result);
  return result;
}

it("hydrates component dependencies and isolates Button/Pagination attachment replacement", async () => {
  const { verifyStyledNavigationBrowser } =
    await import("../../../../packages/svelte/tests/styled-navigation-browser.js");
  await verifyStyledNavigationBrowser(await consumer());
});

import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { selectSvelteStyledContracts } from "../../renderers/framework-adapters/svelte/styled/scope.js";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
it("closes dependencies and imports same-group parts directly", () => {
  expect(
    selectSvelteStyledContracts(starwindStyledContracts, ["button-group", "pagination"]).map(
      (c) => c.component,
    ),
  ).toEqual(["button", "button-group", "pagination", "separator"]);
  for (const name of ["button", "separator"])
    expect(() =>
      selectSvelteStyledContracts(
        starwindStyledContracts.filter((c) => c.component !== name),
        ["button-group", "pagination"],
      ),
    ).toThrow(/missing dependency/);
  const contract = starwindStyledContracts.find((c) => c.component === "pagination")!;
  const files = renderSvelteStyledFiles(
    projectSvelteStyledGroup(projectStyledOutputComponentGroup(contract), {
      primitiveImportBase: "@starwind-ui/svelte",
    }),
  );
  for (const name of ["PaginationPrevious", "PaginationNext"]) {
    const file = files.find((f) => f.relativePath.endsWith(`${name}.svelte`))!;
    expect(file.content).toContain(
      'import { default as PaginationLink } from "./PaginationLink.svelte"',
    );
    expect(file.content).not.toMatch(/from ["'](?:\.\/|\.\.\/pagination\/)index\.js/);
  }
  expect(files.find((f) => f.relativePath.endsWith("PaginationLink.svelte"))!.content).toContain(
    'from "../button/index.js"',
  );
});
it("regenerates navigation with its dependency closure deterministically", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-navigation-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["button-group", "pagination"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["button-group", "pagination"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(20);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map(
        [...committed].filter(([file]) =>
          ["button", "button-group", "pagination", "separator"].includes(file.split("/")[0]!),
        ),
      ),
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
const malformed: {
  name: string;
  root: "button-group" | "pagination";
  mutate: (contract: StyledAdapterContract) => void;
}[] = [
  {
    name: "wrong Separator owner",
    root: "button-group",
    mutate: (c) => {
      const root = c.components.find((p) => p.exportName === "ButtonGroupSeparator")!.render[0]!;
      if (root.type !== "component") throw new Error("contract changed");
      root.exportName = "UnknownSeparator";
    },
  },
  {
    name: "unsupported inherited keys",
    root: "pagination",
    mutate: (c) => {
      const base = c.components.find((p) => p.exportName === "PaginationLink")!.props!.extends![0]!;
      if (base.type !== "componentProps") throw new Error("contract changed");
      base.keys = ["size"];
    },
  },
  {
    name: "wrong anchor branch",
    root: "pagination",
    mutate: (c) => {
      const root = c.components.find((p) => p.exportName === "PaginationLink")!.render[0]!;
      if (root.type !== "component") throw new Error("contract changed");
      root.attrs!.find((a) => a.name === "as")!.value = { type: "literal", value: "button" };
    },
  },
  {
    name: "missing prop spread",
    root: "pagination",
    mutate: (c) => {
      const root = c.components.find((p) => p.exportName === "PaginationNext")!.render[0]!;
      if (root.type !== "component") throw new Error("contract changed");
      root.attrs = root.attrs!.filter((a) => a.name !== "spread");
    },
  },
  {
    name: "unsupported named slot",
    root: "pagination",
    mutate: (c) => {
      const root = c.components.find((p) => p.exportName === "PaginationPrevious")!.render[0]!;
      if (root.type !== "component" || root.children![0]!.type !== "slot")
        throw new Error("contract changed");
      root.children![0]!.name = "unknown";
    },
  },
  {
    name: "missing icon asset",
    root: "pagination",
    mutate: (c) => {
      c.components.find((p) => p.exportName === "PaginationEllipsis")!.imports![0]!.source =
        "@tabler/icons/outline/unknown-pagination-icon.svg";
    },
  },
  {
    name: "unknown import",
    root: "pagination",
    mutate: (c) => {
      c.components.find((p) => p.exportName === "PaginationNext")!.imports![0]!.source =
        "unrecognized-navigation-module";
    },
  },
  {
    name: "missing native part identity",
    root: "pagination",
    mutate: (c) => {
      const root = c.components.find((p) => p.exportName === "PaginationEllipsis")!.render[0]!;
      if (root.type !== "element") throw new Error("contract changed");
      root.attrs = root.attrs!.filter((a) => a.name !== "data-slot");
    },
  },
];
it.each(malformed)(
  "rejects $name before replacing prior output",
  async ({ root: component, mutate }) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-navigation-invalid-"));
    try {
      await mkdir(path.join(root, component));
      await writeFile(path.join(root, component, "retained.txt"), "prior output");
      const contracts = structuredClone(starwindStyledContracts);
      mutate(contracts.find((c) => c.component === component)!);
      await expect(
        generateSvelteStyled({ outputRoot: root, roots: [component], contracts }),
      ).rejects.toThrow();
      expect(await readFile(path.join(root, component, "retained.txt"), "utf8")).toBe(
        "prior output",
      );
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
