import ts from "typescript";

/**
 * Vue casts an absent prop to false when its runtime type includes Boolean. The generator gives
 * these props an explicit undefined default, so the Primitive or Runtime default stays in charge.
 */
export function isVueBooleanCastType(type: string): boolean {
  const source = ts.createSourceFile(
    "vue-styled-prop-type.ts",
    `type T = ${type};`,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const statement = source.statements[0];
  return (
    statement !== undefined &&
    ts.isTypeAliasDeclaration(statement) &&
    typeNodeIncludesBoolean(statement.type)
  );
}

function typeNodeIncludesBoolean(node: ts.TypeNode): boolean {
  if (ts.isParenthesizedTypeNode(node)) return typeNodeIncludesBoolean(node.type);
  if (ts.isUnionTypeNode(node)) return node.types.some(typeNodeIncludesBoolean);
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return true;
  return (
    ts.isLiteralTypeNode(node) &&
    (node.literal.kind === ts.SyntaxKind.TrueKeyword ||
      node.literal.kind === ts.SyntaxKind.FalseKeyword)
  );
}

export function renderVuePropKey(name: string): string {
  return isVueIdentifier(name) ? name : JSON.stringify(name);
}

export function hasVueDependentPropDefault(
  props: ReadonlyArray<{ alias?: string; defaultValue?: string; name: string }>,
): boolean {
  const bindings = new Set(props.map((prop) => prop.alias ?? prop.name));
  return props.some((prop) => prop.defaultValue !== undefined && bindings.has(prop.defaultValue));
}

export function isVueIdentifier(value: string): boolean {
  if (!value.length) return false;
  const first = value.charCodeAt(0);
  if (!(value[0] === "$" || value[0] === "_" || isAsciiLetter(first))) return false;
  for (let index = 1; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (!(value[index] === "$" || value[index] === "_" || isAsciiLetter(code) || isDigit(code))) {
      return false;
    }
  }
  return true;
}

function isAsciiLetter(code: number): boolean {
  return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
}

function isDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}
