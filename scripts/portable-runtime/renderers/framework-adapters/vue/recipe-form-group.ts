import type { GroupOperations, GroupProjection } from "../../shared-recipes/grouped/groups.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const groupOperations: GroupOperations = {
  fw: {
    ...modelOperations("vue", "value", "modelValue"),
    renderAccepted: (_name, next) => `renderedValue.value=${next};`,
  },
  acceptedRenderMode: "cached-cell",
  acceptedRead: "renderedValue.value",
  frame,
};
function frame(code: string, p: GroupProjection): string {
  if (p.connectPhase !== "after-children" || p.commandPhase !== "after-children")
    throw new Error("Form group frame requires children before connection and commands");
  const rename = (name: string) => (name === "value" ? "modelValue" : name);
  const props = p.props.map((x) => `${rename(x.name)}?:${x.type};`).join("\n");
  const defaults = p.props
    .filter((x) => x.defaultValue !== undefined)
    .map((x) => `${rename(x.name)}:${x.defaultValue}`)
    .concat("modelValue:undefined", "defaultValue:undefined")
    .join(",");
  const attrs = p.attrs
    .map(([name, value]) =>
      value.startsWith('"') && value.endsWith('"')
        ? `${name}=${value}`
        : `:${name}='${value.replace(/'/g, "&#39;")}'`,
    )
    .join(" ");
  return `<script setup lang="ts">import{${p.factory},type ${p.type},type ${p.details}}from'@starwind-ui/runtime/${p.kind}';import{computed,onMounted,onBeforeUnmount,provide,ref,useAttrs,watch}from'vue';import{${p.name}Context}from'./${p.name}Context';defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{${props}}>(),{${defaults}});const emit=defineEmits<{valueChange:[value:${p.callbackType},detail:${p.details}];'update:modelValue':[value:${p.type}]}>();defineSlots<{default?:()=>unknown}>();const attrs=useAttrs(),rootRef=ref<HTMLDivElement|null>(null);defineExpose({element:rootRef});const resetSeed=${p.seed};const initialValue=${p.initial};const renderedValue=ref<${p.type}>(initialValue);const connection:{instance?:ReturnType<typeof ${p.factory}>;accepted:${p.type};unsubscribe?:()=>void;unsubscribeSync?:()=>void;observer?:MutationObserver}={accepted:initialValue};const selected=computed(()=>${p.selected});${code}
provide(${p.name}Context,{${p.context.map(([name, expression]) => `${name}:${name === "value" ? "selected" : `computed(()=>${expression})`}`).join(",")}});onMounted(()=>{if(rootRef.value)connect(rootRef.value)});onBeforeUnmount(disconnect);${p.commands.map((c) => `watch(()=>[${c.inputs.map((n) => "props." + rename(n)).join(",")}],()=>queueMicrotask(${c.name}),{flush:'post'});`).join("\n")}
</script><template><${p.element} ref="rootRef" v-bind="attrs" ${attrs}><slot/></${p.element}></template>`;
}
