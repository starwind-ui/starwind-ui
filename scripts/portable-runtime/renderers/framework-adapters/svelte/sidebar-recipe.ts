import type { SidebarProjection } from "../../shared-recipes/structured/sidebar/types.js";
import { printSvelteRefAttachment } from "./attachments.js";

const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export const svelteSidebarProjection: SidebarProjection = {
  read: (name) => name,
  initial: (expression) => `untrack(()=>${expression})`,
  state: (name, initial) => `let accepted${upper(name)}=$state(${initial});`,
  readState: (name) => `accepted${upper(name)}`,
  writeState: (name, value) => `accepted${upper(name)}=${value};`,
  attribute: (name, value) => `${name}={${value}}`,
  print: ({
    facts: f,
    plan,
    props,
    fields,
    callbacks,
    initial,
    cells,
    controller,
    lifecycle,
    media,
    context,
    attributes,
  }) => `<script lang="ts">
import {${f.runtime.factory},type ${f.types.openDetails},type ${f.types.mobileOpenDetails},type ${f.types.persistenceStorage}} from '${f.runtime.importSource}';
import {setContext,untrack,type Snippet} from 'svelte';
import type {Attachment} from 'svelte/attachments';
import type {HTMLAttributes} from 'svelte/elements';
import {${f.context.name},type ${f.context.typeName}} from './${f.context.name}.js';
type Props=Omit<HTMLAttributes<HTMLDivElement>,'children'> & {${fields}${callbacks}children?:Snippet;ref?:(element:HTMLDivElement|null)=>void;};
let {children,ref,${props.map((p) => `${p.name}${plan.models.includes(p.name as any) ? "=$bindable()" : p.defaultValue ? `=${p.defaultValue}` : ""}`).join(",")},${plan.models.map((name) => f.events[name].callbackProp).join(",")},...rest}:Props=$props();
${initial}
${cells}
${controller}
${lifecycle}
${media}
const context:${f.context.typeName}={${Object.entries(context)
    .map(([name, value]) => `get ${name}(){return ${value};}`)
    .join(",")},setMobileOpen(next){acceptMobile(next);}};setContext(${f.context.name},context);
const attachRuntime:Attachment<HTMLDivElement>=(root)=>{
$effect(()=>connectMedia(${plan.media.input}));
$effect(()=>{${plan.constructorInputs.map((name) => `void ${name};`).join("")}untrack(()=>connectRuntime(root));return()=>untrack(disconnectRuntime);});
$effect(()=>{${plan.models.map((name) => `void ${name};`).join("")}untrack(applyParentCommand);});
};
${printSvelteRefAttachment("HTMLDivElement")}
</script>
<div {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>{@render children?.()}</div>`,
};
