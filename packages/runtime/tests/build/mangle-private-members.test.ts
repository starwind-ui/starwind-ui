import path from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

import {
  applyPrivateMemberEdits,
  createPrivateMemberSourceMap,
  planPrivateMemberRenames,
  planRuntimePrivateMemberRenames,
} from "../../build/mangle-private-members";
import tsupConfig from "../../tsup.config";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const tsconfigPath = path.join(packageRoot, "tsconfig.json");
const sourceRoot = path.join(packageRoot, "src").split(path.sep).join("/");

function createProgram(files: Map<string, string>, roots: string[], options: ts.CompilerOptions) {
  const host = ts.createCompilerHost(options);
  const { fileExists, getSourceFile, readFile } = host;
  host.fileExists = (name) => files.has(name) || fileExists(name);
  host.readFile = (name) => files.get(name) ?? readFile(name);
  host.getSourceFile = (name, languageVersion) => {
    const text = files.get(name);
    return text === undefined
      ? getSourceFile(name, languageVersion)
      : ts.createSourceFile(name, text, languageVersion, true);
  };
  return ts.createProgram(roots, options, host);
}

function planFixture(source: string) {
  const file = "/fixture/fixture.ts";
  const program = createProgram(new Map([[file, source]]), [file], {
    lib: ["lib.es2022.d.ts", "lib.dom.d.ts"],
    noEmit: true,
    strict: true,
    target: ts.ScriptTarget.ES2022,
    types: [],
  });
  const plan = planPrivateMemberRenames(program, (name) => name === file);
  return {
    ...plan,
    output: applyPrivateMemberEdits(source, plan.edits.get(file) ?? []),
  };
}

describe("private member rename plan", () => {
  it("renames a private member and keeps every public name with the same spelling", () => {
    const { output, renames } = planFixture(`
      type Options = { open?: boolean };
      type Details = { open: boolean };
      class Controller {
        private open = false;
        constructor(readonly root: HTMLElement, options: Options) {
          this.open = options.open ?? false;
        }
        getDetails(): Details {
          this.root.setAttribute("data-open", "open");
          return { open: this.open };
        }
      }
      class Other {
        open = true;
      }
      export const pair = [new Controller(document.body, { open: true }), new Other().open];
    `);

    expect(renames.map((rename) => [rename.from, rename.to])).toEqual([["open", "a"]]);
    expect(output).toContain("private a = false;");
    expect(output).toContain("this.a = options.open ?? false;");
    expect(output).toContain('this.root.setAttribute("data-open", "open");');
    expect(output).toContain("return { open: this.a };");
    expect(output).toContain("type Options = { open?: boolean };");
    expect(output).toContain("type Details = { open: boolean };");
    expect(output).toContain("  open = true;");
    expect(output).toContain("{ open: true }");
  });

  it("gives no short name that a public member of the class already uses", () => {
    const { output } = planFixture(`
      class Controller {
        a = 1;
        private secret = 2;
        read() { return this.a + this.secret; }
      }
      export const value = new Controller().read();
    `);

    expect(output).toContain("return this.a + this.b;");
  });

  it("keeps a private member reached other than through this", () => {
    const { kept, output } = planFixture(`
      class Controller {
        private byKey = 1;
        private byReceiver = 2;
        private byPattern = 3;
        private byThis = 4;
        read(other: Controller) {
          const { byPattern } = this;
          return this.byKey + other.byReceiver + this.byReceiver + byPattern + this.byThis;
        }
      }
      export function readKey(controller: Controller) { return controller["byKey"]; }
    `);

    expect(kept.map((entry) => entry.member).sort()).toEqual(["byKey", "byPattern", "byReceiver"]);
    expect(output).toContain('controller["byKey"]');
    expect(output).toContain("other.byReceiver + this.byReceiver");
    expect(output).toContain("this.a;");
  });

  it("keeps a private parameter property", () => {
    const { output, renames } = planFixture(`
      class Controller {
        constructor(private readonly owner: Document) {}
        read() { return this.owner; }
      }
      export const value = new Controller(document).read();
    `);

    expect(renames).toEqual([]);
    expect(output).toContain("this.owner");
  });

  it("leaves exported and inherited classes alone", () => {
    const { renames } = planFixture(`
      export class Published { private secret = 1; read() { return this.secret; } }
      class Base { private secret = 1; read() { return this.secret; } }
      class Child extends Base { private other = 2; own() { return this.other; } }
      export const value = new Child().own();
    `);

    expect(renames).toEqual([]);
  });

  it.each([
    [
      "a computed key",
      "const key = 'secret' as string; return (this as Controller)[key as 'read'];",
    ],
    ["an in test", "return 'secret' in this;"],
    ["for...in", "for (const key in this) console.log(key);"],
    ["an object spread", "return { ...this };"],
    ["a cast", "return (this as unknown as { secret: number }).secret;"],
    ["Object.keys", "return Object.keys(this);"],
    ["JSON.stringify", "return JSON.stringify(this);"],
    ["a rest binding", "const { read, ...rest } = this; return [read, rest];"],
    ["an untyped read", "const value: any = {}; return value.secret + this.secret;"],
  ])("stops the build for %s", (_name, body) => {
    const { findings } = planFixture(`
      class Controller {
        private secret = 1;
        read(): unknown { ${body} }
      }
      export const value = new Controller().read();
    `);

    expect(findings).toHaveLength(1);
  });
});

