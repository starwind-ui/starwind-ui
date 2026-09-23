import { describe, expect, it } from "vitest";
import { compile } from "svelte/compiler";
import { videoStyledContract } from "../../contracts/styled/components/video.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { projectSvelteStyledGroup } from "../../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../../renderers/framework-adapters/svelte/styled/render.js";

describe("Video source branches", () => {
  it("projects and compiles the contract's video and iframe owners", () => {
    const group = projectStyledOutputComponentGroup(videoStyledContract);
    const before = structuredClone(group);
    const projection = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(group).toEqual(before);
    expect(projection.components.map((component) => component.exportName)).toEqual(["Video"]);
    const file = renderSvelteStyledFiles(projection).find(
      (entry) => entry.relativePath === "video/Video.svelte",
    )!;
    expect(file.content).toContain("<video");
    expect(file.content).toContain("<iframe");
    expect(file.content).toContain("autoplay={autoplay}");
    expect(file.content).toContain("srcdoc={srcdoc}");
    for (const generate of ["client", "server"] as const) {
      expect(compile(file.content, { filename: file.relativePath, generate }).warnings).toEqual([]);
    }
  });
});

import { afterEach } from "vitest";
import path from "node:path";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";
import { createStyledVideoConsumer } from "../../../../packages/svelte/tests/styled-video-consumer.js";
import { verifyStyledVideoBrowser } from "../../../../packages/svelte/tests/styled-video-browser.js";
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
});
async function consumer() {
  const result = await createStyledVideoConsumer(process.cwd());
  consumers.push(result);
  return result;
}
it("server-renders source branches and hydrates native media with balanced replacement", async () => {
  await verifyStyledVideoBrowser(await consumer());
}, 60000);

import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import os from "node:os";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
it("serializes three deterministic files from the unchanged source expressions", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-video-output-"));
  try {
    await generateSvelteStyled({ outputRoot: root, roots: ["video"] });
    const first = await readSvelteStyledTree(root);
    await generateSvelteStyled({ outputRoot: root, roots: ["video"] });
    expect(await readSvelteStyledTree(root)).toEqual(first);
    expect([...first.keys()].sort()).toEqual([
      "video/Video.svelte",
      "video/index.ts",
      "video/variants.ts",
    ]);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(first).toEqual(new Map([...committed].filter(([file]) => file.startsWith("video/"))));
    const group = projectStyledOutputComponentGroup(videoStyledContract);
    const projected = projectSvelteStyledGroup(group, {
      primitiveImportBase: "@starwind-ui/svelte",
    });
    expect(projected.components[0]!.variables).toEqual(group.components[0]!.variables);
    for (const content of first.values())
      expect(content).not.toMatch(/@starwind-ui\/runtime|@starwind-ui\/svelte/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
function branches(c: StyledAdapterContract) {
  const node = c.components[0]!.render[0]!;
  if (
    node.type !== "conditional" ||
    node.then[0]?.type !== "element" ||
    node.else?.[0]?.type !== "element"
  )
    throw new Error("contract changed");
  return { native: node.then[0], iframe: node.else[0] };
}
const malformed: { name: string; mutate: (c: StyledAdapterContract) => void }[] = [
  {
    name: "missing iframe branch",
    mutate(c) {
      const node = c.components[0]!.render[0]!;
      if (node.type !== "conditional") throw new Error("contract changed");
      node.else = [];
    },
  },
  {
    name: "wrong native owner",
    mutate(c) {
      branches(c).native.tag = "div";
    },
  },
  {
    name: "wrong iframe owner",
    mutate(c) {
      branches(c).iframe.tag = "video";
    },
  },
  {
    name: "missing captions track",
    mutate(c) {
      branches(c).native.children = [];
    },
  },
  {
    name: "missing iframe prop spread",
    mutate(c) {
      const node = branches(c).iframe;
      node.attrs = node.attrs!.filter((attr) => attr.name !== "spread");
    },
  },
  {
    name: "duplicate native spread",
    mutate(c) {
      branches(c).native.attrs!.push({ name: "spread", value: { type: "variable", name: "rest" } });
    },
  },
  {
    name: "missing native casing",
    mutate(c) {
      const node = branches(c).iframe;
      node.attrs = node.attrs!.filter((attr) => attr.name !== "srcdoc");
    },
  },
  {
    name: "wrong attribute inheritance",
    mutate(c) {
      const base = c.components[0]!.props!.extends![1]!;
      if (base.type !== "htmlAttributes") throw new Error("contract changed");
      base.element = "button";
    },
  },
  {
    name: "duplicate media field",
    mutate(c) {
      const fields = c.components[0]!.props!.fields!;
      fields[1] = structuredClone(fields.find((field) => field.name === "muted")!);
    },
  },
  {
    name: "missing media destructure",
    mutate(c) {
      const destructure = c.components[0]!.destructure!;
      destructure.props = destructure.props.filter((prop) => prop.name !== "src");
    },
  },
  {
    name: "missing source expression",
    mutate(c) {
      c.components[0]!.variables!.pop();
    },
  },
];
it.each(malformed)("rejects $name before replacing prior output", async ({ mutate }) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "svelte-video-invalid-"));
  try {
    await mkdir(path.join(root, "video"));
    await writeFile(path.join(root, "video/retained.txt"), "prior output");
    const contract = structuredClone(videoStyledContract);
    mutate(contract);
    await expect(
      generateSvelteStyled({ outputRoot: root, roots: ["video"], contracts: [contract] }),
    ).rejects.toThrow();
    expect(await readFile(path.join(root, "video/retained.txt"), "utf8")).toBe("prior output");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
