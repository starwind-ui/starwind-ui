import type {
  AdapterEditableCollectionOverlayComponentProjection,
  AdapterEditableCollectionOverlayFacts,
  AdapterEditableCollectionOverlayHelperProjection,
  AdapterEditableCollectionOverlayIndexProjection,
  AdapterEditableCollectionOverlayPartName,
} from "../types.js";
import {
  renderReactAsChildCloneBranch,
  renderReactAsChildImports,
  renderReactAsChildSetup,
} from "./as-child-trigger-fragments.js";

export function printReactEditableCollectionOverlayComponent(
  family: AdapterEditableCollectionOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRootWithClosedContentFixes(facts);
  if (family.part === "input") return printInputWithContext(facts);
  if (family.part === "trigger") return printAsChildButtonWithContext(facts, "trigger");
  if (family.part === "clear") return printAsChildButtonWithContext(facts, "clear");
  if (family.part === "value") return printValueWithContext(facts);
  if (family.part === "positioner") return printFloatingPart(facts, "positioner");
  if (family.part === "popup") return printPopupWithLazyChildren(facts);
  if (family.part === "empty")
    return printSimplePart(facts, "empty", facts.collection.empty.hiddenAttribute);
  if (family.part === "group")
    return printSimplePart(facts, "group", `role="${facts.collection.group.role}"`);
  if (family.part === "item") return printItemWithContext(facts);
  if (family.part === "itemIndicator") return printItemIndicatorWithContext(facts);
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "icon") return printSimplePart(facts, "icon", 'aria-hidden="true"');

  return printSimplePart(facts, family.part);
}

export function printReactEditableCollectionOverlayIndex(
  family: AdapterEditableCollectionOverlayIndexProjection,
): string {
  const facts = family.facts;
  const imports = facts.index.importMembers
    .map((member) => `import ${member.name} from "${member.from}";`)
    .join("\n");
  const contextExport = `export {\n${facts.context.fileExportMembers
    .map((member) => `  ${member.name},`)
    .join("\n")}\n} from "./${facts.context.rootContext.replace(/Context$/, "Context")}";`;
  const namespaceEntries = facts.index.namespaceMembers
    .map((member) => `  ${member.key}: ${member.name},`)
    .join("\n");
  const namedExports = [
    facts.exports.namespace,
    ...facts.index.importMembers.map((member) => member.name),
  ]
    .map((name) => `  ${name},`)
    .join("\n");
  const typeExport = printRuntimeTypeExport(facts);

  return `${imports}\n\n${contextExport}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n${namedExports}\n};\n\nexport default ${facts.exports.namespace};\n${typeExport}`;
}

export function printReactEditableCollectionOverlayHelper(
  family: AdapterEditableCollectionOverlayHelperProjection,
): string {
  const facts = family.facts;
  const context = facts.context;

  return `import * as React from "react";\n\nexport type ${context.rootContextValueType} = {\n  disabled: boolean;\n  inputValue: string;\n  open: boolean;\n  readOnly: boolean;\n  required: boolean;\n  selectedText: string | null;\n  value: string | null;\n};\n\nexport type ${context.itemContextValueType} = {\n  value: string;\n};\n\nconst fallback${context.rootContext}: ${context.rootContextValueType} = {\n  disabled: false,\n  inputValue: "",\n  open: false,\n  readOnly: false,\n  required: false,\n  selectedText: null,\n  value: null,\n};\n\nconst fallback${context.itemContext}: ${context.itemContextValueType} = {\n  value: "",\n};\n\nexport const ${context.rootContext} = React.createContext<${context.rootContextValueType} | null>(null);\nexport const ${context.itemContext} = React.createContext<${context.itemContextValueType} | null>(null);\n\nexport function ${context.useRootContext}(): ${context.rootContextValueType} {\n  return React.useContext(${context.rootContext}) ?? fallback${context.rootContext};\n}\n\nexport function ${context.useItemContext}(): ${context.itemContextValueType} {\n  return React.useContext(${context.itemContext}) ?? fallback${context.itemContext};\n}\n`;
}

