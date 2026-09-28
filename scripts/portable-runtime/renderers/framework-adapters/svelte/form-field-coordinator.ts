import {
  formReactivePropTypes,
  formReactiveTypeImports,
  formSummaryDefaults,
  formTimingValue,
  requestFormConnection,
  updateFormErrors,
  updateFormOptions,
} from "../../shared-recipes/structured/document-controls/form-policy.js";
import type {
  AdapterComponentFile,
  AdapterFormFieldCoordinatorFacts,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";
import { svelteDocumentConnection } from "./document-control-operations.js";

export function printSvelteFormFieldCoordinatorIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "form-field-coordinator")
    throw new TypeError("Svelte Form requires form-field-coordinator facts.");
  const { namespace, root, errorSummary } = file.family.facts.exports;
  return {
    path: file.path,
    contents: `import ${root} from "./${root}.svelte";
import ${errorSummary} from "./${errorSummary}.svelte";
const ${namespace} = { Root: ${root}, ErrorSummary: ${errorSummary} };
export { ${namespace}, ${root}, ${errorSummary} };
export default ${namespace};
`,
  };
}

export function printSvelteFormFieldCoordinatorComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "form-field-coordinator")
    throw new TypeError("Svelte Form requires form-field-coordinator facts.");
  return {
    path: `${file.path}.svelte`,
    contents: family.part === "root" ? printRoot(family.facts) : printSummary(family.facts),
  };
}

function printRoot(facts: AdapterFormFieldCoordinatorFacts): string {
  const { errorVisibility, revalidationTiming, validationTiming } = facts.props;
  return `<script lang="ts">
  import { ${facts.runtime.factory}, type ${facts.runtime.validationTimingType}, ${formReactiveTypeImports} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import { provideFormOwner } from "./FormFieldContext.js";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLFormAttributes } from "svelte/elements";
  type Props = Omit<HTMLFormAttributes, "children"> & {
    ${formReactivePropTypes}
    children?: Snippet;
    ref?: (element: HTMLFormElement | null) => void;
    "data-slot"?: string;
    "${facts.attrs.errorVisibility}"?: ${facts.runtime.validationTimingType};
    "${facts.attrs.revalidationTiming}"?: ${facts.runtime.validationTimingType};
    "${facts.attrs.validationTiming}"?: ${facts.runtime.validationTimingType};
    ${errorVisibility.name}?: ${errorVisibility.type};
    ${revalidationTiming.name}?: ${revalidationTiming.type};
    ${validationTiming.name}?: ${validationTiming.type};
  };
  let { children, ref, options, errors, errorOptions, "data-slot": dataSlot = "${facts.parts.root.slotValue}",
    "${facts.attrs.errorVisibility}": dataErrorVisibility,
    "${facts.attrs.revalidationTiming}": dataRevalidationTiming,
    "${facts.attrs.validationTiming}": dataValidationTiming,
    ${errorVisibility.name} = ${JSON.stringify(errorVisibility.defaultValue)},
    ${revalidationTiming.name} = ${JSON.stringify(revalidationTiming.defaultValue)},
    ${validationTiming.name} = ${JSON.stringify(validationTiming.defaultValue)},
    ...rest }: Props = $props();
  const configured = { options: false, errors: false };
  const owner = provideFormOwner();
  let ready = $state.raw<ReturnType<typeof ${facts.runtime.factory}> | null>(null);
  const attachForm: Attachment<HTMLFormElement> = (element) => {
    let active = true;
    let instance: ReturnType<typeof ${facts.runtime.factory}> | undefined;
    ${requestFormConnection(svelteDocumentConnection, "instance = owner.connect(element);", "ready = instance;")}
    return () => { active = false; ready = null; if (instance) owner.disconnect(instance); };
  };
  $effect(() => {
    const instance = ready, value = options;
    if (instance) untrack(() => { ${updateFormOptions("instance", "value")} });
  });
  $effect(() => {
    const instance = ready, value = errors, settings = errorOptions;
    if (instance) untrack(() => { ${updateFormErrors("instance", "value", "settings")} });
  });
  $effect(() => {
    const element = ready?.root, callback = ref;
    if (!element) return;
    untrack(() => callback?.(element));
    return () => untrack(() => callback?.(null));
  });
</script>
<${facts.parts.root.defaultElement} {...rest} ${facts.attrs.root}="" ${facts.attrs.rootSlot}={dataSlot}
  ${facts.attrs.errorVisibility}={${formTimingValue("dataErrorVisibility", errorVisibility.name)}}
  ${facts.attrs.revalidationTiming}={${formTimingValue("dataRevalidationTiming", revalidationTiming.name)}}
  ${facts.attrs.validationTiming}={${formTimingValue("dataValidationTiming", validationTiming.name)}}
  {@attach attachForm}>
  {@render children?.()}
</${facts.parts.root.defaultElement}>
`;
}

function printSummary(facts: AdapterFormFieldCoordinatorFacts): string {
  return `<script lang="ts">
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
    "data-slot"?: string;
  };
  let { children, ref, role = ${formSummaryDefaults.role}, "aria-live": ariaLive = ${formSummaryDefaults.ariaLive}, "aria-atomic": ariaAtomic = ${formSummaryDefaults.ariaAtomic}, hidden = ${formSummaryDefaults.hidden}, "data-slot": dataSlot = "${facts.parts.errorSummary.slotValue}", ...rest }: Props = $props();
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<${facts.parts.errorSummary.defaultElement} {...rest} ${facts.attrs.errorSummary}="" ${facts.attrs.errorSummarySlot}={dataSlot}
  ${facts.attrs.errorSummaryRole}={role} ${facts.attrs.errorSummaryAriaLive}={ariaLive} ${facts.attrs.errorSummaryAriaAtomic}={ariaAtomic} ${facts.attrs.errorSummaryHidden}={hidden} {@attach attachRef}>
  {@render children?.()}
</${facts.parts.errorSummary.defaultElement}>
`;
}
