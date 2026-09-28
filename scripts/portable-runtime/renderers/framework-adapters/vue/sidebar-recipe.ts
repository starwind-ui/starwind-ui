import type { SidebarProjection } from "../../shared-recipes/structured/sidebar/types.js";

const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export const vueSidebarProjection: SidebarProjection = {
  read: (name) => `props.${name}`,
  initial: (expression) => expression,
  state: (name, initial) => `const accepted${upper(name)}=ref(${initial});`,
  readState: (name) => `accepted${upper(name)}.value`,
  writeState: (name, value) => `accepted${upper(name)}.value=${value};`,
  attribute: (name, value) =>
    `:${name}="${value.replace(/(accepted\w+)\.value/g, "$1").replaceAll('"', "'")}"`,
  print: ({
    facts: f,
    plan,
    props,
    fields,
    initial,
    cells,
    controller,
    lifecycle,
    media,
    context,
    attributes,
  }) => `<script setup lang="ts">
import {${f.runtime.factory},type ${f.types.openDetails},type ${f.types.mobileOpenDetails},type ${f.types.persistenceStorage}} from '${f.runtime.importSource}';
import {computed,onMounted,onBeforeUnmount,provide,readonly,ref,watch} from 'vue';
import {${f.context.name}} from './${f.context.name}.js';
defineOptions({inheritAttrs:false});
const props=withDefaults(defineProps<{${fields}}>(),{${props
    .map((p) => `${p.name}:${p.defaultValue ?? "undefined"}`)
    .join(",")}});
const emit=defineEmits<{${plan.models.map((name) => `${f.events[name].name}:[next:boolean,detail:${f.events[name].detailsType}];'update:${name}':[next:boolean];`).join("")}}>();
defineSlots<{default?:()=>unknown}>();
const element=ref<HTMLDivElement|null>(null);defineExpose({element});
${initial}
${cells}
${controller}
${lifecycle}
${media}
provide(${f.context.name},{${Object.entries(context)
    .filter(([name]) => name !== "isMobile")
    .map(([name, value]) => `${name}:readonly(computed(()=>${value}))`)
    .join(",")}});
let mounted=false,stopMedia:(()=>void)|undefined;
function reconnect(){if(element.value&&mounted)connectRuntime(element.value);}
onMounted(()=>{mounted=true;stopMedia=connectMedia(props.${plan.media.input});reconnect();});
watch(()=>props.${plan.media.input},()=>{if(!mounted)return;stopMedia?.();stopMedia=connectMedia(props.${plan.media.input});},{flush:'post'});
watch([${plan.constructorInputs.map((name) => `()=>props.${name}`).join(",")}],reconnect,{flush:'post'});
${plan.models.map((name) => `watch(()=>props.${name},(next,previous)=>{if((next===undefined)!==(previous===undefined))reconnect();else applyParentCommand();},{flush:'post'});`).join("\n")}
onBeforeUnmount(()=>{mounted=false;stopMedia?.();disconnectRuntime();});
</script>
<template><div ref="element" v-bind="$attrs" ${attributes}><slot/></div></template>`,
};
