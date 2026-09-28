import type { AdapterRangeControlFacts } from "../../../framework-adapters/types.js";

/** Runtime owns range math, native inputs and deferred reset. This recipe owns their adapter connection. */
export const sliderPolicy = {
  options: [
    "disabled",
    "form",
    "largeStep",
    "max",
    "min",
    "minStepsBetweenValues",
    "name",
    "orientation",
    "step",
  ],
  emitCommands: false,
} as const;
export interface SliderOperations {
  authority: "parent" | "binding";
  read(name: string): string;
  render(value: string): string;
  publish(value: string): string;
  notify(event: "valueChange" | "valueCommitted", value: string, detail: string): string;
  untrack(body: string): string;
}
export function sliderCodec(): string {
  return `function copyValue<T extends SliderValue | undefined>(value:T):T{return (Array.isArray(value)?[...value]:value) as T;}
function valuesEqual(left:SliderValue|undefined,right:SliderValue|undefined):boolean{const a=Array.isArray(left)?left:[left],b=Array.isArray(right)?right:[right];return a.length===b.length&&a.every((value,index)=>value===b[index]);}
function serializeValue(value:SliderValue):string{return Array.isArray(value)?JSON.stringify(value):String(value);}`;
}
export function sliderConnection(f: AdapterRangeControlFacts, op: SliderOperations): string {
  const read = op.read,
    binding = op.authority === "binding",
    keys = sliderPolicy.options;
  const options = keys.filter((k) => k !== "disabled" && k !== "name");
  const publish = binding
    ? `${op.publish("copyValue(next)")} const canonical=${read("value")};if(canonical!==undefined&&!valuesEqual(canonical,next))synchronize(canonical);`
    : op.publish("copyValue(next)");
  return `${sliderCodec()}
function connectSlider(root:HTMLDivElement){
 const initialModel=copyValue(${read("value")});
 const controlled=${binding ? "false" : "initialModel!==undefined"};
 let disposed=false,synchronizing=false;
 let rendered=copyValue(initialModel??initialDefaultValue);
 const readOptions=()=>({${keys.map((k) => `${k}:${read(k)}`).join(",")}});
 let applied=readOptions();
 const instance=${f.runtime.factory}(root,{
 defaultValue:copyValue(initialDefaultValue),...applied,
 ${binding ? "" : "...(controlled?{value:initialModel}:{}),"}
 ${f.events.valueChange.callbackProp}:(next,detail)=>{${op.untrack(op.notify("valueChange", "copyValue(next)", "detail"))}}
 });
 function render(next:SliderValue):void{if(controlled||valuesEqual(rendered,next))return;rendered=copyValue(next);${op.render("copyValue(next)")}}
 function publishReadback():void{if(disposed||controlled)return;const next=instance.getValue();render(next);${publish}}
 function synchronize(next:SliderValue):void{if(disposed)return;synchronizing=true;try{instance.refresh();if(!valuesEqual(instance.getValue(),next))instance.setValue(copyValue(next),{emit:${sliderPolicy.emitCommands}});}finally{synchronizing=false;}render(instance.getValue());}
 function syncModel():void{if(disposed${binding ? "" : "||!controlled"})return;const next=${read("value")};if(next===undefined)return;synchronize(next);${binding ? "publishReadback();" : ""}}
 function syncOptions():void{if(disposed)return;const next=readOptions();if(${keys.map((k) => `Object.is(next.${k},applied.${k})`).join("&&")})return;
 synchronizing=true;try{
 if(next.disabled!==applied.disabled)instance.${f.setters.disabled}(next.disabled);
 if(next.name!==applied.name)instance.${f.setters.name}(next.name);
 instance.${f.setters.options}({${options.map((k) => `${k}:next.${k}`).join(",")}});
 applied=next;
 }finally{synchronizing=false;}
 syncModel();publishReadback();}
 const stopChange=instance.subscribe('${f.events.valueChange.name}',detail=>{if(disposed||detail.isCanceled)return;${op.untrack(binding ? "publishReadback();" : `render(detail.value);${op.publish("copyValue(detail.value)")}`)}});
 const stopCommit=instance.subscribe('${f.events.valueCommitted.name}',detail=>{if(disposed)return;${op.untrack(op.notify("valueCommitted", "copyValue(detail.value)", "detail"))}});
 const stopState=instance.subscribe('stateSync',()=>{if(disposed||synchronizing)return;${op.untrack("publishReadback();")}});
 ${binding ? "syncModel();publishReadback();" : "render(instance.getValue());"}
 return {instance,syncModel,syncOptions,refresh(){if(disposed)return;synchronizing=true;try{instance.refresh();}finally{synchronizing=false;}syncModel();publishReadback();},destroy(){disposed=true;stopState();stopChange();stopCommit();instance.destroy();}};
}`;
}
