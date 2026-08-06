import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { alertStyledContract } from "../../contracts/styled/components/alert.js";
import { separatorStyledContract } from "../../contracts/styled/components/separator.js";
import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { getPrimitiveFrameworkAdapterTarget } from "../../renderers/framework-adapters/index.js";
import { vueStyledComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  computedExpressionUsesReference,
  projectVueComputedExpression,
} from "../../renderers/framework-adapters/vue/styled/expressions.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { generateFrameworkStyledWrappers } from "../../renderers/framework-wrapper-generator.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { GENERIC_VUE_STYLED_FIXTURE } from "../styled-contracts/vue-styled-generic-corrections.test.js";

const options = {
  directory: "/tmp/styled/generic-binding-fixture",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("generic Vue Styled corrections", () => {
  const group = projectStyledOutputComponentGroup(GENERIC_VUE_STYLED_FIXTURE);

  it("projects prop-only and earlier-computed expressions from binding facts", () => {
    const source = render("GenericBindingRoot");

    expect(source).toContain('const resolvedTone = computed(() => tone ?? "neutral");');
    expect(source).toContain(
      'const active = computed(() => resolvedTone.value === "accent" && Boolean(enabled));',
    );
    expect(() => assertVueSfcCompiles(source, "GenericBindingRoot.vue")).not.toThrow();
  });

  it("uses the same binding-aware mechanism for the real Alert contract", () => {
    const alertGroup = projectStyledOutputComponentGroup(alertStyledContract);
    const alert = alertGroup.components.find((component) => component.exportName === "Alert");
    if (!alert) throw new TypeError("Missing Alert component.");
    const source = renderVueComponent(alertGroup, alert, options);

    expect(source).toContain(
      'const inferredRole = computed(() => role ?? (variant === "error" || variant === "warning" ? "alert" : "status"));',
    );
    expect(() => assertVueSfcCompiles(source, "Alert.vue")).not.toThrow();
  });

  it("rejects unresolved identifiers with the expression and binding name", () => {
    expect(() =>
      projectVueComputedExpression(
        { type: "raw", code: "known + missingBinding" },
        {
          computed: [],
          props: [{ sourceName: "known", targetName: "known" }],
        },
      ),
    ).toThrow(/missingBinding[\s\S]+known \+ missingBinding/);
  });

  it("keeps nested local bindings scoped and tracks projected attrs references", () => {
    const scoped = projectVueComputedExpression(
      {
        type: "raw",
        code: 'external + values.map((external) => external).join("")',
      },
      {
        computed: [],
        props: [
          { sourceName: "external", targetName: "projectedExternal" },
          { sourceName: "values", targetName: "values" },
        ],
      },
    );
    const attrs = projectVueComputedExpression(
      { type: "raw", code: 'rest["data-tone"]' },
      {
        computed: [],
        props: [{ sourceName: "rest", targetName: "attrs" }],
      },
    );

    expect(scoped).toMatchObject({
      code: 'projectedExternal + values.map((external) => external).join("")',
      type: "source",
    });
    expect(computedExpressionUsesReference(attrs, "attrs")).toBe(true);
  });

  it("preserves shorthand keys when bindings need projected values", () => {
    const shorthand = projectVueComputedExpression(
      { type: "raw", code: "({ tone, resolvedTone })" },
      {
        computed: ["resolvedTone"],
        props: [{ sourceName: "tone", targetName: "projectedTone" }],
      },
    );

    expect(shorthand).toMatchObject({
      code: "({ tone: projectedTone, resolvedTone: resolvedTone.value })",
      type: "source",
    });
  });

  it("keeps block, catch, and function bindings in their lexical scopes", () => {
    const block = projectVueComputedExpression(
      {
        type: "raw",
        code: `(() => {
          if (flag) {
            const tone = "local";
            return tone;
          }
          return tone;
        })()`,
      },
      {
        computed: [],
        props: [
          { sourceName: "flag", targetName: "projectedFlag" },
          { sourceName: "tone", targetName: "projectedTone" },
        ],
      },
    );
    const caught = projectVueComputedExpression(
      {
        type: "raw",
        code: `(() => {
          try {
            throw "fixture";
          } catch (tone) {
            String(tone);
          }
          return tone;
        })()`,
      },
      {
        computed: [],
        props: [{ sourceName: "tone", targetName: "projectedTone" }],
      },
    );
    const functionScoped = projectVueComputedExpression(
      {
        type: "raw",
        code: `(() => {
          const parameter = ((tone) => tone)("value");
          const variable = (() => {
            return tone;
            var tone;
          })();
          const declared = (() => {
            return tone();
            function tone() { return "local"; }
          })();
          return [parameter, variable, declared];
        })()`,
      },
      {
        computed: [],
        props: [{ sourceName: "tone", targetName: "projectedTone" }],
      },
    );

    expect(block).toMatchObject({ type: "source" });
    expect(block.type === "source" ? block.code : "").toContain("if (projectedFlag)");
    expect(block.type === "source" ? block.code.match(/return tone;/g) : []).toHaveLength(1);
    expect(block.type === "source" ? block.code.match(/return projectedTone;/g) : []).toHaveLength(
      1,
    );
    expect(caught.type === "source" ? caught.code : "").toContain("String(tone);");
    expect(caught.type === "source" ? caught.code : "").toContain("return projectedTone;");
    expect(functionScoped.type === "source" ? functionScoped.code : "").not.toContain(
      "projectedTone",
    );
  });

  it("keeps block and case function declarations lexical", () => {
    const bindings = {
      computed: [],
      props: [
        { sourceName: "flag", targetName: "projectedFlag" },
        { sourceName: "tone", targetName: "projectedTone" },
      ],
    };
    const block = projectVueComputedExpression(
      {
        type: "raw",
        code: '(() => { if (flag) { function tone() { return "local"; } tone(); } return tone; })()',
      },
      bindings,
    );
    const caseBlock = projectVueComputedExpression(
      {
        type: "raw",
        code: '(() => { switch (flag) { case true: function tone() { return "local"; } tone(); break; } return tone; })()',
      },
      bindings,
    );

    expect(block).toMatchObject({
      code: '(() => { if (projectedFlag) { function tone() { return "local"; } tone(); } return projectedTone; })()',
      type: "source",
    });
    expect(caseBlock).toMatchObject({
      code: '(() => { switch (projectedFlag) { case true: function tone() { return "local"; } tone(); break; } return projectedTone; })()',
      type: "source",
    });
  });

  it("keeps class static block var declarations inside the static block", () => {
    const projected = projectVueComputedExpression(
      {
        type: "raw",
        code: '(() => { class Fixture { static { var tone = "local"; String(tone); } } return tone; })()',
      },
      {
        computed: [],
        props: [{ sourceName: "tone", targetName: "projectedTone" }],
      },
    );

    expect(projected).toMatchObject({
      code: '(() => { class Fixture { static { var tone = "local"; String(tone); } } return projectedTone; })()',
      type: "source",
    });
  });

  it("projects the computed, property, global, and renamed-prop binding matrix", () => {
    const matrix = projectVueComputedExpression(
      {
        type: "raw",
        code: "Math.max(resolvedTone.value, settings.tone, tone)",
      },
      {
        computed: ["resolvedTone"],
        props: [
          { sourceName: "settings", targetName: "projectedSettings" },
          { sourceName: "tone", targetName: "projectedTone" },
        ],
      },
    );

    expect(matrix).toEqual({
      code: "Math.max(resolvedTone.value, projectedSettings.tone, projectedTone)",
      references: ["projectedSettings", "projectedTone", "resolvedTone"],
      type: "source",
    });
  });

  it("exposes one native root from forwardRef facts", () => {
    const source = render("GenericBindingRoot");

    expect(source).toContain("const element = ref<HTMLDivElement | null>(null);");
    expect(source).toContain("defineExpose({ element });");
    expect(source.match(/ref="element"/g)).toHaveLength(1);
  });

  it("binds conditional union roots without duplicate setup", () => {
    const source = render("GenericConditionalRoot");

    expect(source).toContain(
      "const element = ref<HTMLButtonElement | HTMLAnchorElement | null>(null);",
    );
    expect(source.match(/ref="element"/g)).toHaveLength(2);
    expect(source.match(/defineExpose\(\{ element \}\);/g)).toHaveLength(1);
  });

  it("keeps a ref-less composed root free of an invented element bridge", () => {
    const source = render("GenericComposedRoot");

    expect(source).not.toContain("defineExpose({ element });");
    expect(source).not.toMatch(/\bref="element"/);
  });

  it("preserves explicit roots and their closure through registered project and write", async () => {
    const root = await createOutputRoot();
    const outputRoot = path.join(root, "styled");
    const primitiveOutputRoot = path.join(root, "primitives");
    const contracts = [GENERIC_VUE_STYLED_FIXTURE, separatorStyledContract];
    const roots = [GENERIC_VUE_STYLED_FIXTURE.component];
    const styled = getPrimitiveFrameworkAdapterTarget("vue").styled;
    if (!styled) throw new TypeError("Vue Styled target is not registered.");

    try {
      const projected = styled.project({ contracts, outputRoot, primitiveOutputRoot, roots });
      expect(projected.componentGroups.map(({ component }) => component)).toEqual([
        "generic-binding-fixture",
        "separator",
      ]);

      await generateFrameworkStyledWrappers("vue", {
        contracts,
        generatedBy: "vue-styled-generic-corrections.test.ts",
        outputRoot,
        primitiveOutputRoot,
        roots,
      });
      expect(await readDirectories(outputRoot)).toEqual(["generic-binding-fixture", "separator"]);
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  it("keeps omitted-root inventory output path- and byte-identical", async () => {
    const root = await createOutputRoot();
    const defaultOutputRoot = path.join(root, "default");
    const explicitOutputRoot = path.join(root, "explicit");

    try {
      await generateStarwindVueWrappers({ outputDir: "default", repoRoot: root });
      await generateStarwindVueWrappers({
        outputDir: "explicit",
        repoRoot: root,
        roots: vueStyledComponents,
      });

      expect(await readFileManifest(defaultOutputRoot)).toEqual(
        await readFileManifest(explicitOutputRoot),
      );
    } finally {
      await rm(root, { force: true, recursive: true });
    }
  });

  function render(exportName: string): string {
    const component = group.components.find((candidate) => candidate.exportName === exportName);
    if (!component) throw new TypeError(`Missing fixture component ${exportName}.`);
    return renderVueComponent(group, component, options);
  }
});

async function createOutputRoot(): Promise<string> {
  return mkdtemp(path.join(os.tmpdir(), "starwind-vue-generic-corrections-"));
}

async function readDirectories(root: string): Promise<string[]> {
  return (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map(({ name }) => name)
    .sort();
}

async function readFileManifest(root: string, prefix = ""): Promise<Record<string, string>> {
  const entries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const manifests = await Promise.all(
    entries.map(async (entry): Promise<Array<readonly [string, string]>> => {
      const file = path.posix.join(prefix.replaceAll("\\", "/"), entry.name);
      if (entry.isDirectory()) return Object.entries(await readFileManifest(root, file));
      const bytes = await readFile(path.join(root, file));
      return [[file, createHash("sha256").update(bytes).digest("hex")]];
    }),
  );
  return Object.fromEntries(manifests.flat().sort(([left], [right]) => left.localeCompare(right)));
}
