import { renderTsValue } from "../../../shared.js";
import {
  getStyledPartsIdentifier,
  renderStyledTypeParameterArguments,
  renderStyledTypeParameterDeclarations,
  type StyledOutputValueExpression,
} from "../../../styled-output-model/index.js";
import { svelteCommandName } from "../recipe-framework-operations.js";
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
  const referenced = new Set([
    ...named,
    ...group.defaultExport.members.map((member) => member.localName),
  ]);
  files.push({
    relativePath: `${group.component}/index.ts`,
    content:
      [
        ...projection.components
          .filter((component) => referenced.has(component.exportName))
          .map((component) => `import ${component.exportName} from "./${component.fileName}";`),
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
  const imports = component.imports
    .filter((entry) => entry.names.length > 0)
    .map(
      (entry) =>
        `import ${entry.typeOnly ? "type " : ""}{ ${entry.names.join(", ")} } from ${JSON.stringify(entry.source)};`,
    );
  if (styleImport) imports.push(`import ${JSON.stringify(styleImport)};`);
  const props = component.destructure.map((prop) =>
    prop.defaultValue?.startsWith("$bindable(") &&
    !prop.alias &&
    /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(prop.name)
      ? `${prop.name} = ${prop.defaultValue}`
      : `${renderDestructuredName(prop.name, prop.alias ?? prop.name)}${prop.defaultValue ? ` = ${prop.defaultValue}` : ""}`,
  );
  // Forward a model through the parent getter so a one-way parent keeps ownership past this wrapper.
  const models = new Set(
    component.destructure
      .filter((prop) => prop.defaultValue?.startsWith("$bindable(") && prop.name !== "ref")
      .map((prop) => prop.name),
  );
  const markup = [
    ...(component.templatePrelude ? [component.templatePrelude] : []),
    ...component.render.map((node) => renderNode(node, models)),
  ].join("\n");
  for (const model of models) {
    const command = svelteCommandName(model);
    if (
      markup.includes(`={() => ${command},`) &&
      !component.destructure.some((prop) => prop.alias === command)
    )
      props.push(`${JSON.stringify(model)}: ${command}`);
  }
  for (const variable of component.variables) {
    const model = variable.state?.acceptedFrom;
    if (model) props.push(`${JSON.stringify(model)}: ${svelteCommandName(model)}`);
  }
  if (component.rest) props.push(`...${component.rest}`);
  const typeParameters = component.typeParameters?.length ? component.typeParameters : undefined;
  if (typeParameters && component.generics)
    throw new TypeError(
      `Svelte Styled ${component.exportName}.svelte: type parameters cannot combine with element generics.`,
    );
  const propsType = `${component.exportName}Props${
    typeParameters
      ? `<${renderStyledTypeParameterArguments(typeParameters)}>`
      : (component.generics?.arguments ?? "")
  }`;
  const instance = [
    `let {\n${indent(props.join(",\n"))}\n}: ${propsType} = $props();`,
    ...(component.initialization ?? []),
    ...component.variables.map((variable) =>
      variable.state
        ? renderAcceptedState(
            variable.name,
            variable.state.acceptedFrom,
            renderSvelteStyledValue(variable.value),
          )
        : `let ${variable.name} = $derived(${renderSvelteStyledValue(variable.value)});`,
    ),
    ...component.setup,
  ].join("\n\n");
  const publicTypes = typeParameters
    ? parameterizePublicPropsType(component.exportName, component.publicTypes, typeParameters)
    : component.publicTypes;
  const generics = typeParameters
    ? ` generics="${renderStyledTypeParameterDeclarations(typeParameters)}"`
    : component.generics
      ? ` generics="${component.generics.declaration}"`
      : "";
  return `<script module lang="ts">\n${indent([...imports, "", publicTypes].join("\n"))}\n</script>\n\n<script lang="ts"${generics}>\n${indent(instance)}\n</script>\n\n${markup}\n`;
}

/**
 * The module script cannot see instance generics, so the public props type declares its own
 * parameters. Family projections write that type in different shapes, so match one declaration.
 * A helper alias, such as Button's `CommonProps`, can hold a contract field outside the scope of
 * the parameters, so a projection that declares one cannot take type parameters.
 */
function parameterizePublicPropsType(
  exportName: string,
  publicTypes: string,
  typeParameters: NonNullable<SvelteStyledComponentProjection["typeParameters"]>,
): string {
  const helpers = [
    ...publicTypes.matchAll(/\b(?:type|interface)\s+([A-Za-z_$][\w$]*)\s*(?:<|=|\{|extends\b)/g),
  ]
    .map((match) => match[1]!)
    .filter((name) => name !== `${exportName}Props`);
  if (helpers.length) {
    throw new TypeError(
      `Svelte Styled ${exportName}.svelte: type parameters are not supported by a projection that declares helper types (${helpers.join(", ")}).`,
    );
  }
  const declaration = new RegExp(`export type ${exportName}Props\\s*=`, "g");
  const matches = publicTypes.match(declaration) ?? [];
  if (matches.length !== 1) {
    throw new TypeError(
      `Svelte Styled ${exportName}.svelte: type parameters need exactly one ${exportName}Props declaration.`,
    );
  }
  return publicTypes.replace(
    declaration,
    `export type ${exportName}Props<${renderStyledTypeParameterDeclarations(typeParameters)}> =`,
  );
}

/** A parent-controlled input is read past the local value of a one-way bindable. */
/** A same-name binding uses shorthand; a rename keeps the quoted key for reserved names like class. */
function renderDestructuredName(name: string, local: string): string {
  return name === local ? name : `${JSON.stringify(name)}: ${local}`;
}

function renderAcceptedState(name: string, model: string, initial: string): string {
  const command = svelteCommandName(model);
  return `const ${model}Controlled = untrack(() => ${command}) !== undefined;
const ${command}Input = () => ${model}Controlled ? ${command} : ${model};
let ${name} = $state(untrack(() => ${initial}));
$effect.pre(() => {
  const input = ${command}Input();
  if (input !== undefined) ${name} = input;
});`;
}

function renderNode(node: SvelteStyledRenderNode, models: ReadonlySet<string>): string {
  const renderAll = (nodes: SvelteStyledRenderNode[]) =>
    nodes.map((child) => renderNode(child, models)).join("\n");
  switch (node.type) {
    case "condition":
      return `{#if ${node.condition}}\n${indent(renderAll(node.then))}${node.else.length ? `\n{:else}\n${indent(renderAll(node.else))}` : ""}\n{/if}`;
    case "each":
      return `{#each ${node.each} as ${node.item}, ${node.index} (${node.key})}\n${indent(renderAll(node.children))}\n{/each}`;
    case "fragment":
      return renderAll(node.children);
    case "snippet-definition":
      return `{#snippet ${node.name}(${node.parameters.join(", ")})}\n${indent(renderAll(node.children))}\n{/snippet}`;
    case "snippet":
      return node.fallback.length
        ? `{#if ${node.name}}{@render ${node.name}()}{:else}${renderAll(node.fallback)}{/if}`
        : `{@render ${node.name}?.()}`;
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
        attrs.push(
          // Textarea keeps native element semantics, so its one-way value stays editable.
          node.type === "component" && node.name !== "Textarea" && models.has(binding.expression)
            ? `bind:${binding.name}={() => ${svelteCommandName(binding.expression)}, (next) => { ${binding.expression} = next; }}`
            : `bind:${binding.name}={${binding.expression}}`,
        );
      if (node.attachment) attrs.push(`{@attach ${node.attachment}}`);
      const start = `<${node.name}${attrs.length ? "\n" + indent(attrs.join("\n")) + "\n" : ""}`;
      // Whitespace inside an empty textarea becomes its initial native value.
      if (node.type === "element" && node.name === "textarea" && !node.children.length)
        return `${start}></textarea>`;
      return node.selfClosing
        ? `${start}/>`
        : `${start}>\n${indent(renderAll(node.children))}\n</${node.name}>`;
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
