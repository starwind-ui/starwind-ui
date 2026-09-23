import type { TimedRootProjection } from "../../shared-recipes/structured/timed/frame.js";
import { vueNativeRootProjection } from "./native-recipe-root.js";
export const vueTimedRoot: TimedRootProjection = {
  read: (name) => `props.${name}`,
  initial: vueNativeRootProjection.initialCell,
  attribute: vueNativeRootProjection.attribute,
  observe: (inputs, body) =>
    `watch([${inputs.map((name) => `()=>props.${name}`).join(", ")}],()=>{${body}},{flush:'post'});`,
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
  }) => `<script lang="ts">
import type { InjectionKey,Ref } from 'vue';
export type ${plan.component}ContextValue={element:Readonly<Ref<HTMLElement|null>>;mounted:Readonly<Ref<boolean>>;registerPortal(owner:symbol,element:HTMLElement|null):void;registerPlacement(element:HTMLElement,attributes:Record<string,string>|null):void};
export const ${plan.component}Context:InjectionKey<${plan.component}ContextValue>=Symbol('${plan.component}Context');
</script>
<script setup lang="ts">
import { ${f.runtime.factory},type ${plan.proposal.details} } from '${f.runtime.importSource}';
import { computed,nextTick,onBeforeUnmount,onMounted,provide,ref,useAttrs,watch } from 'vue';
import { useVueAsChildRuntimeOwner } from '../_internal/as-child';
defineOptions({inheritAttrs:false});
const props=withDefaults(defineProps<{${fields}}>(),{${props.map((p) => `${p.name}:${p.defaultValue ?? "undefined"}`).join(", ")}});
const emit=defineEmits<{openChange:[open:boolean,detail:${plan.proposal.details}];'update:open':[open:boolean]}>();
defineSlots<{default?:()=>unknown}>();
const attrs=useAttrs(),rootRef=ref<HTMLDivElement|null>(null),mounted=ref(false);
${initial}
${accepted}
${controller}
${placement}
const renderedOpen=computed(()=>props.open??uncontrolledOpen.value);
const portals=new Set<symbol>();
let disposed=false,generation=0;
provide(${plan.component}Context,{element:rootRef,mounted,registerPlacement,registerPortal(owner,element){if(element)portals.add(owner);else portals.delete(owner);}});
defineExpose({element:rootRef});
${lifecycle}
${connectSurface}
function connectMountedRoot(): void { const root=rootRef.value;if(!root)return;${plan.surface.requirePortal ? `if(portals.size===0)throw new Error("Starwind UI: <${plan.component}.Portal> is missing.");` : ""}connectSurface(root); }
async function reconnectRuntime():Promise<void>{ const current=++generation;disconnectRuntime();mounted.value=false;await nextTick();if(disposed||current!==generation)return;connectMountedRoot();mounted.value=true; }
useVueAsChildRuntimeOwner(rootRef,reconnectRuntime);
onMounted(()=>{connectMountedRoot();mounted.value=true;});
watch([${plan.constructorInputs.map((name) => `()=>props.${name}`).join(", ")}],()=>{void reconnectRuntime();},{flush:'post'});
${observeModel}
${disabledSync}
onBeforeUnmount(()=>{disposed=true;generation++;mounted.value=false;disconnectRuntime();});
</script>
<template><div ref="rootRef" v-bind="attrs" ${attributes}><slot/></div></template>
`,
};
