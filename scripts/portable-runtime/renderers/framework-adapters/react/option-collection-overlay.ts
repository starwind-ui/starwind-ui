import type {
  AdapterOptionCollectionOverlayComponentProjection,
  AdapterOptionCollectionOverlayFacts,
  AdapterOptionCollectionOverlayHelperProjection,
  AdapterOptionCollectionOverlayIndexProjection,
  AdapterOptionCollectionOverlayPartName,
} from "../types.js";
import {
  renderReactAsChildCloneBranch,
  renderReactAsChildImports,
  renderReactAsChildSetup,
} from "./as-child-trigger-fragments.js";

export function printReactOptionCollectionOverlayComponent(
  family: AdapterOptionCollectionOverlayComponentProjection,
): string {
  const facts = family.facts;

  if (family.part === "root") return printRootWithLazyClosedContentSupport(facts);
  if (family.part === "trigger") return printTrigger(facts);
  if (family.part === "value") return printValueWithSelectedLabel(facts);
  if (family.part === "positioner") return printPositioner(facts);
  if (family.part === "popup") return printPopupWithLazyChildren(facts);
  if (family.part === "item") return printItem(facts);
  if (family.part === "itemIndicator") return printItemIndicator(facts);
  if (family.part === "separator") return printSeparator(facts);
  if (family.part === "icon") return printSimplePart(facts, family.part, 'aria-hidden="true"');
  if (family.part === "group") return printSimplePart(facts, family.part, 'role="group"');
  if (family.part === "scrollUpArrow" || family.part === "scrollDownArrow") {
    return printSimplePart(facts, family.part, 'aria-hidden="true"');
  }

  return printSimplePart(facts, family.part);
}

export function printReactOptionCollectionOverlayHelper(
  family: AdapterOptionCollectionOverlayHelperProjection,
): string {
  const facts = family.facts;
  const context = facts.context;

  return `import * as React from "react";\n\nexport type ${context.rootContextValueType} = {\n  disabled: boolean;\n  open: ${facts.props.open.type};\n  readOnly: boolean;\n  required: boolean;\n  value: ${facts.props.value.type};\n  selectedLabel: string | null;\n};\n\nexport type ${context.itemContextValueType} = {\n  value: string;\n};\n\nconst fallback${context.rootContext}: ${context.rootContextValueType} = {\n  disabled: false,\n  open: false,\n  readOnly: false,\n  required: false,\n  value: null,\n  selectedLabel: null,\n};\n\nconst fallback${context.itemContext}: ${context.itemContextValueType} = {\n  value: "",\n};\n\nexport const ${context.rootContext} = React.createContext<${context.rootContextValueType} | null>(null);\nexport const ${context.itemContext} = React.createContext<${context.itemContextValueType} | null>(null);\n\nexport function ${context.useRootContext}(): ${context.rootContextValueType} {\n  return React.useContext(${context.rootContext}) ?? fallback${context.rootContext};\n}\n\nexport function ${context.useItemContext}(): ${context.itemContextValueType} {\n  return React.useContext(${context.itemContext}) ?? fallback${context.itemContext};\n}\n`;
}

export function printReactOptionCollectionOverlayIndex(
  family: AdapterOptionCollectionOverlayIndexProjection,
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
  ];
  const typeExports = `export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";`;

  return `${imports}\n\n${contextExport}\n\nconst ${facts.exports.namespace} = {\n${namespaceEntries}\n};\n\nexport {\n  ${namedExports.join(",\n  ")},\n};\n\nexport default ${facts.exports.namespace};\n\n${typeExports}\n`;
}

