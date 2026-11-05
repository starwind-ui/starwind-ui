import { readFile } from "node:fs/promises";
import path from "node:path";

import ts from "typescript";

/**
 * Shortens private controller member names in the published Runtime build.
 *
 * The rule: a member is renamed only when the TypeScript checker resolves it to a declaration with
 * the `private` modifier, in a class that is not exported and takes no part in inheritance, and
 * every reference to it has the form `this.member`. The rename follows symbols, so a public method,
 * an option, an event detail field, or a data attribute with the same spelling keeps its name.
 *
 * A private member reached any other way keeps its name: a string key such as `controller["x"]`, a
 * destructuring pattern, or a receiver other than `this`. Controllers live in a registry that
 * Runtime copies share on the page, and two copies can assign different short names. A `this.member`
 * reference always runs in the copy that created the controller, so only that form is safe.
 *
 * TypeScript rejects other outside access to a private member, so the only remaining ways to reach
 * one are reflective. `findings` lists each of those ways, and the build stops when one exists.
 */

export type PrivateMemberEdit = { end: number; start: number; text: string };

export type PrivateMemberRename = {
  className: string;
  file: string;
  from: string;
  references: number;
  to: string;
};

export type PrivateMemberPlan = {
  edits: Map<string, PrivateMemberEdit[]>;
  findings: string[];
  kept: { className: string; member: string }[];
  renames: PrivateMemberRename[];
};

type MemberEntry = {
  escapes: boolean;
  identifiers: ts.Identifier[];
  name: string;
  typeKeys: ts.StringLiteral[];
};

type ClassEntry = {
  className: string;
  file: string;
  members: MemberEntry[];
  takenNames: Set<string>;
};

const SHORT_NAME_ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const RESERVED_SHORT_NAMES = new Set(["as", "do", "if", "in", "is", "of"]);
const REFLECTIVE_GLOBALS = new Set(["JSON", "Object", "Reflect", "structuredClone"]);
const NAME_BLIND_CALLS = new Set(["Object.freeze", "Object.is", "Object.isFrozen"]);

function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  return ts.canHaveModifiers(node) && (ts.getModifiers(node) ?? []).some((m) => m.kind === kind);
}

function* shortNames(): Generator<string> {
  yield* SHORT_NAME_ALPHABET;
  for (const first of SHORT_NAME_ALPHABET) {
    for (const second of SHORT_NAME_ALPHABET) yield first + second;
  }
}

function collectExtendedClasses(checker: ts.TypeChecker, files: ts.SourceFile[]): Set<ts.Node> {
  const extended = new Set<ts.Node>();
  const visit = (node: ts.Node): void => {
    if (ts.isHeritageClause(node) && node.token === ts.SyntaxKind.ExtendsKeyword) {
      for (const type of node.types) {
        const symbol = checker.getSymbolAtLocation(type.expression);
        const resolved =
          symbol && symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol;
        for (const declaration of resolved?.declarations ?? []) extended.add(declaration);
      }
    }
    ts.forEachChild(node, visit);
  };
  for (const file of files) visit(file);
  return extended;
}

function isExcludedClass(node: ts.ClassLikeDeclaration, extended: Set<ts.Node>): boolean {
  return (
    !node.name ||
    hasModifier(node, ts.SyntaxKind.ExportKeyword) ||
    extended.has(node) ||
    (node.heritageClauses ?? []).some((c) => c.token === ts.SyntaxKind.ExtendsKeyword)
  );
}

