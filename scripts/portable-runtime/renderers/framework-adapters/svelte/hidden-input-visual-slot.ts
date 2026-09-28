import {
  otpCaretFallbackClass,
  otpConnection,
  otpInitialSeed,
  otpInputMode,
  otpPattern,
  otpTabIndex,
} from "../../shared-recipes/structured/file-controls/input-otp-recipe.js";
import type {
  AdapterComponentFile,
  AdapterHiddenInputVisualSlotFacts,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteHiddenInputVisualSlotIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "hidden-input-visual-slot")
    throw new TypeError("Input OTP requires hidden-input-visual-slot facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `${facts.index.importMembers.map(({ name, from }) => `import ${name} from "${from}.svelte";`).join("\n")}
const ${facts.exports.namespace} = { ${facts.index.namespaceMembers.map(({ key, name }) => `${key}: ${name}`).join(", ")} };
export { ${facts.exports.namespace}, ${facts.index.importMembers.map(({ name }) => name).join(", ")} };
export default ${facts.exports.namespace};
export type { ${facts.index.typeExports.join(", ")} } from "${facts.runtime.typeImportSource}";
`,
  };
}

export function printSvelteHiddenInputVisualSlotComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  const family = file.component.family;
  if (family?.kind !== "hidden-input-visual-slot")
    throw new TypeError("Input OTP requires hidden-input-visual-slot facts.");
  return {
    path: `${file.path}.svelte`,
    contents:
      family.part === "root" ? printRoot(family.facts) : printPart(family.facts, family.part),
  };
}

function printRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const connection = otpConnection(facts, {
    authority: "binding",
    parentAcceptance: "runtime",
    read: "readInputs()",
    seed: "seed",
    current: "renderedValue",
    notify: (next, detail) => `onValueChange?.(${next}, ${detail});`,
    writeCurrent: (next) => `renderedValue = ${next};`,
    publish: (next) => `value = ${next};`,
    untrack: (body) => `untrack(() => { ${body} });`,
    afterCommit: (body) => `queueMicrotask(() => { ${body} });`,
  });
  return `<script lang="ts">
  import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";
  import { untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children" | "id"> & {
    children?: Snippet;
    value?: string;
    defaultValue?: string;
    disabled?: boolean;
    form?: string;
    id?: string;
    maxLength?: number;
    name?: string;
    pattern?: RegExp | string;
    readOnly?: boolean;
    required?: boolean;
    onValueChange?: (value: string, detail: ${facts.event.detailsType}) => void;
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { children, value = $bindable(), defaultValue, disabled = ${facts.props.disabled.defaultValue}, form, id, maxLength = ${facts.props.maxLength.defaultValue}, name, pattern, readOnly = ${facts.props.readOnly.defaultValue}, required = ${facts.props.required.defaultValue}, onValueChange, ref, ...rest }: Props = $props();
  const initialModel = untrack(() => value);
  const seed = untrack(() => ${otpInitialSeed("binding", "defaultValue", "initialModel")});
  const initial = initialModel ?? seed;
  let renderedValue = $state(initial);
  let rootNode = $state.raw<HTMLDivElement | null>(null);
  let connection = $state.raw<ReturnType<typeof connectOtp> | undefined>();
  let patternText = $derived(${otpPattern(facts, "pattern")});
  let inputMode = $derived<"numeric" | "text">(${otpInputMode(facts, "patternText")});
  function readInputs() { return { value, disabled, form, id, maxLength, name, pattern: patternText, readOnly, required }; }
  ${connection}
  const attachRuntime: Attachment<HTMLDivElement> = (element) => {
    rootNode = element;
    return () => { rootNode = null; };
  };
  $effect(() => {
    const root = rootNode;
    if (!root) return;
    const owned = untrack(() => connectOtp(root));
    connection = owned;
    return () => { if (connection === owned) connection = undefined; owned.destroy(); };
  });
  $effect(() => {
    const owned = connection;
    readInputs();
    if (owned) untrack(() => owned.update());
  });
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<!-- Runtime forwards root focus to the internal native input. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div {...rest} ${facts.attrs.root}="" ${facts.attrs.defaultValue}={seed} ${facts.attrs.disabled}={disabled ? "" : undefined}
  ${facts.attrs.form}={form} ${facts.attrs.id}={id} ${facts.attrs.maxLength}={maxLength} ${facts.attrs.name}={name} ${facts.attrs.pattern}={patternText}
  ${facts.attrs.readOnly}={readOnly ? "" : undefined} ${facts.attrs.required}={required ? "" : undefined} ${facts.attrs.value}={renderedValue}
  aria-disabled={disabled} tabindex={${otpTabIndex("disabled")}} {@attach attachRuntime} {@attach attachRef}>
  <input ${facts.attrs.input}="" autocomplete="${facts.nativeInput.autocompleteValue}" class="${facts.nativeInput.hiddenClassValue}"
    {disabled} {form} {id} inputmode={inputMode} maxlength={maxLength} {name} readonly={readOnly} {required} tabindex="${facts.nativeInput.tabIndexValue}" value={initial} />
  {@render children?.()}
</div>
`;
}

function printPart(
  facts: AdapterHiddenInputVisualSlotFacts,
  part: "group" | "slot" | "separator",
): string {
  const slot = part === "slot";
  return `<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    ${slot ? "index?: number; caret?: Snippet;" : "children?: Snippet;"}
    ref?: (element: HTMLDivElement | null) => void;
  };
  let { ${slot ? "index, caret" : "children"}, ref, ...rest }: Props = $props();
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${facts.parts[part].discoveryAttribute}=""${slot ? ` ${facts.attrs.slotIndex}={index}` : part === "separator" ? ` role="${facts.visualSlots.separator.role}" aria-hidden="${facts.visualSlots.separator.ariaHiddenValue}"` : ""} {@attach attachRef}>
  ${
    slot
      ? `<span ${facts.attrs.slotChar}=""></span>
  <div ${facts.attrs.slotCaret}="" class="${facts.visualSlots.slotCaret.classValue}" ${facts.attrs.slotCaretHidden}>
    {#if caret}{@render caret()}{:else}<div class="${otpCaretFallbackClass}"></div>{/if}
  </div>`
      : "{@render children?.()}"
  }
</div>
`;
}