function printRootWithLazyClosedContentSupport(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const root = facts.exports.root;
  const openEvent = facts.events.openChange;
  const valueEvent = facts.events.valueChange;

  return `import {
  ${facts.runtime.factory},
  type ${openEvent.detailsType},
  type ${valueEvent.detailsType},
} from "${facts.runtime.importSource}";
import * as React from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";

import { ${facts.context.rootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";

export type ${root}Props = Omit<
  React.HTMLAttributes<HTMLDivElement>,
  "${props.defaultValue.name}" | "onChange"
> & {
  ${props.autoComplete.name}?: ${props.autoComplete.type};
  ${props.defaultOpen.name}?: ${props.defaultOpen.type};
  ${props.defaultValue.name}?: ${props.defaultValue.type};
  ${props.disabled.name}?: ${props.disabled.type};
  ${props.form.name}?: ${props.form.type};
  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};
  ${props.modal.name}?: ${props.modal.type};
  ${props.name.name}?: ${props.name.type};
  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;
  ${valueEvent.callbackProp}?: (${valueEvent.valueProperty}: ${valueEvent.valueType}, details: ${valueEvent.detailsType}) => void;
  ${props.open.name}?: ${props.open.type};
  ${props.readOnly.name}?: ${props.readOnly.type};
  ${props.required.name}?: ${props.required.type};
  ${props.value.name}?: ${props.value.type};
};

const ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(
  {
    ${props.autoComplete.name},
    ${props.defaultOpen.name} = ${facts.state.open.defaultValue},
    ${props.defaultValue.name},
    ${props.disabled.name} = ${getDefault(props.disabled, "false")},
    ${props.form.name},
    ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},
    ${props.modal.name} = ${getDefault(props.modal, "true")},
    ${props.name.name},
    ${openEvent.callbackProp},
    ${valueEvent.callbackProp},
    ${props.open.name},
    ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},
    ${props.required.name} = ${getDefault(props.required, "false")},
    ${props.value.name},
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);
  const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});
  const ${valueEvent.callbackProp}Ref = React.useRef(${valueEvent.callbackProp});
  const ${props.open.name}Ref = React.useRef(${props.open.name});
  const ${props.value.name}Ref = React.useRef(${props.value.name});
  const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});
  const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});
  const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);
  const [uncontrolledValue, setUncontrolledValueState] = React.useState(${props.defaultValue.name}Ref.current);
  const uncontrolledOpenRef = React.useRef(uncontrolledOpen);
  const uncontrolledValueRef = React.useRef(uncontrolledValue);

  const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {
    uncontrolledOpenRef.current = nextOpen;
    setUncontrolledOpenState(nextOpen);
  }, []);

  const setUncontrolledValue = React.useCallback((nextValue: ${props.value.type}) => {
    uncontrolledValueRef.current = nextValue;
    setUncontrolledValueState(nextValue);
  }, []);

  useIsomorphicLayoutEffect(() => {
    ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};
  }, [${openEvent.callbackProp}]);

  useIsomorphicLayoutEffect(() => {
    ${valueEvent.callbackProp}Ref.current = ${valueEvent.callbackProp};
  }, [${valueEvent.callbackProp}]);

  useIsomorphicLayoutEffect(() => {
    ${props.open.name}Ref.current = ${props.open.name};
  }, [${props.open.name}]);

  useIsomorphicLayoutEffect(() => {
    ${props.value.name}Ref.current = ${props.value.name};
  }, [${props.value.name}]);

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      setRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  const ensureInstance = React.useCallback(() => {
    const existing = instanceRef.current;
    if (existing) return existing;

    const root = rootRef.current;
    if (!root) return undefined;

    const instance = ${facts.runtime.factory}(root, {
      ${props.defaultOpen.name}: uncontrolledOpenRef.current,
      ${props.defaultValue.name}: uncontrolledValueRef.current,
      ${props.disabled.name},
      ${props.autoComplete.name},
      ${props.form.name},
      ${props.highlightItemOnHover.name},
      ${props.modal.name},
      ${openEvent.callbackProp}: (nextOpen, details) => {
        ${openEvent.callbackProp}Ref.current?.(nextOpen, details);
        if (details.isCanceled) return;

        if (${props.open.name}Ref.current === undefined) {
          setUncontrolledOpen(nextOpen);
        }
      },
      ${valueEvent.callbackProp}: (nextValue, details) => {
        ${valueEvent.callbackProp}Ref.current?.(nextValue, details);
        if (details.isCanceled) return;

        const nextSelectedLabel = getTextFromSelectItem(details.item);
        if (nextSelectedLabel !== null || nextValue === null) {
          setSelectedLabel({ label: nextSelectedLabel, value: nextValue });
        }

        if (${props.value.name}Ref.current === undefined) {
          setUncontrolledValue(nextValue);
        }
      },
      ${props.name.name},
      ${props.readOnly.name},
      ${props.required.name},
      ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),
      ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),
    });
    instanceRef.current = instance;
    return instance;
  }, [
    ${props.autoComplete.name},
    ${props.disabled.name},
    ${props.form.name},
    ${props.highlightItemOnHover.name},
    ${props.modal.name},
    ${props.name.name},
    ${props.readOnly.name},
    ${props.required.name},
    setUncontrolledOpen,
    setUncontrolledValue,
  ]);

  useIsomorphicLayoutEffect(() => {
    return () => {
      instanceRef.current?.destroy();
      instanceRef.current = undefined;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if ((${props.open.name}Ref.current ?? uncontrolledOpenRef.current) !== true) return;

    ensureInstance();
  }, [ensureInstance, ${props.open.name}, uncontrolledOpen]);

  useIsomorphicLayoutEffect(() => {
    instanceRef.current?.setFormOptions({ ${props.autoComplete.name}, ${props.form.name}, ${props.name.name}, ${props.required.name} });
  }, [${props.autoComplete.name}, ${props.form.name}, ${props.name.name}, ${props.required.name}]);

  useIsomorphicLayoutEffect(() => {
    instanceRef.current?.setDisabled(${props.disabled.name});
  }, [${props.disabled.name}]);

  useIsomorphicLayoutEffect(() => {
    instanceRef.current?.setReadOnly(${props.readOnly.name});
  }, [${props.readOnly.name}]);

  useIsomorphicLayoutEffect(() => {
    instanceRef.current?.setModal(${props.modal.name});
  }, [${props.modal.name}]);

  useIsomorphicLayoutEffect(() => {
    instanceRef.current?.setHighlightItemOnHover(${props.highlightItemOnHover.name});
  }, [${props.highlightItemOnHover.name}]);

  useIsomorphicLayoutEffect(() => {
    if (${props.open.name} === undefined) return;
    const instance = ${props.open.name} ? ensureInstance() : instanceRef.current;
    if (!instance) return;
    if (instance.${facts.state.open.getter}() === ${props.open.name}) return;

    instance.${facts.state.open.setter}(${props.open.name}, { emit: false });
  }, [ensureInstance, ${props.open.name}]);

  useIsomorphicLayoutEffect(() => {
    if (${props.value.name} === undefined) return;
    const instance = instanceRef.current;
    if (!instance) return;
    if (instance.${facts.state.value.getter}() === ${props.value.name}) return;

    instance.${facts.state.value.setter}(${props.value.name}, { emit: false });
  }, [${props.value.name}]);

  const renderedOpen = ${props.open.name} ?? uncontrolledOpen;
  const selectedValue = ${props.value.name} !== undefined ? ${props.value.name} : (uncontrolledValue ?? null);
  const renderedValue = selectedValue ?? "";
  const [selectedLabel, setSelectedLabel] = React.useState<{
    label: string | null;
    value: string | null;
  }>(() => ({ label: null, value: null }));
  React.useEffect(/* @starwind-passive-effect */ () => {
    const timer = window.setTimeout(() => {
      setSelectedLabel({
        label: findSelectedOptionText(children, selectedValue),
        value: selectedValue,
      });
    }, 0);

    return () => window.clearTimeout(timer);
  }, [children, selectedValue]);
  const renderedSelectedLabel =
    selectedLabel.value === selectedValue ? selectedLabel.label : null;
  const initializeFromTriggerEvent = React.useCallback(
    (event: React.SyntheticEvent<HTMLDivElement>) => {
      if (${props.disabled.name}) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (!target.closest("[${facts.attrs.trigger}]")) return;

      ensureInstance();
    },
    [ensureInstance, ${props.disabled.name}],
  );
  const contextValue = React.useMemo(
    () => ({
      disabled: ${props.disabled.name},
      open: renderedOpen,
      readOnly: ${props.readOnly.name},
      required: ${props.required.name},
      value: selectedValue,
      selectedLabel: renderedSelectedLabel,
    }),
    [
      ${props.disabled.name},
      renderedOpen,
      ${props.readOnly.name},
      ${props.required.name},
      selectedValue,
      renderedSelectedLabel,
    ],
  );

  return (
    <${facts.context.rootContext}.Provider value={contextValue}>
      <div
        ${facts.attrs.root}
        ${facts.attrs.autoComplete}={${props.autoComplete.name}}
        ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}
        ${facts.attrs.defaultValue}={${props.defaultValue.name}Ref.current ?? undefined}
        ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}
        ${facts.attrs.form}={${props.form.name}}
        ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}
        ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}
        ${facts.attrs.name}={${props.name.name}}
        ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}
        ${facts.attrs.required}={${props.required.name} ? "" : undefined}
        data-value={selectedValue ?? undefined}
        data-placeholder={selectedValue === null ? "" : undefined}
        data-selected-value={renderedSelectedLabel !== null && selectedValue !== null ? selectedValue : undefined}
        data-selected-label={renderedSelectedLabel ?? undefined}
        data-state={renderedOpen ? "open" : "closed"}
        ref={composedRef}
        {...props}
        onClickCapture={(event) => {
          props.onClickCapture?.(event);
          if (!event.defaultPrevented) initializeFromTriggerEvent(event);
        }}
        onFocusCapture={(event) => {
          props.onFocusCapture?.(event);
          if (!event.defaultPrevented) initializeFromTriggerEvent(event);
        }}
        onKeyDownCapture={(event) => {
          props.onKeyDownCapture?.(event);
          if (!event.defaultPrevented) initializeFromTriggerEvent(event);
        }}
        onPointerDownCapture={(event) => {
          props.onPointerDownCapture?.(event);
          if (!event.defaultPrevented) initializeFromTriggerEvent(event);
        }}
      >
        <input
          ${facts.attrs.input}
          type="hidden"
          autoComplete={${props.autoComplete.name}}
          form={${props.form.name}}
          name={${props.name.name}}
          disabled={${props.disabled.name}}
          required={${props.required.name}}
          value={renderedValue}
          aria-hidden="true"
          tabIndex={-1}
          readOnly
        />
        {children}
      </div>
    </${facts.context.rootContext}.Provider>
  );
});

${root}.displayName = "${facts.displayName}.Root";

export default ${root};

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (!ref) return;

  if (typeof ref === "function") {
    ref(value);
    return;
  }

  ref.current = value;
}

function findSelectedOptionText(
  children: React.ReactNode,
  selectedValue: string | null,
): string | null {
  if (selectedValue === null) return null;

  let selectedText: string | null = null;

  const visit = (node: React.ReactNode): void => {
    if (selectedText !== null) return;

    React.Children.forEach(node, (child) => {
      if (selectedText !== null || !React.isValidElement(child)) return;

      const childProps = child.props as {
        children?: React.ReactNode;
        label?: unknown;
        textValue?: unknown;
        value?: unknown;
        "aria-label"?: unknown;
      };
      if (childProps.value === selectedValue) {
        selectedText = getSelectedOptionTextFromProps(childProps);
        return;
      }

      visit(childProps.children);
    });
  };

  visit(children);
  return selectedText;
}

function getSelectedOptionTextFromProps(props: {
  children?: React.ReactNode;
  label?: unknown;
  textValue?: unknown;
  "aria-label"?: unknown;
}): string | null {
  const explicitText =
    getStringPropText(props.textValue) ??
    getStringPropText(props.label) ??
    getStringPropText(props["aria-label"]);
  if (explicitText !== null) return explicitText;

  const childText =
    getSelectItemTextFromReactNode(props.children) ?? getTextFromReactNode(props.children).trim();
  return childText.length > 0 ? childText : null;
}

function getSelectItemTextFromReactNode(node: React.ReactNode): string | null {
  let selectedText: string | null = null;

  const visit = (candidate: React.ReactNode): void => {
    if (selectedText !== null) return;

    React.Children.forEach(candidate, (child) => {
      if (selectedText !== null || !React.isValidElement(child)) return;

      const childProps = child.props as {
        children?: React.ReactNode;
        ${JSON.stringify(facts.attrs.itemText)}?: unknown;
      };
      if (isSelectItemTextElement(child)) {
        const text = getTextFromReactNode(childProps.children).trim();
        selectedText = text.length > 0 ? text : null;
        return;
      }

      visit(childProps.children);
    });
  };

  visit(node);
  return selectedText;
}

function getStringPropText(value: unknown): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;

  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function isSelectItemTextElement(node: React.ReactElement): boolean {
  const props = node.props as { ${JSON.stringify(facts.attrs.itemText)}?: unknown };
  if (props[${JSON.stringify(facts.attrs.itemText)}] !== undefined) return true;

  const displayName = getReactComponentDisplayName(node.type);
  return displayName === "Select.ItemText" || displayName === "SelectItemText";
}

function getReactComponentDisplayName(type: unknown): string | null {
  if (typeof type === "string") return null;
  if (typeof type !== "function" && (typeof type !== "object" || type === null)) return null;

  const candidate = type as { displayName?: string; name?: string };
  return candidate.displayName ?? candidate.name ?? null;
}

function getTextFromReactNode(node: React.ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (!React.isValidElement(node)) {
    let text = "";
    React.Children.forEach(node, (child) => {
      text += getTextFromReactNode(child);
    });
    return text;
  }

  return getTextFromReactNode((node.props as { children?: React.ReactNode }).children);
}

function getTextFromSelectItem(item: HTMLElement | undefined): string | null {
  if (!item) return null;

  const textElement = item.querySelector<HTMLElement>("[${facts.attrs.itemText}]");
  const text = (textElement ?? item).textContent?.trim() ?? "";
  return text.length > 0 ? text : null;
}
`;
}

