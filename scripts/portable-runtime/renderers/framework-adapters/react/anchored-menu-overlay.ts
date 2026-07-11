import type {
  AdapterAnchoredMenuOverlayComponentProjection,
  AdapterAnchoredMenuOverlayFacts,
  AdapterAnchoredMenuOverlayIndexProjection,
} from "../types.js";

export function printReactAnchoredMenuOverlayComponent(
  family: AdapterAnchoredMenuOverlayComponentProjection,
): string {
  if (family.part === "root") return printRoot(family.facts);

  return printTrigger(family.facts);
}

export function printReactAnchoredMenuOverlayIndex(
  family: AdapterAnchoredMenuOverlayIndexProjection,
): string {
  const facts = family.facts;
  const menuImports = facts.index.menuAliasMembers
    .map((alias) => `import ${alias.contextName} from "../menu/${alias.menuName}";`)
    .join("\n");
  const localImports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedMembers = [
    ...facts.index.importMembers.map((member) => member.name),
    ...facts.index.menuAliasMembers.map((alias) => alias.contextName),
  ].sort((a, b) => a.localeCompare(b));
  const namedExports = [facts.exports.namespace, ...namedMembers]
    .map((name) => `  ${name},`)
    .join("\n");
  const typeExports = facts.index.typeExports.length
    ? `\n\nexport type {\n${facts.index.typeExports.map((name) => `  ${name},`).join("\n")}\n} from "${facts.runtime.typeImportSource}";`
    : "";

  return `${menuImports}\n${localImports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};${typeExports}\n`;
}

function printRoot(facts: AdapterAnchoredMenuOverlayFacts): string {
  const props = facts.props;
  const root = facts.exports.root;
  const openEvent = facts.events.openChange;
  const closeEvent = facts.events.closeComplete;

  return `import {\n  type ${closeEvent.detailsType},\n  type ${openEvent.detailsType},\n  ${facts.runtime.factory},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nexport type ${root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.open.name}?: ${props.open.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n  ${closeEvent.callbackProp}?: (details: ${closeEvent.detailsType}) => void;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(\n  function ${root}(\n    {\n      ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n      ${props.open.name},\n      ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n      ${props.modal.name} = ${getDefault(props.modal, "true")},\n      ${props.closeDelay.name} = ${getDefault(props.closeDelay, "200")},\n      ${closeEvent.callbackProp},\n      ${openEvent.callbackProp},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${closeEvent.callbackProp}Ref = React.useRef(${closeEvent.callbackProp});\n    const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});\n    const ${props.open.name}Ref = React.useRef(${props.open.name});\n    const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    useIsomorphicLayoutEffect(() => {\n      ${closeEvent.callbackProp}Ref.current = ${closeEvent.callbackProp};\n    }, [${closeEvent.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};\n    }, [${openEvent.callbackProp}]);\n\n    useIsomorphicLayoutEffect(() => {\n      ${props.open.name}Ref.current = ${props.open.name};\n    }, [${props.open.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    useIsomorphicLayoutEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${props.disabled.name},\n        ${props.modal.name},\n        ${props.closeDelay.name},\n        ${closeEvent.callbackProp}: (details) => {\n          ${closeEvent.callbackProp}Ref.current?.(details);\n        },\n        ${openEvent.callbackProp}: (nextOpen, details) => {\n          ${openEvent.callbackProp}Ref.current?.(nextOpen, details);\n          if (details.isCanceled) return;\n\n          if (${props.open.name}Ref.current === undefined) {\n            setUncontrolledOpen(nextOpen);\n          }\n        },\n        ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n\n      return () => {\n        instance.${facts.runtime.destroyMethod}();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [${props.disabled.name}, ${props.modal.name}, ${props.closeDelay.name}]);\n\n    useIsomorphicLayoutEffect(() => {\n      if (${props.open.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.state.open.getter}() === ${props.open.name}) return;\n\n      instance.${facts.state.open.setter}(${props.open.name}, ${formatOptions(facts.setters.open.options)});\n    }, [${props.open.name}]);\n\n    const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n\n    return (\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.menuRoot}\n        ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}\n        ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n        ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n        ${facts.attrs.closeDelay}={${props.closeDelay.name}}\n        ${facts.attrs.state}={renderedOpen ? "${facts.root.stateAttributes.openValue}" : "${facts.root.stateAttributes.closedValue}"}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n`;
}

function printTrigger(facts: AdapterAnchoredMenuOverlayFacts): string {
  const trigger = facts.exports.trigger;
  const disabled = facts.trigger.disabled;
  const touchCalloutStyleProperty = toReactStyleProperty(facts.trigger.touchCalloutStyle.property);

  return `import * as React from "react";\n\nexport type ${trigger}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${disabled.prop.name}?: ${disabled.prop.type};\n};\n\nconst ${trigger} = React.forwardRef<HTMLDivElement, ${trigger}Props>(\n  function ${trigger}(\n    { ${disabled.prop.name} = false, style, ${facts.props.tabIndex.name}, ...props },\n    forwardedRef,\n  ) {\n    return (\n      <${facts.parts.trigger.defaultElement}\n        ${facts.attrs.trigger}\n        ${facts.attrs.menuTrigger}\n        ${facts.trigger.disclosure.ariaHaspopup.attribute}="${facts.trigger.disclosure.ariaHaspopup.value}"\n        ${facts.trigger.disclosure.ariaExpanded}="false"\n        ${disabled.ariaAttribute}={${disabled.prop.name} || undefined}\n        ${disabled.dataAttribute}={${disabled.prop.name} ? "" : undefined}\n        ${facts.trigger.disclosure.stateAttribute}="${facts.trigger.disclosure.closedStateValue}"\n        tabIndex={${disabled.prop.name} ? -1 : (${facts.props.tabIndex.name} ?? ${facts.trigger.tabIndexDefaultValue})}\n        style={{ ${touchCalloutStyleProperty}: "${facts.trigger.touchCalloutStyle.value}", ...style }}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  const entries = Object.entries(options ?? {});
  if (entries.length === 0) return "{}";

  return `{ ${entries
    .map(([key, value]) => `${key}: ${typeof value === "string" ? JSON.stringify(value) : String(value)}`)
    .join(", ")} }`;
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}

function toReactStyleProperty(property: string): string {
  const camelCaseProperty = property
    .replace(/^-/, "")
    .replace(/-([a-z])/g, (_, char: string) => char.toUpperCase());

  if (camelCaseProperty.startsWith("webkit")) {
    return `Webkit${camelCaseProperty.slice("webkit".length)}`;
  }

  return camelCaseProperty;
}