function printRootWithLazyClosedContentSupport(
  facts: AdapterEditableCollectionOverlayFacts,
): string {
  const props = facts.props;
  const root = facts.exports.root;
  const inputValueEvent = facts.events.inputValueChange;
  const openEvent = facts.events.openChange;
  const valueEvent = facts.events.valueChange;
  const context = facts.context;

  return `import {\n  type ${inputValueEvent.detailsType},\n  type ${openEvent.detailsType},\n  type ${valueEvent.detailsType},\n  ${facts.runtime.factory},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nimport { ${context.rootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${props.defaultValue.name}" | "onChange"\n> & {\n  ${props.autoComplete.name}?: ${props.autoComplete.type};\n  ${props.defaultInputValue.name}?: ${props.defaultInputValue.type};\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.filterMode.name}?: ${props.filterMode.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};\n  ${props.inputValue.name}?: ${props.inputValue.type};\n  ${props.locale.name}?: ${props.locale.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.name.name}?: ${props.name.type};\n  ${inputValueEvent.callbackProp}?: (\n    ${inputValueEvent.valueProperty}: ${inputValueEvent.valueType},\n    details: ${inputValueEvent.detailsType},\n  ) => void;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;\n  ${valueEvent.callbackProp}?: (${valueEvent.valueProperty}: ${valueEvent.valueType}, details: ${valueEvent.detailsType}) => void;\n  ${props.open.name}?: ${props.open.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n  ${props.value.name}?: ${props.value.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(\n  function ${root}(\n    {\n      ${props.autoComplete.name},\n      ${props.defaultInputValue.name},\n      ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n      ${props.defaultValue.name},\n      ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n      ${props.filterMode.name} = ${getDefault(props.filterMode, '"contains"')},\n      ${props.form.name},\n      ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},\n      ${props.inputValue.name},\n      ${props.locale.name},\n      ${props.modal.name} = ${getDefault(props.modal, "false")},\n      ${props.name.name},\n      ${inputValueEvent.callbackProp},\n      ${openEvent.callbackProp},\n      ${valueEvent.callbackProp},\n      ${props.open.name},\n      ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},\n      ${props.required.name} = ${getDefault(props.required, "false")},\n      ${props.value.name},\n      children,\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${props.inputValue.name}Ref = React.useRef(${props.inputValue.name});\n    const ${inputValueEvent.callbackProp}Ref = React.useRef(${inputValueEvent.callbackProp});\n    const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});\n    const ${valueEvent.callbackProp}Ref = React.useRef(${valueEvent.callbackProp});\n    const ${props.open.name}Ref = React.useRef(${props.open.name});\n    const ${props.value.name}Ref = React.useRef(${props.value.name});\n    const ${props.defaultInputValue.name}Ref = React.useRef(${props.defaultInputValue.name});\n    const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n    const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n    const [uncontrolledInputValue, setUncontrolledInputValueState] = React.useState(${props.defaultInputValue.name}Ref.current);\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n    const [uncontrolledValue, setUncontrolledValueState] = React.useState(${props.defaultValue.name}Ref.current);\n    const [selectedInputValue, setSelectedInputValue] = React.useState<{\n      inputValue: string | null;\n      value: string | null;\n    }>(() => ({ inputValue: null, value: null }));\n    const uncontrolledInputValueRef = React.useRef(uncontrolledInputValue);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n    const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n    const setUncontrolledInputValue = React.useCallback((nextInputValue: ${props.inputValue.type}) => {\n      uncontrolledInputValueRef.current = nextInputValue;\n      setUncontrolledInputValueState(nextInputValue);\n    }, []);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    const setUncontrolledValue = React.useCallback((nextValue: ${props.value.type}) => {\n      uncontrolledValueRef.current = nextValue;\n      setUncontrolledValueState(nextValue);\n    }, []);\n\n    React.useEffect(() => {\n      ${props.inputValue.name}Ref.current = ${props.inputValue.name};\n    }, [${props.inputValue.name}]);\n\n    React.useEffect(() => {\n      ${inputValueEvent.callbackProp}Ref.current = ${inputValueEvent.callbackProp};\n    }, [${inputValueEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};\n    }, [${openEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${valueEvent.callbackProp}Ref.current = ${valueEvent.callbackProp};\n    }, [${valueEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${props.open.name}Ref.current = ${props.open.name};\n    }, [${props.open.name}]);\n\n    React.useEffect(() => {\n      ${props.value.name}Ref.current = ${props.value.name};\n    }, [${props.value.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    const ensureInstance = React.useCallback(() => {\n      const existing = instanceRef.current;\n      if (existing) return existing;\n\n      const root = rootRef.current;\n      if (!root) return undefined;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${props.autoComplete.name},\n        ${props.defaultInputValue.name}: uncontrolledInputValueRef.current,\n        ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${props.defaultValue.name}: uncontrolledValueRef.current,\n        ${props.disabled.name},\n        ${props.filterMode.name},\n        ${props.form.name},\n        ${props.highlightItemOnHover.name},\n        ${props.locale.name},\n        ${props.modal.name},\n        ${props.name.name},\n        ${inputValueEvent.callbackProp}: (nextInputValue, details) => {\n          ${inputValueEvent.callbackProp}Ref.current?.(nextInputValue, details);\n          if (details.isCanceled) return;\n\n          if (${props.inputValue.name}Ref.current === undefined) {\n            setUncontrolledInputValue(nextInputValue);\n          }\n        },\n        ${openEvent.callbackProp}: (nextOpen, details) => {\n          ${openEvent.callbackProp}Ref.current?.(nextOpen, details);\n          if (details.isCanceled) return;\n\n          if (${props.open.name}Ref.current === undefined) {\n            setUncontrolledOpen(nextOpen);\n          }\n        },\n        ${valueEvent.callbackProp}: (nextValue, details) => {\n          ${valueEvent.callbackProp}Ref.current?.(nextValue, details);\n          if (details.isCanceled) return;\n\n          const nextSelectedInputValue = getTextFromComboboxItem(details.item);\n          if (nextSelectedInputValue !== null || nextValue === null) {\n            setSelectedInputValue({ inputValue: nextSelectedInputValue, value: nextValue });\n          }\n\n          if (${props.value.name}Ref.current === undefined) {\n            setUncontrolledValue(nextValue);\n          }\n        },\n        ${props.readOnly.name},\n        ${props.required.name},\n        ...(${props.inputValue.name}Ref.current !== undefined ? { ${props.inputValue.name}: ${props.inputValue.name}Ref.current } : {}),\n        ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n        ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n      return instance;\n    }, [\n      ${props.autoComplete.name},\n      ${props.disabled.name},\n      ${props.filterMode.name},\n      ${props.form.name},\n      ${props.highlightItemOnHover.name},\n      ${props.locale.name},\n      ${props.modal.name},\n      ${props.name.name},\n      ${props.readOnly.name},\n      ${props.required.name},\n      setUncontrolledInputValue,\n      setUncontrolledOpen,\n      setUncontrolledValue,\n    ]);\n\n    React.useEffect(() => {\n      return () => {\n        instanceRef.current?.destroy();\n        instanceRef.current = undefined;\n      };\n    }, []);\n\n    React.useEffect(() => {\n      if ((${props.open.name}Ref.current ?? uncontrolledOpenRef.current) !== true) return;\n\n      ensureInstance();\n    }, [ensureInstance, ${props.open.name}, uncontrolledOpen]);\n\n    React.useEffect(() => {\n      instanceRef.current?.${facts.formSetter.method}(${renderObjectShorthand(facts.formSetter.props)});\n    }, ${renderDependencyList(facts.formSetter.dependencies)});\n\n    React.useEffect(() => {\n      instanceRef.current?.${facts.setters.disabled.method}(${props.disabled.name});\n    }, [${props.disabled.name}]);\n\n    React.useEffect(() => {\n      if (${props.inputValue.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.states.inputValue.getter}() === ${props.inputValue.name}) return;\n\n      instance.${facts.setters.inputValue.method}(${props.inputValue.name}, ${formatOptions(facts.setters.inputValue.options)});\n    }, [${props.inputValue.name}]);\n\n    React.useEffect(() => {\n      if (${props.open.name} === undefined) return;\n      const instance = ${props.open.name} ? ensureInstance() : instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.states.open.getter}() === ${props.open.name}) return;\n\n      instance.${facts.setters.open.method}(${props.open.name}, ${formatOptions(facts.setters.open.options)});\n    }, [ensureInstance, ${props.open.name}]);\n\n    React.useEffect(() => {\n      if (${props.value.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      const previousValue = instance.${facts.states.value.getter}();\n      if (previousValue !== ${props.value.name}) {\n        instance.${facts.setters.value.method}(${props.value.name}, ${formatOptions(facts.setters.value.options)});\n      }\n\n      if (${props.inputValue.name}Ref.current === undefined) {\n        const nextInputValue = instance.${facts.states.inputValue.getter}();\n        if (uncontrolledInputValueRef.current !== nextInputValue) {\n          setUncontrolledInputValue(nextInputValue);\n        }\n      }\n    }, [setUncontrolledInputValue, ${props.value.name}]);\n\n    const selectedValue = ${props.value.name} !== undefined ? ${props.value.name} : (uncontrolledValue ?? null);\n    React.useEffect(() => {\n      const timer = window.setTimeout(() => {\n        setSelectedInputValue({\n          inputValue: findSelectedComboboxItemText(children, selectedValue),\n          value: selectedValue,\n        });\n      }, 0);\n\n      return () => window.clearTimeout(timer);\n    }, [children, selectedValue]);\n\n    const renderedInputValue =\n      ${props.inputValue.name} !== undefined\n        ? ${props.inputValue.name}\n        : uncontrolledInputValue !== undefined\n          ? uncontrolledInputValue\n          : selectedInputValue.value === selectedValue\n            ? (selectedInputValue.inputValue ?? "")\n            : "";\n    const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n    const renderedValue = selectedValue ?? "";\n    const initializeFromInteractiveEvent = React.useCallback(\n      (event: React.SyntheticEvent<HTMLDivElement>) => {\n        if (${props.disabled.name}) return;\n        const target = event.target;\n        if (!(target instanceof Element)) return;\n        if (!target.closest("[${facts.attrs.trigger}], [${facts.attrs.input}], [${facts.attrs.clear}]")) return;\n\n        ensureInstance();\n      },\n      [ensureInstance, ${props.disabled.name}],\n    );\n    const contextValue = React.useMemo(\n      () => ({\n        disabled: ${props.disabled.name},\n        inputValue: renderedInputValue ?? "",\n        open: renderedOpen,\n        readOnly: ${props.readOnly.name},\n        required: ${props.required.name},\n        value: selectedValue,\n      }),\n      [\n        ${props.disabled.name},\n        renderedInputValue,\n        renderedOpen,\n        ${props.readOnly.name},\n        ${props.required.name},\n        selectedValue,\n      ],\n    );\n\n    return (\n      <${context.rootContext}.Provider value={contextValue}>\n        <${facts.parts.root.defaultElement}\n          ${facts.attrs.root}\n          ${facts.attrs.autoComplete}={${props.autoComplete.name}}\n          ${facts.attrs.defaultInputValue}={${props.defaultInputValue.name}Ref.current}\n          ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}\n          ${facts.attrs.defaultValue}={${props.defaultValue.name}Ref.current ?? undefined}\n          ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n          ${facts.attrs.filterMode}={${props.filterMode.name}}\n          ${facts.attrs.form}={${props.form.name}}\n          ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}\n          ${facts.attrs.inputValue}={renderedInputValue}\n          ${facts.attrs.locale}={${props.locale.name}}\n          ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n          ${facts.attrs.name}={${props.name.name}}\n          ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n          ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n          data-state={renderedOpen ? "open" : "closed"}\n          ref={composedRef}\n          {...props}\n          onClickCapture={(event) => {\n            props.onClickCapture?.(event);\n            if (!event.defaultPrevented) initializeFromInteractiveEvent(event);\n          }}\n          onFocusCapture={(event) => {\n            props.onFocusCapture?.(event);\n            if (!event.defaultPrevented) initializeFromInteractiveEvent(event);\n          }}\n          onInputCapture={(event) => {\n            props.onInputCapture?.(event);\n            if (!event.defaultPrevented) initializeFromInteractiveEvent(event);\n          }}\n          onKeyDownCapture={(event) => {\n            props.onKeyDownCapture?.(event);\n            if (!event.defaultPrevented) initializeFromInteractiveEvent(event);\n          }}\n          onPointerDownCapture={(event) => {\n            props.onPointerDownCapture?.(event);\n            if (!event.defaultPrevented) initializeFromInteractiveEvent(event);\n          }}\n        >\n          <input\n            ${facts.attrs.hiddenInput}\n            type="${facts.hiddenInput.constantAttributes.type}"\n            autoComplete={${props.autoComplete.name}}\n            form={${props.form.name}}\n            name={${props.name.name}}\n            disabled={${props.disabled.name}}\n            required={${props.required.name}}\n            value={renderedValue}\n            aria-hidden="${facts.hiddenInput.constantAttributes.ariaHidden}"\n            tabIndex={${facts.hiddenInput.constantAttributes.tabIndex}}\n            readOnly\n          />\n          {children}\n        </${facts.parts.root.defaultElement}>\n      </${context.rootContext}.Provider>\n    );\n  },\n);\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n\nfunction findSelectedComboboxItemText(\n  children: React.ReactNode,\n  selectedValue: string | null,\n): string | null {\n  if (selectedValue === null) return null;\n\n  let selectedText: string | null = null;\n\n  const visit = (node: React.ReactNode): void => {\n    if (selectedText !== null) return;\n\n    React.Children.forEach(node, (child) => {\n      if (selectedText !== null || !React.isValidElement(child)) return;\n\n      const childProps = child.props as {\n        children?: React.ReactNode;\n        label?: unknown;\n        textValue?: unknown;\n        value?: unknown;\n        "aria-label"?: unknown;\n      };\n      if (childProps.value === selectedValue) {\n        selectedText = getSelectedComboboxTextFromProps(childProps);\n        return;\n      }\n\n      visit(childProps.children);\n    });\n  };\n\n  visit(children);\n  return selectedText;\n}\n\nfunction getSelectedComboboxTextFromProps(props: {\n  children?: React.ReactNode;\n  label?: unknown;\n  textValue?: unknown;\n  "aria-label"?: unknown;\n}): string | null {\n  const explicitText =\n    getStringPropText(props.textValue) ??\n    getStringPropText(props.label) ??\n    getStringPropText(props["aria-label"]);\n  if (explicitText !== null) return explicitText;\n\n  const childText =\n    getComboboxItemTextFromReactNode(props.children) ?? getTextFromReactNode(props.children).trim();\n  return childText.length > 0 ? childText : null;\n}\n\nfunction getComboboxItemTextFromReactNode(node: React.ReactNode): string | null {\n  let selectedText: string | null = null;\n\n  const visit = (candidate: React.ReactNode): void => {\n    if (selectedText !== null) return;\n\n    React.Children.forEach(candidate, (child) => {\n      if (selectedText !== null || !React.isValidElement(child)) return;\n\n      const childProps = child.props as {\n        children?: React.ReactNode;\n        ${JSON.stringify(facts.attrs.itemText)}?: unknown;\n      };\n      if (isComboboxItemTextElement(child)) {\n        const text = getTextFromReactNode(childProps.children).trim();\n        selectedText = text.length > 0 ? text : null;\n        return;\n      }\n\n      visit(childProps.children);\n    });\n  };\n\n  visit(node);\n  return selectedText;\n}\n\nfunction getStringPropText(value: unknown): string | null {\n  if (typeof value !== "string" && typeof value !== "number") return null;\n\n  const text = String(value).trim();\n  return text.length > 0 ? text : null;\n}\n\nfunction isComboboxItemTextElement(node: React.ReactElement): boolean {\n  const props = node.props as { ${JSON.stringify(facts.attrs.itemText)}?: unknown };\n  if (props[${JSON.stringify(facts.attrs.itemText)}] !== undefined) return true;\n\n  const displayName = getReactComponentDisplayName(node.type);\n  return displayName === "Combobox.ItemText" || displayName === "ComboboxItemText";\n}\n\nfunction getReactComponentDisplayName(type: unknown): string | null {\n  if (typeof type === "string") return null;\n  if (typeof type !== "function" && (typeof type !== "object" || type === null)) return null;\n\n  const candidate = type as { displayName?: string; name?: string };\n  return candidate.displayName ?? candidate.name ?? null;\n}\n\nfunction getTextFromReactNode(node: React.ReactNode): string {\n  if (node === null || node === undefined || typeof node === "boolean") return "";\n  if (typeof node === "string" || typeof node === "number") return String(node);\n  if (!React.isValidElement(node)) {\n    let text = "";\n    React.Children.forEach(node, (child) => {\n      text += getTextFromReactNode(child);\n    });\n    return text;\n  }\n\n  return getTextFromReactNode((node.props as { children?: React.ReactNode }).children);\n}\n\nfunction getTextFromComboboxItem(item: HTMLElement | undefined): string | null {\n  if (!item) return null;\n\n  const textElement = item.querySelector<HTMLElement>("[${facts.attrs.itemText}]");\n  const text = (textElement ?? item).textContent?.trim() ?? "";\n  return text.length > 0 ? text : null;\n}\n`;
}

