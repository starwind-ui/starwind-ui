import { compileTemplate as compileVueTemplate, parse as parseVue } from "@vue/compiler-sfc";
import ts from "typescript";

/** Compare TypeScript syntax while allowing the repository formatters to change layout and import order. */
export function normalizeTypeScriptSource(source: string): string {
  const file = ts.createSourceFile(
    "component.tsx",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const shape = (node: ts.Node): unknown => {
    if (ts.isParenthesizedExpression(node)) return shape(node.expression);
    if (ts.isParenthesizedTypeNode(node)) return shape(node.type);
    if (ts.isJsxText(node) && !node.text.trim()) return undefined;
    if (
      ts.isBinaryExpression(node) &&
      [
        ts.SyntaxKind.BarBarToken,
        ts.SyntaxKind.AmpersandAmpersandToken,
        ts.SyntaxKind.QuestionQuestionToken,
      ].includes(node.operatorToken.kind)
    ) {
      const operands: unknown[] = [];
      const collect = (child: ts.Expression): void => {
        if (ts.isParenthesizedExpression(child)) return collect(child.expression);
        if (ts.isBinaryExpression(child) && child.operatorToken.kind === node.operatorToken.kind) {
          collect(child.left);
          collect(child.right);
        } else operands.push(shape(child));
      };
      collect(node.left);
      collect(node.right);
      return { kind: "LogicalExpression", operator: node.operatorToken.kind, operands };
    }
    const children: unknown[] = [];
    ts.forEachChild(node, (child) => {
      const value = shape(child);
      if (value !== undefined) children.push(value);
    });
    if (ts.isNamedImports(node) || ts.isNamedExports(node))
      children.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
    const text = ts.isIdentifier(node)
      ? node.text
      : ts.isLiteralExpression(node)
        ? node.text
        : undefined;
    const propertyName =
      ts.isStringLiteral(node) &&
      "name" in (node.parent ?? {}) &&
      (node.parent as ts.NamedDeclaration).name === node &&
      /^[A-Za-z_$][\w$]*$/.test(node.text);
    return {
      kind: propertyName ? "Identifier" : ts.SyntaxKind[node.kind],
      ...(text === undefined ? {} : { text }),
      ...("isTypeOnly" in node ? { isTypeOnly: node.isTypeOnly } : {}),
      ...("operator" in node ? { operator: node.operator } : {}),
      ...(ts.isVariableDeclarationList(node)
        ? { declarationKind: node.flags & (ts.NodeFlags.Const | ts.NodeFlags.Let) }
        : {}),
      children,
    };
  };
  const imports = file.statements
    .filter((node) => ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
    .map(shape)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const statements = file.statements
    .filter((node) => !ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
    .map(shape);
  return JSON.stringify({ imports, statements });
}

/** Compare source fragments independently of template formatting. Full modules use AST comparison. */
export function compactCode(source: string | undefined): string {
  if (source === undefined) throw new Error("Expected generated source.");
  return source
    .replace(/'/g, '"')
    .replace(/(^|[{,;]\s*)"([A-Za-z_$][\w$]*)"(\??)\s*:/gm, "$1$2$3:")
    .replace(/\s+/g, "")
    .replace(/;/g, "")
    .replace(/=\{("[^"]*")\}/g, "=$1")
    .replace(/,([}\])])/g, "$1")
    .replace(/,$/, "");
}

export function assertTypeScriptModule(source: string | undefined): void {
  if (!source?.trim()) throw new Error("Expected a generated component module.");
  const result = ts.transpileModule(source, {
    fileName: "Component.tsx",
    reportDiagnostics: true,
    compilerOptions: {
      jsx: ts.JsxEmit.Preserve,
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
    },
  });
  const errors =
    result.diagnostics?.filter(
      (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
    ) ?? [];
  if (errors.length)
    throw new Error(
      ts.formatDiagnostics(errors, {
        getCanonicalFileName: (name) => name,
        getCurrentDirectory: () => "",
        getNewLine: () => "\n",
      }),
    );
}

/** Compare Vue script and compiled template semantics across import/format normalization. */
export function normalizeVueSource(source: string): string {
  if (!/<(?:script|template)\b/.test(source)) return normalizeTypeScriptSource(source);
  const { descriptor, errors } = parseVue(source);
  if (errors.length) throw errors[0];
  return JSON.stringify({
    script: descriptor.script ? normalizeTypeScriptSource(descriptor.script.content) : null,
    setup: descriptor.scriptSetup
      ? normalizeTypeScriptSource(descriptor.scriptSetup.content)
      : null,
    template: descriptor.template
      ? normalizeTypeScriptSource(
          compileVueTemplate({
            source: descriptor.template.content,
            filename: "Component.vue",
            id: "comparison",
          }).code,
        )
      : null,
    styles: descriptor.styles.map((style) => style.content.trim()),
  });
}
