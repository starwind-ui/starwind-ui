import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";
import { selectRuntimeAdapterContract } from "../contracts/primitive/representatives.js";
import { writeAstroAdapterOutput } from "../renderers/framework-adapters/astro/primitive-output-writer.js";
import {
  type AdapterOutputModel,
  createFrameworkAdapterConformanceFixture,
  getPrimitiveFrameworkAdapterTarget,
} from "../renderers/framework-adapters/index.js";
import { writePrimitiveOutputFiles } from "../renderers/framework-adapters/primitive-output-writer.js";
import {
  applyReactEffectTiming,
  writeReactAdapterOutput,
} from "../renderers/framework-adapters/react/primitive-output-writer.js";
import {
  buildSelectAdapterOutputModel,
  buildSelectSpecializedAdapterSpec,
} from "../renderers/specialized-adapter-spec/index.js";

describe("specialized primitive output writer", () => {
  it("preserves explicitly marked passive React effects in runtime controller files", () => {
    const output = applyReactEffectTiming(`import * as React from "react";

export function Fixture() {
  const rootRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(/* @starwind-passive-effect */ () => {
    window.setTimeout(() => undefined, 0);
  }, []);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const instance = { destroy() {} };

    return () => {
      instance.destroy();
    };
  }, []);

  return <div ref={rootRef} />;
}
`);

    expect(output).toContain(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
    );
    expect(output).toContain("React.useEffect(() => {\n    window.setTimeout");
    expect(output).toContain("useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current");
    expect(output).not.toContain("@starwind-passive-effect");
  });

  it("routes registered primitive target output through target-owned print and write policy", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "starwind-specialized-output-writer-"));

    try {
      await getPrimitiveFrameworkAdapterTarget("astro").primitive.outputModel.write({
        componentHeader: "---\n// astro header\n",
        componentName: "Fixture",
        moduleHeader: "// ts header\n",
        outputModel: createFrameworkAdapterConformanceFixture(),
        outputRoot: path.join(outputRoot, "astro"),
      });

      await expect(
        readFile(path.join(outputRoot, "astro/conformance/ConformanceRoot.astro"), "utf8"),
      ).resolves.toContain("---\n// astro header\n");
      await expect(
        readFile(path.join(outputRoot, "astro/conformance/index.ts"), "utf8"),
      ).resolves.toContain("// ts header\n");

      await getPrimitiveFrameworkAdapterTarget("react").primitive.outputModel.write({
        componentName: "Fixture",
        moduleHeader: "// ts header\n",
        outputModel: createFrameworkAdapterConformanceFixture(),
        outputRoot: path.join(outputRoot, "react"),
      });

      const reactRoot = await readFile(
        path.join(outputRoot, "react/conformance/ConformanceRoot.tsx"),
        "utf8",
      );
      expect(reactRoot).toContain("// ts header\n");
      expect(reactRoot).toContain(
        'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";',
      );
      expect(reactRoot).toContain("useIsomorphicLayoutEffect(() =>");
      expect(reactRoot).not.toContain("React.useEffect");
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });

  it("writes registered React target-ready output models with projected helper files", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "starwind-specialized-output-writer-"));
    const reactTarget = getPrimitiveFrameworkAdapterTarget("react");
    const outputModel = reactTarget.primitive.outputModel.projectSpecialized(
      buildSelectAdapterOutputModel(
        buildSelectSpecializedAdapterSpec(selectRuntimeAdapterContract),
      ),
    );

    try {
      await reactTarget.primitive.outputModel.write({
        componentName: "Select",
        moduleHeader: "// ts header\n",
        outputModel,
        outputRoot,
      });

      await expect(
        readFile(path.join(outputRoot, "select/SelectContext.tsx"), "utf8"),
      ).resolves.toContain("// ts header\n");
      await expect(readFile(path.join(outputRoot, "select/index.ts"), "utf8")).resolves.toContain(
        "SelectContext",
      );
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });

  it("applies Astro headers to Astro files and TypeScript headers to helper files", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "starwind-specialized-output-writer-"));

    try {
      await writeAstroAdapterOutput({
        astroHeader: "---\n// astro header\n",
        componentName: "Fixture",
        outputModel: createFrameworkAdapterConformanceFixture(),
        outputRoot,
        tsHeader: "// ts header\n",
      });

      await expect(
        readFile(path.join(outputRoot, "conformance/ConformanceRoot.astro"), "utf8"),
      ).resolves.toContain("---\n// astro header\n");
      await expect(
        readFile(path.join(outputRoot, "conformance/index.ts"), "utf8"),
      ).resolves.toContain("// ts header\n");
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });

  it("rejects unknown ignored output model paths before writing files", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "starwind-specialized-output-writer-"));

    try {
      await expect(
        writeReactAdapterOutput({
          componentName: "Fixture",
          ignoreOutputModelFilePaths: ["fixture/Missing.tsx"],
          outputModel: {
            files: [helperFile("fixture/One.tsx"), helperFile("fixture/Two.tsx")],
          },
          outputRoot,
          tsHeader: "// ts header\n",
        }),
      ).rejects.toThrow(
        "Fixture React output model route ignored unknown paths: fixture/Missing.tsx",
      );
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });

  it("rejects target printer path mismatches before writing files", async () => {
    let didWrite = false;
    const mismatchedAdapter = {
      ...getPrimitiveFrameworkAdapterTarget("react").adapter,
      printOutput: () => [
        { contents: "export const two = true;\n", path: "fixture/Two.tsx" },
        { contents: "export const one = true;\n", path: "fixture/One.tsx" },
      ],
    };

    await expect(
      writePrimitiveOutputFiles({
        adapter: mismatchedAdapter,
        componentName: "Fixture",
        extension: "tsx",
        outputModel: {
          files: [helperFile("fixture/One.tsx"), helperFile("fixture/Two.tsx")],
        },
        outputRoot: "unused",
        target: "react",
        targetDisplayName: "Example",
        transformPrintedFile: (file) => file.contents,
        writeFile: async () => {
          didWrite = true;
        },
      }),
    ).rejects.toThrow(
      "Fixture Example output model route printed unexpected paths: fixture/Two.tsx, fixture/One.tsx. Expected: fixture/One.tsx, fixture/Two.tsx",
    );
    expect(didWrite).toBe(false);
  });

  it("allows only explicitly ignored output model paths", async () => {
    const outputRoot = await mkdtemp(path.join(tmpdir(), "starwind-specialized-output-writer-"));

    try {
      await expect(
        writeAstroAdapterOutput({
          astroHeader: "---\n// astro header\n",
          componentName: "Tabs",
          ignoreOutputModelFilePaths: ["tabs/TabsContext.tsx"],
          outputModel: {
            files: [
              helperFile("tabs/TabsContext.tsx"),
              helperFile("tabs/TabsExtraContext.tsx"),
              indexFile("tabs/index.ts"),
            ],
          },
          outputRoot,
          tsHeader: "// ts header\n",
        }),
      ).resolves.toBeUndefined();
      await expect(
        readFile(path.join(outputRoot, "tabs/TabsContext.tsx"), "utf8"),
      ).rejects.toThrow();
      await expect(
        readFile(path.join(outputRoot, "tabs/TabsExtraContext.tsx"), "utf8"),
      ).resolves.toContain("// ts header\n");
    } finally {
      await rm(outputRoot, { force: true, recursive: true });
    }
  });
});

function helperFile(filePath: string): AdapterOutputModel["files"][number] {
  return {
    body: { code: "return undefined;" },
    imports: [],
    kind: "helper",
    name: path.basename(filePath).replace(/\.[^.]+$/, ""),
    path: filePath,
  };
}

function indexFile(filePath: string): AdapterOutputModel["files"][number] {
  return {
    exports: {
      kind: "namespace",
      members: [],
      namespace: "Tabs",
    },
    imports: [],
    kind: "index",
    path: filePath,
    typeFacades: [],
  };
}
