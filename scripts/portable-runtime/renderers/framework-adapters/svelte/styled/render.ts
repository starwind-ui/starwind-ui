import { renderTsValue } from "../../../shared.js";
import {
  getStyledPartsIdentifier,
  type StyledOutputValueExpression,
} from "../../../styled-output-model/index.js";
import type {
  SvelteStyledComponentProjection,
  SvelteStyledFile,
  SvelteStyledGroupProjection,
  SvelteStyledRenderNode,
} from "./types.js";

export function renderSvelteStyledFiles(
  projection: SvelteStyledGroupProjection,
): SvelteStyledFile[] {
  const { group, variantAliases, primitiveFacade } = projection;
  const files = projection.components.map((component) => ({
    relativePath: `${group.component}/${component.fileName}`,
    content: renderComponent(
      component,
      group.styles?.importFrom.includes(component.exportName)
        ? `./${group.styles.sourceFileName ?? "styles.css"}`
        : undefined,
    ),
  }));
  if (group.styles)
    files.push({
      relativePath: `${group.component}/${group.styles.sourceFileName ?? "styles.css"}`,
      content: group.styles.content.map((line) => line.trimEnd()).join("\n") + "\n",
    });
  if (group.variants.length || variantAliases.length) {
    files.push({
      relativePath: `${group.component}/variants.ts`,
      content: [
        'import { tv } from "tailwind-variants";',
        ...variantAliases.map(
          (alias) =>
            `import { ${alias.importName === alias.localName ? alias.importName : `${alias.importName} as ${alias.localName}`} } from ${JSON.stringify(alias.source)};`,
        ),
        "",
        ...variantAliases.map(
          (alias) =>
            `export const ${alias.name}${alias.defaultVariants ? "" : `: typeof ${alias.localName}`} = ${alias.defaultVariants ? `tv({ extend: ${alias.localName}, defaultVariants: ${renderTsValue(alias.defaultVariants)} })` : alias.localName};\n`,
        ),
        group.variants
          .map(
            (variant) => `export const ${variant.name} = tv(${renderTsValue(variant.definition)});`,
          )
          .join("\n\n"),
        "",
      ].join("\n"),
    });
  }
  const variants = [
    ...group.variants.map((variant) => variant.name),
    ...variantAliases.map((alias) => alias.name),
  ].sort();
  const collection =
    variants.length && group.variantCollectionName
      ? `const ${group.variantCollectionName} = { ${variants.join(", ")} };`
      : "";
  const parts =
    group.defaultExport.mode === "parts"
      ? `const ${getStyledPartsIdentifier(group)} = { ${group.defaultExport.members.map((member) => `${member.exportName}: ${member.localName}`).join(", ")} };`
      : "";
  const named = [
    ...group.publicExports,
    ...group.constants.map((entry) => entry.name),
    ...(collection && group.variantCollectionName ? [group.variantCollectionName] : []),
  ].sort();
  files.push({
    relativePath: `${group.component}/index.ts`,
    content:
      [
        ...projection.components.map(
          (component) => `import ${component.exportName} from "./${component.fileName}";`,
        ),
        ...(variants.length ? [`import { ${variants.join(", ")} } from "./variants.js";`] : []),
        ...projection.components.map(
          (component) =>
            `export type { ${[`${component.exportName}Props`, ...(component.typeExports ?? [])].join(", ")} } from "./${component.fileName}";`,
        ),
        ...(primitiveFacade
          ? [
              `export type { ${primitiveFacade.types.join(", ")} } from ${JSON.stringify(primitiveFacade.source)};`,
              `export { ${primitiveFacade.values.join(", ")} } from ${JSON.stringify(primitiveFacade.source)};`,
            ]
          : []),
        ...group.constants.map((constant) => `const ${constant.name} = ${constant.value};`),
        collection,
        parts,
        `export { ${named.join(", ")} };`,
        `export default ${group.defaultExport.mode === "parts" ? getStyledPartsIdentifier(group) : group.defaultExport.members[0]!.localName};`,
        "",
      ]
        .filter((line) => line !== "")
        .join("\n") + "\n",
  });
  return files;
}

