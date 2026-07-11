import type {
  AdapterNativeDisabledComponentProjection,
  AdapterNativeDisabledFacts,
  AdapterNativeDisabledIndexProjection,
  AdapterNativeDisabledPart,
} from "../types.js";
import { reactLifecycleProjection } from "./lifecycle-projection.js";

export function printReactNativeDisabledComponent(
  family: AdapterNativeDisabledComponentProjection,
): string {
  const part = getPart(family.facts, family.part);

  if (part.name === family.facts.parts.root.name) {
    return printReactNativeDisabledRoot(family.facts);
  }

  return printReactNativeDisabledSlotPart(family.facts, part);
}

export function printReactNativeDisabledIndex(
  family: AdapterNativeDisabledIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const exportNames = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ].join(", ");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport { ${exportNames} };\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactNativeDisabledRoot(facts: AdapterNativeDisabledFacts): string {
  const part = facts.parts.root;
  const disabled = facts.props.disabled.name;
  const exportName = part.exportName;
  const elementType = getElementType(part);
  const propsType = `${exportName}Props`;
  const rootRef = reactLifecycleProjection.printRootRef({ elementType, indentation: "  " });
  const composedRef = reactLifecycleProjection.printComposedRefCallback({
    elementType,
    indentation: "  ",
  });
  const setupEffect = reactLifecycleProjection.printEffect({
    body: `const root = rootRef.current;\nif (!root) return;\n\nconst instance = ${facts.runtime.factory}(root, { ${disabled} });\ninstanceRef.current = instance;\n\nreturn () => {\n  instance.destroy();\n  if (instanceRef.current === instance) {\n    instanceRef.current = undefined;\n  }\n};`,
    dependencies: [],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });
  const disabledSetterEffect = reactLifecycleProjection.printEffect({
    body: `instanceRef.current?.${facts.runtime.disabledSetter.method}(${disabled});`,
    dependencies: [disabled],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });

  return `import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${propsType} = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(function ${exportName}(\n  { children, ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, ...props },\n  forwardedRef,\n) {\n${rootRef}\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n\n${composedRef}\n\n${setupEffect}\n\n${disabledSetterEffect}\n\n  return (\n    <${part.defaultElement}\n      ${part.discoveryAttribute}\n      ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled}}\n      ref={composedRef}\n      {...props}\n    >\n      {children}\n    </${part.defaultElement}>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactNativeDisabledSlotPart(
  facts: AdapterNativeDisabledFacts,
  part: AdapterNativeDisabledPart,
): string {
  const exportName = part.exportName;
  const elementType = getElementType(part);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.ComponentPropsWithoutRef<"${part.defaultElement}">;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ children, ...props }, ref) {\n    return (\n      <${part.defaultElement} ${part.discoveryAttribute}${renderRole(part)} ref={ref} {...props}>\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function getPart(facts: AdapterNativeDisabledFacts, partName: string): AdapterNativeDisabledPart {
  const part = facts.parts.all.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`${facts.displayName} native-disabled facts are missing ${partName} part.`);
  }

  return part;
}

function getElementType(part: AdapterNativeDisabledPart): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
    fieldset: "HTMLFieldSetElement",
  };

  return elementTypes[part.defaultElement] ?? "HTMLElement";
}

function getPropDefault(
  facts: AdapterNativeDisabledFacts,
  prop: AdapterNativeDisabledFacts["props"]["disabled"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}

function renderRole(part: AdapterNativeDisabledPart): string {
  return part.role ? ` role=${JSON.stringify(part.role)}` : "";
}

function renderSetRefFunction(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}
