import {
  carouselAxis,
  carouselConnectionType,
  carouselInputs,
  carouselLifecycle,
} from "../../shared-recipes/media/carousel.js";
import type {
  AdapterEngineViewportComponentProjection,
  AdapterEngineViewportFacts,
  AdapterEngineViewportIndexProjection,
  AdapterEngineViewportPartName,
} from "../types.js";

export function printReactEngineViewportComponent(
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

export function printReactEngineViewportIndex(
  family: AdapterEngineViewportIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n\nexport type { ${facts.index.typeExports.join(", ")} } from "${facts.index.typeExportSource}";\nexport { ${facts.index.valueExports.join(", ")} } from "${facts.index.valueExportSource}";\n`;
}

function printRoot(facts: AdapterEngineViewportFacts): string {
  const props = facts.options;
  const root = facts.exports.root;
  const defaultOptionsConst = `DEFAULT_${facts.displayName.toUpperCase()}_OPTS`;

  return `import {\n  type ${facts.runtime.instanceType},\n  type ${facts.runtime.optionsType},\n  ${facts.runtime.factory},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${root}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.orientation.name}?: ${props.orientation.type};\n  ${props.opts.name}?: ${props.opts.type};\n  ${props.plugins.name}?: ${props.plugins.type};\n  ${props.setApi.name}?: ${props.setApi.type};\n};\n\nconst ${defaultOptionsConst}: ${facts.runtime.optionsType}["opts"] = {};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  { ${props.orientation.name} = ${props.orientation.defaultValue}, ${props.opts.name} = ${defaultOptionsConst}, ${props.plugins.name}, ${props.setApi.name}, ...props },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const inputs = React.useRef({ ${[...carouselInputs(facts), props.setApi.name].join(", ")} });\n  inputs.current = { ${[...carouselInputs(facts), props.setApi.name].join(", ")} };\n  const connection = React.useRef<${carouselConnectionType(facts)}>({}).current;\n\n  ${carouselLifecycle(facts, (name) => `inputs.current.${name}`)}\n\n  const composedRef = React.useCallback((node: HTMLDivElement | null) => {\n    rootRef.current = node;\n    setRef(forwardedRef, node);\n  }, [forwardedRef]);\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n    connectCarousel(root);\n    return disconnectCarousel;\n  }, []);\n  React.useEffect(syncCarouselOptions, [${carouselInputs(facts).join(", ")}]);\n  React.useEffect(publishCarouselApi, [${props.setApi.name}]);\n\n  return (\n    <${facts.parts.root.defaultElement}\n      ${facts.attrs.role}="${facts.semantics.rootRole}"\n      ${facts.attrs.roledescription}="${facts.semantics.rootRoledescription}"\n      {...props}\n      ${facts.attrs.autoInit}="${props.autoInit.falseValue}"\n      ${facts.attrs.root}\n      ${facts.attrs.axis}={${carouselAxis(facts, (name) => name)}}\n      ${facts.attrs.opts}={JSON.stringify(${props.opts.name})}\n      ref={composedRef}\n    />\n  );\n});\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n`;
}

function printItem(facts: AdapterEngineViewportFacts): string {
  const part = facts.parts.item;
  const component = facts.exports.item;

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.itemRole}="${facts.semantics.itemRole}"\n        ${facts.attrs.itemRoledescription}="${facts.semantics.itemRoledescription}"\n        {...props}\n        ${facts.attrs.item}\n        ref={forwardedRef}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printControl(facts: AdapterEngineViewportFacts, partName: "next" | "previous"): string {
  const part = facts.parts[partName];
  const component = facts.exports[partName];
  const control = facts.controls[partName];
  const attr = facts.attrs[partName];

  return `import * as React from "react";\n\nexport type ${component}Props = React.ButtonHTMLAttributes<HTMLButtonElement>;\n\nconst ${component} = React.forwardRef<HTMLButtonElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return <${part.defaultElement} ${attr} ${control.typeAttribute}="${control.typeValue}" ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printSimplePart(
  facts: AdapterEngineViewportFacts,
  partName: Exclude<AdapterEngineViewportPartName, "item" | "next" | "previous" | "root">,
): string {
  const part = facts.parts[partName];
  const component = facts.exports[partName];
  const attr = facts.attrs[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${component} = React.forwardRef<${elementType}, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return <${part.defaultElement} ${attr} ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}