function renderComponent(component: SvelteStyledComponentProjection, styleImport?: string): string {
  const imports = component.imports.map(
    (entry) =>
      `import ${entry.typeOnly ? "type " : ""}{ ${entry.names.join(", ")} } from ${JSON.stringify(entry.source)};`,
  );
  if (styleImport) imports.push(`import ${JSON.stringify(styleImport)};`);
  const props = component.destructure.map((prop) =>
    prop.defaultValue?.startsWith("$bindable(") &&
    !prop.alias &&
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop.name)
      ? `${prop.name} = ${prop.defaultValue}`
      : `${JSON.stringify(prop.name)}${prop.alias ? `: ${prop.alias}` : `: ${prop.name}`}${prop.defaultValue ? ` = ${prop.defaultValue}` : ""}`,
  );
  if (component.rest) props.push(`...${component.rest}`);
  const instance = [
    `let {\n${indent(props.join(",\n"))}\n}: ${component.exportName}Props = $props();`,
    ...(component.initialization ?? []),
    ...component.variables.map(
      (variable) => `let ${variable.name} = $derived(${renderSvelteStyledValue(variable.value)});`,
    ),
    ...component.setup,
  ].join("\n\n");
  return `<script module lang="ts">\n${indent([...imports, "", component.publicTypes].join("\n"))}\n</script>\n\n<script lang="ts">\n${indent(instance)}\n</script>\n\n${component.render.map((node) => renderNode(node)).join("\n")}\n`;
}

function renderNode(node: SvelteStyledRenderNode): string {
  switch (node.type) {
    case "condition":
      return `{#if ${node.condition}}\n${indent(node.then.map(renderNode).join("\n"))}${node.else.length ? `\n{:else}\n${indent(node.else.map(renderNode).join("\n"))}` : ""}\n{/if}`;
    case "each":
      return `{#each ${node.each} as ${node.item}, ${node.index} (${node.key})}\n${indent(node.children.map(renderNode).join("\n"))}\n{/each}`;
    case "fragment":
      return node.children.map(renderNode).join("\n");
    case "snippet-definition":
      return `{#snippet ${node.name}(${node.parameters.join(", ")})}\n${indent(node.children.map(renderNode).join("\n"))}\n{/snippet}`;
    case "snippet":
      return node.fallback.length
        ? `{#if ${node.name}}{@render ${node.name}(${node.args?.join(", ") ?? ""})}{:else}${node.fallback.map(renderNode).join("\n")}{/if}`
        : `{@render ${node.name}?.(${node.args?.join(", ") ?? ""})}`;
    case "expression":
      return `{${node.value}}`;
    case "text":
      return node.value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll("{", "&#123;");
    case "component":
    case "element": {
      const attrs = node.attrs.map((attr) =>
        attr.name === "spread"
          ? `{...${renderSvelteStyledValue(attr.value!)}}`
          : attr.value
            ? `${attr.name}={${renderSvelteStyledValue(attr.value)}}`
            : attr.name,
      );
      for (const binding of node.bindings ?? [])
        attrs.push(`bind:${binding.name}={${binding.expression}}`);
      if (node.attachment) attrs.push(`{@attach ${node.attachment}}`);
      const start = `<${node.name}${attrs.length ? "\n" + indent(attrs.join("\n")) + "\n" : ""}`;
      // Whitespace inside an empty textarea becomes its initial native value.
      if (node.type === "element" && node.name === "textarea" && !node.children.length)
        return `${start}></textarea>`;
      return node.selfClosing
        ? `${start}/>`
        : `${start}>\n${indent(node.children.map(renderNode).join("\n"))}\n</${node.name}>`;
    }
  }
}

export function renderSvelteStyledValue(value: StyledOutputValueExpression): string {
  switch (value.type) {
    case "literal":
      return JSON.stringify(value.value);
    case "raw":
      return value.code;
    case "variable":
      return value.name;
    case "class-variant":
      return `${value.variant}({ ${Object.entries(value.args ?? {})
        .map(
          ([key, expression]) =>
            `${JSON.stringify(key)}: ${key === "class" || key === "className" ? `cx(${expression})` : expression}`,
        )
        .join(", ")} })`;
    case "class-join":
      return `[${value.items.map(renderSvelteStyledValue).join(", ")}].filter(Boolean).join(" ")`;
    case "object":
      return `{ ${Object.entries(value.entries)
        .map(
          ([key, expression]) => `${JSON.stringify(key)}: ${renderSvelteStyledValue(expression)}`,
        )
        .join(", ")} }`;
    case "template":
      return value.parts
        .map((part) =>
          typeof part === "string"
            ? JSON.stringify(part)
            : `String(${renderSvelteStyledValue(part)})`,
        )
        .join(" + ");
  }
}

function indent(source: string): string {
  return source
    .split("\n")
    .map((line) => (line ? `  ${line}` : ""))
    .join("\n");
}
