import type { TabsOperations } from "../../shared-recipes/selection/tabs.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const tabsOperations: TabsOperations = {
  acceptedRead: "renderedValue",
  fw: {
    ...modelOperations("svelte", "value", "value"),
    renderAccepted: (_name, next) => `renderedValue=${next};`,
  },
  root(code, projection) {
    const initial = projection.initial
      .map((item) => `const ${item.name}=untrack(()=>${item.expression});`)
      .join("\n");
    const attrs = projection.attrs.map(([name, expression]) => `${name}={${expression}}`).join(" ");
    return `<script lang="ts">import {onMount,untrack,type Snippet} from 'svelte';import type {HTMLAttributes} from 'svelte/elements';import {createTabs,type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from '@starwind-ui/runtime/tabs';import {setTabsContext} from './TabsContext';
 type Props=Omit<HTMLAttributes<HTMLDivElement>,'children'> & {children?:Snippet<[TabsValue]>;value?:TabsValue;defaultValue?:TabsValue;orientation?:TabsOrientation;syncKey?:string;onValueChange?:(value:TabsValue,detail:TabsValueChangeDetails)=>void;ref?:(element:HTMLDivElement|null)=>void};let {children,value=$bindable(),defaultValue,orientation='horizontal',syncKey,onValueChange,ref,...rest}:Props=$props();${initial}let renderedValue=$state<TabsValue>(untrack(()=>${projection.seed}));let selected=$derived(${projection.selected});let rootElement=$state<HTMLDivElement>(),ready=$state(false),revision=$state(0);const connection:{instance?:ReturnType<typeof createTabs>;unsubscribe?:()=>void}={};setTabsContext({get value(){return renderedValue;},get orientation(){return orientation;},refresh(){revision+=1;}});
 ${code}
 onMount(()=>{if(rootElement)untrack(()=>connect(rootElement!));ready=true;return()=>{ready=false;disconnect();};});$effect(()=>{ready;value;untrack(applyParent);});$effect(()=>{ready;${projection.refreshInputs.join(";")};revision;untrack(refresh);});$effect(()=>{const element=rootElement,callback=ref;if(!element)return;untrack(()=>callback?.(element));return()=>untrack(()=>callback?.(null));});
 </script><div bind:this={rootElement} {...rest} ${attrs}>{@render children?.(renderedValue)}</div>`;
  },
  part(plan) {
    const name = "Tabs" + plan.part[0]!.toUpperCase() + plan.part.slice(1);
    const element =
      plan.tag === "button"
        ? "HTMLButtonElement"
        : plan.tag === "span"
          ? "HTMLSpanElement"
          : "HTMLDivElement";
    const native = plan.tag === "button" ? "HTMLButtonAttributes" : `HTMLAttributes<${element}>`;
    const fields = plan.props
      .map((p) => `${p.name}${p.default !== undefined ? "?" : ""}:${p.type}`)
      .join(";");
    const attrs = plan.attrs
      .map(([name, expr]) =>
        expr.startsWith('"') && expr.endsWith('"')
          ? `${name}=${expr}`
          : `${name}={${expr.replace(/\borientation\b/g, "context.orientation")}}`,
      )
      .join(" ");
    return `<script lang="ts">import {untrack,type Snippet} from 'svelte';import type {Attachment} from 'svelte/attachments';import type {${plan.tag === "button" ? "HTMLButtonAttributes" : "HTMLAttributes"}} from 'svelte/elements';import {createRefAttachment} from '../_internal/ref-attachment.js';import {getTabsContext} from './TabsContext';type Props=Omit<${native},'children'${plan.props.map((p) => "|" + JSON.stringify(p.name)).join("")}> & {${fields}${fields ? ";" : ""}children?:Snippet${plan.children === "active" ? "<[boolean]>" : ""};ref?:(element:${element}|null)=>void};let {children,ref,${plan.props.map((p) => p.name + (p.default !== undefined ? "=" + p.default : "")).join(",")}${plan.props.length ? "," : ""}...rest}:Props=$props();const context=getTabsContext('${name}');${plan.active ? "let active=$derived(context.value===value);" : ""}const attachRef=createRefAttachment<${element}>(()=>ref);const attachPart:Attachment<${element}>=()=>{$effect(()=>{${plan.refreshInputs.map((n) => n + ";").join("")}untrack(()=>context.refresh());});return()=>untrack(()=>context.refresh());};</script><${plan.tag} {...rest} ${attrs} {@attach attachPart} {@attach attachRef}>{@render children?.(${plan.children === "active" ? "active" : ""})}</${plan.tag}>`;
  },
};