describe("private member source map", () => {
  function decodeLine(line: string): number[][] {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    return line.split(",").map((segment) => {
      const fields: number[] = [];
      let shift = 0;
      let value = 0;
      for (const character of segment) {
        const digit = alphabet.indexOf(character);
        value += (digit & 31) << shift;
        if (digit & 32) {
          shift += 5;
        } else {
          fields.push(value & 1 ? -(value >> 1) : value >> 1);
          shift = 0;
          value = 0;
        }
      }
      return fields;
    });
  }

  it("maps a renamed member and the following token to their original columns", () => {
    const source = "class C {\n  private secret = 1;\n  read() { return this.secret + 1; }\n}\n";
    const start = source.lastIndexOf("secret");
    const map = JSON.parse(
      createPrivateMemberSourceMap(
        source,
        [{ end: start + "secret".length, start, text: "a" }],
        "c.ts",
      ),
    );
    const lineStart = source.lastIndexOf("\n", start) + 1;
    // An original column stays relative across lines, and a generated column resets on each line.
    let original = 0;
    const lines = map.mappings.split(";").map((line: string) => {
      let generated = 0;
      return decodeLine(line).map(([column, , , originalColumn, name]) => {
        generated += column;
        original += originalColumn;
        return { generated, name, original };
      });
    });
    const positions = lines[2];

    expect(map.sources).toEqual(["c.ts"]);
    expect(map.sourcesContent).toEqual([source]);
    expect(map.names).toEqual(["secret"]);
    expect(positions).toContainEqual({
      generated: start - lineStart,
      name: 0,
      original: start - lineStart,
    });
    const plus = source.indexOf("+", start) - lineStart;
    expect(positions).toContainEqual({
      generated: plus - "secret".length + 1,
      name: undefined,
      original: plus,
    });
  });

  it("publishes source maps from the Runtime build", () => {
    expect(tsupConfig).toMatchObject({ sourcemap: true });
  });
});

describe("Runtime source rename plan", () => {
  function readPublicSurface(program: ts.Program): string[] {
    const checker = program.getTypeChecker();
    const index = program.getSourceFile(`${sourceRoot}/index.ts`);
    const moduleSymbol = index && checker.getSymbolAtLocation(index);
    if (!moduleSymbol) throw new Error("Could not read the Runtime entry.");
    const seen = new Set<ts.Type>();
    const names = new Set<string>();
    const visitType = (type: ts.Type, depth: number): void => {
      if (seen.has(type) || depth > 6) return;
      seen.add(type);
      if (type.isUnionOrIntersection()) {
        for (const part of type.types) visitType(part, depth);
        return;
      }
      const isExternal = type
        .getSymbol()
        ?.declarations?.some((d) => !d.getSourceFile().fileName.startsWith(sourceRoot));
      if (isExternal) return;
      for (const property of type.getProperties()) {
        names.add(property.name);
        const declaration = property.valueDeclaration ?? property.declarations?.[0];
        if (declaration)
          visitType(checker.getTypeOfSymbolAtLocation(property, declaration), depth + 1);
      }
      for (const signature of type.getCallSignatures()) {
        visitType(signature.getReturnType(), depth + 1);
        for (const parameter of signature.getParameters()) {
          const declaration = parameter.valueDeclaration;
          if (declaration) {
            visitType(checker.getTypeOfSymbolAtLocation(parameter, declaration), depth + 1);
          }
        }
      }
    };
    for (const exported of checker.getExportsOfModule(moduleSymbol)) {
      const symbol =
        exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
      visitType(checker.getDeclaredTypeOfSymbol(symbol), 0);
      if (symbol.valueDeclaration) {
        visitType(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration), 0);
      }
    }
    return [...names].filter((name) => !name.startsWith("__@")).sort();
  }

  function readStringLiterals(file: ts.SourceFile): string[] {
    const literals: string[] = [];
    const visit = (node: ts.Node): void => {
      if (ts.isTypeNode(node)) return;
      if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) literals.push(node.text);
      ts.forEachChild(node, visit);
    };
    visit(file);
    return literals;
  }

  it("renames private members without changing types, public names, or string values", () => {
    const plan = planRuntimePrivateMemberRenames(tsconfigPath);

    expect(plan.findings).toEqual([]);
    expect(plan.renames.length).toBeGreaterThan(1000);

    const parsed = ts.getParsedCommandLineOfConfigFile(
      tsconfigPath,
      { noEmit: true, types: [] },
      { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
    );
    if (!parsed) throw new Error("Could not read the Runtime tsconfig.");
    const roots = parsed.fileNames.filter((name) => name.startsWith(`${sourceRoot}/`));

    const original = ts.createProgram(roots, parsed.options);
    const edited = new Map<string, string>();
    for (const [file, edits] of plan.edits) {
      edited.set(file, applyPrivateMemberEdits(ts.sys.readFile(file) ?? "", edits));
    }
    const renamed = createProgram(edited, roots, parsed.options);

    const format = (diagnostics: readonly ts.Diagnostic[]) =>
      diagnostics.map((d) => ts.flattenDiagnosticMessageText(d.messageText, "\n"));
    expect(format(ts.getPreEmitDiagnostics(renamed))).toEqual(
      format(ts.getPreEmitDiagnostics(original)),
    );

    const publicSurface = readPublicSurface(original);
    expect(publicSurface).toEqual(expect.arrayContaining(["defaultPressed", "getPressed"]));
    expect(publicSurface).toEqual(expect.arrayContaining(["onPressedChange", "previousPressed"]));
    expect(readPublicSurface(renamed)).toEqual(publicSurface);

    for (const file of plan.edits.keys()) {
      const before = original.getSourceFile(file);
      const after = renamed.getSourceFile(file);
      if (!before || !after) throw new Error(`Could not read ${file}.`);
      expect(readStringLiterals(after)).toEqual(readStringLiterals(before));
    }
  }, 120_000);
});
