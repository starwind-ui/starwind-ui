import type { DisclosureRootProjection } from "../../shared-recipes/structured/disclosure/frame.js";
export const svelteDisclosureRoot: DisclosureRootProjection = {
  attribute: (name, expression) => (expression === undefined ? name : `${name}={${expression}}`),
  initialCell: (expression) => `untrack(() => ${expression})`,
  readInput: (name) => name,
  print: ({
    plan,
    fields,
    initial,
    accepted,
    controller,
    lifecycle,
    modelObserver,
    attributes,
  }) => `<script module lang="ts">
import { getContext } from "svelte";
const contextKey = Symbol("Collapsible");
export function getDisclosurePresenceContext(): { readonly disabled: boolean } | undefined { return getContext(contextKey); }
</script>
<script lang="ts">
import { create${plan.component}, type ${plan.proposal.details} } from "@starwind-ui/runtime/collapsible";
import { setContext, untrack, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { Attachment } from "svelte/attachments";
import { createRefAttachment } from "../_internal/ref-attachment.js";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & { ${fields} children?: Snippet<[boolean]>; ref?: (element: HTMLDivElement | null) => void; onOpenChange?: (open: boolean, detail: ${plan.proposal.details}) => void };
let { open = $bindable(), defaultOpen, disabled = false, onOpenChange, children, ref, ...rest }: Props = $props();
setContext(contextKey, { get disabled() { return disabled; } });
${initial}
${accepted}
${controller}
${lifecycle}
const attachRuntime: Attachment<HTMLDivElement> = root => {
  $effect(() => { void [${plan.constructorInputs.join(", ")}]; untrack(() => connectRuntime(root)); return disconnectRuntime; });
  ${modelObserver}
};
const attachRef = createRefAttachment<HTMLDivElement>(() => ref);
</script>
<div {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>{@render children?.(renderedOpen)}</div>
`,
};