function printRoot(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;
  const root = facts.exports.root;
  const inputValueEvent = facts.events.inputValueChange;
  const openEvent = facts.events.openChange;
  const valueEvent = facts.events.valueChange;

  return `import {\n  type ${inputValueEvent.detailsType},\n  type ${openEvent.detailsType},\n  type ${valueEvent.detailsType},\n  ${facts.runtime.factory},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${props.defaultValue.name}" | "onChange"\n> & {\n  ${props.autoComplete.name}?: ${props.autoComplete.type};\n  ${props.defaultInputValue.name}?: ${props.defaultInputValue.type};\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.filterMode.name}?: ${props.filterMode.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};\n  ${props.inputValue.name}?: ${props.inputValue.type};\n  ${props.locale.name}?: ${props.locale.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.name.name}?: ${props.name.type};\n  ${inputValueEvent.callbackProp}?: (\n    ${inputValueEvent.valueProperty}: ${inputValueEvent.valueType},\n    details: ${inputValueEvent.detailsType},\n  ) => void;\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;\n  ${valueEvent.callbackProp}?: (${valueEvent.valueProperty}: ${valueEvent.valueType}, details: ${valueEvent.detailsType}) => void;\n  ${props.open.name}?: ${props.open.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n  ${props.value.name}?: ${props.value.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(\n  function ${root}(\n    {\n      ${props.autoComplete.name},\n      ${props.defaultInputValue.name},\n      ${props.defaultOpen.name} = ${getDefault(props.defaultOpen, "false")},\n      ${props.defaultValue.name},\n      ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n      ${props.filterMode.name} = ${getDefault(props.filterMode, '"contains"')},\n      ${props.form.name},\n      ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},\n      ${props.inputValue.name},\n      ${props.locale.name},\n      ${props.modal.name} = ${getDefault(props.modal, "false")},\n      ${props.name.name},\n      ${inputValueEvent.callbackProp},\n      ${openEvent.callbackProp},\n      ${valueEvent.callbackProp},\n      ${props.open.name},\n      ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},\n      ${props.required.name} = ${getDefault(props.required, "false")},\n      ${props.value.name},\n      children,\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const rootRef = React.useRef<HTMLDivElement>(null);\n    const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n    const ${props.inputValue.name}Ref = React.useRef(${props.inputValue.name});\n    const ${inputValueEvent.callbackProp}Ref = React.useRef(${inputValueEvent.callbackProp});\n    const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});\n    const ${valueEvent.callbackProp}Ref = React.useRef(${valueEvent.callbackProp});\n    const ${props.open.name}Ref = React.useRef(${props.open.name});\n    const ${props.value.name}Ref = React.useRef(${props.value.name});\n    const ${props.defaultInputValue.name}Ref = React.useRef(${props.defaultInputValue.name});\n    const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n    const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n    const [uncontrolledInputValue, setUncontrolledInputValueState] = React.useState(${props.defaultInputValue.name}Ref.current);\n    const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n    const [uncontrolledValue, setUncontrolledValueState] = React.useState(${props.defaultValue.name}Ref.current);\n    const uncontrolledInputValueRef = React.useRef(uncontrolledInputValue);\n    const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n    const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n    const setUncontrolledInputValue = React.useCallback((nextInputValue: ${props.inputValue.type}) => {\n      uncontrolledInputValueRef.current = nextInputValue;\n      setUncontrolledInputValueState(nextInputValue);\n    }, []);\n\n    const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {\n      uncontrolledOpenRef.current = nextOpen;\n      setUncontrolledOpenState(nextOpen);\n    }, []);\n\n    const setUncontrolledValue = React.useCallback((nextValue: ${props.value.type}) => {\n      uncontrolledValueRef.current = nextValue;\n      setUncontrolledValueState(nextValue);\n    }, []);\n\n    React.useEffect(() => {\n      ${props.inputValue.name}Ref.current = ${props.inputValue.name};\n    }, [${props.inputValue.name}]);\n\n    React.useEffect(() => {\n      ${inputValueEvent.callbackProp}Ref.current = ${inputValueEvent.callbackProp};\n    }, [${inputValueEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};\n    }, [${openEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${valueEvent.callbackProp}Ref.current = ${valueEvent.callbackProp};\n    }, [${valueEvent.callbackProp}]);\n\n    React.useEffect(() => {\n      ${props.open.name}Ref.current = ${props.open.name};\n    }, [${props.open.name}]);\n\n    React.useEffect(() => {\n      ${props.value.name}Ref.current = ${props.value.name};\n    }, [${props.value.name}]);\n\n    const composedRef = React.useCallback(\n      (node: HTMLDivElement | null) => {\n        rootRef.current = node;\n        setRef(forwardedRef, node);\n      },\n      [forwardedRef],\n    );\n\n    React.useEffect(() => {\n      const root = rootRef.current;\n      if (!root) return;\n\n      const instance = ${facts.runtime.factory}(root, {\n        ${props.autoComplete.name},\n        ${props.defaultInputValue.name}: uncontrolledInputValueRef.current,\n        ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n        ${props.defaultValue.name}: uncontrolledValueRef.current,\n        ${props.disabled.name},\n        ${props.filterMode.name},\n        ${props.form.name},\n        ${props.highlightItemOnHover.name},\n        ${props.locale.name},\n        ${props.modal.name},\n        ${props.name.name},\n        ${inputValueEvent.callbackProp}: (nextInputValue, details) => {\n          ${inputValueEvent.callbackProp}Ref.current?.(nextInputValue, details);\n          if (details.isCanceled) return;\n\n          if (${props.inputValue.name}Ref.current === undefined) {\n            setUncontrolledInputValue(nextInputValue);\n          }\n        },\n        ${openEvent.callbackProp}: (nextOpen, details) => {\n          ${openEvent.callbackProp}Ref.current?.(nextOpen, details);\n          if (details.isCanceled) return;\n\n          if (${props.open.name}Ref.current === undefined) {\n            setUncontrolledOpen(nextOpen);\n          }\n        },\n        ${valueEvent.callbackProp}: (nextValue, details) => {\n          ${valueEvent.callbackProp}Ref.current?.(nextValue, details);\n          if (details.isCanceled) return;\n\n          if (${props.value.name}Ref.current === undefined) {\n            setUncontrolledValue(nextValue);\n          }\n        },\n        ${props.readOnly.name},\n        ${props.required.name},\n        ...(${props.inputValue.name}Ref.current !== undefined ? { ${props.inputValue.name}: ${props.inputValue.name}Ref.current } : {}),\n        ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n        ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),\n      });\n      instanceRef.current = instance;\n\n      return () => {\n        instance.destroy();\n        if (instanceRef.current === instance) {\n          instanceRef.current = undefined;\n        }\n      };\n    }, [\n      ${props.filterMode.name},\n      ${props.highlightItemOnHover.name},\n      ${props.locale.name},\n      ${props.modal.name},\n      ${props.readOnly.name},\n    ]);\n\n    React.useEffect(() => {\n      instanceRef.current?.${facts.formSetter.method}(${renderObjectShorthand(facts.formSetter.props)});\n    }, ${renderDependencyList(facts.formSetter.dependencies)});\n\n    React.useEffect(() => {\n      instanceRef.current?.${facts.setters.disabled.method}(${props.disabled.name});\n    }, [${props.disabled.name}]);\n\n    React.useEffect(() => {\n      if (${props.inputValue.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.states.inputValue.getter}() === ${props.inputValue.name}) return;\n\n      instance.${facts.setters.inputValue.method}(${props.inputValue.name}, ${formatOptions(facts.setters.inputValue.options)});\n    }, [${props.inputValue.name}]);\n\n    React.useEffect(() => {\n      if (${props.open.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n      if (instance.${facts.states.open.getter}() === ${props.open.name}) return;\n\n      instance.${facts.setters.open.method}(${props.open.name}, ${formatOptions(facts.setters.open.options)});\n    }, [${props.open.name}]);\n\n    React.useEffect(() => {\n      if (${props.value.name} === undefined) return;\n      const instance = instanceRef.current;\n      if (!instance) return;\n\n      const previousValue = instance.${facts.states.value.getter}();\n      if (previousValue !== ${props.value.name}) {\n        instance.${facts.setters.value.method}(${props.value.name}, ${formatOptions(facts.setters.value.options)});\n      }\n\n      if (${props.inputValue.name}Ref.current === undefined) {\n        const nextInputValue = instance.${facts.states.inputValue.getter}();\n        if (uncontrolledInputValueRef.current !== nextInputValue) {\n          setUncontrolledInputValue(nextInputValue);\n        }\n      }\n    }, [setUncontrolledInputValue, ${props.value.name}]);\n\n    const renderedInputValue = ${props.inputValue.name} !== undefined ? ${props.inputValue.name} : uncontrolledInputValue;\n    const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n    const renderedValue = ${props.value.name} !== undefined ? (${props.value.name} ?? "") : (uncontrolledValue ?? "");\n\n    return (\n      <${facts.parts.root.defaultElement}\n        ${facts.attrs.root}\n        ${facts.attrs.autoComplete}={${props.autoComplete.name}}\n        ${facts.attrs.defaultInputValue}={${props.defaultInputValue.name}Ref.current}\n        ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}\n        ${facts.attrs.defaultValue}={${props.defaultValue.name}Ref.current ?? undefined}\n        ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n        ${facts.attrs.filterMode}={${props.filterMode.name}}\n        ${facts.attrs.form}={${props.form.name}}\n        ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}\n        ${facts.attrs.inputValue}={renderedInputValue}\n        ${facts.attrs.locale}={${props.locale.name}}\n        ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n        ${facts.attrs.name}={${props.name.name}}\n        ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n        ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n        data-state={renderedOpen ? "open" : "closed"}\n        ref={composedRef}\n        {...props}\n      >\n        <input\n          ${facts.attrs.hiddenInput}\n          type="${facts.hiddenInput.constantAttributes.type}"\n          form={${props.form.name}}\n          name={${props.name.name}}\n          value={renderedValue}\n          aria-hidden="${facts.hiddenInput.constantAttributes.ariaHidden}"\n          tabIndex={${facts.hiddenInput.constantAttributes.tabIndex}}\n          readOnly\n        />\n        {children}\n      </${facts.parts.root.defaultElement}>\n    );\n  },\n);\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\n${printSetRef()}\n`;
}