function printRoot(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const root = facts.exports.root;
  const openEvent = facts.events.openChange;
  const valueEvent = facts.events.valueChange;

  return `import {\n  ${facts.runtime.factory},\n  type ${openEvent.detailsType},\n  type ${valueEvent.detailsType},\n} from "${facts.runtime.importSource}";\nimport * as React from "react";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n\nimport { ${facts.context.rootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${root}Props = Omit<\n  React.HTMLAttributes<HTMLDivElement>,\n  "${props.defaultValue.name}" | "onChange"\n> & {\n  ${props.autoComplete.name}?: ${props.autoComplete.type};\n  ${props.defaultOpen.name}?: ${props.defaultOpen.type};\n  ${props.defaultValue.name}?: ${props.defaultValue.type};\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.form.name}?: ${props.form.type};\n  ${props.highlightItemOnHover.name}?: ${props.highlightItemOnHover.type};\n  ${props.modal.name}?: ${props.modal.type};\n  ${props.name.name}?: ${props.name.type};\n  ${openEvent.callbackProp}?: (${openEvent.valueProperty}: ${openEvent.valueType}, details: ${openEvent.detailsType}) => void;\n  ${valueEvent.callbackProp}?: (${valueEvent.valueProperty}: ${valueEvent.valueType}, details: ${valueEvent.detailsType}) => void;\n  ${props.open.name}?: ${props.open.type};\n  ${props.readOnly.name}?: ${props.readOnly.type};\n  ${props.required.name}?: ${props.required.type};\n  ${props.value.name}?: ${props.value.type};\n};\n\nconst ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(\n  {\n    ${props.autoComplete.name},\n    ${props.defaultOpen.name} = ${facts.state.open.defaultValue},\n    ${props.defaultValue.name},\n    ${props.disabled.name} = ${getDefault(props.disabled, "false")},\n    ${props.form.name},\n    ${props.highlightItemOnHover.name} = ${getDefault(props.highlightItemOnHover, "true")},\n    ${props.modal.name} = ${getDefault(props.modal, "true")},\n    ${props.name.name},\n    ${openEvent.callbackProp},\n    ${valueEvent.callbackProp},\n    ${props.open.name},\n    ${props.readOnly.name} = ${getDefault(props.readOnly, "false")},\n    ${props.required.name} = ${getDefault(props.required, "false")},\n    ${props.value.name},\n    children,\n    ...props\n  },\n  forwardedRef,\n) {\n  const rootRef = React.useRef<HTMLDivElement>(null);\n  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);\n  const ${openEvent.callbackProp}Ref = React.useRef(${openEvent.callbackProp});\n  const ${valueEvent.callbackProp}Ref = React.useRef(${valueEvent.callbackProp});\n  const ${props.open.name}Ref = React.useRef(${props.open.name});\n  const ${props.value.name}Ref = React.useRef(${props.value.name});\n  const ${props.defaultOpen.name}Ref = React.useRef(${props.defaultOpen.name});\n  const ${props.defaultValue.name}Ref = React.useRef(${props.defaultValue.name});\n  const [uncontrolledOpen, setUncontrolledOpenState] = React.useState(${props.defaultOpen.name}Ref.current);\n  const [uncontrolledValue, setUncontrolledValueState] = React.useState(${props.defaultValue.name}Ref.current);\n  const uncontrolledOpenRef = React.useRef(uncontrolledOpen);\n  const uncontrolledValueRef = React.useRef(uncontrolledValue);\n\n  const setUncontrolledOpen = React.useCallback((nextOpen: ${props.open.type}) => {\n    uncontrolledOpenRef.current = nextOpen;\n    setUncontrolledOpenState(nextOpen);\n  }, []);\n\n  const setUncontrolledValue = React.useCallback((nextValue: ${props.value.type}) => {\n    uncontrolledValueRef.current = nextValue;\n    setUncontrolledValueState(nextValue);\n  }, []);\n\n  useIsomorphicLayoutEffect(() => {\n    ${openEvent.callbackProp}Ref.current = ${openEvent.callbackProp};\n  }, [${openEvent.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${valueEvent.callbackProp}Ref.current = ${valueEvent.callbackProp};\n  }, [${valueEvent.callbackProp}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.open.name}Ref.current = ${props.open.name};\n  }, [${props.open.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    ${props.value.name}Ref.current = ${props.value.name};\n  }, [${props.value.name}]);\n\n  const composedRef = React.useCallback(\n    (node: HTMLDivElement | null) => {\n      rootRef.current = node;\n      setRef(forwardedRef, node);\n    },\n    [forwardedRef],\n  );\n\n  useIsomorphicLayoutEffect(() => {\n    const root = rootRef.current;\n    if (!root) return;\n\n    const instance = ${facts.runtime.factory}(root, {\n      ${props.defaultOpen.name}: uncontrolledOpenRef.current,\n      ${props.defaultValue.name}: uncontrolledValueRef.current,\n      ${props.disabled.name},\n      ${props.autoComplete.name},\n      ${props.form.name},\n      ${props.highlightItemOnHover.name},\n      ${props.modal.name},\n      ${openEvent.callbackProp}: (nextOpen, details) => {\n        ${openEvent.callbackProp}Ref.current?.(nextOpen, details);\n        if (details.isCanceled) return;\n\n        if (${props.open.name}Ref.current === undefined) {\n          setUncontrolledOpen(nextOpen);\n        }\n      },\n      ${valueEvent.callbackProp}: (nextValue, details) => {\n        ${valueEvent.callbackProp}Ref.current?.(nextValue, details);\n        if (details.isCanceled) return;\n\n        if (${props.value.name}Ref.current === undefined) {\n          setUncontrolledValue(nextValue);\n        }\n      },\n      ${props.readOnly.name},\n      ...(${props.open.name}Ref.current !== undefined ? { ${props.open.name}: ${props.open.name}Ref.current } : {}),\n      ...(${props.value.name}Ref.current !== undefined ? { ${props.value.name}: ${props.value.name}Ref.current } : {}),\n    });\n    instanceRef.current = instance;\n\n    return () => {\n      instance.destroy();\n      if (instanceRef.current === instance) {\n        instanceRef.current = undefined;\n      }\n    };\n  }, [${props.highlightItemOnHover.name}, ${props.modal.name}, ${props.readOnly.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.setFormOptions({ ${props.autoComplete.name}, ${props.form.name}, ${props.name.name}, ${props.required.name} });\n  }, [${props.autoComplete.name}, ${props.form.name}, ${props.name.name}, ${props.required.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    instanceRef.current?.setDisabled(${props.disabled.name});\n  }, [${props.disabled.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    if (${props.open.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.open.getter}() === ${props.open.name}) return;\n\n    instance.${facts.state.open.setter}(${props.open.name}, { emit: false });\n  }, [${props.open.name}]);\n\n  useIsomorphicLayoutEffect(() => {\n    if (${props.value.name} === undefined) return;\n    const instance = instanceRef.current;\n    if (!instance) return;\n    if (instance.${facts.state.value.getter}() === ${props.value.name}) return;\n\n    instance.${facts.state.value.setter}(${props.value.name}, { emit: false });\n  }, [${props.value.name}]);\n\n  const renderedOpen = ${props.open.name} ?? uncontrolledOpen;\n  const selectedValue = ${props.value.name} !== undefined ? ${props.value.name} : (uncontrolledValue ?? null);\n  const renderedValue = selectedValue ?? "";\n  const contextValue = React.useMemo(\n    () => ({ open: renderedOpen, value: selectedValue }),\n    [renderedOpen, selectedValue],\n  );\n\n  return (\n    <${facts.context.rootContext}.Provider value={contextValue}>\n      <div\n        ${facts.attrs.root}\n        ${facts.attrs.autoComplete}={${props.autoComplete.name}}\n        ${facts.attrs.defaultOpen}={${props.defaultOpen.name}Ref.current ? "true" : undefined}\n        ${facts.attrs.defaultValue}={${props.defaultValue.name}Ref.current ?? undefined}\n        ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n        ${facts.attrs.form}={${props.form.name}}\n        ${facts.attrs.highlightItemOnHover}={${props.highlightItemOnHover.name} ? "true" : "false"}\n        ${facts.attrs.modal}={${props.modal.name} ? "true" : "false"}\n        ${facts.attrs.name}={${props.name.name}}\n        ${facts.attrs.readOnly}={${props.readOnly.name} ? "" : undefined}\n        ${facts.attrs.required}={${props.required.name} ? "" : undefined}\n        data-state={renderedOpen ? "open" : "closed"}\n        ref={composedRef}\n        {...props}\n      >\n        <input\n          ${facts.attrs.input}\n          type="hidden"\n          autoComplete={${props.autoComplete.name}}\n          form={${props.form.name}}\n          name={${props.name.name}}\n          value={renderedValue}\n          aria-hidden="true"\n          tabIndex={-1}\n          readOnly\n        />\n        {children}\n      </div>\n    </${facts.context.rootContext}.Provider>\n  );\n});\n\n${root}.displayName = "${facts.displayName}.Root";\n\nexport default ${root};\n\nfunction setRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {\n  if (!ref) return;\n\n  if (typeof ref === "function") {\n    ref(value);\n    return;\n  }\n\n  ref.current = value;\n}\n`;
}

