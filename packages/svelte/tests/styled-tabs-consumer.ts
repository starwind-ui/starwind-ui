import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledTabsConsumer = (root: string) =>
  createStyledNativeConsumer(root, ["tabs"]);
const imports = `import Tabs,{Tabs as StyledTabs,TabsList,TabsTrigger,TabsContent,TabsVariants,type TabsProps} from "./tabs/index.js";import Primitive,{type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from "@starwind-ui/svelte/tabs";import {createTabs} from "@starwind-ui/runtime/tabs";import {createAttachmentKey} from "svelte/attachments";`;
export const tabsPositive = `<script lang="ts">${imports}
let value=$state<TabsValue>();const orientation:TabsOrientation="horizontal";
const props:TabsProps={defaultValue:null,orientation,syncKey:"preferences",onValueChange(next,details){const value:TabsValue=next;const detail:TabsValueChangeDetails=details;detail.cancel();detail.allowPropagation();void [value,detail.reason,detail.activationDirection];},ref(node){const element:HTMLDivElement|null=node;if(element)createTabs(element).setValue("",{emit:false,sync:true});}};
const attached={[createAttachmentKey()]:(node:HTMLButtonElement)=>{void node.disabled;return()=>{};}};void [TabsVariants.tabs(),TabsVariants.tabsList(),TabsVariants.tabsTrigger(),TabsVariants.tabsContent()];
</script>
<Tabs.Root {...props} bind:value>{#snippet children(accepted)}<output>{accepted}</output><Tabs.List activateOnFocus loopFocus={false}><Tabs.Trigger value="" {...attached} ref={(node:HTMLButtonElement|null)=>{}} onclick={event=>{const button:HTMLButtonElement=event.currentTarget;void button;}}>{#snippet children(active)}{active?"Selected":"Empty"}{/snippet}</Tabs.Trigger><Tabs.Trigger value="other" disabled>Other</Tabs.Trigger></Tabs.List><Tabs.Content value="" keepMounted>{#snippet children(active)}{active?"Visible":"Hidden"}{/snippet}</Tabs.Content>{/snippet}</Tabs.Root>
<StyledTabs defaultValue="a"><TabsList><TabsTrigger value="a">A</TabsTrigger></TabsList><TabsContent value="a">Content</TabsContent></StyledTabs>
<Primitive.Root value={null}><Primitive.List><Primitive.Tab value="a">A</Primitive.Tab><Primitive.Indicator ref={(node:HTMLSpanElement|null)=>{}}/></Primitive.List><Primitive.Panel value="a">A content</Primitive.Panel></Primitive.Root>`;
