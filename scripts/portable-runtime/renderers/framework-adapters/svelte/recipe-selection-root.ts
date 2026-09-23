import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";
import type { ConnectionRecipe } from "../../shared-recipes/structured/plan.js";
import type { SelectionRootProjection } from "../../shared-recipes/structured/root-frame.js";
export const svelteSelectionRootProjection: SelectionRootProjection = {
  readProp: (name) => name,
  callbackType: (plan) => `(value: ${plan.model.type}, detail: ${plan.proposal.details}) => void`,
  destructureProp: (name, defaultValue, model) =>
    model ? `${name} = $bindable()` : `${name}${defaultValue ? ` = ${defaultValue}` : ""}`,
  marker: (name) => `${name}=""`,
  attribute: (name, value) => `${name}={${value}}`,
  print(input) {
    const {
      frame,
      plan,
      fw,
      name,
      code,
      controller,
      accepted,
      renderedName,
      callbackType,
      fields,
      destructure,
      attributes,
      callback,
      imports,
      initialBody,
      serializeDefault,
      helpers,
    } = input;
    return `<script lang="ts">
${imports}
import { untrack, type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { Attachment } from "svelte/attachments";
import { createRefAttachment } from "../_internal/ref-attachment.js";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children?: Snippet<[${plan.model.type}]>;
  ${fields}
  ${callback}?: ${callbackType};
  ref?: (element: HTMLDivElement | null) => void;
};
let { children, ${destructure}, ${callback}, ref, ...rest }: Props = $props();
const initialValue = untrack(() => {
  ${initialBody}
  return copyModel(initialValue);
});
${serializeDefault}
${accepted}
${controller}
${code}
${observeElementConnection(plan, fw)}
const attachRef = createRefAttachment<HTMLDivElement>(() => ref);
${helpers}
</script>
<${frame.element} {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>
  {@render children?.(copyModel(${renderedName}))}
</${frame.element}>
`;
  },
};
function observeElementConnection(plan: ConnectionRecipe, fw: FrameworkOperations): string {
  return `const attachRuntime: Attachment<HTMLDivElement> = root => {
  $effect(() => {
    void [${plan.constructorInputs.join(", ")}];
    untrack(() => connectRuntime(root));
    return disconnectRuntime;
  });
  ${fw.observeModel(plan.model.name)}
};`;
}