function printInputWithContext(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.input;
  const context = facts.context;

  return `import * as React from "react";\n\nimport { ${context.useRootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = React.InputHTMLAttributes<HTMLInputElement>;\n\nconst ${component} = React.forwardRef<HTMLInputElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    const combobox = ${context.useRootContext}();\n    const inputDisabled = combobox.disabled || props.disabled === true;\n    const inputReadOnly = combobox.readOnly || props.readOnly === true;\n\n    return (\n      <${facts.parts.input.defaultElement}\n        {...props}\n        ${facts.attrs.input}\n        role="${facts.inputSemantics.role}"\n        aria-autocomplete="${facts.inputSemantics.ariaAutocomplete}"\n        aria-disabled={inputDisabled ? "true" : undefined}\n        aria-expanded={combobox.open ? "true" : "false"}\n        aria-readonly={inputReadOnly ? "true" : "false"}\n        aria-required={combobox.required ? "true" : "false"}\n        autoComplete="${facts.inputSemantics.autocomplete}"\n        data-disabled={inputDisabled ? "" : undefined}\n        data-readonly={inputReadOnly ? "" : undefined}\n        data-required={combobox.required ? "" : undefined}\n        disabled={inputDisabled}\n        readOnly={inputReadOnly}\n        ref={forwardedRef}\n        value={props.value ?? combobox.inputValue}\n        onChange={props.onChange ?? noopComboboxInputChange}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Input";\n\nexport default ${component};\n\nfunction noopComboboxInputChange(_event: React.ChangeEvent<HTMLInputElement>): void {}\n`;
}

