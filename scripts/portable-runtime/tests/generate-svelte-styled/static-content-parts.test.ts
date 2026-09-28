import { afterEach, describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  createStyledStaticConsumer,
  staticStyledRoots,
  staticStyledParts,
} from "../../../../packages/svelte/tests/styled-static-consumer.js";
import { verifyStyledStaticBrowser } from "../../../../packages/svelte/tests/styled-static-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
const consumers: DistConsumer[] = [];
const temporaryRoots: string[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((entry) => entry.dispose()));
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { recursive: true, force: true })),
  );
});
async function consumer() {
  const result = await createStyledStaticConsumer(process.cwd());
  consumers.push(result);
  return result;
}
const roots = staticStyledRoots;
describe("static native content parts", () => {
  it.each(roots)("projects and compiles every %s public part", (root) => {
    const contract = starwindStyledContracts.find((entry) => entry.component === root)!;
    const group = projectStyledOutputComponentGroup(contract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((entry) => entry.exportName).sort()).toEqual(
      staticStyledParts
        .filter((part) => part.root === root)
        .map((part) => part.name)
        .sort(),
    );
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

describe("static content consumers", () => {
  it("hydrates valid table anatomy and every static part with balanced refs, attachments and native events", async () => {
    await verifyStyledStaticBrowser(await consumer());
  }, 60_000);
  it("regenerates the assigned groups deterministically without changing the existing roots", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-static-output-"));
    temporaryRoots.push(root);
    const previous = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    await generateSvelteStyled({ outputRoot: root, roots });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(28);
    expect(first).toEqual(
      new Map([...previous].filter(([file]) => roots.includes(file.split("/")[0] as never))),
    );
    expect(await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime")).toEqual(
      previous,
    );
  });
  const malformed: {
    name: string;
    diagnostic: RegExp;
    mutate: (contract: StyledAdapterContract) => void;
  }[] = [
    {
      name: "multiple container children",
      diagnostic: /fixed native container/,
      mutate: (contract) => {
        const root = contract.components[0]!.render[0]!;
        if (root.type !== "element") throw new Error("Table contract changed");
        root.children!.push({ type: "element", tag: "table" });
      },
    },
    {
      name: "forwarded props on container",
      diagnostic: /container must not own forwarded props/,
      mutate: (contract) => {
        const root = contract.components[0]!.render[0]!;
        if (root.type !== "element") throw new Error("Table contract changed");
        root.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
      },
    },
    {
      name: "wrong semantic child",
      diagnostic: /fixed native semantic owner/,
      mutate: (contract) => {
        const root = contract.components[0]!.render[0]!;
        if (root.type !== "element") throw new Error("Table contract changed");
        const table = root.children![0]!;
        if (table.type !== "element") throw new Error("Table contract changed");
        table.tag = "div";
      },
    },
    {
      name: "missing semantic attribute spread",
      diagnostic: /requires one native attribute spread/,
      mutate: (contract) => {
        const root = contract.components[0]!.render[0]!;
        if (root.type !== "element") throw new Error("Table contract changed");
        const table = root.children![0]!;
        if (table.type !== "element") throw new Error("Table contract changed");
        table.attrs = table.attrs!.filter((entry) => entry.name !== "spread");
      },
    },
  ];
  it.each(malformed)(
    "rejects Table $name before replacing prior output",
    async ({ mutate, diagnostic }) => {
      const root = await mkdtemp(path.join(os.tmpdir(), "svelte-static-invalid-"));
      temporaryRoots.push(root);
      await mkdir(path.join(root, "table"));
      await writeFile(path.join(root, "table/retained.txt"), "prior output");
      const contract = structuredClone(
        starwindStyledContracts.find((entry) => entry.component === "table")!,
      );
      mutate(contract);
      await expect(
        generateSvelteStyled({ outputRoot: root, roots: ["table"], contracts: [contract] }),
      ).rejects.toThrow(diagnostic);
      expect(await readFile(path.join(root, "table/retained.txt"), "utf8")).toBe("prior output");
    },
  );
});
