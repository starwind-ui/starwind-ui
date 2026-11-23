import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import { primitiveDocsEnrichment } from "../docs/layered-docs/annotations.js";
import { getPrimitiveLiveDemo } from "../docs/layered-docs/generator/live-demo.js";
import { renderPrimitiveReferencePage } from "../docs/layered-docs/generator/render-reference.js";
import {
  buildLayeredDocsMetadata,
  checkLayeredDocsMetadata,
  generateLayeredDocsMetadata,
  validateLayeredDocsMetadata,
} from "../generate-layered-docs-metadata.js";

describe("generated Primitive docs pages", () => {
  it("opens every Primitive page with its authored user-facing summary", () => {
    const metadata = buildLayeredDocsMetadata();

    expect(metadata.primitives.map((primitive) => primitive.id).sort()).toEqual(
      runtimeAdapterContracts.map((contract) => contract.component).sort(),
    );

    for (const primitive of metadata.primitives) {
      const summary = primitiveDocsEnrichment[primitive.id]?.summary;
      const page = renderPrimitiveReferencePage(primitive);

      expect(summary, primitive.id).toBeTruthy();
      expect(primitive.docsReference.summary).toBe(summary);
      expect(page).toContain(`\ndescription: ${summary}\n`);
      expect(page).not.toMatch(/contract family/i);
      expect(summary, primitive.id).not.toMatch(/^["'`]|: |[#{}<>]/);
    }
  });

  it("fails validation when a Primitive has no summary or uses internal wording", () => {
    const { button: _button, ...withoutButton } = primitiveDocsEnrichment;
    const missing = validateLayeredDocsMetadata(
      buildLayeredDocsMetadata({ primitiveDocsEnrichment: withoutButton }),
    );
    const internal = validateLayeredDocsMetadata(
      buildLayeredDocsMetadata({
        primitiveDocsEnrichment: {
          ...primitiveDocsEnrichment,
          button: { summary: "Button is a primitive in the boolean contract family." },
        },
      }),
    );

    expect(missing.requiredFailures).toContainEqual(
      expect.stringContaining("button primitive page needs a user-facing summary."),
    );
    expect(internal.requiredFailures).toContainEqual(
      expect.stringContaining('button primitive summary uses internal "contract family" wording.'),
    );
  });

  it("renders the chart live demo above the anatomy through the liveDemo hook", () => {
    const chart = buildLayeredDocsMetadata().primitives.find(
      (primitive) => primitive.id === "chart",
    );
    const page = chart ? renderPrimitiveReferencePage(chart) : "";

    expect(chart?.docsReference.liveDemo).toEqual({
      componentName: "ChartPrimitiveDemo",
      importPath: "@/components/demos/primitives/ChartPrimitiveDemo.astro",
      sourcePath: "src/components/demos/primitives/ChartPrimitiveDemo.astro",
    });
    expect(page).toContain(
      '\nimport ChartPrimitiveDemo from "@/components/demos/primitives/ChartPrimitiveDemo.astro";\n',
    );
    expect(page).toContain(
      '\n\n<PrimitiveLiveDemo docId="primitives/chart">\n  <ChartPrimitiveDemo />\n</PrimitiveLiveDemo>\n\n## Anatomy',
    );
  });

  it("renders every Primitive live demo above the anatomy", () => {
    const metadata = buildLayeredDocsMetadata();
    expect(validateLayeredDocsMetadata(metadata).requiredFailures).toEqual([]);
    for (const primitive of metadata.primitives) {
      const demo = getPrimitiveLiveDemo(primitive.id);
      expect(primitive.docsReference.liveDemo, primitive.id).toEqual(demo);
      const page = renderPrimitiveReferencePage(primitive);
      expect(page).toContain(`import ${demo.componentName} from "${demo.importPath}";`);
      expect(page).toContain(`<${demo.componentName} />\n</PrimitiveLiveDemo>`);
      expect(page.indexOf("</PrimitiveLiveDemo>")).toBeLessThan(page.indexOf("## Anatomy"));
    }
  });

  it("rejects every Primitive whose live demo is removed", () => {
    const metadata = buildLayeredDocsMetadata();
    const report = validateLayeredDocsMetadata({
      ...metadata,
      primitives: metadata.primitives.map((primitive) => ({
        ...primitive,
        docsReference: { ...primitive.docsReference, liveDemo: undefined },
      })),
    });
    for (const primitive of metadata.primitives) {
      expect(report.requiredFailures).toContainEqual(
        expect.stringContaining(`${primitive.id} primitive page needs a live demo.`),
      );
    }
  });

  it("fails the docs check and export when a named live demo file is missing", async () => {
    const tempRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-primitive-demo-"));
    const docsRoot = path.join(tempRoot, "starwind-docs");
    const demoPath = path.join(docsRoot, getPrimitiveLiveDemo("chart").sourcePath);

    try {
      await mkdir(docsRoot, { recursive: true });
      await expect(generateLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot })).rejects.toThrow(
        "chart primitive live demo is missing",
      );

      for (const primitive of buildLayeredDocsMetadata().primitives) {
        const file = path.join(docsRoot, getPrimitiveLiveDemo(primitive.id).sourcePath);
        await mkdir(path.dirname(file), { recursive: true });
        await writeFile(file, "<div></div>\n");
      }
      await generateLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot });
      expect(
        (await checkLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot })).report
          .requiredFailures,
      ).toEqual([]);

      await rm(demoPath);
      expect(
        (await checkLayeredDocsMetadata({ docsRoot, outputRoot: tempRoot })).report
          .requiredFailures,
      ).toContainEqual(expect.stringContaining("chart primitive live demo is missing"));
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }, 30_000);
});
