import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledRadioGroupConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["radio-group"]);
export const radioGroupImports = `import Styled,{RadioGroup,RadioGroupItem,RadioGroupVariants,type RadioGroupProps,type RadioGroupItemProps} from "./radio-group/index.js";import Radio,{RadioRoot,RadioIndicator,type RadioCheckedChangeDetails} from "@starwind-ui/svelte/radio";import Group,{RadioGroupRoot,type RadioGroupValue,type RadioGroupValueChangeDetails} from "@starwind-ui/svelte/radio-group";`;
export const radioGroupPositive = `<script lang="ts">${radioGroupImports}
import {createAttachmentKey} from "svelte/attachments";
let value=$state<string|undefined>(),checked=$state<boolean|undefined>();
const props:RadioGroupProps={legend:"Delivery",size:"md",orientation:"horizontal",form:"form",name:"delivery",required:true};const item:RadioGroupItemProps={value:"one",nativeButton:true,ref(node){const el:HTMLButtonElement|null=node;void el;}};
const attachment={[createAttachmentKey()]:(node:HTMLDivElement)=>()=>{void node;}};void [RadioGroupVariants.radioGroup(),RadioGroupVariants.radioControl()];
</script><Styled.Root {...props} {...attachment} bind:value onValueChange={(next,detail)=>{const v:RadioGroupValue=next;const d:RadioGroupValueChangeDetails=detail;void v;d.cancel();}}><Styled.Item {...item} bind:checked onCheckedChange={(next,detail)=>{const v:boolean=next;const d:RadioCheckedChangeDetails=detail;void v;d.cancel();}}>{#snippet icon()}<svg aria-hidden="true"><circle cx="5" cy="5" r="4" /></svg>{/snippet}</Styled.Item><RadioGroupItem value="two" ref={(node:HTMLSpanElement|null)=>{void node;}} /></Styled.Root><RadioGroup /><Group.Root bind:value><Radio.Root value="x" bind:checked><Radio.Indicator keepMounted /></Radio.Root></Group.Root><RadioGroupRoot /><RadioRoot nativeButton value="b" ref={(node:HTMLButtonElement|null)=>{void node;}}/><RadioIndicator />`;
