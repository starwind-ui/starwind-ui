import type { TabsOperations } from "../../shared-recipes/selection/tabs.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const tabsOperations: TabsOperations = {
  acceptedRead: "renderedValue.value",
  fw: {
    ...modelOperations("vue", "value", "modelValue"),
    renderAccepted: (_name, next) => `if(props.modelValue===undefined)renderedValue.value=${next};`,
  },
  root(code, projection) {
    const initial = projection.initial
      .map((item) => `const ${item.name}=${item.expression};`)
      .join("\n");
    const attrs = projection.attrs
      .map(([name, expression]) => `:${name}='${expression}'`)
      .join(" ");
    return `<script setup lang="ts">import {computed,ref,provide,toRef,onMounted,onUpdated,onBeforeUnmount,watch} from 'vue';import {createTabs,type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from '@starwind-ui/runtime/tabs';import {TabsContext} from './TabsContext';
 defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{modelValue?:TabsValue;defaultValue?:TabsValue;orientation?:TabsOrientation;syncKey?:string}>(),{modelValue:undefined,defaultValue:undefined,orientation:'horizontal',syncKey:undefined});const emit=defineEmits<{valueChange:[value:TabsValue,detail:TabsValueChangeDetails];'update:modelValue':[value:TabsValue]}>();defineSlots<{default?:(props:{value:TabsValue;orientation:TabsOrientation})=>unknown}>();
 const rootRef=ref<HTMLDivElement|null>(null);defineExpose({element:rootRef});${initial}const renderedValue=ref<TabsValue>(${projection.seed});const selected=computed(()=>${projection.selected});provide(TabsContext,{value:selected,orientation:toRef(props,'orientation'),refresh});const connection:{instance?:ReturnType<typeof createTabs>;unsubscribe?:()=>void}={};
 ${code}
 onMounted(()=>{if(rootRef.value)connect(rootRef.value);});onUpdated(refresh);onBeforeUnmount(disconnect);watch(()=>props.modelValue,applyParent,{flush:'post'});
 </script><template><div v-bind="$attrs" ref="rootRef" ${attrs}><slot :value="selected" :orientation="props.orientation"/></div></template>`;
  },
  part(plan) {
    const name = "Tabs" + plan.part[0]!.toUpperCase() + plan.part.slice(1);
    const element =
      plan.tag === "button"
        ? "HTMLButtonElement"
        : plan.tag === "span"
          ? "HTMLSpanElement"
          : "HTMLDivElement";
    const fields = plan.props
      .map((p) => `${p.name}${p.default !== undefined ? "?" : ""}:${p.type}`)
      .join(";");
    const attrs = plan.attrs
      .map(
        ([name, expr]) =>
          `:${name}='${expr.replace(/\b[a-zA-Z]\w*\b/g, (t) => (plan.props.some((p) => p.name === t) ? "props." + t : t))}'`,
      )
      .join(" ");
    return `<script setup lang="ts">import {ref,computed,watch,onUnmounted} from 'vue';import {useTabsContext} from './TabsContext';defineOptions({inheritAttrs:false});const props=withDefaults(defineProps<{${fields}}>(),{${plan.props
      .filter((p) => p.default !== undefined)
      .map((p) => p.name + ":" + p.default)
      .join(
        ",",
      )}});defineSlots<{default?:${plan.children === "active" ? "(props:{active:boolean})" : "()"}=>unknown}>();const element=ref<${element}|null>(null);defineExpose({element});const context=useTabsContext('${name}');const {orientation,value:selected}=context;watch([${plan.refreshInputs.map((n) => "()=>props." + n).join(",")}],context.refresh,{flush:'post'});onUnmounted(context.refresh);${plan.active ? "const active=computed(()=>selected.value===props.value);" : ""}</script><template><${plan.tag} v-bind="$attrs" ref="element" ${attrs}><slot ${plan.children === "active" ? ':active="active"' : ""}/></${plan.tag}></template>`;
  },
};
