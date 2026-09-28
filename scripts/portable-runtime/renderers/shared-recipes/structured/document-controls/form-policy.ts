import {
  formOptionDefaults,
  formReactiveProps,
  formRuntimeAdapterContract,
} from "../../../../contracts/primitive/components/form.js";

const summary = formRuntimeAdapterContract.parts.find((part) => part.name === "error-summary")!;
const constant = (name: string): string => {
  const attribute = summary.initialAttributes.find((attribute) => attribute.name === name);
  if (!attribute || attribute.source !== "constant")
    throw new Error(`Form summary requires ${name}`);
  return JSON.stringify(attribute.value);
};
export const formSummaryDefaults = {
  role: constant("role"),
  ariaLive: constant("aria-live"),
  ariaAtomic: constant("aria-atomic"),
  hidden: "true",
};
/** Authored timing data attributes take precedence over the named options. */
export function formTimingValue(dataValue: string, namedValue: string): string {
  return `${dataValue} ?? ${namedValue}`;
}
export interface DescendantConnectionOperations {
  afterDescendants(body: string): string;
}
/** Child native controls must be ready before Form discovery and public readiness publication. */
export function requestFormConnection(
  operations: DescendantConnectionOperations,
  connect: string,
  publishReady: string,
): string {
  return operations.afterDescendants(`${connect}\n${publishReady}`);
}
/** Clear the current owner before destroying its captured Runtime controller. */
export function disposeDocumentOwner(current: string, owned: string): string {
  return `if (${current} === ${owned}) ${current} = undefined;\n${owned}.destroy();`;
}
/** Create the native Form controller before publishing the adapter's owner reference. */
export function connectDocumentOwner(
  factory: string,
  element: string,
  current: string,
  captured?: string,
): string {
  return captured
    ? `const ${captured} = ${factory}(${element});\n${current} = ${captured};`
    : `${current} = ${factory}(${element});`;
}

/** These declarations and transitions are shared by all reactive Form printers. */
export const formReactivePropTypes = formReactiveProps
  .map(({ name, type }) => `${name}?: ${type};`)
  .join("\n");
export const formReactiveTypeImports = formReactiveProps
  .map(({ type }) => `type ${type}`)
  .join(", ");
export function updateFormOptions(instance: string, options: string): string {
  return `if (${options} !== undefined || configured.options) { configured.options = ${options} !== undefined; ${instance}.setOptions({ ${Object.keys(
    formOptionDefaults,
  )
    .map((key) => `${key}: undefined`)
    .join(", ")}, ...${options} } satisfies Record<keyof FormOptions, unknown>); }`;
}
export function updateFormErrors(instance: string, errors: string, options: string): string {
  return `if (${errors} !== undefined || configured.errors) { configured.errors = ${errors} !== undefined; ${instance}.setExternalErrors(${errors} ?? {}, ${options}); }`;
}
