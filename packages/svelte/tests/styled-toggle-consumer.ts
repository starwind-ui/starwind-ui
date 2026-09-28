import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledToggleConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["toggle", "toggle-group"]);
export const togglePositive = `<script lang="ts">
import Toggle,{Toggle as NamedToggle,ToggleVariants,type ToggleProps} from "./toggle/index.js";
import Group,{ToggleGroup,ToggleGroupItem,ToggleGroupVariants,type ToggleGroupProps,type ToggleGroupItemProps} from "./toggle-group/index.js";
import {ToggleRoot,type TogglePressedChangeDetails} from "@starwind-ui/svelte/toggle";
import {ToggleGroupRoot,type ToggleGroupValueChangeDetails} from "@starwind-ui/svelte/toggle-group";
let pressed=$state<boolean|undefined>(),value=$state<string[]|undefined>();
void [ToggleVariants.toggle({variant:"outline",size:"lg"}),ToggleGroupVariants.toggleGroup(),ToggleGroupVariants.toggleGroupItem({variant:"outline"})];
const props:ToggleProps={nativeButton:true,ref(node){const button:HTMLButtonElement|null=node;void button;}};
const group:ToggleGroupProps={spacing:0,style:"--gap: 2",multiple:true};const item:ToggleGroupItemProps={nativeButton:false,ref(node){const span:HTMLSpanElement|null=node;void span;}};
</script><Toggle {...props} bind:pressed onPressedChange={(next,detail)=>{const d:TogglePressedChangeDetails=detail;void next;d.cancel();}}>Bold</Toggle><Group.Root {...group} bind:value onValueChange={(next,detail)=>{const d:ToggleGroupValueChangeDetails=detail;const v:string[]=next;void v;d.cancel();}}><Group.Item {...item}>A</Group.Item><Group.Item value="b" /></Group.Root><NamedToggle/><ToggleGroup><ToggleGroupItem/></ToggleGroup><ToggleRoot syncGroup="sync"/><ToggleGroupRoot />`;
