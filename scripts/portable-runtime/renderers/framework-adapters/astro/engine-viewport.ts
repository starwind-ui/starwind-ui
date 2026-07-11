import type {
  AdapterEngineViewportComponentProjection,
  AdapterEngineViewportFacts,
  AdapterEngineViewportIndexProjection,
  AdapterEngineViewportPartName,
} from "../types.js";

export function printAstroEngineViewportComponent(
  family: AdapterEngineViewportComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "item") return printItem(facts);
  if (family.part === "previous" || family.part === "next") {
    return printControl(facts, family.part);
  }

  return printSimplePart(facts, family.part);
}

export function printAstroEngineViewportIndex(
  family: AdapterEngineViewportIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}.astro";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [facts.exports.namespace, ...facts.index.importMembers.map((member) => member.name)]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

function printRoot(facts: AdapterEngineViewportFacts): string {
  const props = facts.options;

  return `---\nimport type { ${facts.runtime.optionsType} } from "${facts.runtime.importSource}";\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${facts.parts.root.defaultElement}"> & {\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${props.opts.name}?: ${props.opts.type};\n  ${props.autoInit.name}?: ${props.autoInit.type};\n};\n\nconst { ${props.orientation.name} = ${props.orientation.defaultValue}, ${props.opts.name} = ${props.opts.defaultValue}, ${props.autoInit.name} = ${props.autoInit.defaultValue}, ...rest } = Astro.props;\n---\n\n<${facts.parts.root.defaultElement}\n  ${facts.attrs.root}\n  ${facts.attrs.role}="${facts.semantics.rootRole}"\n  ${facts.attrs.roledescription}="${facts.semantics.rootRoledescription}"\n  ${facts.attrs.axis}={${props.orientation.name} === "vertical" ? "${props.orientation.axisMap.vertical}" : "${props.orientation.axisMap.horizontal}"}\n  ${facts.attrs.opts}={JSON.stringify(${props.opts.name})}\n  ${facts.attrs.autoInit}={${props.autoInit.name} ? undefined : "${props.autoInit.falseValue}"}\n  {...rest}\n>\n  <slot />\n</${facts.parts.root.defaultElement}>\n\n<script>\n  import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\n\n  const getInitCandidates = (event: Event | undefined, selector: string): HTMLElement[] => {\n    const initRoot =\n      event?.type === "starwind:init" && event instanceof CustomEvent\n        ? event.detail?.root\n        : undefined;\n    const scopedRoot: Document | DocumentFragment | Element = isQueryableRoot(initRoot)\n      ? initRoot\n      : document;\n    const candidates = Array.from(scopedRoot.querySelectorAll<HTMLElement>(selector));\n\n    if (scopedRoot instanceof Element && scopedRoot.matches(selector)) {\n      candidates.unshift(scopedRoot as HTMLElement);\n    }\n\n    return candidates;\n  };\n\n  const isQueryableRoot = (value: unknown): value is Document | DocumentFragment | Element =>\n    value instanceof Document || value instanceof DocumentFragment || value instanceof Element;\n\n  const ${facts.runtime.setupFunction} = (event?: Event) => {\n    getInitCandidates(event, "[${facts.attrs.root}]").forEach((root) => {\n      if (root.getAttribute("${facts.attrs.autoInit}") === "${props.autoInit.falseValue}") return;\n\n      ${facts.runtime.factory}(root);\n    });\n  };\n\n  ${facts.runtime.setupFunction}();\n  document.addEventListener("astro:after-swap", ${facts.runtime.setupFunction});\n  document.addEventListener("starwind:init", ${facts.runtime.setupFunction});\n</script>\n`;
}

function printItem(facts: AdapterEngineViewportFacts): string {
  const part = facts.parts.item;

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${facts.attrs.item} ${facts.attrs.itemRole}="${facts.semantics.itemRole}" ${facts.attrs.itemRoledescription}="${facts.semantics.itemRoledescription}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printControl(
  facts: AdapterEngineViewportFacts,
  partName: "next" | "previous",
): string {
  const part = facts.parts[partName];
  const control = facts.controls[partName];
  const attr = facts.attrs[partName];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${attr} ${control.typeAttribute}="${control.typeValue}" {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}

function printSimplePart(
  facts: AdapterEngineViewportFacts,
  partName: Exclude<AdapterEngineViewportPartName, "item" | "next" | "previous" | "root">,
): string {
  const part = facts.parts[partName];
  const attr = facts.attrs[partName];

  return `---\nimport type { HTMLAttributes } from "astro/types";\n\ntype Props = HTMLAttributes<"${part.defaultElement}">;\n\nconst { ...rest } = Astro.props;\n---\n\n<${part.defaultElement} ${attr} {...rest}>\n  <slot />\n</${part.defaultElement}>\n`;
}
