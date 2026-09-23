import type { TimedRootProjection } from "../../shared-recipes/structured/timed/frame.js";
import { svelteNativeRootProjection } from "./native-recipe-root.js";
export const svelteTimedRoot: TimedRootProjection = {
  read: (name) => name,
  initial: svelteNativeRootProjection.initialCell,
  attribute: svelteNativeRootProjection.attribute,
  observe: (inputs, body) => `$effect(()=>{void [${inputs.join(", ")}];untrack(()=>{${body}});});`,
  print: ({
    facts: f,
    plan,
    props,
    fields,
    initial,
    accepted,
    controller,
    lifecycle,
    attributes,
    placement,
    connectSurface,
    disabledSync,
    observeModel,
  }) => {
    return `<script module lang="ts">
import {getContext} from 'svelte';
type TimedOverlayContext={readonly mounted:boolean;registerPlacement(element:HTMLElement,attributes:Record<string,string>|null):void;registerPortal(owner:symbol,element:HTMLElement|null,authoredParent?:HTMLElement,prepare?:()=>()=>void):void};
const timedOverlayContext=Symbol('${plan.component} part context');
export function getTimedOverlayContext():TimedOverlayContext|undefined{return getContext(timedOverlayContext);}
</script>
<script lang="ts">
import {createPortalBinding,readyPortalBindingSnapshot,${f.runtime.factory},type ${plan.proposal.details}} from '${f.runtime.importSource}';
import {setContext,untrack,type Snippet} from 'svelte';
import type {Attachment} from 'svelte/attachments';
import type {HTMLAttributes} from 'svelte/elements';
import {createRefAttachment} from '../_internal/ref-attachment.js';
type Props=Omit<HTMLAttributes<HTMLDivElement>,'children'>&{${fields} children?:Snippet<[boolean]>;ref?:(element:HTMLDivElement|null)=>void;onOpenChange?:(open:boolean,detail:${plan.proposal.details})=>void};
let {${props.map((p) => (p.name === "open" ? "open=$bindable()" : `${p.name}${p.defaultValue ? `=${p.defaultValue}` : ""}`)).join(", ")},children,ref,onOpenChange,...rest}:Props=$props();
${initial}
${accepted}
${controller}
${placement}
let mounted=$state(false);
const portals=new Map<symbol,{wrapper:HTMLElement;authoredParent:HTMLElement;prepare?:()=>()=>void}>();
let binding:ReturnType<typeof createPortalBinding>|undefined,bindingRoot:HTMLDivElement|undefined;
setContext<TimedOverlayContext>(timedOverlayContext,{get mounted(){return mounted;},
registerPlacement,
registerPortal(owner,element,authoredParent,prepare){if(element&&authoredParent)portals.set(owner,{wrapper:element,authoredParent,prepare});else portals.delete(owner);binding?.publish(readyPortalBindingSnapshot(bindingRoot!,[...portals.values()]));}
});
${lifecycle}
${connectSurface}
const attachRuntime:Attachment<HTMLDivElement>=root=>{
bindingRoot=root;binding=createPortalBinding(root);binding.publish(readyPortalBindingSnapshot(root,[...portals.values()]));mounted=true;
$effect(()=>{void [${plan.constructorInputs.join(", ")}];untrack(()=>{${plan.surface.requirePortal ? `if(portals.size===0)throw new Error("Starwind UI: <${plan.component}.Portal> is missing.");` : ""}connectSurface(root);});return disconnectRuntime;});
${observeModel}
${disabledSync}
return ()=>{mounted=false;binding?.destroy();binding=undefined;bindingRoot=undefined;};
};
const attachRef=createRefAttachment<HTMLDivElement>(()=>ref);
</script>
<div {...rest} ${attributes} {@attach attachRuntime} {@attach attachRef}>{@render children?.(renderedOpen)}</div>
`;
  },
};
