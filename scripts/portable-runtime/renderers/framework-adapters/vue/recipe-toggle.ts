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
        "vue",
        kind === "toggle" ? "pressed" : "value",
        kind === "toggle" ? "pressed" : "modelValue",
      ),
      renderAccepted: (_name, next) => `renderedValue.value=${next};`,
    },
    acceptedRead: "renderedValue.value",
    groupExists: "toggleGroup!==undefined",
    groupValue: "toggleGroup!.value.value",
    groupDisabled: "toggleGroup?.disabled.value===true",
    frame,
  };
}
function frame(kind: Kind, code: string, p: Projection): string {
  const group = kind === "toggle-group",
    factory = group ? "createToggleGroup" : "createToggle",
    model = group ? "modelValue" : "pressed",
    event = group ? "valueChange" : "pressedChange",
    detail = group ? "ToggleGroupValueChangeDetails" : "TogglePressedChangeDetails",
    type = group ? "ToggleGroupValue" : "boolean";
  const rename = (n: string) => (group && n === "value" ? "modelValue" : n);
  const props = p.props.map((x) => `${rename(x.name)}?:${x.type};`).join("\n");
  const defaults = p.props
    .filter((x) => x.defaultValue !== undefined)
    .map((x) => `${rename(x.name)}:${x.defaultValue}`)
    .concat(`${model}:undefined`)
    .join(",");
  const attrs = p.attrs
    .map(([name, value]) =>
      value.startsWith('"') && value.endsWith('"')
        ? `${name}=${value}`
        : `:${name}='${value.replace(/'/g, "&#39;")}'`,
    )
    .join(" ");
  const effects = p.commands
    .map(
      (c) =>
        `watch(()=>[${c.inputs.map((n) => "props." + rename(n)).join(",")}],${p.commandPhase === "after-children" ? `()=>queueMicrotask(${c.name})` : c.name},{flush:'post'});`,
    )
    .join("\n");
  return `<script setup lang="ts">import{${factory},type ${detail}${group ? ",type ToggleGroupValue" : ""}}from'@starwind-ui/runtime/${kind}';import{computed,onMounted,onBeforeUnmount,ref,useAttrs,watch${group ? ",provide" : ""}}from'vue';${group ? "import{ToggleGroupContext}from'./ToggleGroupContext';" : "import{useToggleGroupContext}from'../toggle-group/ToggleGroupContext';"}
defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{${props}}>(),{${defaults}});const emit=defineEmits<{${event}:[value:${type},detail:${detail}];'update:${model}':[value:${type}]}>();defineSlots<{default?:()=>unknown}>();const attrs=useAttrs();const rootRef=ref<${group ? "HTMLDivElement" : "HTMLElement"}|null>(null);defineExpose({element:rootRef});const initialDefault=${p.initial};const renderedValue=ref<${type}>(initialDefault);const connection:{instance?:ReturnType<typeof ${factory}>;unsubscribe?:()=>void;observer?:MutationObserver;ownDisabled?:boolean;accepted:${type}}={accepted:initialDefault};
${group ? "" : `const toggleGroup=useToggleGroupContext();const isGroupOwned=toggleGroup!==undefined;const groupPressed=computed(()=>${p.groupPressed});`}
const effectiveDisabled=computed(()=>${p.disabled});const selected=computed(()=>${p.selected.replace(/\bgroupPressed\b/g, "groupPressed.value")});${code.replace(/\bgroupPressed\b/g, "groupPressed.value")}
onMounted(()=>{if(rootRef.value)connect(rootRef.value);});onBeforeUnmount(disconnect);${p.reconnect.length ? `watch(()=>[${p.reconnect.map((n) => "props." + rename(n)).join(",")}],()=>{if(rootRef.value)connect(rootRef.value);},{flush:'post'});` : ""}${effects}
${group ? `provide(ToggleGroupContext,{value:selected,disabled:computed(()=>props.disabled),multiple:computed(()=>props.multiple),loopFocus:computed(()=>props.loopFocus),orientation:computed(()=>props.orientation)});` : ""}
</script><template><${group ? "div" : `component :is="props.nativeButton?'button':'span'"`} ref="rootRef" v-bind="attrs" ${attrs}><slot/></${group ? "div" : "component"}></template>`;
}