/** Plans the renames for one program. `isTarget` selects the files that the build owns. */
export function planPrivateMemberRenames(
  program: ts.Program,
  isTarget: (fileName: string) => boolean,
): PrivateMemberPlan {
  const checker = program.getTypeChecker();
  const sourceFiles = program.getSourceFiles().filter((file) => isTarget(file.fileName));
  const extended = collectExtendedClasses(checker, sourceFiles);
  const findings: string[] = [];
  const classes = new Map<ts.Node, ClassEntry>();
  const memberByDeclaration = new Map<ts.Node, MemberEntry>();

  const collectClass = (node: ts.ClassLikeDeclaration, file: ts.SourceFile): void => {
    const entry: ClassEntry = {
      className: node.name?.text ?? "",
      file: file.fileName,
      members: [],
      takenNames: new Set(),
    };
    const byName = new Map<string, MemberEntry>();
    for (const member of node.members) {
      if (ts.isConstructorDeclaration(member)) {
        // A parameter property name is also a local binding, so it keeps its name.
        for (const parameter of member.parameters) {
          if (ts.isIdentifier(parameter.name)) entry.takenNames.add(parameter.name.text);
        }
      } else if (member.name && ts.isIdentifier(member.name)) {
        const name = member.name.text;
        if (!hasModifier(member, ts.SyntaxKind.PrivateKeyword)) {
          entry.takenNames.add(name);
          continue;
        }
        let memberEntry = byName.get(name);
        if (!memberEntry) {
          memberEntry = { escapes: false, identifiers: [], name, typeKeys: [] };
          byName.set(name, memberEntry);
          entry.members.push(memberEntry);
        }
        memberByDeclaration.set(member, memberEntry);
      } else if (member.name && ts.isStringLiteralLike(member.name)) {
        entry.takenNames.add(member.name.text);
      }
    }
    classes.set(node, entry);
  };

  for (const file of sourceFiles) {
    const visit = (node: ts.Node): void => {
      if (ts.isClassLike(node) && !isExcludedClass(node, extended)) collectClass(node, file);
      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  const memberOfSymbol = (symbol: ts.Symbol | undefined): MemberEntry | undefined => {
    for (const declaration of symbol?.declarations ?? []) {
      const member = memberByDeclaration.get(declaration);
      if (member) return member;
    }
    return undefined;
  };

  const privateNames = new Set(
    [...classes.values()].flatMap((entry) => entry.members.map((member) => member.name)),
  );

  const isControllerValue = (expression: ts.Expression): boolean => {
    const type = checker.getTypeAtLocation(expression);
    for (const part of type.isUnion() ? type.types : [type]) {
      const symbol = part.getSymbol() ?? checker.getBaseConstraintOfType(part)?.getSymbol();
      if (symbol?.declarations?.some((declaration) => classes.has(declaration))) return true;
    }
    return false;
  };

  const memberOfKey = (receiver: ts.Expression, key: string): MemberEntry | undefined => {
    const type = checker.getNonNullableType(checker.getTypeAtLocation(receiver));
    return memberOfSymbol(checker.getPropertyOfType(type, key));
  };

  for (const file of sourceFiles) {
    const report = (node: ts.Node, message: string): void => {
      const { line } = file.getLineAndCharacterOfPosition(node.getStart(file));
      findings.push(`${path.basename(file.fileName)}:${line + 1} ${message}`);
    };

    const visit = (node: ts.Node): void => {
      if (ts.isIdentifier(node)) {
        const member = memberOfSymbol(checker.getSymbolAtLocation(node));
        if (member) {
          member.identifiers.push(node);
          const parent = node.parent;
          const isThisRead =
            ts.isPropertyAccessExpression(parent) &&
            parent.name === node &&
            parent.expression.kind === ts.SyntaxKind.ThisKeyword;
          if (!isThisRead && !memberByDeclaration.has(parent)) member.escapes = true;
        }
      }

      // A type such as `Controller["member"]` is erased from the build. The rename still covers it,
      // so the renamed source type-checks in the guard test.
      if (
        ts.isIndexedAccessTypeNode(node) &&
        ts.isLiteralTypeNode(node.indexType) &&
        ts.isStringLiteral(node.indexType.literal)
      ) {
        const type = checker.getTypeFromTypeNode(node.objectType);
        const member = memberOfSymbol(checker.getPropertyOfType(type, node.indexType.literal.text));
        member?.typeKeys.push(node.indexType.literal);
      }

      if (ts.isPropertyAccessExpression(node)) {
        const receiver = checker.getTypeAtLocation(node.expression);
        if (receiver.flags & ts.TypeFlags.Any && privateNames.has(node.name.text)) {
          report(node, `reads "${node.name.text}" from an untyped value`);
        }
      }

      if (ts.isElementAccessExpression(node) && isControllerValue(node.expression)) {
        const key = node.argumentExpression;
        if (ts.isStringLiteralLike(key)) {
          const member = memberOfKey(node.expression, key.text);
          if (member) member.escapes = true;
        } else {
          report(node, "reads a controller member through a computed key");
        }
      }

      if (
        ts.isBindingElement(node) &&
        ts.isObjectBindingPattern(node.parent) &&
        ts.isVariableDeclaration(node.parent.parent) &&
        node.parent.parent.initializer &&
        isControllerValue(node.parent.parent.initializer)
      ) {
        const key = node.propertyName ?? node.name;
        if (node.dotDotDotToken || !ts.isIdentifier(key)) {
          report(node, "copies controller members with a computed or rest binding");
        } else {
          const member = memberOfKey(node.parent.parent.initializer, key.text);
          if (member) member.escapes = true;
        }
      }

      if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) {
        if (isControllerValue(node.right)) report(node, "tests a controller member with `in`");
      }

      if (ts.isForInStatement(node) && isControllerValue(node.expression)) {
        report(node, "walks controller members with for...in");
      }

      if (ts.isSpreadAssignment(node) && isControllerValue(node.expression)) {
        report(node, "spreads a controller into an object");
      }

      if (
        (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) &&
        isControllerValue(node.expression) &&
        !isControllerValue(node)
      ) {
        report(node, "casts a controller to another type");
      }

      if (ts.isCallExpression(node) && node.arguments.some(isControllerValue)) {
        const callee = node.expression;
        const root = ts.isPropertyAccessExpression(callee) ? callee.expression : callee;
        if (
          ts.isIdentifier(root) &&
          REFLECTIVE_GLOBALS.has(root.text) &&
          !NAME_BLIND_CALLS.has(callee.getText(file))
        ) {
          report(node, `passes a controller to ${root.text}`);
        }
      }

      ts.forEachChild(node, visit);
    };
    visit(file);
  }

  const edits = new Map<string, PrivateMemberEdit[]>();
  const renames: PrivateMemberRename[] = [];
  const kept: PrivateMemberPlan["kept"] = [];

  for (const entry of classes.values()) {
    for (const member of entry.members) {
      if (member.escapes) {
        entry.takenNames.add(member.name);
        kept.push({ className: entry.className, member: member.name });
      }
    }
    const ordered = entry.members
      .filter((member) => !member.escapes)
      .sort(
        (a, b) =>
          b.identifiers.length - a.identifiers.length ||
          (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
      );
    const names = shortNames();
    for (const member of ordered) {
      let next = names.next().value as string;
      while (entry.takenNames.has(next) || RESERVED_SHORT_NAMES.has(next)) {
        next = names.next().value as string;
      }
      renames.push({
        className: entry.className,
        file: entry.file,
        from: member.name,
        references: member.identifiers.length,
        to: next,
      });
      const addEdit = (node: ts.Node, text: string): void => {
        const file = node.getSourceFile();
        const list = edits.get(file.fileName) ?? [];
        list.push({ end: node.getEnd(), start: node.getStart(file), text });
        edits.set(file.fileName, list);
      };
      for (const identifier of member.identifiers) addEdit(identifier, next);
      for (const key of member.typeKeys) addEdit(key, JSON.stringify(next));
    }
  }

  return { edits, findings, kept, renames };
}

export function applyPrivateMemberEdits(source: string, edits: PrivateMemberEdit[]): string {
  let output = "";
  let position = 0;
  for (const edit of [...edits].sort((a, b) => a.start - b.start)) {
    output += source.slice(position, edit.start) + edit.text;
    position = edit.end;
  }
  return output + source.slice(position);
}

const BASE64_VLQ = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

function encodeVlq(value: number): string {
  let rest = value < 0 ? (-value << 1) | 1 : value << 1;
  let output = "";
  do {
    const digit = rest & 31;
    rest >>>= 5;
    output += BASE64_VLQ[rest > 0 ? digit | 32 : digit];
  } while (rest > 0);
  return output;
}

/**
 * Creates the source map from edited source back to the original source. Edits stay inside one line,
 * so each original line maps to one edited line. A mapping at each token keeps columns exact after
 * esbuild chains this map, and a renamed member carries its original name.
 */
export function createPrivateMemberSourceMap(
  source: string,
  edits: PrivateMemberEdit[],
  sourceName: string,
): string {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  const names: string[] = [];
  const mappings: string[] = [];
  let previousOriginalLine = 0;
  let previousOriginalColumn = 0;
  let previousName = 0;
  let editIndex = 0;
  let lineStart = 0;

  source.split("\n").forEach((line, lineNumber) => {
    const lineEnd = lineStart + line.length;
    const segments: { column: number; name?: string; originalColumn: number }[] = [];
    const lineEdits: PrivateMemberEdit[] = [];
    while (editIndex < sorted.length && sorted[editIndex].start < lineEnd) {
      lineEdits.push(sorted[editIndex]);
      editIndex += 1;
    }
    for (const edit of lineEdits) {
      const name = source.slice(edit.start, edit.end).replace(/^"|"$/g, "");
      segments.push({ column: -1, name, originalColumn: edit.start - lineStart });
    }
    for (const token of line.matchAll(/[\w$]+|[^\s\w$]/g)) {
      const offset = lineStart + token.index;
      if (!lineEdits.some((edit) => offset >= edit.start && offset < edit.end)) {
        segments.push({ column: -1, originalColumn: token.index });
      }
    }
    segments.sort((a, b) => a.originalColumn - b.originalColumn);

    let previousColumn = 0;
    const encoded = segments.map((segment) => {
      const offset = lineStart + segment.originalColumn;
      const delta = lineEdits
        .filter((edit) => edit.start < offset)
        .reduce((total, edit) => total + edit.text.length - (edit.end - edit.start), 0);
      const column = segment.originalColumn + delta;
      let fields =
        encodeVlq(column - previousColumn) +
        encodeVlq(0) +
        encodeVlq(lineNumber - previousOriginalLine) +
        encodeVlq(segment.originalColumn - previousOriginalColumn);
      if (segment.name !== undefined) {
        let nameIndex = names.indexOf(segment.name);
        if (nameIndex < 0) nameIndex = names.push(segment.name) - 1;
        fields += encodeVlq(nameIndex - previousName);
        previousName = nameIndex;
      }
      previousColumn = column;
      previousOriginalLine = lineNumber;
      previousOriginalColumn = segment.originalColumn;
      return fields;
    });
    mappings.push(encoded.join(","));
    lineStart = lineEnd + 1;
  });

  return JSON.stringify({
    mappings: mappings.join(";"),
    names,
    sources: [sourceName],
    sourcesContent: [source],
    version: 3,
  });
}

/** Plans the renames for the Runtime source files named by a tsconfig. */
export function planRuntimePrivateMemberRenames(tsconfigPath: string): PrivateMemberPlan {
  const sourceRoot = path.join(path.dirname(tsconfigPath), "src") + path.sep;
  const isSource = (fileName: string) => path.normalize(fileName).startsWith(sourceRoot);
  const parsed = ts.getParsedCommandLineOfConfigFile(
    tsconfigPath,
    { noEmit: true, types: [] },
    { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => undefined },
  );
  if (!parsed) throw new Error(`Could not read ${tsconfigPath}.`);
  const program = ts.createProgram(parsed.fileNames.filter(isSource), parsed.options);
  return planPrivateMemberRenames(program, isSource);
}

type PluginBuild = {
  onLoad(
    options: { filter: RegExp },
    callback: (args: { path: string }) => Promise<{ contents: string; loader: "ts" } | undefined>,
  ): void;
  onStart(callback: () => { errors: { text: string }[] } | undefined): void;
};

/** An esbuild plugin that applies the plan to each Runtime source file as esbuild loads it. */
export function manglePrivateMembersPlugin(tsconfigPath: string) {
  return {
    name: "starwind-mangle-private-members",
    setup(build: PluginBuild) {
      let plan: PrivateMemberPlan;
      build.onStart(() => {
        plan = planRuntimePrivateMemberRenames(tsconfigPath);
        return plan.findings.length > 0
          ? { errors: plan.findings.map((text) => ({ text: `Private member mangle: ${text}` })) }
          : undefined;
      });
      build.onLoad({ filter: /\.ts$/ }, async (args) => {
        const edits = plan.edits.get(args.path.split(path.sep).join("/"));
        if (!edits) return undefined;
        const source = await readFile(args.path, "utf8");
        const map = createPrivateMemberSourceMap(source, edits, path.basename(args.path));
        const inlineMap = Buffer.from(map).toString("base64");
        return {
          contents: `${applyPrivateMemberEdits(source, edits)}\n//# sourceMappingURL=data:application/json;base64,${inlineMap}`,
          loader: "ts",
        };
      });
    },
  };
}
