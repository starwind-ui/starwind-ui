import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledSwitchConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["switch"]);
export const switchImports = `import Switch, { Switch as NamedSwitch, SwitchVariants, type SwitchProps } from "./switch/index.js";import Primitive, { SwitchRoot, SwitchThumb, type SwitchCheckedChangeDetails } from "@starwind-ui/svelte/switch";`;
export const switchPositive = `<script lang="ts">
${switchImports}
import {createAttachmentKey} from "svelte/attachments";
let checked=$state<boolean|undefined>();
const props:SwitchProps={id:"typed-switch",size:"lg",variant:"primary",padding:4,name:"switch",value:"yes",uncheckedValue:"no",required:true,readOnly:false,form:"external",ref(node){const button:HTMLButtonElement|null=node;void button;}};
const attachments={[createAttachmentKey()]:(node:HTMLButtonElement)=>{void node.disabled;return()=>{};}};
void [SwitchVariants.switchButton({variant:"info"}),SwitchVariants.switchToggle({size:"sm"}),SwitchVariants.switchLabel({size:"md"}),SwitchVariants.switchWrapper()];
</script>
<Switch {...props} {...attachments} label="Typed" bind:checked onCheckedChange={(value,detail)=>{const next:boolean=value;const details:SwitchCheckedChangeDetails=detail;void next;details.cancel();}} onclick={event=>{const button:HTMLButtonElement=event.currentTarget;void button;}} />
<NamedSwitch id="named" />
<Primitive.Root name="span" ref={(node:HTMLSpanElement|null)=>{void node;}} inputRef={(node:HTMLInputElement|null)=>{void node;}}><Primitive.Thumb ref={(node:HTMLSpanElement|null)=>{void node;}}>Thumb</Primitive.Thumb></Primitive.Root>
<SwitchRoot nativeButton form="external" bind:checked inputRef={(node:HTMLInputElement|null)=>{void node;}} ref={(node:HTMLButtonElement|null)=>{void node;}}><SwitchThumb/></SwitchRoot>`;
