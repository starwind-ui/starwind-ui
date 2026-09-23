import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledCheckboxGroupConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["checkbox-group", "checkbox"]);
export const checkboxGroupImports = `import Group, { CheckboxGroup, CheckboxGroupVariants, type CheckboxGroupProps } from "./checkbox-group/index.js";
import Primitive, { CheckboxGroupRoot, type CheckboxGroupValue, type CheckboxGroupValueChangeDetails } from "@starwind-ui/svelte/checkbox-group";
import Checkbox from "./checkbox/index.js";`;
export const checkboxGroupPositive = `<script lang="ts">
${checkboxGroupImports}
import {createAttachmentKey} from "svelte/attachments";
let value=$state<string[]|undefined>();
const props:CheckboxGroupProps={defaultValue:["first"],disabled:false,ref(node){const element:HTMLDivElement|null=node;void element;}};
const attachment={[createAttachmentKey()]:(node:HTMLDivElement)=>{void node.dataset;return()=>{};}};
const values:CheckboxGroupValue=["first"];void [values,CheckboxGroupVariants.checkboxGroup()];
</script>
<Group {...props} {...attachment} bind:value onValueChange={(next,detail)=>{const value:CheckboxGroupValue=next;const details:CheckboxGroupValueChangeDetails=detail;void value;details.cancel();}} onclick={event=>{const element:HTMLDivElement=event.currentTarget;void element;}}><Checkbox id="first" value="first" label="First" /></Group>
<CheckboxGroup defaultValue={[]} />
<Primitive.Root bind:value><Checkbox id="second" value="second" /></Primitive.Root>
<CheckboxGroupRoot ref={(node:HTMLDivElement|null)=>{void node;}} />`;
