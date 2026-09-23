import type { SliderProjection } from "../../shared-recipes/structured/range/frame.js";
export const vueSliderProjection: SliderProjection = {
  operations: {
    authority: "parent",
    read: (name) => (name === "value" ? "modelValue.value" : `props.${name}`),
    render: (value) => `localValue.value=${value};`,
    publish: (value) => `if(!valuesEqual(modelValue.value,${value}))modelValue.value=${value};`,
    notify: (event, value, detail) => `emit('${event}',${value},${detail});`,
    untrack: (body) => body,
  },
  renderRead: (name) => (name === "value" ? "modelValue.value" : `props.${name}`),
  attribute: (name, value) => `:${name}='${value}'`,
  print: ({
    facts: f,
    props,
    attributes,
    connection,
    inputs,
    initialDefault,
    initialModel,
  }) => `<script setup lang="ts">
import{computed,ref,onMounted,onBeforeUnmount,onUpdated,nextTick,watch,useAttrs}from 'vue';
import{createSlider,type SliderValue,type SliderOrientation,type SliderValueChangeDetails,type SliderValueCommitDetails}from '${f.runtime.importSource}';
defineOptions({inheritAttrs:false});
const props=withDefaults(defineProps<{${props
    .filter((p) => p.name !== "value")
    .map((p) => `${p.name}?:${p.type};`)
    .join("")}}>(),{${props
    .filter((p) => p.defaultValue !== undefined && p.name !== "value")
    .map((p) => `${p.name}:${p.name === "defaultValue" ? "()=>" : ""}${p.defaultValue}`)
    .join(",")}});
const modelValue=defineModel<SliderValue>();const emit=defineEmits<{valueChange:[value:SliderValue,detail:SliderValueChangeDetails];valueCommitted:[value:SliderValue,detail:SliderValueCommitDetails]}>();
const attrs=useAttrs(),element=ref<HTMLDivElement|null>(null);defineExpose({element});
const initialDefaultValue=${initialDefault},localValue=ref<SliderValue>(${initialModel});
const renderedValue=computed(()=>modelValue.value??localValue.value);
let connection:ReturnType<typeof connectSlider>|undefined;
${connection}
onMounted(()=>{if(element.value)connection=connectSlider(element.value);});
watch(()=>[${inputs.map((n) => `props.${n}`).join(",")}],()=>connection?.syncOptions(),{flush:'post'});
watch(modelValue,()=>connection?.syncModel(),{flush:'post'});
onUpdated(()=>{void nextTick().then(()=>connection?.refresh());});
onBeforeUnmount(()=>{const owned=connection;connection=undefined;owned?.destroy();});
</script><template><div ${attributes} ref="element" v-bind="attrs"><slot/></div></template>`,
};
