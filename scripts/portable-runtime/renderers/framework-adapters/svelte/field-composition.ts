import {
  connectField,
  type FieldOwner,
  type FieldReadinessProjection,
  fieldMatch,
  fieldPartConnection,
  fieldSynchronizations,
  releaseFieldConnection,
  requestFieldConnection,
} from "../../shared-recipes/structured/document-controls/field-recipe.js";
import { formTimingValue } from "../../shared-recipes/structured/document-controls/form-policy.js";
import type {
  AdapterComponentFile,
  AdapterFormControlCompositionFacts,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteFieldCompositionIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "field-composition")
    throw new TypeError("Field requires field-composition facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `${facts.index.importMembers.map(({ name, from }) => `import ${name} from "${from}.svelte";`).join("\n")}
const Field = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { Field, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default Field;
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}
export function printSvelteFieldCompositionComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "field-composition")
    throw new TypeError("Field requires field-composition facts.");
  const { facts, part } = family;
  return {
    path: `${file.path}.svelte`,
    contents:
      part === "root" ? root(facts) : part === "control" ? control(facts) : simple(facts, part),
  };
}
function root(facts: AdapterFormControlCompositionFacts): string {
  const owner: FieldOwner = {
    kind: "form-context",
    owner: "owner",
    defer: (body) => `queueMicrotask(() => { ${body} });`,
  };
  const readiness: FieldReadinessProjection = {
    afterDescendants: (body) =>
      `queueMicrotask(() => {\n    if (!active) return;\n    ${body}\n  });`,
    cancelPending: "active = false;",
    ready: (element) => `ready = ${element};`,
  };
  const states = Object.values(facts.rootState);
  const timings = [
    facts.formTiming.errorVisibility,
    facts.formTiming.revalidationTiming,
    facts.formTiming.validationTiming,
  ];
  return `<script lang="ts">
import { ${facts.runtime.factory} } from "${facts.runtime.importSource}";
import type { FormValidationTiming } from "${facts.formTiming.typeImport.importSource}";
import { getFormOwner, provideFieldRefresh } from "../form/FormFieldContext.js";
import { untrack, type Snippet } from "svelte";
import type { Attachment } from "svelte/attachments";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
children?: Snippet; ref?: (element: HTMLDivElement | null) => void; "data-slot"?: string;
${states.map(({ prop }) => `${prop.name}?: ${prop.type};`).join("\n")}
${timings.map(({ prop, attribute }) => `${prop.name}?: FormValidationTiming; "${attribute}"?: FormValidationTiming;`).join("\n")}
};
let { children, ref, "data-slot": dataSlot = "field", ${states.map(({ prop }) => prop.name + (prop.name === "disabled" ? ` = ${prop.defaultValue}` : "")).join(", ")},
${timings.map(({ prop, attribute }) => `${prop.name}, "${attribute}": data${prop.name}`).join(", ")}, ...rest }: Props = $props();
const owner = getFormOwner();
let instance = $state<ReturnType<typeof ${facts.runtime.factory}>>();
let ready = $state<HTMLDivElement | null>(null);
let refreshQueued = false;
provideFieldRefresh(() => {
  if (refreshQueued) return;
  refreshQueued = true;
  queueMicrotask(() => { refreshQueued = false; instance?.refresh(); });
});
const attachField: Attachment<HTMLDivElement> = (element) => {
  let active = true;
  let connected: ReturnType<typeof ${facts.runtime.factory}> | undefined;
  ${requestFieldConnection(readiness, owner, connectField(facts, { read: (name) => name }, "element", "instance", "connected", false), "element")}
  return () => {
    ${releaseFieldConnection(readiness, "instance", "connected", owner)}
  };
};
${fieldSynchronizations(facts, { read: (name) => name, observe: (_name, body) => `$effect(() => { ${body} });` }, "instance")}
$effect(() => {
  const element = ready, callback = ref;
  if (!element) return;
  untrack(() => callback?.(element));
  return () => untrack(() => callback?.(null));
});
</script>
<div {...rest} ${facts.attrs.root}="" data-slot={dataSlot}
${states.map(({ prop, attribute }) => `${attribute}={${prop.name}${prop.name === "name" ? "" : ' ? "" : undefined'}}`).join("\n")}
${timings.map(({ prop, attribute }) => `${attribute}={${formTimingValue(`data${prop.name}`, prop.name)}}`).join("\n")}
{@attach attachField}>{@render children?.()}</div>
`;
}
function control(facts: AdapterFormControlCompositionFacts): string {
  return `<script module lang="ts">
import InputRoot from "../input/InputRoot.svelte";
import type { ComponentProps } from "svelte";
export interface FieldControlProps extends ComponentProps<typeof InputRoot> {}
</script>
<script lang="ts">
import { createAttachmentKey } from "svelte/attachments";
import { getFieldRefresh } from "../form/FormFieldContext.js";
const refresh = getFieldRefresh();
const fieldAttachment = { [createAttachmentKey()]: () => { ${fieldPartConnection("refresh")} } };
type Props = FieldControlProps;
let { value = $bindable(), ...rest }: Props = $props();
</script>
<InputRoot {...rest} {...fieldAttachment} ${facts.attrs.control}="" bind:value />
`;
}
function simple(
  facts: AdapterFormControlCompositionFacts,
  part: "label" | "description" | "item" | "error" | "validity",
): string {
  const element =
    part === "label"
      ? "HTMLLabelElement"
      : part === "description"
        ? "HTMLParagraphElement"
        : "HTMLDivElement";
  const message = part === "error" || part === "validity" ? facts.message[part] : undefined;
  const matchType = [
    "boolean",
    ...facts.message.matchValues.map((value) => JSON.stringify(value)),
  ].join(" | ");
  return `<script lang="ts">
import { untrack, type Snippet } from "svelte";
import type { Attachment } from "svelte/attachments";
import type { ${part === "label" ? "HTMLLabelAttributes" : "HTMLAttributes"} } from "svelte/elements";
import { getFieldRefresh } from "../form/FormFieldContext.js";
const refresh = getFieldRefresh();
const attachPart: Attachment<${element}> = () => { ${fieldPartConnection("refresh")} };
type Props = Omit<${part === "label" ? "HTMLLabelAttributes" : `HTMLAttributes<${element}>`}, "children"> & { children?: Snippet; ref?: (element: ${element} | null) => void; "data-slot"?: string; ${message ? `match?: ${matchType};` : ""} ${part === "error" ? `${facts.message.error.messageSource.prop.name}?: ${facts.message.error.messageSource.prop.type};` : ""} };
let { children, ref, "data-slot": dataSlot = "field-${part}", ${message ? `match = ${message.matchDefault}, hidden = ${message.hiddenDefault},` : ""} ${part === "error" ? "messageSource," : ""} ...rest }: Props = $props();
${printSvelteRefAttachment(element)}
</script>
<${facts.parts[part].defaultElement} {...rest} ${facts.attrs[part]}="" data-slot={dataSlot} ${message ? `${message.matchAttribute}={${fieldMatch("match")}} {hidden}` : ""} ${part === "error" ? `${facts.message.error.messageSource.attribute}={messageSource}` : ""} {@attach attachPart} {@attach attachRef}>{@render children?.()}</${facts.parts[part].defaultElement}>
`;
}
