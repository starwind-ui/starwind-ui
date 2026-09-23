import type { SliderProjection } from "../../shared-recipes/structured/range/frame.js";
export const svelteSliderProjection: SliderProjection = {
  operations: {
    authority: "binding",
    read: (name) => name,
    render: (value) => `localValue=${value};`,
    publish: (next) => `if(!valuesEqual(value,${next}))value=${next};`,
    notify: (event, value, detail) =>
      `${event === "valueChange" ? "onValueChange" : "onValueCommitted"}?.(${value},${detail});`,
    untrack: (body) => `untrack(()=>{${body}});`,
  },
  renderRead: (name) => name,
  attribute: (name, value) => `${name}={${value}}`,
  print: ({
    facts: f,
    props,
    attributes,
    connection,
    inputs,
    initialDefault,
    initialModel,
  }) => `<script lang="ts">
import{tick,untrack,type Snippet}from 'svelte';import type{Attachment}from 'svelte/attachments';import type{HTMLAttributes}from 'svelte/elements';
import{createSlider,type SliderValue,type SliderOrientation,type SliderValueChangeDetails,type SliderValueCommitDetails}from '${f.runtime.importSource}';
import{createRefAttachment}from '../_internal/ref-attachment.js';
type Props=Omit<HTMLAttributes<HTMLDivElement>,'children'>&{${props.map((p) => `${p.name}?:${p.type};`).join("")}children?:Snippet<[SliderValue]>;ref?:(node:HTMLDivElement|null)=>void;onValueChange?:(value:SliderValue,detail:SliderValueChangeDetails)=>void;onValueCommitted?:(value:SliderValue,detail:SliderValueCommitDetails)=>void;};
let{${props.map((p) => (p.name === "value" ? "value=$bindable()" : `${p.name}${p.defaultValue === undefined ? "" : `=${p.defaultValue}`}`)).join(",")},children,ref,onValueChange,onValueCommitted,...rest}:Props=$props();
const initialDefaultValue=untrack(()=>${initialDefault});let localValue=$state<SliderValue>(untrack(()=>${initialModel}));let renderedValue=$derived(localValue);
${connection}
const attachRuntime:Attachment<HTMLDivElement>=root=>{const connection=untrack(()=>connectSlider(root));
$effect(()=>{void[${inputs.join(",")}];untrack(connection.syncOptions);});
$effect(()=>{void value;untrack(connection.syncModel);});
$effect(()=>{void renderedValue;void tick().then(connection.refresh);});
return connection.destroy;};const attachRef=createRefAttachment<HTMLDivElement>(()=>ref);
</script><div {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>{@render children?.(copyValue(renderedValue))}</div>`,
};
