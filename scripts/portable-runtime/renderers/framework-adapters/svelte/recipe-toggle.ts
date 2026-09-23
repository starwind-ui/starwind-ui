import { modelOperations } from "../../shared-recipes/structured/operations.js";
import type {
  Kind,
  Projection,
  ToggleOperations,
} from "../../shared-recipes/toggle-selection/recipe.js";
export function toggleOperations(kind: Kind): ToggleOperations {
  return {
    fw: {
      ...modelOperations(
        "svelte",
        kind === "toggle" ? "pressed" : "value",
        kind === "toggle" ? "pressed" : "value",
      ),
      renderAccepted: (_name, next) => `renderedValue=${next};`,
    },
    acceptedRead: "renderedValue",
    groupExists: "toggleGroup!==undefined",
    groupValue: "toggleGroup!.value",
    groupDisabled: "toggleGroup?.disabled===true",
    frame,
  };
}
function frame(kind: Kind, code: string, p: Projection): string {
  const group = kind === "toggle-group",
    factory = group ? "createToggleGroup" : "createToggle",
    model = group ? "value" : "pressed",
    event = group ? "onValueChange" : "onPressedChange",
    detail = group ? "ToggleGroupValueChangeDetails" : "TogglePressedChangeDetails",
    type = group ? "ToggleGroupValue" : "boolean",
    element = group ? "HTMLDivElement" : "HTMLButtonElement | HTMLSpanElement";
  const props = p.props
    .filter((x) => x.name !== "nativeButton")
    .map((x) => `${x.name}?:${x.type};`)
    .join("\n");
  const destructure = p.props
    .map(
      (x) =>
        x.name +
        (x.name === model
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
  const effects = p.commands
    .map((c) => `$effect(()=>{ready;${c.inputs.map((n) => n + ";").join("")}untrack(${c.name});});`)
    .join("\n");
  return `${group ? "" : `<script module lang="ts">export type ToggleGroupContextValue={readonly value:string[];readonly disabled:boolean};export const ToggleGroupContext=Symbol('Starwind Toggle Group');</script>`}
<script lang="ts">import{${factory},type ${detail}${group ? ",type ToggleGroupValue" : ""}}from'@starwind-ui/runtime/${kind}';import{onMount,untrack,${group ? "setContext" : "getContext"},type Snippet}from'svelte';import type{${group ? "HTMLAttributes" : "HTMLAttributes,HTMLButtonAttributes"}}from'svelte/elements';${group ? "import{ToggleGroupContext,type ToggleGroupContextValue}from'../toggle/ToggleRoot.svelte';" : ""}
type RootElement=${element};${group ? "" : `type Owned='children'|'disabled'|'type'|'value'|'aria-pressed'|'role';type SpanProps=Omit<HTMLAttributes<HTMLSpanElement>,Owned>;type ButtonProps=Omit<HTMLButtonAttributes,Owned>;type StrictSpanProps=SpanProps & {[Key in Exclude<keyof ButtonProps,keyof SpanProps>]?:never};`}
type Props=${group ? `Omit<HTMLAttributes<HTMLDivElement>,'children'|'defaultValue'|'onChange'>` : `((ButtonProps & {nativeButton?:true;ref?:(node:HTMLButtonElement|null)=>void})|(StrictSpanProps & {nativeButton:false;ref?:(node:HTMLSpanElement|null)=>void}))`} & {${props}children?:Snippet;${group ? "ref?:(node:HTMLDivElement|null)=>void;" : ""}${event}?:(value:${type},detail:${detail})=>void};let{children,ref,${destructure},${event},...rest}:Props=$props();const initialDefault=untrack(()=>${p.initial});let renderedValue=$state<${type}>(initialDefault),rootElement=$state<RootElement>(),ready=$state(false);const connection:{instance?:ReturnType<typeof ${factory}>;unsubscribe?:()=>void;observer?:MutationObserver;ownDisabled?:boolean;accepted:${type}}={accepted:initialDefault};
${group ? "" : `const toggleGroup=getContext<ToggleGroupContextValue|undefined>(ToggleGroupContext);const isGroupOwned=toggleGroup!==undefined;let groupPressed=$derived(${p.groupPressed});`}
let effectiveDisabled=$derived(${p.disabled});let selected=$derived(${p.selected});${group ? `setContext<ToggleGroupContextValue>(ToggleGroupContext,{get value(){return selected;},get disabled(){return disabled;}});` : ""}${code}
${p.connectPhase === "after-children" ? `onMount(()=>{let alive=true;queueMicrotask(()=>{if(!alive)return;untrack(()=>{if(rootElement)connect(rootElement);ready=true;});});return()=>{alive=false;ready=false;disconnect();};});` : `$effect(()=>{const node=rootElement;${p.reconnect.map((n) => n + ";").join("")}if(!node)return;untrack(()=>connect(node));ready=true;return()=>{ready=false;disconnect();};});`}
${effects}$effect(()=>{const node=rootElement,callback=ref as ((node:RootElement|null)=>void)|undefined;if(!node||!ready)return;untrack(()=>callback?.(node));return()=>untrack(()=>callback?.(null));});
</script><${group ? "div" : `svelte:element this={nativeButton?'button':'span'}`} bind:this={rootElement} {...rest} ${attrs}>{@render children?.()}</${group ? "div" : "svelte:element"}>`;
}