function printRootWithClosedContentFixes(facts: AdapterEditableCollectionOverlayFacts): string {
  const props = facts.props;
  let output = printRootWithLazyClosedContentSupport(facts);

  output = output.replace(
    `      const instance = ${facts.runtime.factory}(root, {
        ${props.autoComplete.name},
        ${props.defaultInputValue.name}: uncontrolledInputValueRef.current,`,
    `      const selectedInitialValue =
        ${props.value.name}Ref.current !== undefined ? ${props.value.name}Ref.current : (uncontrolledValueRef.current ?? null);
      const selectedInitialInputValue = findSelectedComboboxItemText(children, selectedInitialValue);
      const defaultRuntimeInputValue =
        uncontrolledInputValueRef.current ?? selectedInitialInputValue ?? "";
      const defaultRuntimeFilterValue = uncontrolledInputValueRef.current ?? "";

      const instance = ${facts.runtime.factory}(root, {
        ${props.autoComplete.name},
        ${props.defaultInputValue.name}: defaultRuntimeInputValue,
        ...(${props.inputValue.name}Ref.current === undefined ? { defaultFilterValue: defaultRuntimeFilterValue } : {}),
        ...(selectedInitialInputValue !== null ? { defaultValueText: selectedInitialInputValue } : {}),`,
  );
  output = output.replace(
    `    }, [
      ${props.autoComplete.name},`,
    `    }, [
      children,
      ${props.autoComplete.name},`,
  );

  output = output.replace(
    `          const nextSelectedInputValue = getTextFromComboboxItem(details.item);
          if (nextSelectedInputValue !== null || nextValue === null) {
            setSelectedInputValue({ inputValue: nextSelectedInputValue, value: nextValue });
          }

          if (${props.value.name}Ref.current === undefined) {`,
    `          const nextRuntimeInputValue =
            ${props.inputValue.name}Ref.current === undefined ? instanceRef.current?.${facts.states.inputValue.getter}() : undefined;
          const nextSelectedInputValue =
            getTextFromComboboxItem(details.item) ??
            (nextValue === null ? null : findSelectedComboboxItemText(children, nextValue)) ??
            nextRuntimeInputValue ??
            null;
          if (nextSelectedInputValue !== null || nextValue === null) {
            setSelectedInputValue({
              inputValue: nextSelectedInputValue && nextSelectedInputValue.length > 0 ? nextSelectedInputValue : null,
              value: nextValue,
            });
          }

          if (${props.inputValue.name}Ref.current === undefined) {
            const nextInputValue = nextValue === null ? "" : (nextSelectedInputValue ?? nextRuntimeInputValue ?? "");
            if (nextRuntimeInputValue !== nextInputValue) {
              instanceRef.current?.${facts.setters.inputValue.method}(nextInputValue, {
                emit: false,
                filter: false,
              });
            }
            setUncontrolledInputValue(nextInputValue);
          }

          if (${props.value.name}Ref.current === undefined) {`,
  );

  output = output.replace(
    `    const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});
    const [uncontrolledInputValue, setUncontrolledInputValueState] = React.useState(${props.defaultInputValue.name}Ref.current);`,
    `    const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});
    const runtimeOptionsRef = React.useRef({
      ${props.filterMode.name},
      ${props.highlightItemOnHover.name},
      ${props.locale.name},
      ${props.modal.name},
      ${props.readOnly.name},
    });
    const [uncontrolledInputValue, setUncontrolledInputValueState] = React.useState(${props.defaultInputValue.name}Ref.current);`,
  );

  const openEffect = `    React.useEffect(() => {
      if ((${props.open.name}Ref.current ?? uncontrolledOpenRef.current) !== true) return;

      ensureInstance();
    }, [ensureInstance, ${props.open.name}, uncontrolledOpen]);`;
  output = output.replace(
    openEffect,
    `    React.useEffect(() => {
      const nextRuntimeOptions = {
        ${props.filterMode.name},
        ${props.highlightItemOnHover.name},
        ${props.locale.name},
        ${props.modal.name},
        ${props.readOnly.name},
      };
      const previousRuntimeOptions = runtimeOptionsRef.current;
      runtimeOptionsRef.current = nextRuntimeOptions;

      if (
        previousRuntimeOptions.${props.filterMode.name} === nextRuntimeOptions.${props.filterMode.name} &&
        previousRuntimeOptions.${props.highlightItemOnHover.name} === nextRuntimeOptions.${props.highlightItemOnHover.name} &&
        previousRuntimeOptions.${props.locale.name} === nextRuntimeOptions.${props.locale.name} &&
        previousRuntimeOptions.${props.modal.name} === nextRuntimeOptions.${props.modal.name} &&
        previousRuntimeOptions.${props.readOnly.name} === nextRuntimeOptions.${props.readOnly.name}
      ) {
        return;
      }

      const instance = instanceRef.current;
      if (!instance) return;

      instance.destroy();
      if (instanceRef.current === instance) {
        instanceRef.current = undefined;
      }
      if ((${props.open.name}Ref.current ?? uncontrolledOpenRef.current) === true) {
        ensureInstance();
      }
    }, [
      ensureInstance,
      ${props.filterMode.name},
      ${props.highlightItemOnHover.name},
      ${props.locale.name},
      ${props.modal.name},
      ${props.readOnly.name},
    ]);

${openEffect}`,
  );

  output = output.replace(
    `    React.useEffect(() => {
      return () => {
        instanceRef.current?.destroy();
        instanceRef.current = undefined;
      };
    }, []);`,
    `    React.useEffect(() => {
      const root = rootRef.current;
      if (!root) return;

      const handleProgrammaticValueCommand = (event: Event) => {
        if (!(event instanceof CustomEvent) || !event.detail || typeof event.detail !== "object") return;

        const detail = event.detail as { emit?: unknown; value?: unknown };
        if (!Object.hasOwn(detail, "value")) return;
        if (detail.value !== null && typeof detail.value !== "string") return;

        event.stopImmediatePropagation();

        const instance = ensureInstance();
        if (!instance) return;

        const nextValue = detail.value === "" ? null : detail.value;
        instance.${facts.setters.value.method}(nextValue, {
          emit: typeof detail.emit === "boolean" ? detail.emit : undefined,
        });

        if (${props.value.name}Ref.current === undefined) {
          setUncontrolledValue(nextValue);
        }

        if (${props.inputValue.name}Ref.current === undefined) {
          const nextInputValue =
            nextValue === null
              ? ""
              : findSelectedComboboxItemText(children, nextValue) ?? instance.${facts.states.inputValue.getter}();
          instance.${facts.setters.inputValue.method}(nextInputValue, {
            emit: false,
            filter: false,
          });
          setUncontrolledInputValue(nextInputValue);
          setSelectedInputValue({ inputValue: nextInputValue || null, value: nextValue });
        }
      };

      root.addEventListener("starwind:set-value", handleProgrammaticValueCommand, {
        capture: true,
      });

      return () => {
        root.removeEventListener("starwind:set-value", handleProgrammaticValueCommand, {
          capture: true,
        });
      };
    }, [children, ensureInstance, setUncontrolledInputValue, setUncontrolledValue]);

    React.useEffect(() => {
      return () => {
        instanceRef.current?.destroy();
        instanceRef.current = undefined;
      };
    }, []);`,
  );

  output = output.replace(
    `    const renderedInputValue =
      ${props.inputValue.name} !== undefined
        ? ${props.inputValue.name}
        : uncontrolledInputValue !== undefined
          ? uncontrolledInputValue
          : selectedInputValue.value === selectedValue
            ? (selectedInputValue.inputValue ?? "")
            : "";`,
    `    const selectedText =
      selectedInputValue.value === selectedValue ? selectedInputValue.inputValue : null;
    const renderedInputValue =
      ${props.inputValue.name} !== undefined
        ? ${props.inputValue.name}
        : uncontrolledInputValue !== undefined
          ? uncontrolledInputValue
          : selectedText ?? "";`,
  );

  output = output.replace(
    `        ${props.required.name}: ${props.required.name},
        value: selectedValue,`,
    `        ${props.required.name}: ${props.required.name},
        selectedText,
        value: selectedValue,`,
  );
  output = output.replace(
    `        ${props.required.name},
        selectedValue,`,
    `        ${props.required.name},
        selectedText,
        selectedValue,`,
  );
  output = output.replace(
    `          ${facts.attrs.required}={${props.required.name} ? "" : undefined}
          data-state={renderedOpen ? "open" : "closed"}`,
    `          ${facts.attrs.required}={${props.required.name} ? "" : undefined}
          data-value={selectedValue ?? undefined}
          data-state={renderedOpen ? "open" : "closed"}`,
  );

  return output;
}

