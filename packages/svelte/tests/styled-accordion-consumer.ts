import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledAccordionConsumer = (root: string) =>
  createStyledNativeConsumer(root, ["accordion"]);
export const accordionImports = `import Accordion, { Accordion as StyledRoot, AccordionItem, AccordionTrigger, AccordionContent, AccordionVariants, type AccordionProps, type AccordionItemProps } from "./accordion/index.js";
import Primitive, { type AccordionValue, type AccordionValueChangeDetails } from "@starwind-ui/svelte/accordion";
import { createAccordion } from "@starwind-ui/runtime/accordion";`;
export const accordionPositive = `<script lang="ts">
${accordionImports}
import { createAttachmentKey } from "svelte/attachments";
let value=$state<AccordionValue>();
const props: AccordionProps={type:"multiple",defaultValue:["one"],collapsible:true,onValueChange(next,detail){const accepted:AccordionValue=next;const details:AccordionValueChangeDetails=detail;details.cancel();void accepted;},ref(node){const root:HTMLDivElement|null=node;void root;}};
const item:AccordionItemProps={value:"one",disabled:false};
const attached={ [createAttachmentKey()]:(node:HTMLButtonElement)=>{void node.disabled;return()=>{};} };
void [AccordionVariants.accordion(),AccordionVariants.accordionContent()];
</script>
<Accordion.Root {...props} bind:value>{#snippet children(accepted)}
 <output>{JSON.stringify(accepted)}</output><Accordion.Item {...item}><Accordion.Trigger {...attached} ref={(node:HTMLButtonElement|null)=>{}} onclick={event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}>One</Accordion.Trigger><Accordion.Content ref={(node:HTMLDivElement|null)=>{}}>Content</Accordion.Content></Accordion.Item>
{/snippet}</Accordion.Root>
<StyledRoot value="one"><AccordionItem value="one"><AccordionTrigger>{#snippet icon()}<span>+</span>{/snippet}One</AccordionTrigger><AccordionContent>Content</AccordionContent></AccordionItem></StyledRoot>
<Primitive.Root value={null}><Primitive.Item value="one"><Primitive.Trigger>One</Primitive.Trigger><Primitive.Panel>Content</Primitive.Panel></Primitive.Item></Primitive.Root>`;
