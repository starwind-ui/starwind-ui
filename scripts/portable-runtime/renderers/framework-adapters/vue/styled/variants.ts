import { renderTsValue } from "../../../shared.js";
import type { StyledOutputComponentGroup } from "../../../styled-output-model/index.js";

export function renderVariants(group: StyledOutputComponentGroup): string {
  const aliases = group.variantAliases ?? [];
  const usesTv = group.variants.length > 0 || aliases.some((alias) => alias.defaultVariants);
  const imports = [
    ...(usesTv ? ['import { tv } from "tailwind-variants";'] : []),
    ...aliases.map((alias) => {
      const localName = alias.localName ?? alias.importName;
      const specifier =
        localName === alias.importName ? alias.importName : `${alias.importName} as ${localName}`;
      return `import { ${specifier} } from ${JSON.stringify(alias.source)};`;
    }),
  ].join("\n");
  const aliasExports = aliases
    .map((alias) => {
      const source = alias.localName ?? alias.importName;
      if (!alias.defaultVariants) return `export const ${alias.name} = ${source};`;
      return `export const ${alias.name} = tv({\n  extend: ${source},\n  defaultVariants: ${renderTsValue(alias.defaultVariants, 2)},\n});`;
    })
    .join("\n\n");
  const variants = group.variants
    .map((variant) => `export const ${variant.name} = tv(${renderTsValue(variant.definition)});`)
    .join("\n\n");

  return `${imports}\n\n${[aliasExports, variants].filter(Boolean).join("\n\n")}\n`;
}
