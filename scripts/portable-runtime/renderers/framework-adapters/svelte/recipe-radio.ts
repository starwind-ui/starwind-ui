import type {
  RadioIndicatorPolicy,
  RadioOperations,
  RadioProjection,
} from "../../shared-recipes/grouped/radio.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const radioOperations: RadioOperations = {
  fw: {
    ...modelOperations("svelte", "checked", "checked"),
    renderAccepted: (_name, next) => `renderedValue=${next};`,
  },
  acceptedRenderMode: "cached-cell",
  acceptedRead: "renderedValue",
  groupValue: (name) => `group?.${name}`,
  frame,
  indicator,
};
const attributes = (entries: [string, string][]) =>
  entries
    .map(([name, value]) =>
      value.startsWith('"') && value.endsWith('"') ? `${name}=${value}` : `${name}={${value}}`,
    )
    .join(" ");
function frame(code: string, p: RadioProjection): string {
  const destructure = p.props
    .map(
      (x) =>
        x.name +
        (x.name === "checked"
          ? "=$bindable()"
          : x.name !== "defaultChecked" && x.defaultValue !== undefined
            ? "=" + x.defaultValue
            : ""),
    )
    .join(",");
  const input = `<input ${attributes(p.input)} style="${p.inputStyle.map(([name, value]) => `${name}:${value};`).join("")}"/>`;
  return `<script lang="ts">import{createRadio,type RadioCheckedChangeDetails}from'@starwind-ui/runtime/radio';import{getContext,untrack,type Snippet}from'svelte';import type{HTMLAttributes,HTMLButtonAttributes}from'svelte/elements';import{RadioGroupContext,type RadioGroupContextValue}from'./RadioGroupContext.svelte.js';type RootElement=HTMLSpanElement|HTMLButtonElement;type Owned='children'|'disabled'|'form'|'id'|'name'|'readonly'|'required'|'type'|'value'|'role'|'aria-checked';type SpanProps=Omit<HTMLAttributes<HTMLSpanElement>,Owned>;type ButtonProps=Omit<HTMLButtonAttributes,Owned>;type StrictSpanProps=SpanProps & {[Key in Exclude<keyof ButtonProps,keyof SpanProps>]?:never};type Props={${p.props
    .filter((x) => x.name !== "nativeButton")
    .map((x) => `${x.name}${x.required ? "" : "?"}:${x.type};`)
    .join(
      "\n",
    )}children?:Snippet;onCheckedChange?:(checked:boolean,detail:RadioCheckedChangeDetails)=>void}&((StrictSpanProps & {nativeButton?:false;ref?:(element:HTMLSpanElement|null)=>void})|(ButtonProps & {nativeButton:true;ref?:(element:HTMLButtonElement|null)=>void}));let{children,ref,${destructure},onCheckedChange,...rest}:Props=$props();const group=getContext<RadioGroupContextValue|undefined>(RadioGroupContext);${p.functions.map(([name, expression]) => `function ${name}(){return ${expression};}`).join("\n")}
const initialChecked=untrack(()=>${p.initial});const resetSeed=untrack(()=>${p.seed});let renderedValue=$state(initialChecked),rootElement=$state<RootElement>();const connection:{instance?:ReturnType<typeof createRadio>;accepted:boolean;unsubscribe?:()=>void;unsubscribeSync?:()=>void;disabled?:boolean;readOnly?:boolean}={accepted:initialChecked};let selected=$derived(${p.selected});${code}
$effect(()=>{const root=rootElement;${p.reconnect.map((n) => n + ";").join("")}if(!root)return;untrack(()=>connect(root));return disconnect;});${p.commands.map((c) => `$effect(()=>{${c.inputs.map((n) => n + ";").join("")}${c.phase === "after-parent" ? `queueMicrotask(()=>untrack(${c.name}));` : `untrack(${c.name});`}});`).join("\n")}
$effect(()=>{const node=rootElement,callback=ref as ((node:RootElement|null)=>void)|undefined;if(!node)return;untrack(()=>callback?.(node));return()=>untrack(()=>callback?.(null));});
</script><svelte:element this={${p.element}} bind:this={rootElement} {...rest} ${attributes(p.attrs)}>{@render children?.()}{#if ${p.inputInside}}${input}{/if}</svelte:element>{#if ${p.inputOutside}}${input}{/if}`;
}
function indicator(p: RadioIndicatorPolicy): string {
  return `<script lang="ts">import{untrack,type Snippet}from'svelte';import type{HTMLAttributes}from'svelte/elements';type Props=Omit<HTMLAttributes<HTMLSpanElement>,'children'>&{children?:Snippet;keepMounted?:boolean;ref?:(element:HTMLSpanElement|null)=>void};let{children,ref,keepMounted=false,...rest}:Props=$props();let element=$state<HTMLSpanElement>();$effect(()=>{const node=element,callback=ref;if(!node)return;untrack(()=>callback?.(node));return()=>untrack(()=>callback?.(null));});</script><${p.element} {...rest} bind:this={element} ${p.marker}="" data-sw-part="${p.part}" ${p.keepMounted}={keepMounted?'':undefined} ${p.unchecked}="" hidden={${p.initialHidden}}>{@render children?.()}</${p.element}>`;
}