function printTrigger(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const trigger = facts.exports.trigger;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";
${renderReactAsChildImports()}

import { ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";

export type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  ${props.asChild.name}?: ${props.asChild.type};
};

const ${trigger} = React.forwardRef<HTMLElement, ${trigger}Props>(
  function ${trigger}({ ${props.asChild.name} = false, children, className, ...props }, forwardedRef) {
    const ${contextLocalName} = ${facts.context.useRootContext}();
    const protectedTriggerProps = {
      ${JSON.stringify(facts.attrs.trigger)}: "",
      "aria-haspopup": "listbox",
      "aria-expanded": ${contextLocalName}.open ? "true" : "false",
      "aria-disabled": ${contextLocalName}.disabled ? "true" : undefined,
      "aria-required": ${contextLocalName}.required ? "true" : undefined,
      "aria-readonly": ${contextLocalName}.readOnly ? "true" : "false",
      "data-disabled": ${contextLocalName}.disabled ? "" : undefined,
      "data-required": ${contextLocalName}.required ? "" : undefined,
      "data-readonly": ${contextLocalName}.readOnly ? "" : undefined,
      "data-state": ${contextLocalName}.open ? "open" : "closed",
      disabled: ${contextLocalName}.disabled || undefined,
      role: "${facts.parts.trigger.role}",
    } satisfies React.HTMLAttributes<HTMLElement> & { disabled?: boolean } & Record<\`data-\${string}\`, string | undefined>;
    const triggerProps = {
      ...protectedTriggerProps,
      ...props,
    } satisfies React.HTMLAttributes<HTMLElement> & { disabled?: boolean } & Record<\`data-\${string}\`, string | undefined>;

${renderReactAsChildSetup("    ")}

${renderReactAsChildCloneBranch({
  asChildExpression: props.asChild.name,
  indent: "    ",
  protectedPropsExpression: "protectedTriggerProps",
  propsExpression: "triggerProps",
})}

    return (
      <${facts.parts.trigger.defaultElement}
        type="button"
        className={className}
        ref={forwardedRef as React.Ref<HTMLButtonElement>}
        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        disabled={${contextLocalName}.disabled}
      >
        {children}
      </${facts.parts.trigger.defaultElement}>
    );
  },
);

${trigger}.displayName = "${facts.displayName}.Trigger";

export default ${trigger};
`;
}

function printTriggerLegacy(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const trigger = facts.exports.trigger;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";\n${renderReactAsChildImports()}\n\nimport { ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${trigger}Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {\n  ${props.asChild.name}?: ${props.asChild.type};\n};\n\nconst ${trigger} = React.forwardRef<HTMLElement, ${trigger}Props>(\n  function ${trigger}({ ${props.asChild.name} = false, children, className, ...props }, forwardedRef) {\n    const ${contextLocalName} = ${facts.context.useRootContext}();\n    const protectedTriggerProps = {\n      ${JSON.stringify(facts.attrs.trigger)}: "",\n      "aria-haspopup": "listbox",\n      "aria-expanded": ${contextLocalName}.open ? "true" : "false",\n      "aria-disabled": ${contextLocalName}.disabled ? "true" : undefined,\n      "aria-required": ${contextLocalName}.required ? "true" : undefined,\n      "aria-readonly": ${contextLocalName}.readOnly ? "true" : "false",\n      "data-disabled": ${contextLocalName}.disabled ? "" : undefined,\n      "data-required": ${contextLocalName}.required ? "" : undefined,\n      "data-readonly": ${contextLocalName}.readOnly ? "" : undefined,\n      "data-state": ${contextLocalName}.open ? "open" : "closed",\n      role: "${facts.parts.trigger.role}",\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n    const triggerProps = {\n      ...protectedTriggerProps,\n      ...props,\n    } satisfies React.HTMLAttributes<HTMLElement> & Record<\`data-\${string}\`, string | undefined>;\n\n${renderReactAsChildSetup("    ")}\n\n${renderReactAsChildCloneBranch(
    {
      asChildExpression: props.asChild.name,
      indent: "    ",
      protectedPropsExpression: "protectedTriggerProps",
      propsExpression: "triggerProps",
    },
  )}\n\n    return (\n      <${facts.parts.trigger.defaultElement}\n        type="button"\n        className={className}\n        ref={forwardedRef as React.Ref<HTMLButtonElement>}\n        {...(triggerProps as React.ButtonHTMLAttributes<HTMLButtonElement>)}\n        disabled={${contextLocalName}.disabled}\n      >\n        {children}\n      </${facts.parts.trigger.defaultElement}>\n    );\n  },\n);\n\n${trigger}.displayName = "${facts.displayName}.Trigger";\n\nexport default ${trigger};\n`;
}

function printValueWithSelectedLabel(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.value;
  const exportName = facts.exports.value;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";

import { ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";

export type ${exportName}Props = React.HTMLAttributes<HTMLSpanElement> & {
  placeholder?: string;
};

const ${exportName} = React.forwardRef<HTMLSpanElement, ${exportName}Props>(
  function ${exportName}({ children, placeholder, ...props }, forwardedRef) {
    const ${contextLocalName} = ${facts.context.useRootContext}();
    const fallback =
      ${contextLocalName}.value !== null && ${contextLocalName}.selectedLabel !== null
        ? ${contextLocalName}.selectedLabel
        : placeholder;

    return (
      <${part.defaultElement}
        ${facts.attrs.value}
        data-placeholder={placeholder}
        ref={forwardedRef}
        {...props}
      >
        {children ?? fallback}
      </${part.defaultElement}>
    );
  },
);

${exportName}.displayName = "${facts.displayName}.Value";

export default ${exportName};
`;
}

