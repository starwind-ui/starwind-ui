import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";
describe("Native form wrappers", () => {
  it.each(["native-select", "textarea"])(
    "projects and compiles contract-owned %s output",
    (root) => {
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
      ))
        for (const generate of ["client", "server"] as const)
          expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual(
            [],
          );
    },
  );
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledNativeFormConsumer } from "../../../../packages/svelte/tests/styled-native-form-consumer.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((c) => c.dispose()));
});
async function consumer() {
  const result = await createStyledNativeFormConsumer(process.cwd());
  consumers.push(result);
  return result;
}

it("preserves native form bindings, SSR/hydration, reset, FormData and ref/attachment ownership", async () => {
  const { verifyStyledNativeFormBrowser } =
    await import("../../../../packages/svelte/tests/styled-native-form-browser.js");
  await verifyStyledNativeFormBrowser(await consumer());
});

import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
it("serializes the form wrappers and icon deterministically without hidden runtime dependencies", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-native-form-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["native-select", "textarea"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["native-select", "textarea"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect(first.size).toBe(8);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(
      new Map(
        [...committed].filter(([file]) =>
          ["native-select", "textarea"].includes(file.split("/")[0]!),
        ),
      ),
    );
    const select = first.get("native-select/NativeSelect.svelte")!,
      textarea = first.get("textarea/Textarea.svelte")!;
    expect(select).toContain("bind:value={value}");
    expect(select).toContain("nativeProps.multiple && value === undefined");
    expect(select).toContain('data-slot={"native-select-icon"}');
    expect(select).toContain('d={"M6 9l6 6l6 -6"}');
    expect(textarea).toContain("bind:value={value}");
    expect(textarea).toMatch(/>\s*<\/textarea>/);
    for (const content of first.values())
      expect(content).not.toMatch(/@tabler\/icons|@starwind-ui\/runtime|@starwind-ui\/svelte/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
const malformed: {
  name: string;
  root: "native-select" | "textarea";
  mutate: (c: StyledAdapterContract) => void;
}[] = [
  {
    name: "missing textarea children omission",
    root: "textarea",
    mutate(c) {
      const base = c.components[0]!.props!.extends![0]!;
      if (base.type !== "omitHtmlAttributes") throw new Error("contract changed");
      base.keys = [];
    },
  },
  {
    name: "wrong select owner",
    root: "native-select",
    mutate(c) {
      const wrapper = c.components[0]!.render[0]!;
      if (wrapper.type !== "element" || wrapper.children?.[0]?.type !== "element")
        throw new Error("contract changed");
      wrapper.children[0].tag = "div";
    },
  },
  {
    name: "shell prop forwarding",
    root: "native-select",
    mutate(c) {
      const wrapper = c.components[0]!.render[0]!;
      if (wrapper.type !== "element") throw new Error("contract changed");
      wrapper.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
    },
  },
  {
    name: "missing native select size omission",
    root: "native-select",
    mutate(c) {
      const base = c.components[0]!.props!.extends![0]!;
      if (base.type !== "omitHtmlAttributes") throw new Error("contract changed");
      base.keys = [];
    },
  },
  {
    name: "missing select icon",
    root: "native-select",
    mutate(c) {
      const wrapper = c.components[0]!.render[0]!;
      if (wrapper.type !== "element") throw new Error("contract changed");
      wrapper.children!.pop();
    },
  },
  {
    name: "unknown select SVG",
    root: "native-select",
    mutate(c) {
      c.components[0]!.imports![0]!.source = "@tabler/icons/outline/missing-native-select.svg";
    },
  },
  {
    name: "wrong Option attribute inheritance",
    root: "native-select",
    mutate(c) {
      const base = c.components[1]!.props!.extends![0]!;
      if (base.type !== "htmlAttributes") throw new Error("contract changed");
      base.element = "button";
    },
  },
  {
    name: "wrong textarea attribute inheritance",
    root: "textarea",
    mutate(c) {
      const base = c.components[0]!.props!.extends![0]!;
      if (base.type !== "omitHtmlAttributes") throw new Error("contract changed");
      base.element = "input";
    },
  },
  {
    name: "missing textarea prop spread",
    root: "textarea",
    mutate(c) {
      const node = c.components[0]!.render[0]!;
      if (node.type !== "element") throw new Error("contract changed");
      node.attrs = node.attrs!.filter((a) => a.name !== "spread");
    },
  },
];
it.each(malformed)(
  "rejects $name before output replacement",
  async ({ root: component, mutate }) => {
    const root = await mkdtemp(path.join(os.tmpdir(), "svelte-native-form-invalid-"));
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
