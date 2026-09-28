import { assertBooleanStatePolicy } from "../../primitive-output-model/boolean-state-policy.js";
import { renderFormRoot } from "../../shared-recipes/structured/forms/root.js";
import type {
  AdapterBooleanFormControlFacts,
  AdapterComponentFile,
  AdapterIndexFile,
  AdapterPrintedFile,
} from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteSwitchIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "boolean-form-control")
    throw new TypeError("Switch requires boolean form-control facts.");
  const facts = file.family.facts;
  return {
    path: file.path,
    contents: `import ${facts.exports.root} from "./${facts.exports.root}.svelte";
import ${facts.exports.stateIndicator} from "./${facts.exports.stateIndicator}.svelte";
const ${facts.exports.namespace} = {Root:${facts.exports.root},Thumb:${facts.exports.stateIndicator}};
export {${facts.exports.namespace},${facts.exports.root},${facts.exports.stateIndicator}};
export default ${facts.exports.namespace};
`,
  };
}
export function printSvelteSwitchComponent(file: AdapterComponentFile): AdapterPrintedFile {
  if (
    file.component.family?.kind === "boolean-form-control" &&
    file.component.family.part === "root"
  )
    return { path: `${file.path}.svelte`, contents: renderFormRoot("Switch", "svelte") };
  const family = file.component.family;
  if (
    family?.kind !== "boolean-form-control" ||
    family.facts.runtime.factory !== "createSwitch" ||
    !family.facts.parts.stateIndicator ||
    !family.facts.parts.uncheckedInput ||
    !family.facts.input.refProp
  )
    throw new TypeError("Switch requires its root, thumb and form input facts.");
  assertBooleanStatePolicy(family.facts);
  return {
    path: `${file.path}.svelte`,
    contents: family.part === "root" ? printRoot(family.facts) : printThumb(family.facts),
  };
}
function printRoot(facts: AdapterBooleanFormControlFacts): string {
  return `<script lang="ts">
import {${facts.runtime.factory},type ${facts.event.detailsType}} from "${facts.runtime.importSource}";
import {untrack,type Snippet} from "svelte";
import type {Attachment} from "svelte/attachments";
import type {HTMLAttributes,HTMLButtonAttributes} from "svelte/elements";
type RootElement=HTMLSpanElement|HTMLButtonElement;
type Owned="children"|"disabled"|"form"|"id"|"name"|"readonly"|"required"|"type"|"value"|"role"|"aria-checked";
type SpanProps=Omit<HTMLAttributes<HTMLSpanElement>,Owned>;
type ButtonProps=Omit<HTMLButtonAttributes,Owned>;
type StrictSpanProps=SpanProps & {[Key in Exclude<keyof ButtonProps,keyof SpanProps>]?:never};
type Props={children?:Snippet;checked?:boolean;defaultChecked?:boolean;disabled?:boolean;form?:string;id?:string;name?:string;readOnly?:boolean;required?:boolean;uncheckedValue?:string;value?:string;inputRef?:(element:HTMLInputElement|null)=>void;onCheckedChange?:(checked:boolean,detail:${facts.event.detailsType})=>void} & (
  (StrictSpanProps & {nativeButton?:false;ref?:(element:HTMLSpanElement|null)=>void}) |
  (ButtonProps & {nativeButton:true;ref?:(element:HTMLButtonElement|null)=>void})
);
let {children,checked=$bindable(),defaultChecked,disabled=false,form,id,name,nativeButton=false,onCheckedChange,readOnly=false,ref,inputRef,required=false,uncheckedValue,value,...rest}:Props=$props();
const initialModel=untrack(()=>checked), initialDefault=untrack(()=>defaultChecked);
const resetSeed=initialDefault??initialModel??false;
const initialChecked=initialModel??resetSeed;
let renderedChecked=$state(initialChecked),initialized=false;
let rootRef=$derived(ref as ((element:RootElement|null)=>void)|undefined);
${printSvelteRefAttachment("RootElement", "rootRef")}
${printSvelteRefAttachment("HTMLInputElement", "inputRef", "attachInputRef")}
const attachRuntimeInput:Attachment<HTMLInputElement>=(input)=>{
  const root=untrack(()=>nativeButton?input.previousElementSibling:input.parentElement) as RootElement|null;
  if(!(root instanceof HTMLElement))throw new TypeError("Switch input requires its semantic owner.");
  let connectionOptions=$state.raw(untrack(()=>({id,readOnly})));
  function updateConnectionOptions(next={id,readOnly}){
    if(next.id!==connectionOptions.id||next.readOnly!==connectionOptions.readOnly)connectionOptions=next;
  }
  $effect(()=>{const next={id,readOnly};untrack(()=>updateConnectionOptions(next));});
  $effect(()=>{
    const {id:connectionId,readOnly:connectionReadOnly}=connectionOptions;
    let alive=true,resetForm:HTMLFormElement|null=null,resetTimer:number|undefined;
    const instance=untrack(()=>${facts.runtime.factory}(root,{defaultChecked:resetSeed,disabled,form,id:connectionId,name,readOnly:connectionReadOnly,required,uncheckedValue,value,onCheckedChange:handleChange}));
    function synchronize(next:boolean){if(instance.${facts.state.getter}()!==next)instance.${facts.setters.state.method}(next,{emit:false});renderedChecked=instance.${facts.state.getter}();}
    function publish(){renderedChecked=instance.${facts.state.getter}();if(checked!==renderedChecked)checked=renderedChecked;}
    function handleChange(next:boolean,detail:${facts.event.detailsType}){onCheckedChange?.(next,detail);}
    untrack(()=>{synchronize(renderedChecked);if(!initialized){initialized=true;publish();}});
    const unsubscribe=instance.subscribe("${facts.event.name}",(detail)=>{if(alive&&!detail.isCanceled)untrack(publish);});
    function clearReset(){if(resetTimer!==undefined){window.clearTimeout(resetTimer);resetTimer=undefined;}}
    function handleReset(event:Event){
      clearReset();resetTimer=window.setTimeout(()=>{resetTimer=undefined;if(alive&&!event.defaultPrevented)untrack(publish);},0);
    }
    function bindReset(){const next=input.form;if(next===resetForm)return;resetForm?.removeEventListener("reset",handleReset);resetForm=next;resetForm?.addEventListener("reset",handleReset);}
    bindReset();
    $effect(()=>{const next=checked;if(next!==undefined)untrack(()=>synchronize(next));});
    let appliedDisabled=untrack(()=>disabled);
    $effect(()=>{const next=disabled;if(next===appliedDisabled)return;appliedDisabled=next;instance.${facts.setters.disabled.method}(next);});
    $effect(()=>{const options={form,name,required,uncheckedValue,value};untrack(()=>{instance.setFormOptions(options);bindReset();});});
    return()=>{alive=false;unsubscribe();clearReset();resetForm?.removeEventListener("reset",handleReset);instance.destroy();const unchecked=input.nextElementSibling;if(unchecked instanceof HTMLInputElement&&unchecked.hasAttribute("${facts.parts.uncheckedInput!.discoveryAttribute}"))unchecked.remove();};
  });
};
</script>
<svelte:element this={nativeButton?"${facts.render.nativeElement}":"${facts.render.nonNativeElement}"} {...rest}
  ${facts.attrs.root}="" ${facts.attrs.defaultState}={resetSeed?"true":undefined}
  ${facts.attrs.form}={form} ${facts.attrs.id}={id} ${facts.attrs.name}={name} ${facts.attrs.value}={value} ${facts.attrs.uncheckedValue}={uncheckedValue}
  id={nativeButton?id:undefined} role="${facts.render.role}" aria-checked={renderedChecked} aria-disabled={disabled?"true":undefined}
  ${facts.attrs.ariaReadOnly}={readOnly?"true":undefined} ${facts.attrs.ariaRequired}={required?"true":undefined}
  ${facts.attrs.truthyPresence}={renderedChecked?"":undefined} ${facts.attrs.falsyPresence}={!renderedChecked?"":undefined} ${facts.attrs.filled}={renderedChecked?"":undefined}
  ${facts.attrs.disabled}={disabled?"":undefined} ${facts.attrs.readOnly}={readOnly?"":undefined} ${facts.attrs.required}={required?"":undefined}
  disabled={nativeButton?disabled:undefined} type={nativeButton?"button":undefined} tabindex={disabled?-1:0}
  {@attach attachRef}>
  {@render children?.()}
  {#if !nativeButton}
    <input ${facts.attrs.input}="" type="${facts.input.type}" aria-hidden="true" tabindex="-1" checked={initialChecked} {disabled} {form} {id} {name} {required} {value} style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;" {@attach attachRuntimeInput} {@attach attachInputRef}/>
  {/if}
</svelte:element>
{#if nativeButton}
  <input ${facts.attrs.input}="" type="${facts.input.type}" aria-hidden="true" tabindex="-1" checked={initialChecked} {disabled} {form} id={id?\`\${id}-input\`:undefined} {name} {required} {value} style="position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0;" {@attach attachRuntimeInput} {@attach attachInputRef}/>
{/if}
`;
}
function printThumb(facts: AdapterBooleanFormControlFacts): string {
  return `<script lang="ts">
import {untrack,type Snippet} from "svelte";
import type {HTMLAttributes} from "svelte/elements";
type Props=Omit<HTMLAttributes<HTMLSpanElement>,"children"> & {children?:Snippet;ref?:(element:HTMLSpanElement|null)=>void};
let {children,ref,...rest}:Props=$props();
${printSvelteRefAttachment("HTMLSpanElement")}
</script>
<span {...rest} ${facts.parts.stateIndicator!.discoveryAttribute}="" {@attach attachRef}>{@render children?.()}</span>
`;
}
