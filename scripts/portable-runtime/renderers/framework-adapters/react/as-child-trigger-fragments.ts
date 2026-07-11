export type ReactAsChildImportFormat = "compact" | "multiline";

export type ReactAsChildCloneBranchOptions = {
  asChildExpression: string;
  eventOrder?: "child-first" | "parent-first";
  indent: string;
  protectedPropsExpression: string;
  propsExpression: string;
};

export function renderReactAsChildImports(format: ReactAsChildImportFormat = "compact"): string {
  if (format === "multiline") {
    return `import type { RefCapableElementProps } from "../internal/compose-refs";\nimport {\n  getAsChildElement,\n  getElementRef,\n  mergeAsChildProps,\n  useComposedRefs,\n} from "../internal/compose-refs";`;
  }

  return `import type { RefCapableElementProps } from "../internal/compose-refs";\nimport { getAsChildElement, getElementRef, mergeAsChildProps, useComposedRefs } from "../internal/compose-refs";`;
}

export function renderReactAsChildSetup(indent: string): string {
  return `${indent}const asChildElement = getAsChildElement(children);\n${indent}const composedRef = useComposedRefs(\n${indent}  forwardedRef,\n${indent}  asChildElement ? getElementRef(asChildElement) : undefined,\n${indent});`;
}

export function renderReactAsChildCloneBranch({
  asChildExpression,
  eventOrder,
  indent,
  protectedPropsExpression,
  propsExpression,
}: ReactAsChildCloneBranchOptions): string {
  const eventOrderLine =
    eventOrder && eventOrder !== "child-first" ? `${indent}    eventOrder: "${eventOrder}",\n` : "";

  return `${indent}if (${asChildExpression} && asChildElement) {\n${indent}  const child = asChildElement;\n${indent}  const childProps = child.props;\n${indent}  const mergedProps = mergeAsChildProps({ ...${propsExpression}, className }, childProps, {\n${eventOrderLine}${indent}    protectedProps: ${protectedPropsExpression},\n${indent}  });\n\n${indent}  return React.cloneElement(child, {\n${indent}    ...mergedProps,\n${indent}    ref: composedRef,\n${indent}  });\n${indent}}`;
}
