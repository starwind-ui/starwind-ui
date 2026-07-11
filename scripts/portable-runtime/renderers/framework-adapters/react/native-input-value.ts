import type {
  AdapterNativeInputValueComponentProjection,
  AdapterNativeInputValueFacts,
  AdapterNativeInputValueIndexProjection,
} from "../types.js";
import { reactLifecycleProjection } from "./lifecycle-projection.js";

export function printReactNativeInputValueComponent(
  family: AdapterNativeInputValueComponentProjection,
): string {
  return printReactNativeInputValueRoot(family.facts);
}

export function printReactNativeInputValueIndex(
  family: AdapterNativeInputValueIndexProjection,
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
  const typeExports = facts.index.typeExports.join(", ");

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport { ${exportNames} };\n\nexport default ${facts.exports.namespace};\n\nexport type { ${typeExports} } from "${facts.runtime.typeImportSource}";\n`;
}

function printReactNativeInputValueRoot(facts: AdapterNativeInputValueFacts): string {
  const defaultValue = facts.props.defaultValue.name;
  const disabled = facts.props.disabled.name;
  const event = facts.events.valueChange;
  const exportName = facts.exports.root;
  const part = facts.parts.root;
  const value = facts.props.value.name;
  const propsType = `${exportName}Props`;
  const rootRef = reactLifecycleProjection.printRootRef({
    elementType: "HTMLInputElement",
    indentation: "  ",
  });
  const valueRefSyncEffect = reactLifecycleProjection.printRefSyncEffect({
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
    refName: "valueRef",
    value,
  });
  const onValueChangeRefSyncEffect = reactLifecycleProjection.printRefSyncEffect({
    dependencies: [event.callbackProp],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
    refName: "onValueChangeRef",
    value: event.callbackProp,
  });
  const composedRef = reactLifecycleProjection.printComposedRefCallback({
    elementType: "HTMLInputElement",
    indentation: "  ",
  });
  const setupEffect = reactLifecycleProjection.printEffect({
    body: `const root = rootRef.current;\nif (!root) return;\n\nconst instance = ${facts.runtime.factory}(root, {\n  ${defaultValue}: ${defaultValue}Ref.current,\n  ${disabled},\n  ${event.callbackProp}: (_nextValue, details) => {\n    valueChangeDetailsRef.current = details;\n  },\n  ...(valueRef.current !== undefined ? { ${value}: valueRef.current } : {}),\n});\ninstanceRef.current = instance;\n\nreturn () => {\n  if (controlledSyncTimerRef.current !== undefined) {\n    window.clearTimeout(controlledSyncTimerRef.current);\n    controlledSyncTimerRef.current = undefined;\n  }\n  instance.destroy();\n  if (instanceRef.current === instance) {\n    instanceRef.current = undefined;\n  }\n};`,
    dependencies: [],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });
  const valueSetterEffect = reactLifecycleProjection.printEffect({
    body: `if (${value} === undefined) return;\nconst instance = instanceRef.current;\nif (!instance) return;\nif (instance.${facts.runtime.valueGetter}() === String(${value})) return;\n\ninstance.${facts.runtime.valueSetter.method}(${value}, ${formatOptions(facts.runtime.valueSetter.options)});`,
    dependencies: [value],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });
  const disabledSetterEffect = reactLifecycleProjection.printEffect({
    body: `const instance = instanceRef.current;\nif (!instance) return;\n\ninstance.${facts.runtime.disabledSetter.method}(${disabled});`,
    dependencies: [disabled],
    hook: "useIsomorphicLayoutEffect",
    indentation: "  ",
  });
  const scheduleControlledSync = printControlledSyncCallback(
    facts.runtime.valueSetter.method,
    formatOptions(facts.runtime.valueSetter.options),
  );
  const handleChange = reactLifecycleProjection.printCallback({
    body: `const nextValue = event.currentTarget.value;\nconst details = valueChangeDetailsRef.current;\n\nonChange?.(event);\n\nif (details?.${event.valueProperty} === nextValue) {\n  valueChangeDetailsRef.current = undefined;\n  onValueChangeRef.current?.(nextValue, details);\n}\nscheduleControlledSync();`,
    dependencies: ["onChange", "scheduleControlledSync"],
    indentation: "  ",
    name: "handleChange",
    parameters: "(event: React.ChangeEvent<HTMLInputElement>)",
  });

  return `import {\n  ${facts.runtime.factory},\n  type ${facts.props.value.type},\n  type ${event.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${propsType} = Omit<\n  React.InputHTMLAttributes<HTMLInputElement>,\n  "${defaultValue}" | "${value}"\n> & {\n  ${defaultValue}?: ${facts.props.defaultValue.type};\n  ${event.callbackProp}?: (${value}: ${event.valueType}, details: ${event.detailsType}) => void;\n  ${value}?: ${facts.props.value.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLInputElement, ${propsType}>(function ${exportName}(\n  { ${defaultValue}, ${disabled} = ${getPropDefault(facts, facts.props.disabled)}, onChange, ${event.callbackProp}, readOnly, ${value}, ...props },\n  forwardedRef,\n) {\n${rootRef}\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const valueRef = React.useRef(${value});\n  const onValueChangeRef = React.useRef(${event.callbackProp});\n  const valueChangeDetailsRef = React.useRef<${event.detailsType} | undefined>(undefined);\n  const controlledSyncTimerRef = React.useRef<number | undefined>(undefined);\n  const ${defaultValue}Ref = React.useRef(${defaultValue});\n\n${valueRefSyncEffect}\n\n${onValueChangeRefSyncEffect}\n\n${composedRef}\n\n${setupEffect}\n\n${valueSetterEffect}\n\n${disabledSetterEffect}\n\n${scheduleControlledSync}\n\n${handleChange}\n  const valueProps = ${value} !== undefined ? { ${value} } : { ${defaultValue}: ${defaultValue}Ref.current };\n\n  return (\n    <${part.defaultElement}\n      ${part.discoveryAttribute}\n      ${facts.attrs.stateDisabled}={${disabled} ? "" : undefined}\n      ${facts.attrs.disabled}={${disabled}}\n      onChange={handleChange}\n      readOnly={readOnly}\n      ref={composedRef}\n      {...valueProps}\n      {...props}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.Root";\n\nexport default ${exportName};\n\n${renderSetRefFunction()}`;
}

function getPropDefault(
  facts: AdapterNativeInputValueFacts,
  prop: AdapterNativeInputValueFacts["props"]["disabled"],
): string {
  if (prop.defaultValue === undefined) {
    throw new Error(`${facts.displayName} ${prop.name} prop is missing a default value.`);
  }

  return prop.defaultValue;
}

function printControlledSyncCallback(setterMethod: string, setterOptions: string): string {
  return `  const scheduleControlledSync = React.useCallback(() => {\n    if (valueRef.current === undefined) return;\n\n    if (controlledSyncTimerRef.current !== undefined) {\n      window.clearTimeout(controlledSyncTimerRef.current);\n    }\n\n    controlledSyncTimerRef.current = window.setTimeout(() => {\n      controlledSyncTimerRef.current = undefined;\n      const root = rootRef.current;\n      const instance = instanceRef.current;\n      if (!root || !instance) return;\n\n      instance.${setterMethod}(root.value, ${setterOptions});\n    }, 0);\n  }, []);`;
}

function renderSetRefFunction(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}

function formatOptions(options: Readonly<Record<string, boolean | number | string>> | undefined) {
  if (!options || Object.keys(options).length === 0) {
    return "{}";
  }

  const entries = Object.entries(options).map(([key, value]) => `${key}: ${JSON.stringify(value)}`);

  return `{ ${entries.join(", ")} }`;
}
