import type {
  AdapterRangeStatusComponentProjection,
  AdapterRangeStatusFacts,
  AdapterRangeStatusIndexProjection,
} from "../types.js";

export function printReactRangeStatusComponent(
  family: AdapterRangeStatusComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printReactRangeStatusRoot(facts);
  if (family.part === "value") return printReactRangeStatusValue(facts);
  if (family.part === "label") return printReactRangeStatusLabel(facts);

  return printReactRangeStatusStaticPart(facts, family.part);
}

export function printReactRangeStatusIndex(family: AdapterRangeStatusIndexProjection): string {
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
  ]
    .map((name) => `  ${name},`)
    .join("\n");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${exportNames}\n};\n\nexport default ${facts.exports.namespace};\n`;
}

function printReactRangeStatusRoot(facts: AdapterRangeStatusFacts): string {
  const valueSetter = requireSetter(facts, facts.setters.valueSetter, "value");
  const formatOptionsSetter = requireSetter(
    facts,
    facts.setters.formatOptionsSetter,
    "format options",
  );
  const formatProp = requireFamilyProp(facts, facts.props.format, "format").name;
  const getAriaValueTextProp = requireFamilyProp(
    facts,
    facts.props.getAriaValueText,
    "getAriaValueText",
  ).name;
  const localeProp = requireFamilyProp(facts, facts.props.locale, "locale").name;
  const valueProp = facts.props.value.name;
  const minProp = facts.props.min.name;
  const maxProp = facts.props.max.name;
  const exportName = facts.exports.root;
  const propsType = `${exportName}Props`;
  const elementType = getElementType(facts.parts.root.defaultElement);

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.state.valueType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${propsType} = Omit<React.HTMLAttributes<${elementType}>, "${valueProp}"> & {\n  ${formatProp}?: ${requireFamilyProp(facts, facts.props.format, "format").type};\n  ${getAriaValueTextProp}?: ${requireFamilyProp(facts, facts.props.getAriaValueText, "getAriaValueText").type};\n  ${localeProp}?: ${requireFamilyProp(facts, facts.props.locale, "locale").type};\n  ${maxProp}?: ${facts.props.max.type};\n  ${minProp}?: ${facts.props.min.type};\n  ${valueProp}?: ${facts.state.valueType};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(function ${exportName}(\n  {\n    "aria-valuetext": ariaValueText,\n    ${formatProp},\n    ${getAriaValueTextProp},\n    ${localeProp},\n    ${maxProp} = ${getPropDefault(facts, facts.props.max)},\n    ${minProp} = ${getPropDefault(facts, facts.props.min)},\n    ${valueProp} = ${getPropDefault(facts, facts.props.value)},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<${elementType}>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ariaValueTextRef = React.useRef(ariaValueText);\n  const formatRef = React.useRef(${formatProp});\n  const getAriaValueTextRef = React.useRef(${getAriaValueTextProp});\n  const localeRef = React.useRef(${localeProp});\n  const maxRef = React.useRef(${maxProp});\n  const minRef = React.useRef(${minProp});\n  const valueRef = React.useRef(${valueProp});\n\n  React.useEffect(() => {\n    ariaValueTextRef.current = ariaValueText;\n  }, [ariaValueText]);\n\n  React.useEffect(() => {\n    valueRef.current = ${valueProp};\n  }, [${valueProp}]);\n\n  const composedRef = React.useCallback((node: ${elementType} | null) => {\n    rootRef.current = node;\n    setRef(forwardedRef, node);\n  }, [forwardedRef]);\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ariaValueText: ariaValueTextRef.current,\n      ${formatProp}: formatRef.current,\n      ${getAriaValueTextProp}: getAriaValueTextRef.current,\n      ${localeProp}: localeRef.current,\n      ${maxProp}: maxRef.current,\n      ${minProp}: minRef.current,\n      ${valueProp}: valueRef.current,\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, []);\n\n  React.useEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${formatOptionsSetter.method}({\n      ariaValueText,\n      ${formatProp},\n      ${getAriaValueTextProp},\n      ${localeProp},\n    });\n  }, [ariaValueText, ${formatProp}, ${getAriaValueTextProp}, ${localeProp}]);\n\n  React.useEffect(() => {\n    const instance = instanceRef.current;\n    if (!instance) return;\n\n    instance.${valueSetter.method}(${valueProp}, { ${maxProp}, ${minProp} });\n  }, [${maxProp}, ${minProp}, ${valueProp}]);\n\n  const isIndeterminate = ${valueProp} == null;\n\n  return (\n    <${facts.parts.root.defaultElement}\n      {...props}\n      ${facts.parts.root.discoveryAttribute}\n      ${facts.attrs.value}={isIndeterminate ? undefined : ${valueProp}}\n      ${facts.attrs.min}={${minProp}}\n      ${facts.attrs.max}={${maxProp}}\n      ${facts.attrs.indeterminate}={isIndeterminate ? "" : undefined}\n      aria-valuetext={ariaValueText}\n      ref={composedRef}\n      role="${facts.parts.root.role}"\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.Root";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function printReactRangeStatusStaticPart(
  facts: AdapterRangeStatusFacts,
  partName: "indicator" | "track",
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printReactRangeStatusValue(facts: AdapterRangeStatusFacts): string {
  const part = facts.parts.value;
  const exportName = facts.exports.value;
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}({ children, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        ${facts.attrs.valuePreserveText}={children == null ? undefined : ""}\n        ref={forwardedRef}\n        {...props}\n        ${facts.attrs.valueAriaHidden.attribute}="${facts.attrs.valueAriaHidden.value}"\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Value";\n\nexport default ${exportName};\n`;
}

function printReactRangeStatusLabel(facts: AdapterRangeStatusFacts): string {
  const part = facts.parts.label;
  const exportName = facts.exports.label;
  const elementType = getElementType(part.defaultElement);
  const propsType = `${exportName}Props`;

  return `import * as React from "react";\n\nexport type ${propsType} = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${propsType}>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute} ref={forwardedRef} {...props} ${facts.attrs.labelRole.attribute}="${facts.attrs.labelRole.value}" />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Label";\n\nexport default ${exportName};\n`;
}

function requireFamilyProp<T>(facts: AdapterRangeStatusFacts, prop: T | undefined, label: string): T {
  if (!prop) {
    throw new Error(`${facts.displayName} range-status facts are missing ${label} prop.`);
  }

  return prop;
}

function requireSetter<T>(facts: AdapterRangeStatusFacts, setter: T | undefined, label: string): T {
  if (!setter) {
    throw new Error(`${facts.displayName} range-status facts are missing ${label} setter.`);
  }

  return setter;
}

function getPropDefault(
  facts: AdapterRangeStatusFacts,
  prop: AdapterRangeStatusFacts["props"]["value"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}

function getElementType(tagName: string): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

function renderSetRefFunction(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}
