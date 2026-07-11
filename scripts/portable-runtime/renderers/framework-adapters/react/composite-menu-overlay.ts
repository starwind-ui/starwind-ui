import type {
  AdapterCompositeMenuOverlayComponentProjection,
  AdapterCompositeMenuOverlayFacts,
  AdapterCompositeMenuOverlayHelperProjection,
  AdapterCompositeMenuOverlayIndexProjection,
  AdapterCompositeMenuOverlayPartName,
} from "../types.js";
import {
  renderReactAsChildCloneBranch,
  renderReactAsChildImports,
  renderReactAsChildSetup,
} from "./as-child-trigger-fragments.js";

export function printReactCompositeMenuOverlayComponent(
  family: AdapterCompositeMenuOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRoot(facts);
  if (family.part === "trigger") return printTrigger(facts);
  if (family.part === "positioner") return printFloatingPart(facts, "positioner");
  if (family.part === "popup") return printFloatingPart(facts, "popup");
  if (family.part === "item") return printActionItem(facts);
  if (family.part === "linkItem") return printLinkItem(facts);
  if (family.part === "checkboxItem") return printCheckboxItem(facts);
  if (family.part === "checkboxItemIndicator") {
    return printIndicator(facts, "checkboxItemIndicator", facts.checkboxItem.indicator);
  }
  if (family.part === "radioGroup") return printRadioGroup(facts);
  if (family.part === "radioItem") return printRadioItem(facts);
  if (family.part === "radioItemIndicator") {
    return printRadioItemIndicator(facts);
  }
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "submenuRoot") return printSubmenuRoot(facts);
  if (family.part === "submenuTrigger") return printSubmenuTrigger(facts);

  return printSimplePart(facts, family.part);
}

export function printReactCompositeMenuOverlayHelper(
  family: AdapterCompositeMenuOverlayHelperProjection,
): string {
  const facts = family.facts;

  return `import * as React from "react";\n\nexport type ${facts.displayName}RadioGroupContextValue = {\n  value: string | undefined;\n};\n\nexport const ${facts.displayName}RadioGroupContext = React.createContext<${facts.displayName}RadioGroupContextValue | undefined>(undefined);\n\nexport function use${facts.displayName}RadioGroupContext(): ${facts.displayName}RadioGroupContextValue | undefined {\n  return React.useContext(${facts.displayName}RadioGroupContext);\n}\n\nexport type ${facts.displayName}RadioItemContextValue = {\n  checked: boolean;\n  disabled: boolean;\n};\n\nexport const ${facts.displayName}RadioItemContext = React.createContext<${facts.displayName}RadioItemContextValue | undefined>(undefined);\n\nexport function use${facts.displayName}RadioItemContext(): ${facts.displayName}RadioItemContextValue | undefined {\n  return React.useContext(${facts.displayName}RadioItemContext);\n}\n`;
}

export function printReactCompositeMenuOverlayIndex(
  family: AdapterCompositeMenuOverlayIndexProjection,
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
  const typeExports = facts.index.typeExports.length
    ? `\n\nexport type {\n${facts.index.typeExports.map((name) => `  ${name},`).join("\n")}\n} from "${facts.runtime.typeImportSource}";`
    : "";

  return `${imports}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};${typeExports}\n`;
}

function printRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const props = facts.props;
  const root = facts.exports.root;
  const openEvent = facts.events.openChange;
  const closeEvent = facts.events.closeComplete;

  return `import {\n  ${facts.runtime.factory},\n  type ${closeEvent.detailsType},\n  type ${openEvent.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & {\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.open.name}?: ${props.open.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.openOnHover.name}?: ${props.openOnHover.type};\n  ${props.closeDelay.name}?: ${props.closeDelay.type};\n  ${closeEvent.callbackProp}?: (details: ${closeEvent.detailsType}) => void;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n    ${props.open.name},\n    ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n    ${props.modal.name} = ${getDefault(props.modal, "false")},\n    ${props.openOnHover.name} = ${getDefault(props.openOnHover, "false")},\n    ${props.closeDelay.name} = ${getDefault(props.closeDelay, "200")},\n    ${closeEvent.callbackProp},\n    ${openEvent.callbackProp},\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${closeEvent.callbackProp}Ref = React.useRef(${closeEvent.callbackProp});\n  const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});\n  const ${props.open.name}Ref = React.useRef(${props.open.name});\n  const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n  const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n  const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n\n  const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {\n    uncontrolledOpenRef.current = nextOpen;\n    setUncontrolledOpenState(nextOpen);\n  }, []);\n\n  React.useEffect(() => {\n    ${closeEvent.callbackProp}Ref.current = ${closeEvent.callbackProp};\n  }, [${closeEvent.callbackProp}]);\n\n  React.useEffect(() => {\n    ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};\n  }, [${openEvent.callbackProp}]);\n\n  React.useEffect(() => {\n    ${props.open.name}Ref.current = ${props.open.name};\n  }, [${props.open.name}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  React.useEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n      ${props.disabled.name},\n      ${props.modal.name},\n      ${props.openOnHover.name},\n      ${props.closeDelay.name},\n      ${closeEvent.callbackProp}: (details) => {\n        ${closeEvent.callbackProp}Ref.current?.(details);\n      },\n      ${openEvent.callbackProp}: (nextOpen, details) => {\n        ${openEvent.callbackProp}Ref.current?.(nextOpen, details);\n        if (details.isCanceled) return;\n\n        if (${props.open.name}Ref.current === undefined) {\n          setUncontrolledOpen(nextOpen);\n        }\n      },\n      ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${props.disabled.name}, ${props.modal.name}, ${props.openOnHover.name}, ${props.closeDelay.name}]);\n\n  React.useEffect(() => {\n    if (${props.open.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.open.getter}() === ${props.open.name}) return;\n\n    instance.${facts.state.open.setter}(${props.open.name}, ${formatOptions(facts.setters.open.options)});\n  }, [${props.open.name}]);\n\n  const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n\n  return (\n    <div\n      ${facts.attrs.root}\n      ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}\n      ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n      ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n      ${facts.attrs.openOnHover}={${props.openOnHover.name} ? "true" : undefined}\n      ${facts.attrs.closeDelay}={${props.closeDelay.name}}\n      data-state={renderedOpen ? "open" : "closed"}\n      ref={composedRef}\n      {...props}\n    />\n  );\n});\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n`;
}

function printTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const trigger = facts.exports.trigger;
  const asChild = facts.props.asChild;

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${asChild.name}?: ${asChild.type};\n};\n\nconst ${trigger} = React.forwardRef<HTMLElement, ${trigger}Props>(function ${trigger}(\n  { ${asChild.name} = ${getDefault(asChild, "false")}, children, className, ...props },\n  forwardedRef,\n) {\n  const protectedTriggerProps = {\n    ${JSON.stringify(facts.attrs.trigger)}: "",\n    "aria-haspopup": "menu",\n    "aria-expanded": "false",\n    "data-state": "closed",\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n  const triggerProps = {\n    ...protectedTriggerProps,\n    ...props,\n  } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("  ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: asChild.name,
      indent: "  ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n  return (\n    <${facts.parts.trigger.defaultElement}\n      type="button"\n      className={className}\n      ref={forwardedRef as React.Ref<HTMLButtonElement>}\n      {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n    >\n      {children}\n    </${facts.parts.trigger.defaultElement}>\n  );\n});\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function printFloatingPart(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const props = facts.props;
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const roleAttributes =
    partName === "popup" ? `\n      role="${part.role}"\n      tabIndex={-1}` : "";
  const hiddenAttribute = partName === "popup" ? "\n      hidden" : "";

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}> & {\n  ${props.side.name}?: ${props.side.type};\n  ${props.align.name}?: ${props.align.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(function ${exportName}(\n  { ${props.side.name} = ${facts.floating.sideDefault}, ${props.align.name} = ${facts.floating.alignDefault}, ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault}, ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${part.defaultElement}\n      ${facts.attrs[partName]}${roleAttributes}\n      data-state="closed"\n      ${facts.attrs.side}={${props.side.name}}\n      ${facts.attrs.align}={${props.align.name}}\n      ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n      ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}${hiddenAttribute}\n      ref={forwardedRef}\n      {...props}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printActionItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.item;
  const exportName = facts.exports.item;
  const tabIndexValue = branch.tabIndex.value;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${branch.disabled.prop.name}?: ${branch.disabled.prop.type};\n  ${branch.closeOnClick.prop.name}?: ${branch.closeOnClick.prop.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(\n  { ${branch.disabled.prop.name} = false, ${branch.closeOnClick.prop.name} = ${branch.closeOnClick.defaultValue}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${branch.defaultElement}\n      ${facts.attrs.item}\n      role="${branch.role}"\n      tabIndex={${tabIndexValue}}\n      ${branch.closeOnClick.attribute}={${branch.closeOnClick.prop.name} ? undefined : "false"}\n      ${branch.disabled.ariaAttribute}={${branch.disabled.prop.name} || undefined}\n      ${branch.disabled.dataAttribute}={${branch.disabled.prop.name} ? "" : undefined}\n      ref={forwardedRef}\n      {...props}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.Item";\n\nexport default ${exportName};\n`;
}

function printLinkItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.linkItem;
  const exportName = facts.exports.linkItem;
  const tabIndexValue = branch.tabIndex.value;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {\n  ${branch.disabled.prop.name}?: ${branch.disabled.prop.type};\n  ${branch.closeOnClick.prop.name}?: ${branch.closeOnClick.prop.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLAnchorElement, ${exportName}Props>(function ${exportName}(\n  { ${branch.disabled.prop.name} = false, href, ${branch.closeOnClick.prop.name} = ${branch.closeOnClick.defaultValue}, ...props },\n  forwardedRef,\n) {\n  return (\n    <${branch.defaultElement}\n      ${facts.attrs.linkItem}\n      href={${branch.disabled.prop.name} ? undefined : href}\n      role="${branch.role}"\n      tabIndex={${tabIndexValue}}\n      ${branch.closeOnClick.attribute}={${branch.closeOnClick.prop.name} ? "true" : undefined}\n      ${branch.disabled.ariaAttribute}={${branch.disabled.prop.name} || undefined}\n      ${branch.disabled.dataAttribute}={${branch.disabled.prop.name} ? "" : undefined}\n      ref={forwardedRef}\n      {...props}\n    />\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.LinkItem";\n\nexport default ${exportName};\n`;
}

function printCheckboxItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const item = facts.checkboxItem;
  const exportName = facts.exports.checkboxItem;
  const controlled = item.checkedState.controlledProp;
  const defaultProp = item.checkedState.defaultProp;
  const event = item.event;

  return `import type { ${event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${exportName}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${item.stateAttributes.ariaChecked}" | "role"\n> & {\n  ${controlled.name}?: ${controlled.type};\n  ${defaultProp.name}?: ${defaultProp.type};\n  ${event.callbackProp}?: (${event.valueProperty}: ${event.valueType}, details: ${event.detailsType}) => void;\n  ${item.closeOnClick.prop.name}?: ${item.closeOnClick.prop.type};\n  ${item.disabled.prop.name}?: ${item.disabled.prop.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(\n    {\n      ${controlled.name},\n      ${defaultProp.name} = false,\n      ${event.callbackProp},\n      ${item.closeOnClick.prop.name} = ${item.closeOnClick.defaultValue},\n      ${item.disabled.prop.name} = false,\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const itemRef = React.useRef<HTMLDivElement>(null);\n    const ${controlled.name}Ref = React.useRef(${controlled.name});\n    const ${defaultProp.name}Ref = React.useRef(${defaultProp.name});\n    const ${event.callbackProp}Ref = React.useRef(${event.callbackProp});\n    const [uncontrolledChecked, setUncontrolledChecked] = React.useState(\n      () => ${defaultProp.name}Ref.current,\n    );\n\n    React.useEffect(() => {\n      ${controlled.name}Ref.current = ${controlled.name};\n    }, [${controlled.name}]);\n\n    React.useEffect(() => {\n      ${event.callbackProp}Ref.current = ${event.callbackProp};\n    }, [${event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        itemRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const item = itemRef.current;\n      if (!item) return;\n\n      const handleCheckedChange = (event: Event) => {\n        const details = (event as CustomEvent<${event.detailsType}>).detail;\n        ${event.callbackProp}Ref.current?.(details.${event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${controlled.name}Ref.current === undefined) {\n          setUncontrolledChecked(details.${event.valueProperty});\n          return;\n        }\n\n        queueMicrotask(() => {\n          const controlledChecked = ${controlled.name}Ref.current;\n          if (controlledChecked !== undefined && item.isConnected) {\n            syncCheckboxItemState(item, controlledChecked);\n          }\n        });\n      };\n\n      item.addEventListener("${event.domEvent}", handleCheckedChange);\n\n      return () => {\n        item.removeEventListener("${event.domEvent}", handleCheckedChange);\n      };\n    }, []);\n\n    React.useEffect(() => {\n      const item = itemRef.current;\n      if (!item || ${controlled.name} === undefined) return;\n\n      syncCheckboxItemState(item, ${controlled.name});\n    }, [${controlled.name}]);\n\n    const renderedChecked = ${controlled.name} ?? uncontrolledChecked;\n\n    return (\n      <${facts.parts.checkboxItem.defaultElement}\n        ${facts.attrs.checkboxItem}\n        ${item.checkedState.initialAttribute}={${defaultProp.name}Ref.current ? "true" : undefined}\n        ${item.closeOnClick.attribute}={${item.closeOnClick.prop.name} ? "true" : undefined}\n        role="${item.role}"\n        ${item.stateAttributes.ariaChecked}={renderedChecked}\n        ${item.disabled.ariaAttribute}={${item.disabled.prop.name} || undefined}\n        ${item.stateAttributes.checked}={renderedChecked ? "" : undefined}\n        ${item.disabled.dataAttribute}={${item.disabled.prop.name} ? "" : undefined}\n        ${item.stateAttributes.unchecked}={!renderedChecked ? "" : undefined}\n        tabIndex={0}\n        ref={composedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.CheckboxItem";\n\nexport default ${exportName};\n\n${printSetRef()}\n\nfunction syncCheckboxItemState(item: HTMLElement, checked: boolean): void {\n  item.setAttribute("${item.stateAttributes.ariaChecked}", String(checked));\n  item.toggleAttribute("${item.stateAttributes.checked}", checked);\n  item.toggleAttribute("${item.stateAttributes.unchecked}", !checked);\n\n  item\n    .querySelectorAll<HTMLElement>("[${facts.attrs.checkboxItemIndicator}]")\n    .forEach((indicator) => {\n      indicator.setAttribute("aria-hidden", "${item.indicator.ariaHidden}");\n      indicator.setAttribute("${item.indicator.stateAttribute}", checked ? "${item.indicator.checkedStateValue}" : "${item.indicator.uncheckedStateValue}");\n      indicator.toggleAttribute("${item.indicator.visibleAttribute}", checked);\n      indicator.toggleAttribute("${item.indicator.hiddenAttribute}", !checked);\n    });\n}\n`;
}

function printRadioGroup(facts: AdapterCompositeMenuOverlayFacts): string {
  const group = facts.radioGroup;
  const exportName = facts.exports.radioGroup;
  const value = group.valueState.controlledProp;
  const defaultValue = group.valueState.defaultProp;
  const event = group.event;

  return `import type { ${event.detailsType} } from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { ${facts.displayName}RadioGroupContext } from "./${facts.displayName}RadioContext";\n\nexport type ${exportName}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${defaultValue.name}" | "onChange"\n> & {\n  ${value.name}?: ${value.type};\n  ${defaultValue.name}?: ${defaultValue.type};\n  ${event.callbackProp}?: (${event.valueProperty}: ${event.valueType}, details: ${event.detailsType}) => void;\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}({ ${value.name}, ${defaultValue.name}, ${event.callbackProp}, ...props }, forwardedRef) {\n    const groupRef = React.useRef<HTMLDivElement>(null);\n    const ${value.name}Ref = React.useRef(${value.name});\n    const ${event.callbackProp}Ref = React.useRef(${event.callbackProp});\n    const [uncontrolledValue, setUncontrolledValue] = React.useState<string | undefined>(\n      () => ${defaultValue.name},\n    );\n\n    React.useEffect(() => {\n      ${value.name}Ref.current = ${value.name};\n    }, [${value.name}]);\n\n    React.useEffect(() => {\n      ${event.callbackProp}Ref.current = ${event.callbackProp};\n    }, [${event.callbackProp}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        groupRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const group = groupRef.current;\n      if (!group) return;\n\n      const handleValueChange = (event: Event) => {\n        const details = (event as CustomEvent<${event.detailsType}>).detail;\n        ${event.callbackProp}Ref.current?.(details.${event.valueProperty}, details);\n        if (details.isCanceled) return;\n\n        if (${value.name}Ref.current === undefined) {\n          setUncontrolledValue(details.${event.valueProperty});\n          return;\n        }\n\n        queueMicrotask(() => {\n          const controlledValue = ${value.name}Ref.current;\n          if (controlledValue !== undefined && group.isConnected) {\n            syncRadioGroupState(group, controlledValue);\n          }\n        });\n      };\n\n      group.addEventListener("${event.domEvent}", handleValueChange);\n\n      return () => {\n        group.removeEventListener("${event.domEvent}", handleValueChange);\n      };\n    }, []);\n\n    React.useEffect(() => {\n      const group = groupRef.current;\n      if (!group || ${value.name} === undefined) return;\n\n      syncRadioGroupState(group, ${value.name});\n    }, [${value.name}]);\n\n    const renderedValue = ${value.name} ?? uncontrolledValue;\n    const radioGroupContext = React.useMemo(\n      () => ({ value: renderedValue }),\n      [renderedValue],\n    );\n\n    return (\n      <${facts.displayName}RadioGroupContext.Provider value={radioGroupContext}>\n        <${facts.parts.radioGroup.defaultElement}\n          ${facts.attrs.radioGroup}\n          role="${group.role}"\n          ${group.valueState.initialAttribute}={renderedValue}\n          ref={composedRef}\n          {...props}\n        />\n      </${facts.displayName}RadioGroupContext.Provider>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.RadioGroup";\n\nexport default ${exportName};\n\n${printSetRef()}\n\nfunction syncRadioGroupState(group: HTMLElement, value: string): void {\n  group.setAttribute("${group.valueState.initialAttribute}", value);\n\n  group.querySelectorAll<HTMLElement>("[${facts.attrs.radioItem}]").forEach((item) => {\n    if (item.closest("[${facts.attrs.radioGroup}]") !== group) return;\n\n    const checked = item.getAttribute("${facts.radioItem.valueProp.attribute}") === value;\n    item.setAttribute("${facts.radioItem.stateAttributes.ariaChecked}", String(checked));\n    item.toggleAttribute("${facts.radioItem.stateAttributes.checked}", checked);\n    item.toggleAttribute("${facts.radioItem.stateAttributes.unchecked}", !checked);\n\n    item\n      .querySelectorAll<HTMLElement>("[${facts.attrs.radioItemIndicator}]")\n      .forEach((indicator) => {\n        indicator.setAttribute("aria-hidden", "${facts.radioItem.indicator.ariaHidden}");\n        indicator.setAttribute("${facts.radioItem.indicator.stateAttribute}", checked ? "${facts.radioItem.indicator.checkedStateValue}" : "${facts.radioItem.indicator.uncheckedStateValue}");\n        indicator.toggleAttribute("${facts.radioItem.indicator.visibleAttribute}", checked);\n        indicator.toggleAttribute("${facts.radioItem.indicator.hiddenAttribute}", !checked);\n      });\n  });\n}\n`;
}

function printRadioItem(facts: AdapterCompositeMenuOverlayFacts): string {
  const item = facts.radioItem;
  const exportName = facts.exports.radioItem;
  const controlled = item.checkedState.controlledProp;
  const defaultProp = item.checkedState.defaultProp;

  return `import * as React from "react";\nimport { ${facts.displayName}RadioItemContext, use${facts.displayName}RadioGroupContext } from "./${facts.displayName}RadioContext";\n\nexport type ${exportName}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${item.stateAttributes.ariaChecked}" | "role"\n> & {\n  ${item.valueProp.name}: ${item.valueProp.type};\n  ${controlled.name}?: ${controlled.type};\n  ${defaultProp.name}?: ${defaultProp.type};\n  ${item.closeOnClick.prop.name}?: ${item.closeOnClick.prop.type};\n  ${item.disabled.prop.name}?: ${item.disabled.prop.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(\n  { ${item.valueProp.name}, ${controlled.name}, ${defaultProp.name} = false, ${item.closeOnClick.prop.name} = ${item.closeOnClick.defaultValue}, ${item.disabled.prop.name} = false, ...props },\n  forwardedRef,\n) {\n  const radioGroup = use${facts.displayName}RadioGroupContext();\n  const initialChecked = ${controlled.name} ?? ${defaultProp.name};\n  const renderedChecked = radioGroup?.value === undefined ? initialChecked : radioGroup.value === ${item.valueProp.name};\n  const radioItemContext = React.useMemo(\n    () => ({ checked: renderedChecked, disabled: ${item.disabled.prop.name} }),\n    [renderedChecked, ${item.disabled.prop.name}],\n  );\n\n  return (\n    <${facts.displayName}RadioItemContext.Provider value={radioItemContext}>\n      <${facts.parts.radioItem.defaultElement}\n        ${facts.attrs.radioItem}\n        ${item.valueProp.attribute}={${item.valueProp.name}}\n        ${item.checkedState.initialAttribute}={initialChecked ? "true" : undefined}\n        ${item.closeOnClick.attribute}={${item.closeOnClick.prop.name} ? "true" : undefined}\n        role="${item.role}"\n        ${item.stateAttributes.ariaChecked}={renderedChecked}\n        ${item.disabled.ariaAttribute}={${item.disabled.prop.name} || undefined}\n        ${item.stateAttributes.checked}={renderedChecked ? "" : undefined}\n        ${item.disabled.dataAttribute}={${item.disabled.prop.name} ? "" : undefined}\n        ${item.stateAttributes.unchecked}={!renderedChecked ? "" : undefined}\n        tabIndex={0}\n        ref={forwardedRef}\n        {...props}\n      />\n    </${facts.displayName}RadioItemContext.Provider>\n  );\n});\n\n${exportName}.displayName = "${facts.displayName}.RadioItem";\n\nexport default ${exportName};\n`;
}

function printRadioItemIndicator(facts: AdapterCompositeMenuOverlayFacts): string {
  const part = facts.parts.radioItemIndicator;
  const exportName = facts.exports.radioItemIndicator;
  const projection = facts.radioItem.indicator;
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\nimport { use${facts.displayName}RadioItemContext } from "./${facts.displayName}RadioContext";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    const radioItem = use${facts.displayName}RadioItemContext();\n    const checked = radioItem?.checked ?? false;\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.radioItemIndicator}\n        aria-hidden="${projection.ariaHidden}"\n        ${projection.stateAttribute}={checked ? "${projection.checkedStateValue}" : "${projection.uncheckedStateValue}"}\n        ${projection.visibleAttribute}={checked ? "" : undefined}\n        ${projection.hiddenAttribute}={!checked ? "" : undefined}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printIndicator(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: "checkboxItemIndicator" | "radioItemIndicator",
  projection: AdapterCompositeMenuOverlayFacts["checkboxItem"]["indicator"],
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs[partName]}\n        aria-hidden="${projection.ariaHidden}"\n        ${projection.stateAttribute}="${projection.uncheckedStateValue}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printSeparator(facts: AdapterCompositeMenuOverlayFacts): string {
  const branch = facts.staticBranches.separator;
  const exportName = facts.exports.separator;
  const aria = branch.ariaAttributes[0];

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return (\n      <${branch.defaultElement}\n        ${facts.attrs.separator}\n        role="${branch.role}"\n        ${aria.name}="${aria.value}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Separator";\n\nexport default ${exportName};\n`;
}

function printSubmenuRoot(facts: AdapterCompositeMenuOverlayFacts): string {
  const root = facts.submenu.root;
  const exportName = facts.exports.submenuRoot;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${root.closeDelay.name}?: ${root.closeDelay.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}({ ${root.closeDelay.name} = ${root.closeDelay.defaultValue}, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.submenuRoot.defaultElement}\n        ${facts.attrs.submenuRoot}\n        ${root.closeDelay.attribute}={${root.closeDelay.name}}\n        ${root.stateAttributes.state}="${root.stateAttributes.closedValue}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.SubmenuRoot";\n\nexport default ${exportName};\n`;
}

function printSubmenuTrigger(facts: AdapterCompositeMenuOverlayFacts): string {
  const trigger = facts.submenu.trigger;
  const disabled = trigger.disabled;
  const exportName = facts.exports.submenuTrigger;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${disabled.prop.name}?: ${disabled.prop.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}({ ${disabled.prop.name} = false, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.submenuTrigger.defaultElement}\n        ${facts.attrs.submenuTrigger}\n        role="${trigger.role}"\n        ${trigger.disclosure.ariaHaspopup.attribute}="${trigger.disclosure.ariaHaspopup.value}"\n        ${trigger.disclosure.ariaExpanded}="false"\n        ${disabled.ariaAttribute}={${disabled.prop.name} || undefined}\n        ${disabled.dataAttribute}={${disabled.prop.name} ? "" : undefined}\n        ${trigger.disclosure.stateAttribute}="${trigger.disclosure.closedStateValue}"\n        tabIndex={${trigger.tabIndex.value}}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.SubmenuTrigger";\n\nexport default ${exportName};\n`;
}

function printSimplePart(
  facts: AdapterCompositeMenuOverlayFacts,
  partName: Exclude<
    AdapterCompositeMenuOverlayPartName,
    | "checkboxItem"
    | "checkboxItemIndicator"
    | "item"
    | "linkItem"
    | "popup"
    | "positioner"
    | "radioGroup"
    | "radioItem"
    | "radioItemIndicator"
    | "root"
    | "separator"
    | "submenuRoot"
    | "submenuTrigger"
    | "trigger"
  >,
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const role = part.role ? ` role="${part.role}"` : "";

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs[partName]}${role} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function formatOptions(options: Record<string, boolean | number | string> | undefined): string {
  const entries = Object.entries(options ?? {});
  if (entries.length === 0) return "{}";

  return `{ ${entries
    .map(
      ([key, value]) =>
        `${key}: ${typeof value === "string" ? JSON.stringify(value) : String(value)}`,
    )
    .join(", ")} }`;
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    a: "HTMLAnchorElement",
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}
