import { afterEach, describe, expect, it } from "vitest";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";

import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { compile } from "svelte/compiler";
import {
  createStyledNativeConsumer,
  nativeStyledRoots,
} from "../../../../packages/svelte/tests/styled-native-consumer.js";
import { verifyStyledNativeBrowser } from "../../../../packages/svelte/tests/styled-native-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
const consumers: DistConsumer[] = [];
const roots: string[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((entry) => entry.dispose()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function consumer() {
  const result = await createStyledNativeConsumer(process.cwd());
  consumers.push(result);
  return result;
}
describe("native Styled foundation", () => {
  it.each(nativeStyledRoots)("projects the %s contract", (component) => {
    const contract = starwindStyledContracts.find((entry) => entry.component === component)!;
    const result = projectSvelteStyledGroup(projectStyledOutputComponentGroup(contract), {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(result.components).toHaveLength(1);
    for (const file of renderSvelteStyledFiles(result).filter((entry) =>
      entry.relativePath.endsWith(".svelte"),
    )) {
      for (const generate of ["client", "server"] as const)
        expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
          [],
        );
    }
    expect(result.components[0]!.publicTypes).toContain("SvelteHTMLElements");
  });
});

describe("native Styled consumers", () => {
  it("server-renders and hydrates native semantic owners with balanced refs, symbols and events", async () => {
    await verifyStyledNativeBrowser(await consumer());
  }, 60_000);
  const malformedCases: {
    name: string;
    diagnostic: RegExp;
    mutate: (contract: StyledAdapterContract) => void;
  }[] = [
    {
      name: "extra semantic owner",
      diagnostic: /fixed native semantic owner/,
      mutate: (contract) => {
        contract.components[0]!.render.push({ type: "element", tag: "div" });
      },
    },
    {
      name: "named children",
      diagnostic: /unsupported native children shape/,
      mutate: (contract) => {
        const root = nativeRoot(contract);
        root.children = [{ type: "slot", name: "unexpected" }];
      },
    },
    {
      name: "nested children",
      diagnostic: /unsupported native children shape/,
      mutate: (contract) => {
        nativeRoot(contract).children = [{ type: "element", tag: "span" }];
      },
    },
    {
      name: "wrong native attribute type",
      diagnostic: /native attribute type differs/,
      mutate: (contract) => {
        contract.components[0]!.props!.extends = [{ type: "htmlAttributes", element: "button" }];
      },
    },
    {
      name: "unsupported inheritance",
      diagnostic: /unsupported native prop inheritance/,
      mutate: (contract) => {
        contract.components[0]!.props!.extends = [{ type: "raw", code: "Record<string, unknown>" }];
      },
    },
    {
      name: "duplicate native attribute type",
      diagnostic: /requires one native attribute type/,
      mutate: (contract) => {
        contract.components[0]!.props!.extends!.push({
          type: "htmlAttributes",
          element: nativeRoot(contract).tag,
        });
      },
    },
    {
      name: "missing spread",
      diagnostic: /requires one native attribute spread/,
      mutate: (contract) => {
        const root = nativeRoot(contract);
        root.attrs = root.attrs!.filter((attr) => attr.name !== "spread");
      },
    },
    {
      name: "duplicate spread",
      diagnostic: /requires one native attribute spread/,
      mutate: (contract) => {
        const root = nativeRoot(contract);
        root.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
      },
    },
    {
      name: "wrong spread expression",
      diagnostic: /requires one native attribute spread/,
      mutate: (contract) => {
        nativeRoot(contract).attrs!.find((attr) => attr.name === "spread")!.value = {
          type: "variable",
          name: "other",
        };
      },
    },
  ];
  function nativeRoot(contract: StyledAdapterContract) {
    const root = contract.components[0]!.render[0]!;
    if (root.type !== "element") throw new Error("native contract changed");
    return root;
  }
  it.each(
    nativeStyledRoots.flatMap((component) =>
      malformedCases.map((entry) => ({ component, ...entry })),
    ),
  )(
    "rejects $component $name before replacing existing files",
    async ({ component, mutate, diagnostic }) => {
      const root = await mkdtemp(path.join(os.tmpdir(), "svelte-native-invalid-"));
      roots.push(root);
      await mkdir(path.join(root, component));
      await writeFile(path.join(root, component, "retained.txt"), "prior output");
      const contract = structuredClone(
        starwindStyledContracts.find((entry) => entry.component === component)!,
      );
      mutate(contract);
      await expect(
        generateSvelteStyled({ outputRoot: root, roots: [component], contracts: [contract] }),
      ).rejects.toThrow(diagnostic);
      expect(await readFile(path.join(root, component, "retained.txt"), "utf8")).toBe(
        "prior output",
      );
    },
  );
});