function printValueWithContext(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.value;
  const props = facts.props;
  const context = facts.context;

  return `import * as React from "react";\n\nimport { ${context.useRootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLSpanElement> & {\n  ${props.placeholder.name}?: ${props.placeholder.type};\n};\n\nconst ${component} = React.forwardRef<HTMLSpanElement, ${component}Props>(\n  function ${component}({ ${props.placeholder.name}, children, ...props }, forwardedRef) {\n    const combobox = ${context.useRootContext}();\n    const selectedText = combobox.selectedText ?? "";\n    const displayedChildren = children ?? (selectedText.length > 0 ? selectedText : ${props.placeholder.name});\n\n    return (\n      <${facts.parts.value.defaultElement}\n        ${facts.attrs.value}\n        data-placeholder={${props.placeholder.name}}\n        ref={forwardedRef}\n        {...props}\n      >\n        {displayedChildren}\n      </${facts.parts.value.defaultElement}>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Value";\n\nexport default ${component};\n`;
}

function printAsChildButtonWithContext(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: "clear" | "trigger",
): string {
  const component = facts.exports[partName];
  const props = facts.props;
  const part = facts.parts[partName];
  const context = facts.context;
  const protectedPropsName = `protected${partName[0].toUpperCase()}${partName.slice(1)}Props`;
  const partPropsName = `${partName}Props`;
  const triggerProps =
    partName === "trigger"
      ? `      "aria-haspopup": "${facts.popupRole}",\n      "aria-expanded": combobox.open ? "true" : "false",\n      "data-state": combobox.open ? "open" : "closed",\n`
      : "";

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nimport { ${context.useRootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${component} = React.forwardRef<HTMLElement, ${component}Props>(\n  function ${component}({ ${props.asChild.name} = ${getDefault(props.asChild, "false")}, children, className, ...props }, forwardedRef) {\n    const combobox = ${context.useRootContext}();\n    const ${protectedPropsName} = {\n      ${JSON.stringify(part.discoveryAttribute)}: "",\n      "aria-disabled": combobox.disabled ? "true" : undefined,\n      "aria-readonly": combobox.readOnly ? "true" : undefined,\n      "data-disabled": combobox.disabled ? "" : undefined,\n      "data-readonly": combobox.readOnly ? "" : undefined,\n${triggerProps}      disabled: combobox.disabled || undefined,\n    } satisfies React.HTMLAttributes<HTMLElement> & { disabled?: boolean } & Record<\`data-\${string}\`, string | undefined>;\n    const ${partPropsName} = {\n      ...${protectedPropsName},\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & { disabled?: boolean } & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: protectedPropsName,
      propsExpression: partPropsName,
    },
  )}\n\n    return (\n      <${part.defaultElement}\n        type="${facts.clearAction.typeAttribute.value}"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(${partPropsName} as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n        disabled={combobox.disabled}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printPopupWithLazyChildren(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.popup;
  const props = facts.props;
  const part = facts.parts.popup;
  const context = facts.context;

  return `import * as React from "react";\nimport { useComposedRefs } from "../internal/compose-refs";\nimport { useClosePresence } from "../internal/use-close-presence";\n\nimport { ${context.useRootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  keepMounted?: boolean;\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}(\n    {\n      ${props.align.name} = ${facts.floating.alignDefault},\n      ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n      ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n      keepMounted = false,\n      ${props.side.name} = ${facts.floating.sideDefault},\n      ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const combobox = ${context.useRootContext}();\n    const closePresence = useClosePresence<HTMLDivElement>({\n      keepMounted,\n      open: combobox.open,\n    });\n    const composedRef = useComposedRefs(forwardedRef, closePresence.ref);\n\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n        role="${facts.popupRole}"\n        tabIndex={-1}\n        data-state={combobox.open ? "open" : "closed"}\n        ${facts.attrs.side}={${props.side.name}}\n        ${facts.attrs.align}={${props.align.name}}\n        ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n        ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n        ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}\n        hidden={closePresence.hidden}\n        ref={composedRef}\n        {...props}\n      >\n        {closePresence.present ? props.children : null}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printItemWithContext(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.item;
  const props = facts.props;
  const context = facts.context;

  return `import * as React from "react";\n\nimport { ${context.itemContext}, ${context.useRootContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "role"> & {\n  ${props.itemDisabled.name}?: ${props.itemDisabled.type};\n  ${props.itemValue.name}: ${props.itemValue.type};\n};\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}({ ${props.itemDisabled.name} = ${getDefault(props.itemDisabled, "false")}, ${props.itemValue.name}, ...props }, forwardedRef) {\n    const combobox = ${context.useRootContext}();\n    const selected = combobox.value === ${props.itemValue.name};\n    const itemContextValue = React.useMemo(() => ({ value: ${props.itemValue.name} }), [${props.itemValue.name}]);\n\n    return (\n      <${context.itemContext}.Provider value={itemContextValue}>\n        <${facts.parts.item.defaultElement}\n          ${facts.attrs.item}\n          ${facts.attrs.valueData}={${props.itemValue.name}}\n          role="${facts.collection.item.role}"\n          aria-selected={selected}\n          ${facts.collection.item.disabled.ariaAttribute}={${props.itemDisabled.name} || undefined}\n          ${facts.attrs.disabled}={${props.itemDisabled.name} ? "" : undefined}\n          data-selected={selected ? "" : undefined}\n          tabIndex={${facts.collection.item.initialProjection.tabIndex}}\n          ref={forwardedRef}\n          {...props}\n        />\n      </${context.itemContext}.Provider>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Item";\n\nexport default ${component};\n`;
}

function printItemIndicatorWithContext(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.itemIndicator;
  const context = facts.context;

  return `import * as React from "react";\n\nimport { ${context.useRootContext}, ${context.useItemContext} } from "./${context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLSpanElement>;\n\nconst ${component} = React.forwardRef<HTMLSpanElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    const combobox = ${context.useRootContext}();\n    const item = ${context.useItemContext}();\n    const selected = combobox.value === item.value;\n\n    return (\n      <${facts.parts.itemIndicator.defaultElement}\n        ${facts.attrs.itemIndicator}\n        aria-hidden="true"\n        ${facts.collection.itemIndicator.selectedStateAttribute}={selected ? "checked" : "unchecked"}\n        data-visible={selected ? "" : undefined}\n        data-hidden={selected ? undefined : ""}\n        hidden={!selected}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.ItemIndicator";\n\nexport default ${component};\n`;
}

function printInput(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.input;

  return `import * as React from "react";\n\nexport type ${component}Props = React.InputHTMLAttributes<HTMLInputElement>;\n\nconst ${component} = React.forwardRef<HTMLInputElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <${facts.parts.input.defaultElement}\n        ${facts.attrs.input}\n        role="${facts.inputSemantics.role}"\n        aria-autocomplete="${facts.inputSemantics.ariaAutocomplete}"\n        aria-expanded="false"\n        autoComplete="${facts.inputSemantics.autocomplete}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Input";\n\nexport default ${component};\n`;
}

function printAsChildButton(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: "clear" | "trigger",
): string {
  const component = facts.exports[partName];
  const props = facts.props;
  const part = facts.parts[partName];
  const protectedPropsName = `protected${partName[0].toUpperCase()}${partName.slice(1)}Props`;
  const partPropsName = `${partName}Props`;
  const triggerProps =
    partName === "trigger"
      ? `      "aria-haspopup": "${facts.popupRole}",\n      "aria-expanded": "false",\n      "data-state": "closed",\n`
      : "";

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nexport type ${component}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${component} = React.forwardRef<HTMLElement, ${component}Props>(\n  function ${component}({ ${props.asChild.name} = ${getDefault(props.asChild, "false")}, children, className, ...props }, forwardedRef) {\n    const ${protectedPropsName} = {\n      ${JSON.stringify(part.discoveryAttribute)}: "",\n${triggerProps}    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n    const ${partPropsName} = {\n      ...${protectedPropsName},\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: protectedPropsName,
      propsExpression: partPropsName,
    },
  )}\n\n    return (\n      <${part.defaultElement}\n        type="${facts.clearAction.typeAttribute.value}"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(${partPropsName} as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n      >\n        {children}\n      </${part.defaultElement}>\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printValue(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.value;
  const props = facts.props;

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLSpanElement> & {\n  ${props.placeholder.name}?: ${props.placeholder.type};\n};\n\nconst ${component} = React.forwardRef<HTMLSpanElement, ${component}Props>(\n  function ${component}({ ${props.placeholder.name}, ...props }, forwardedRef) {\n    return <${facts.parts.value.defaultElement} ${facts.attrs.value} data-placeholder={${props.placeholder.name}} ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Value";\n\nexport default ${component};\n`;
}

function printFloatingPart(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: "popup" | "positioner",
): string {
  const component = facts.exports[partName];
  const props = facts.props;
  const part = facts.parts[partName];
  const roleAttribute =
    partName === "popup" ? `        role="${facts.popupRole}"\n        tabIndex={-1}\n` : "";
  const hiddenAttribute = partName === "popup" ? "        hidden\n" : "";

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}(\n    {\n      ${props.align.name} = ${facts.floating.alignDefault},\n      ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n      ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n      ${props.side.name} = ${facts.floating.sideDefault},\n      ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    return (\n      <${part.defaultElement}\n        ${part.discoveryAttribute}\n${roleAttribute}        data-state="closed"\n        ${facts.attrs.side}={${props.side.name}}\n        ${facts.attrs.align}={${props.align.name}}\n        ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n        ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n        ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}\n${hiddenAttribute}        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function printItem(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.item;
  const props = facts.props;

  return `import * as React from "react";\n\nexport type ${component}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "role"> & {\n  ${props.itemDisabled.name}?: ${props.itemDisabled.type};\n  ${props.itemValue.name}: ${props.itemValue.type};\n};\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}({ ${props.itemDisabled.name} = ${getDefault(props.itemDisabled, "false")}, ${props.itemValue.name}, ...props }, forwardedRef) {\n    return (\n      <${facts.parts.item.defaultElement}\n        ${facts.attrs.item}\n        ${facts.attrs.valueData}={${props.itemValue.name}}\n        role="${facts.collection.item.role}"\n        aria-selected="${facts.collection.item.initialProjection.ariaSelected}"\n        ${facts.collection.item.disabled.ariaAttribute}={${props.itemDisabled.name} || undefined}\n        ${facts.attrs.disabled}={${props.itemDisabled.name} ? "" : undefined}\n        tabIndex={${facts.collection.item.initialProjection.tabIndex}}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Item";\n\nexport default ${component};\n`;
}

function printItemIndicator(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.itemIndicator;

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLSpanElement>;\n\nconst ${component} = React.forwardRef<HTMLSpanElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <${facts.parts.itemIndicator.defaultElement}\n        ${facts.attrs.itemIndicator}\n        aria-hidden="true"\n        ${facts.collection.itemIndicator.selectedStateAttribute}="${facts.collection.itemIndicator.initialState}"\n        ${facts.collection.itemIndicator.dataHiddenAttribute}=""\n        ${facts.collection.itemIndicator.hiddenAttribute}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.ItemIndicator";\n\nexport default ${component};\n`;
}

function printSeparator(facts: AdapterEditableCollectionOverlayFacts): string {
  const component = facts.exports.separator;

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${component} = React.forwardRef<HTMLDivElement, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return (\n      <${facts.parts.separator.defaultElement}\n        ${facts.attrs.separator}\n        role="${facts.collection.separator.role}"\n        aria-orientation="${facts.collection.separator.ariaOrientation}"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${component}.displayName = "${facts.displayName}.Separator";\n\nexport default ${component};\n`;
}

function printSimplePart(
  facts: AdapterEditableCollectionOverlayFacts,
  partName: Exclude<
    AdapterEditableCollectionOverlayPartName,
    | "clear"
    | "input"
    | "item"
    | "itemIndicator"
    | "popup"
    | "positioner"
    | "root"
    | "separator"
    | "trigger"
    | "value"
  >,
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const component = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const extra = extraAttributes ? ` ${extraAttributes}` : "";

  return `import * as React from "react";\n\nexport type ${component}Props = React.HTMLAttributes<${elementType}>;\n\nconst ${component} = React.forwardRef<${elementType}, ${component}Props>(\n  function ${component}(props, forwardedRef) {\n    return <${part.defaultElement} ${part.discoveryAttribute}${extra} ref={forwardedRef} {...props} />;\n  },\n);\n\n${component}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${component};\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function printRuntimeTypeExport(facts: AdapterEditableCollectionOverlayFacts): string {
  if (!facts.index.typeExportSource || !facts.index.typeExports?.length) return "";

  return `\nexport type {\n${facts.index.typeExports.map((typeName) => `  ${typeName},`).join("\n")}\n} from "${facts.index.typeExportSource}";\n`;
}

function formatOptions(
  options: Readonly<Record<string, boolean | number | string>> | undefined,
): string {
  if (!options || Object.keys(options).length === 0) return "{ emit: false }";

  return `{ ${Object.entries(options)
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ")} }`;
}

function renderObjectShorthand(properties: string[]): string {
  if (properties.length === 0) {
    throw new Error("Editable collection overlay facts require form setter props.");
  }

  return `{ ${properties.join(", ")} }`;
}

function renderDependencyList(dependencies: string[]): string {
  if (dependencies.length === 0) {
    throw new Error("Editable collection overlay facts require form setter dependencies.");
  }

  return `[${dependencies.join(", ")}]`;
}

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    div: "HTMLDivElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}

function printSetRef(): string {
  return `function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}`;
}