function printValue(facts: AdapterOptionCollectionOverlayFacts): string {
  const part = facts.parts.value;
  const exportName = facts.exports.value;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLSpanElement> & {\n  placeholder?: string;\n};\n\nconst ${exportName} = React.forwardRef<HTMLSpanElement, ${exportName}Props>(\n  function ${exportName}({ placeholder, ...props }, forwardedRef) {\n    return (\n      <${part.defaultElement}\n        ${facts.attrs.value}\n        data-placeholder={placeholder}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Value";\n\nexport default ${exportName};\n`;
}

function printPositioner(facts: AdapterOptionCollectionOverlayFacts): string {
  return printFloatingPart(facts, "positioner", true);
}

function printPopup(facts: AdapterOptionCollectionOverlayFacts): string {
  return printFloatingPart(facts, "popup", false);
}

function printPopupWithLazyChildren(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const part = facts.parts.popup;
  const exportName = facts.exports.popup;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";
import { useComposedRefs } from "../internal/compose-refs";
import { useClosePresence } from "../internal/use-close-presence";

import { ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";

export type ${exportName}Props = React.HTMLAttributes<HTMLDivElement> & {
  ${props.align.name}?: ${props.align.type};
  ${props.alignOffset.name}?: ${props.alignOffset.type};
  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};
  keepMounted?: boolean;
  ${props.side.name}?: ${props.side.type};
  ${props.sideOffset.name}?: ${props.sideOffset.type};
};

const ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(function ${exportName}(
  {
    ${props.align.name} = ${facts.floating.alignDefault},
    ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},
    ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},
    keepMounted = false,
    ${props.side.name} = ${facts.floating.sideDefault},
    ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},
    ...props
  },
  forwardedRef,
) {
  const ${contextLocalName} = ${facts.context.useRootContext}();
  const closePresence = useClosePresence<HTMLDivElement>({
    keepMounted,
    open: ${contextLocalName}.open,
  });
  const composedRef = useComposedRefs(forwardedRef, closePresence.ref);

  return (
    <${part.defaultElement}
      ${facts.attrs.popup}
      role="${part.role}"
      tabIndex={-1}
      data-state={${contextLocalName}.open ? "open" : "closed"}
      ${facts.attrs.side}={${props.side.name}}
      ${facts.attrs.align}={${props.align.name}}
      ${facts.attrs.sideOffset}={${props.sideOffset.name}}
      ${facts.attrs.alignOffset}={${props.alignOffset.name}}
      ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}
      hidden={closePresence.hidden}
      ref={composedRef}
      {...props}
    >
      {closePresence.present ? props.children : null}
    </${part.defaultElement}>
  );
});

