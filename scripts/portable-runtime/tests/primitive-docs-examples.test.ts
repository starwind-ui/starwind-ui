import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import { primitiveDocsExamples } from "../docs/layered-docs/examples.js";

const repoRoot = process.cwd();
const adapterFrameworks = ["astro", "react"] as const;
const demoRequire = createRequire(path.join(repoRoot, "apps/demo/package.json"));

type AstroCompiler = {
  transform(
    source: string,
    options: { filename: string; internalURL: string },
  ): Promise<{ diagnostics?: readonly unknown[] }>;
};

describe("primitive docs examples", () => {
  it("keeps raw HTML examples aligned with runtime exports and contract discovery attributes", async () => {
    for (const contract of runtimeAdapterContracts) {
      const example = primitiveDocsExamples[contract.component]?.basic?.["raw-html"];
      const runtimeIndexSource = await readFile(
        path.join(repoRoot, "packages/runtime/src/components", contract.component, "index.ts"),
        "utf8",
      );
      const documentedDataAttributes = new Set(
        contract.parts.flatMap((part) => [
          part.discoveryAttribute,
          ...("initialAttributes" in part ? (part.initialAttributes ?? []) : [])
            .map((attribute) => attribute.name)
            .filter((attribute) => attribute.startsWith("data-sw-")),
        ]),
      );
      const usedDataAttributes = [
        ...new Set(example?.code?.match(/\bdata-sw-[a-z0-9-]+\b/g) ?? []),
      ];

      expect(example?.code).toContain(
        `import { ${contract.runtime.factory} } from "${contract.runtime.importSource}";`,
      );
      expect(
        runtimeIndexSource.includes(contract.runtime.factory) ||
          runtimeIndexSource.includes(`export * from "./${contract.component}";`),
      ).toBe(true);
      expect(usedDataAttributes).not.toEqual([]);
      expect(
        usedDataAttributes.filter((attribute) => !documentedDataAttributes.has(attribute)),
      ).toEqual([]);
    }
  });

  it("keeps Astro and React examples aligned with real adapter namespace exports", async () => {
    for (const contract of runtimeAdapterContracts) {
      for (const framework of adapterFrameworks) {
        const namespace = toPascalCase(contract.component);
        const example = primitiveDocsExamples[contract.component]?.basic?.[framework];
        const adapterIndexSource = await readFile(
          path.join(repoRoot, `packages/${framework}/src`, contract.component, "index.ts"),
          "utf8",
        );
        const usedNamespaceMembers = [
          ...new Set(
            [
              ...(example?.code?.matchAll(new RegExp(`<${namespace}\\.([A-Za-z]\\w*)`, "g")) ?? []),
            ].map((match) => match[1]),
          ),
        ];

        expect(example?.code).toContain(
          `import { ${namespace} } from "@starwind-ui/${framework}/${contract.component}";`,
        );
        expect(adapterIndexSource).toContain(`const ${namespace} = {`);
        expect(usedNamespaceMembers).not.toEqual([]);

        for (const memberName of usedNamespaceMembers) {
          expect(adapterIndexSource).toContain(`${memberName}:`);
        }
      }
    }
  });

  it("compiles generated Astro examples with the Astro compiler", async () => {
    const { transform } = demoRequire("@astrojs/compiler") as AstroCompiler;
    const failures: string[] = [];

    for (const contract of runtimeAdapterContracts) {
      const example = primitiveDocsExamples[contract.component]?.basic?.astro;

      if (!example?.code) {
        failures.push(`${contract.component}: missing Astro example code`);
        continue;
      }

      try {
        const result = await transform(example.code, {
          filename: `${contract.component}.astro`,
          internalURL: "astro/runtime/server/index.js",
        });
        if (result.diagnostics && result.diagnostics.length > 0) {
          failures.push(`${contract.component}: ${JSON.stringify(result.diagnostics)}`);
        }
      } catch (error) {
        failures.push(
          `${contract.component}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    expect(failures).toEqual([]);
  });

  it("typechecks generated React examples against the React adapter sources", async () => {
    const tempRoot = await mkdtemp(
      path.join(repoRoot, "apps/react-demo/.tmp-starwind-react-doc-examples-"),
    );

    try {
      const rootNames = await Promise.all(
        runtimeAdapterContracts.map(async (contract) => {
          const example = primitiveDocsExamples[contract.component]?.basic?.react;
          const filePath = path.join(tempRoot, `${contract.component}.tsx`);

          await writeFile(filePath, example?.code ?? "", "utf8");

          return filePath;
        }),
      );
      const program = ts.createProgram({
        rootNames,
        options: {
          allowSyntheticDefaultImports: true,
          baseUrl: path.join(repoRoot, "apps/react-demo"),
          esModuleInterop: true,
          jsx: ts.JsxEmit.ReactJSX,
          lib: ["lib.es2022.d.ts", "lib.dom.d.ts", "lib.dom.iterable.d.ts"],
          module: ts.ModuleKind.ESNext,
          moduleResolution: ts.ModuleResolutionKind.Bundler,
          noEmit: true,
          paths: {
            "@starwind-ui/react": ["../../packages/react/src/index.ts"],
            "@starwind-ui/react/*": ["../../packages/react/src/*/index.ts"],
            "@starwind-ui/runtime": ["../../packages/runtime/src/index.ts"],
            "@starwind-ui/runtime/init-starwind": ["../../packages/runtime/src/init-starwind.ts"],
            "@starwind-ui/runtime/theme": ["../../packages/runtime/src/theme/theme.ts"],
            "@starwind-ui/runtime/*": ["../../packages/runtime/src/components/*/index.ts"],
          },
          skipLibCheck: true,
          strict: true,
          target: ts.ScriptTarget.ES2022,
          typeRoots: [
            path.join(repoRoot, "apps/react-demo/node_modules/@types"),
            path.join(repoRoot, "node_modules/@types"),
          ],
        },
      });
      const diagnostics = ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => !diagnostic.file?.fileName.includes("node_modules"));

      expect(formatDiagnostics(diagnostics)).toBe("");
    } finally {
      await rm(tempRoot, { force: true, recursive: true });
    }
  }, 60_000);
});

function formatDiagnostics(diagnostics: readonly ts.Diagnostic[]) {
  return diagnostics
    .map((diagnostic) => {
      const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
      if (!diagnostic.file || diagnostic.start === undefined) {
        return message;
      }

      const position = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
      const relativePath = path
        .relative(repoRoot, diagnostic.file.fileName)
        .replaceAll(path.sep, "/");

      return `${relativePath}:${position.line + 1}:${position.character + 1} ${message}`;
    })
    .join("\n");
}

function toPascalCase(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}
