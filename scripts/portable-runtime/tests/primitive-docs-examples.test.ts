import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import {
  colorPickerPrimitiveDocsAuthoredExamples,
  primitiveDocsExamples,
  readAdapterNamespaceParts,
} from "../docs/layered-docs/examples.js";
import { isPrimitiveInventoryComponentAvailableForTarget } from "../renderers/primitive-inventory.js";

const repoRoot = process.cwd();
const adapterFrameworks = ["astro", "react"] as const;
const demoRequire = createRequire(path.join(repoRoot, "apps/demo/package.json"));
const svelteRequire = createRequire(path.join(repoRoot, "packages/svelte/package.json"));
const selectSvelteAuthoredExamplePath =
  "scripts/portable-runtime/docs/layered-docs/primitives/select/examples/positioned-select.svelte";

type SvelteCompiler = {
  compile(source: string, options: { filename: string; generate: "client" }): unknown;
};

type AstroCompiler = {
  transform(
    source: string,
    options: { filename: string; internalURL: string },
  ): Promise<{ diagnostics?: readonly unknown[] }>;
};

describe("primitive docs examples", () => {
  it("documents the native focusable-disabled Button lifecycle in raw HTML", () => {
    const source = primitiveDocsExamples.button?.basic?.["raw-html"]?.code;

    expect(source).toContain(
      '<button data-sw-button type="button" data-focusable-when-disabled="">Button</button>',
    );
    expect(source).toContain("const instance = createButton(root);");
    expect(source).toContain("instance.setDisabled(true)");
    expect(source).not.toMatch(/nativeButton|data-native|role="button"/);
  });

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
        if (!isPrimitiveInventoryComponentAvailableForTarget(contract.component, framework))
          continue;
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

  it("keeps the Select and Combobox list and items in every anatomy example", () => {
    for (const component of ["select", "combobox"] as const) {
      const namespace = toPascalCase(component);
      const frameworks = primitiveDocsExamples[component]?.basic ?? {};

      for (const framework of ["astro", "react", "vue", "svelte"] as const) {
        const code = frameworks[framework]?.code ?? "";
        const label = `${component} ${framework}`;

        expect(code, label).toMatch(
          new RegExp(
            `<${namespace}\\.Popup>\\s*(?:<${namespace}\\.Empty>[^<]*</${namespace}\\.Empty>\\s*)?<${namespace}\\.List>`,
          ),
        );
        for (const value of ["astro", "react"]) {
          expect(code, label).toMatch(
            new RegExp(
              `<${namespace}\\.List>[\\s\\S]*<${namespace}\\.Item value="${value}">[\\s\\S]*</${namespace}\\.List>`,
            ),
          );
        }
        expect(code, label).toContain(`<${namespace}.ItemText>React</${namespace}.ItemText>`);
        expect(code, label).not.toContain(`<${namespace}.Popup />`);
      }

      const html = frameworks["raw-html"]?.code ?? "";
      expect(html).toContain(`<div data-sw-${component}-list>`);
      expect(html).toContain('role="option" data-value="react"');
    }
  });

  it("keeps Svelte examples aligned with the shipped Svelte adapter namespaces", async () => {
    const { compile } = svelteRequire("svelte/compiler") as SvelteCompiler;
    const examples = [
      ...runtimeAdapterContracts.map((contract) => ({
        label: `${contract.component} basic`,
        code: primitiveDocsExamples[contract.component]?.basic?.svelte?.code ?? "",
      })),
      ...colorPickerPrimitiveDocsAuthoredExamples.flatMap((example) =>
        example.frameworks
          .filter((framework) => framework.framework === "svelte")
          .map((framework) => ({ label: `color-picker ${example.id}`, code: framework.code })),
      ),
      {
        label: "select positioned-select",
        code: await readFile(path.join(repoRoot, selectSvelteAuthoredExamplePath), "utf8"),
      },
    ];
    const failures: string[] = [];

    expect(examples.filter((example) => !example.code)).toEqual([]);

    for (const example of examples) {
      try {
        compile(example.code, { filename: `${example.label}.svelte`, generate: "client" });
      } catch (error) {
        failures.push(
          `${example.label}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      const imports = [
        ...example.code.matchAll(
          /import \{ ([A-Za-z]+) \} from "@starwind-ui\/svelte\/([a-z-]+)";/g,
        ),
      ];
      expect(imports, example.label).not.toEqual([]);

      for (const [, namespace, component] of imports) {
        const adapterIndexSource = await readFile(
          path.join(repoRoot, "packages/svelte/src", component!, "index.ts"),
          "utf8",
        );
        const members = [
          ...new Set(
            [...example.code.matchAll(new RegExp(`<${namespace}\\.([A-Za-z]\\w*)`, "g"))].map(
              (match) => match[1]!,
            ),
          ),
        ];

        expect(adapterIndexSource, example.label).toMatch(
          new RegExp(`export \\{[^}]*\\b${namespace}\\b`),
        );
        expect(members, example.label).not.toEqual([]);
        const parts = getNamespaceObjectKeys(adapterIndexSource, namespace!);
        expect(parts, `${example.label}: ${namespace} namespace object`).not.toEqual([]);
        for (const member of members) {
          if (!parts.includes(member)) {
            failures.push(`${example.label}: ${namespace}.${member} is not a Svelte adapter part`);
          }
        }
      }
    }

    expect(failures).toEqual([]);
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

/** Reads the part keys of `const <namespace> = { ... }` in a generated adapter index. */
function getNamespaceObjectKeys(source: string, namespace: string) {
  const file = ts.createSourceFile("index.ts", source, ts.ScriptTarget.ES2022, true);
  const keys: string[] = [];

  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (
        ts.isIdentifier(declaration.name) &&
        declaration.name.text === namespace &&
        declaration.initializer &&
        ts.isObjectLiteralExpression(declaration.initializer)
      ) {
        for (const property of declaration.initializer.properties) {
          if (property.name && ts.isIdentifier(property.name)) keys.push(property.name.text);
        }
      }
    }
  }

  return keys;
}

function toPascalCase(value: string) {
  return value
    .split("-")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}

describe("adapter namespace parts", () => {
  const contract = { component: "fake-select", runtime: { rootPart: "root" } } as const;

  it("fails when the adapter index is missing", () => {
    expect(() =>
      readAdapterNamespaceParts(contract, "svelte", path.join(repoRoot, "missing", "index.ts")),
    ).toThrow(/adapter index is missing/);
  });

  it("fails when the index declares its namespace in a shape the parser cannot read", async () => {
    const directory = await mkdtemp(path.join(repoRoot, ".tmp-adapter-index-"));
    const indexPath = path.join(directory, "index.ts");

    try {
      await writeFile(
        indexPath,
        "const FakeSelect = Object.assign({}, { Root, List });\nexport { FakeSelect };\n",
      );
      expect(() => readAdapterNamespaceParts(contract, "vue", indexPath)).toThrow(
        /does not declare FakeSelect\.Root/,
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it("reads the parts of an object literal namespace", async () => {
    const directory = await mkdtemp(path.join(repoRoot, ".tmp-adapter-index-"));
    const indexPath = path.join(directory, "index.ts");

    try {
      await writeFile(indexPath, "const FakeSelect = { Root, List, Item };\n");
      expect([...readAdapterNamespaceParts(contract, "react", indexPath)]).toEqual([
        "Root",
        "List",
        "Item",
      ]);
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