${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";

export default ${exportName};
`;
}

function printFloatingPart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: "popup" | "positioner",
  alignItemWithTrigger: boolean,
): string {
  const props = facts.props;
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const contextLocalName = getContextLocalName(facts);
  const typeName = `${exportName}Props`;
  const extraProp = alignItemWithTrigger
    ? `  ${props.alignItemWithTrigger.name}?: ${props.alignItemWithTrigger.type};\n`
    : "";
  const destructuredExtra = alignItemWithTrigger
    ? `      ${props.alignItemWithTrigger.name} = ${facts.floating.alignItemWithTriggerDefault},\n`
    : "";
  const renderedExtra = alignItemWithTrigger
    ? `        ${facts.attrs.alignItemWithTrigger}={${props.alignItemWithTrigger.name} ? "true" : "false"}\n`
    : "";
  const roleAttribute =
    partName === "popup" ? `        role="${part.role}"\n        tabIndex={-1}\n` : "";
  const hiddenAttribute =
    partName === "popup"
      ? `        hidden={typeof window === "undefined" && !${contextLocalName}.open ? true : undefined}\n        suppressHydrationWarning\n`
      : "";

  return `import * as React from "react";\n\nimport { ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${typeName} = React.HTMLAttributes<HTMLDivElement> & {\n  ${props.align.name}?: ${props.align.type};\n  ${props.alignOffset.name}?: ${props.alignOffset.type};\n${extraProp}  ${props.avoidCollisions.name}?: ${props.avoidCollisions.type};\n  ${props.side.name}?: ${props.side.type};\n  ${props.sideOffset.name}?: ${props.sideOffset.type};\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${typeName}>(\n  function ${exportName}(\n    {\n      ${props.align.name} = ${facts.floating.alignDefault},\n      ${props.alignOffset.name} = ${facts.floating.alignOffsetDefault},\n${destructuredExtra}      ${props.avoidCollisions.name} = ${facts.floating.avoidCollisionsDefault},\n      ${props.side.name} = ${facts.floating.sideDefault},\n      ${props.sideOffset.name} = ${facts.floating.sideOffsetDefault},\n      ...props\n    },\n    forwardedRef,\n  ) {\n    const ${contextLocalName} = ${facts.context.useRootContext}();\n\n    return (\n      <${part.defaultElement}\n        ${facts.attrs[partName]}\n${roleAttribute}        data-state={${contextLocalName}.open ? "open" : "closed"}\n        ${facts.attrs.side}={${props.side.name}}\n        ${facts.attrs.align}={${props.align.name}}\n        ${facts.attrs.sideOffset}={${props.sideOffset.name}}\n        ${facts.attrs.alignOffset}={${props.alignOffset.name}}\n${renderedExtra}        ${facts.attrs.avoidCollisions}={${props.avoidCollisions.name} ? "true" : "false"}\n${hiddenAttribute}        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function printItem(facts: AdapterOptionCollectionOverlayFacts): string {
  const props = facts.props;
  const exportName = facts.exports.item;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";\n\nimport { ${facts.context.itemContext}, ${facts.context.useRootContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${exportName}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "role"> & {\n  ${props.disabled.name}?: ${props.disabled.type};\n  ${props.value.name}: string;\n};\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}({ ${props.disabled.name} = ${getDefault(props.disabled, "false")}, ${props.value.name}, ...props }, forwardedRef) {\n    const ${contextLocalName} = ${facts.context.useRootContext}();\n    const selected = ${contextLocalName}.value === ${props.value.name};\n    const itemContextValue = React.useMemo(() => ({ value }), [value]);\n\n    return (\n      <${facts.context.itemContext}.Provider value={itemContextValue}>\n        <${facts.parts.item.defaultElement}\n          ${facts.attrs.item}\n          ${facts.attrs.valueData}={${props.value.name}}\n          role="${facts.parts.item.role}"\n          aria-selected={selected}\n          aria-disabled={${props.disabled.name} || undefined}\n          ${facts.attrs.disabled}={${props.disabled.name} ? "" : undefined}\n          data-selected={selected ? "" : undefined}\n          tabIndex={-1}\n          ref={forwardedRef}\n          {...props}\n        />\n      </${facts.context.itemContext}.Provider>\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Item";\n\nexport default ${exportName};\n`;
}

function printItemIndicator(facts: AdapterOptionCollectionOverlayFacts): string {
  const exportName = facts.exports.itemIndicator;
  const contextLocalName = getContextLocalName(facts);

  return `import * as React from "react";\n\nimport { ${facts.context.useRootContext}, ${facts.context.useItemContext} } from "./${facts.context.rootContext.replace(/Context$/, "Context")}";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLSpanElement>;\n\nconst ${exportName} = React.forwardRef<HTMLSpanElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    const ${contextLocalName} = ${facts.context.useRootContext}();\n    const item = ${facts.context.useItemContext}();\n    const selected = ${contextLocalName}.value === item.value;\n\n    return (\n      <${facts.parts.itemIndicator.defaultElement}\n        ${facts.attrs.itemIndicator}\n        aria-hidden="true"\n        data-state={selected ? "checked" : "unchecked"}\n        data-visible={selected ? "" : undefined}\n        data-hidden={selected ? undefined : ""}\n        hidden={!selected}\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.ItemIndicator";\n\nexport default ${exportName};\n`;
}

function printSeparator(facts: AdapterOptionCollectionOverlayFacts): string {
  const exportName = facts.exports.separator;

  return `import * as React from "react";\n\nexport type ${exportName}Props = React.HTMLAttributes<HTMLDivElement>;\n\nconst ${exportName} = React.forwardRef<HTMLDivElement, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return (\n      <${facts.parts.separator.defaultElement}\n        ${facts.attrs.separator}\n        role="${facts.parts.separator.role}"\n        aria-orientation="horizontal"\n        ref={forwardedRef}\n        {...props}\n      />\n    );\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.Separator";\n\nexport default ${exportName};\n`;
}

function printSimplePart(
  facts: AdapterOptionCollectionOverlayFacts,
  partName: Exclude<
    AdapterOptionCollectionOverlayPartName,
    "item" | "itemIndicator" | "popup" | "positioner" | "root" | "separator" | "trigger" | "value"
  >,
  extraAttributes = "",
): string {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];
  const elementType = getReactElementTypeForPart(part.defaultElement);
  const propsType = `React.HTMLAttributes<${elementType}>`;
  const extra = extraAttributes ? ` ${extraAttributes}` : "";

  return `import * as React from "react";\n\nexport type ${exportName}Props = ${propsType};\n\nconst ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(\n  function ${exportName}(props, forwardedRef) {\n    return <${part.defaultElement} ${facts.attrs[partName]}${extra} ref={forwardedRef} {...props} />;\n  },\n);\n\n${exportName}.displayName = "${facts.displayName}.${part.namespaceKey}";\n\nexport default ${exportName};\n`;
}

function getDefault(prop: { defaultValue?: string }, fallback: string): string {
  return prop.defaultValue ?? fallback;
}

function getContextLocalName(facts: AdapterOptionCollectionOverlayFacts): string {
  return facts.displayName
    .replace(/^[A-Z]/, (character) => character.toLowerCase())
    .replace(/[^a-zA-Z0-9_$]/g, "");
}

function getReactElementTypeForPart(tagName: string): string {
  const elementTypes: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    input: "HTMLInputElement",
    span: "HTMLSpanElement",
  };

  return elementTypes[tagName] ?? "HTMLElement";
}
