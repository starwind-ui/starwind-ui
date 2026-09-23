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
  createStyledDynamicConsumer,
  dynamicStyledRoots,
  dynamicStyledParts,
} from "../../../../packages/svelte/tests/styled-dynamic-consumer.js";

import { verifyStyledDynamicBrowser } from "../../../../packages/svelte/tests/styled-dynamic-browser.js";
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
  const result = await createStyledDynamicConsumer(process.cwd());
  consumers.push(result);
  return result;
}
const roots = dynamicStyledRoots;

describe("dynamic native components", () => {
  it.each(["aspect-ratio", "badge", "item"])("projects and compiles all %s parts", (root) => {
    const contract = starwindStyledContracts.find((entry) => entry.component === root)!;
    const group = projectStyledOutputComponentGroup(contract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((part) => part.exportName).sort()).toEqual(
      dynamicStyledParts
        .filter((part) => part.root === root)
        .map((part) => part.name)
        .sort(),
    );
    expect(projection.components.map((part) => part.exportName).sort()).toEqual(
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

describe("dynamic content consumers", () => {
  it("hydrates every part and balances dynamic branches, callback replacement and unmount", async () => {
    await verifyStyledDynamicBrowser(await consumer());
  }, 60_000);
  it("regenerates the assigned groups deterministically without changing the existing roots", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-dynamic-output-"));
    temporaryRoots.push(root);
    const previous = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    await generateSvelteStyled({ outputRoot: root, roots });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(21);
    expect(first).toEqual(
      new Map(
        [...previous].filter(([file]) =>
          [...roots, "separator"].includes(file.split("/")[0] as never),
        ),
      ),
    );
    expect(await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime")).toEqual(
      previous,
    );
  });
});

const malformed: {
  root: "aspect-ratio" | "badge" | "item";
  name: string;
  diagnostic: RegExp;
  mutate: (contract: StyledAdapterContract) => void;
}[] = [
  {
    root: "aspect-ratio",
    name: "ratio wrapper native spread",
    diagnostic: /ratio container must own only/,
    mutate(contract) {
      const wrapper = contract.components[0]!.render[0]!;
      if (wrapper.type !== "element") throw new Error("AspectRatio contract drift");
      wrapper.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
    },
  },
  {
    root: "aspect-ratio",
    name: "ratio wrapper extra child",
    diagnostic: /fixed native container/,
    mutate(contract) {
      const wrapper = contract.components[0]!.render[0]!;
      if (wrapper.type !== "element") throw new Error("AspectRatio contract drift");
      wrapper.children!.push({ type: "element", tag: "div" });
    },
  },
  {
    root: "aspect-ratio",
    name: "ratio owner no dynamic tag",
    diagnostic: /native semantic owner/,
    mutate(contract) {
      const wrapper = contract.components[0]!.render[0]!;
      if (wrapper.type !== "element") throw new Error("AspectRatio contract drift");
      const owner = wrapper.children![0]!;
      if (owner.type !== "element") throw new Error("AspectRatio owner drift");
      delete owner.tagBinding;
    },
  },
  {
    root: "badge",
    name: "unknown dynamic owner",
    diagnostic: /native semantic owner/,
    mutate(contract) {
      const owner = contract.components[0]!.render[0]!;
      if (owner.type !== "element") throw new Error("Badge contract drift");
      owner.tag = "Unknown";
    },
  },
  {
    root: "badge",
    name: "duplicate native spread",
    diagnostic: /one native attribute spread/,
    mutate(contract) {
      const owner = contract.components[0]!.render[0]!;
      if (owner.type !== "element") throw new Error("Badge contract drift");
      owner.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
    },
  },
  {
    root: "item",
    name: "custom component default",
    diagnostic: /native as with div default/,
    mutate(contract) {
      contract.components[0]!.destructure!.props.find((prop) => prop.name === "as")!.defaultValue =
        "CustomComponent";
    },
  },
  {
    root: "item",
    name: "unowned Separator dependency",
    diagnostic: /Separator component owner/,
    mutate(contract) {
      const owner = contract.components.find((part) => part.exportName === "ItemSeparator")!
        .render[0]!;
      if (owner.type !== "component") throw new Error("ItemSeparator contract drift");
      owner.component = "label";
    },
  },
  {
    root: "item",
    name: "wrong Separator prop source",
    diagnostic: /Separator component props/,
    mutate(contract) {
      contract.components.find((part) => part.exportName === "ItemSeparator")!.props!.extends = [
        { type: "htmlAttributes", element: "div" },
      ];
    },
  },
];
it.each(malformed)(
  "rejects $name before replacing output",
  async ({ root: name, mutate, diagnostic }) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-dynamic-invalid-"));
    temporaryRoots.push(root);
    await mkdir(path.join(root, name));
    await writeFile(path.join(root, name, "retained.txt"), "prior output");
    const contract = structuredClone(
      starwindStyledContracts.find((entry) => entry.component === name)!,
    );
    mutate(contract);
    await expect(
      generateSvelteStyled({
        outputRoot: root,
        roots: [name],
        contracts: [
          contract,
          ...starwindStyledContracts.filter((entry) =>
            ["separator", "label"].includes(entry.component),
          ),
        ],
      }),
    ).rejects.toThrow(diagnostic);
    expect(await readFile(path.join(root, name, "retained.txt"), "utf8")).toBe("prior output");
  },
);
