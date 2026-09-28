import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const requireRuntime = createRequire(path.join(root, "packages/runtime/package.json"));
const requireBuild = createRequire(requireRuntime.resolve("tsup"));
const { build } = requireBuild("esbuild");

async function bundle(components) {
  return build({
    absWorkingDir: root,
    bundle: true,
    format: "esm",
    metafile: true,
    outdir: path.join(root, "node_modules/.cache/field-registration-boundary"),
    platform: "browser",
    splitting: true,
    stdin: {
      contents: components
        .map(
          (component, index) =>
            `import * as parts${index} from "./packages/runtime/src/components/${component}/index.ts"; globalThis.parts${index} = parts${index};`,
        )
        .join("\n"),
      resolveDir: root,
    },
    write: false,
  });
}

describe("Field registration bundle boundary", () => {
  it.each(["checkbox", "switch", "select"])(
    "keeps automatic Field discovery out of standalone %s imports",
    async (component) => {
      const { metafile } = await bundle([component]);
      expect(Object.keys(metafile.inputs)).not.toContain(
        "packages/runtime/src/components/field/field-control-bridge.ts",
      );
      expect(
        Object.values(metafile.outputs).flatMap((output) =>
          output.imports.filter((entry) => entry.kind === "dynamic-import"),
        ),
      ).toEqual([]);
    },
  );

  it("shares one registry when Field and direct controls are composed", async () => {
    const { metafile } = await bundle(["checkbox", "field", "color-picker"]);
    const registry = "packages/runtime/src/components/field/field-control-registry.ts";
    const definitions = Object.values(metafile.outputs).filter(
      (output) => (output.inputs[registry]?.bytesInOutput ?? 0) > 0,
    );
    expect(definitions).toHaveLength(1);
    expect(Object.keys(metafile.inputs)).toContain(
      "packages/runtime/src/components/field/field-control-bridge.ts",
    );
  });
});
