import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledCollapsibleConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["collapsible"]);
export const collapsibleNativeHiddenReproduction = `<script lang="ts">const attrs = { id: "native-hidden" }; const hidden = "until-found";</script><div {...attrs} {hidden}>Find this text</div>`;
export const collapsibleImports = `import Styled, { Collapsible, CollapsibleTrigger, CollapsibleContent, CollapsibleVariants, type CollapsibleProps, type ButtonChildPayload as StyledChildPayload, type ButtonChildProps as StyledChildProps } from "./collapsible/index.js";
import Primitive, { CollapsibleRoot, CollapsibleTrigger as Trigger, CollapsiblePanel, type CollapsibleOpenChangeDetails, type ButtonChildProps, type ButtonChildPayload } from "@starwind-ui/svelte/collapsible";
import Button from "@starwind-ui/svelte/button";`;
export const collapsiblePositive = `<script lang="ts">
${collapsibleImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let open = $state<boolean | undefined>();
const ref = (node: HTMLDivElement | null) => { void node; };
const buttonRef = (node: HTMLButtonElement | null) => { void node; };
const attachment: Attachment<HTMLButtonElement> = node => { void node.disabled; return () => {}; };
const attrs: ButtonChildProps & StyledChildProps = { [createAttachmentKey()]: attachment, onclick: event => { const node: HTMLButtonElement = event.currentTarget; void node; } };
const proposal = (next: boolean, detail: CollapsibleOpenChangeDetails) => { void next; detail.cancel(); };
const props: CollapsibleProps = { defaultOpen: true, disabled: false, ref, class: ["caller", { active: true }] };
void [CollapsibleVariants.collapsible(), CollapsibleVariants.collapsibleTrigger(), CollapsibleVariants.collapsibleContent()];
</script>
{#snippet child({ props, children }: ButtonChildPayload)}<button {...props}>{@render children?.()}</button>{/snippet}
{#snippet forwarding({ props, children }: StyledChildPayload)}<Button.Root {...props}>{@render children?.()}</Button.Root>{/snippet}
<Primitive.Root bind:open defaultOpen onOpenChange={proposal} {ref}><Primitive.Trigger {child} {...attrs} ref={buttonRef}>Toggle</Primitive.Trigger><Primitive.Panel hiddenUntilFound {ref}>Content</Primitive.Panel></Primitive.Root>
<CollapsibleRoot open={false} {ref}><Trigger {child} ref={buttonRef}>Named</Trigger><CollapsiblePanel {ref}/></CollapsibleRoot>
<Styled.Root bind:open {...props} onOpenChange={proposal}><Styled.Trigger child={forwarding} {...attrs} ref={buttonRef}>Styled</Styled.Trigger><Styled.Content hiddenUntilFound {ref}/></Styled.Root>
<Collapsible bind:open={() => open, next => open=next}>{#snippet children(accepted)}<CollapsibleTrigger {child} ref={buttonRef}>Open: {accepted}</CollapsibleTrigger><CollapsibleContent {ref}>Named content</CollapsibleContent>{/snippet}</Collapsible>`;
