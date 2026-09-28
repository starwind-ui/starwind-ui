import type { GroupOperations, GroupProjection } from "../../shared-recipes/grouped/groups.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const groupOperations: GroupOperations = {
  fw: {
    ...modelOperations("svelte", "value", "value"),
    renderAccepted: (_name, next) => `renderedValue=${next};`,
  },
  acceptedRenderMode: "cached-cell",
  acceptedRead: "renderedValue",
  frame,
};
function frame(code: string, p: GroupProjection): string {
  if (p.connectPhase !== "after-children" || p.commandPhase !== "after-children")
    throw new Error("Form group frame requires children before connection and commands");
  const destructure = p.props
    .map(
      (x) =>
        x.name +
        (x.name === "value"
          ? "=$bindable()"
          : x.defaultValue !== undefined
            ? "=" + x.defaultValue
            : ""),
    )
    .join(",");
  const attrs = p.attrs
    .map(([name, value]) =>
      value.startsWith('"') && value.endsWith('"') ? `${name}=${value}` : `${name}={${value}}`,
    )
    .join(" ");
  const contextSource = p.kind === "radio-group" ? "radio" : "checkbox";
  return `<script lang="ts">import{${p.factory},type ${p.type},type ${p.details}}from'@starwind-ui/runtime/${p.kind}';import{onMount,setContext,untrack,type Snippet}from'svelte';import type{HTMLAttributes}from'svelte/elements';import{${p.name}Context,type ${p.name}ContextValue}from'../${contextSource}/${p.name}Context.svelte.js';type Props=Omit<HTMLAttributes<HTMLDivElement>,'children'|'defaultValue'|'onChange'>&{${p.props.map((x) => `${x.name}?:${x.type};`).join("\n")}children?:Snippet;ref?:(node:HTMLDivElement|null)=>void;onValueChange?:(value:${p.callbackType},detail:${p.details})=>void};let{children,ref,${destructure},onValueChange,...rest}:Props=$props();const resetSeed=untrack(()=>${p.seed});const initialValue=untrack(()=>${p.initial});let renderedValue=$state<${p.type}>(initialValue),rootElement=$state<HTMLDivElement>(),ready=$state(false);const connection:{instance?:ReturnType<typeof ${p.factory}>;accepted:${p.type};unsubscribe?:()=>void;unsubscribeSync?:()=>void;observer?:MutationObserver}={accepted:initialValue};let selected=$derived(${p.selected});${code}
setContext<${p.name}ContextValue>(${p.name}Context,{${p.context.map(([name, expression]) => `get ${name}(){return ${expression};}`).join(",")}});onMount(()=>{let alive=true;queueMicrotask(()=>{if(!alive)return;untrack(()=>{if(rootElement)connect(rootElement);ready=true;});});return()=>{alive=false;ready=false;disconnect();};});${p.commands.map((c) => `$effect(()=>{ready;${c.inputs.map((n) => n + ";").join("")}untrack(${c.name});});`).join("\n")}
$effect(()=>{const node=rootElement,callback=ref;if(!node||!ready)return;untrack(()=>callback?.(node));return()=>untrack(()=>callback?.(null));});</script><${p.element} bind:this={rootElement} {...rest} ${attrs}>{@render children?.()}</${p.element}>`;
}
