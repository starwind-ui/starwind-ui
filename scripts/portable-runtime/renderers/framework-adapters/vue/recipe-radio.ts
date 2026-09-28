import type {
  RadioIndicatorPolicy,
  RadioOperations,
  RadioProjection,
} from "../../shared-recipes/grouped/radio.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const radioOperations: RadioOperations = {
  fw: {
    ...modelOperations("vue", "checked", "checked"),
    renderAccepted: (_name, next) => `renderedValue.value=${next};`,
  },
  acceptedRenderMode: "cached-cell",
  acceptedRead: "renderedValue.value",
  groupValue: (name) => `group?.${name}${["name", "form"].includes(name) ? "?" : ""}.value`,
  frame,
  indicator,
};
const attributes = (entries: [string, string][]) =>
  entries
    .map(([name, value]) =>
      value.startsWith('"') && value.endsWith('"')
        ? `${name}=${value}`
        : `:${name}='${value.replace(/'/g, "&#39;")}'`,
    )
    .join(" ");
function frame(code: string, p: RadioProjection): string {
  const defaults = p.props
    .filter((x) => x.defaultValue !== undefined && x.name !== "defaultChecked")
    .map((x) => `${x.name}:${x.defaultValue}`)
    .concat("checked:undefined", "defaultChecked:undefined")
    .join(",");
  const input = `<input ref="inputRef" ${attributes(p.input)} style="${p.inputStyle.map(([name, value]) => `${name}:${value};`).join("")}"/>`;
  return `<script setup lang="ts">import{createRadio,type RadioCheckedChangeDetails}from'@starwind-ui/runtime/radio';import{computed,onMounted,onBeforeUnmount,ref,useAttrs,watch}from'vue';import{useRadioGroupContext}from'../radio-group/RadioGroupContext';defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{${p.props.map((x) => `${x.name}${x.required ? "" : "?"}:${x.type};`).join("\n")}}>(),{${defaults}});const emit=defineEmits<{checkedChange:[value:boolean,detail:RadioCheckedChangeDetails];'update:checked':[value:boolean]}>();defineSlots<{default?:()=>unknown}>();const attrs=useAttrs(),rootRef=ref<HTMLElement|null>(null),inputRef=ref<HTMLInputElement|null>(null);defineExpose({element:rootRef,input:inputRef});const group=useRadioGroupContext();${p.functions.map(([name, expression]) => `function ${name}(){return ${expression};}`).join("\n")}
const initialChecked=${p.initial};const resetSeed=${p.seed};const renderedValue=ref(initialChecked);const connection:{instance?:ReturnType<typeof createRadio>;accepted:boolean;unsubscribe?:()=>void;unsubscribeSync?:()=>void;disabled?:boolean;readOnly?:boolean}={accepted:initialChecked};const selected=computed(()=>${p.selected});${code}
onMounted(()=>{if(rootRef.value)connect(rootRef.value)});onBeforeUnmount(disconnect);watch(()=>[${p.reconnect.map((n) => "props." + n).join(",")}],()=>{if(rootRef.value)connect(rootRef.value)},{flush:'post'});${p.commands.map((c) => `watch(()=>[${c.inputs.map((n) => (n.endsWith("()") ? n : "props." + n)).join(",")}],${c.phase === "after-parent" ? `()=>queueMicrotask(${c.name})` : c.name},{flush:'post'});`).join("\n")}
</script><template><component :is='${p.element}' v-bind="attrs" ref="rootRef" ${attributes(p.attrs)}><slot/><template v-if="${p.inputInside}">${input}</template></component><template v-if="${p.inputOutside}">${input}</template></template>`;
}
function indicator(p: RadioIndicatorPolicy): string {
  return `<script setup lang="ts">import{ref}from'vue';defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{keepMounted?:boolean}>(),{keepMounted:false});defineSlots<{default?:()=>unknown}>();const element=ref<HTMLSpanElement|null>(null);defineExpose({element});</script><template><${p.element} v-bind="$attrs" ref="element" ${p.marker}="" data-sw-part="${p.part}" :${p.keepMounted}="props.keepMounted?'':undefined" ${p.unchecked}="" :hidden="${p.initialHidden.replace("keepMounted", "props.keepMounted")}"><slot/></${p.element}></template>`;
}
