import { renderTsValue } from "../../../shared.js";
import type { StyledOutputComponentGroup } from "../../../styled-output-model/index.js";
import { renderNamedImport } from "./formatting.js";

export function renderVariants(group: StyledOutputComponentGroup, tsHeader: string): string {
  const variantAliases = group.variantAliases ?? [];
  if (group.variants.length === 0 && variantAliases.length === 0) return "";

  const usesTv = group.variants.length > 0 || variantAliases.some((alias) => alias.defaultVariants);
  const imports = [
    ...(usesTv ? ['import { tv } from "tailwind-variants";'] : []),
    ...renderVariantAliasImports(variantAliases),
  ].join("\n");

  const aliases = variantAliases.map((alias) => renderVariantAliasExport(alias)).join("\n");

  const variants = group.variants
    .map((variant) => `export const ${variant.name} = tv(${renderTsValue(variant.definition)});\n`)
    .join("\n");

  const body = [aliases, variants].filter(Boolean).join("\n");

  return `${tsHeader}${imports}

${body}`;
}

function renderVariantAliasExport(
  alias: NonNullable<StyledOutputComponentGroup["variantAliases"]>[number],
): string {
  const sourceVariant = alias.localName ?? alias.importName;
  if (!alias.defaultVariants) {
    return `export const ${alias.name} = ${sourceVariant};\n`;
  }

  return `export const ${alias.name} = tv({
  extend: ${sourceVariant},
  defaultVariants: ${renderTsValue(alias.defaultVariants, 2)},
});\n`;
}

function renderVariantAliasImports(
  variantAliases: NonNullable<StyledOutputComponentGroup["variantAliases"]>,
): string[] {
  const importsBySource = new Map<string, Array<{ localName: string; specifier: string }>>();

  for (const alias of variantAliases) {
    const localName = alias.localName ?? alias.importName;
    const specifier =
      localName === alias.importName ? alias.importName : `${alias.importName} as ${localName}`;
    const sourceImports = importsBySource.get(alias.source) ?? [];

    sourceImports.push({ localName, specifier });
    importsBySource.set(alias.source, sourceImports);
  }

  return [...importsBySource].map(([source, sourceImports]) =>
    renderNamedImport(
      sourceImports
        .sort((left, right) => left.localName.localeCompare(right.localName))
        .map(({ specifier }) => specifier),
      source,
    ),
  );
}
