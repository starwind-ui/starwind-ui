import type { SliderProjection } from "../../shared-recipes/structured/range/frame.js";
export const reactSliderProjection: SliderProjection = {
  operations: {
    authority: "parent",
    read: (name) => `inputs.current.${name}`,
    render: (value) => `setLocalValue(${value});`,
    publish: () => "",
    notify: (event, value, detail) =>
      `inputs.current.${event === "valueChange" ? "onValueChange" : "onValueCommitted"}?.(${value},${detail});`,
    untrack: (body) => body,
  },
  renderRead: (name) => name,
  attribute: (name, value) => `${name}={${value}}`,
  print: ({
    facts: f,
    props,
    attributes,
    connection,
    inputs,
    initialDefault,
    initialModel,
  }) => `import * as React from 'react';
import{createSlider,type SliderValue,type SliderOrientation,type SliderValueChangeDetails,type SliderValueCommitDetails}from '${f.runtime.importSource}';
import{useIsomorphicLayoutEffect}from '../internal/use-isomorphic-layout-effect';
import{setRef}from '../internal/compose-refs';
export type SliderRootProps=Omit<React.HTMLAttributes<HTMLDivElement>,'defaultValue'|'onChange'>&{${props.map((p) => `${p.name}?:${p.type};`).join("")}onValueChange?:(value:SliderValue,detail:SliderValueChangeDetails)=>void;onValueCommitted?:(value:SliderValue,detail:SliderValueCommitDetails)=>void;};
const SliderRoot=React.forwardRef<HTMLDivElement,SliderRootProps>(function SliderRoot({${props.map((p) => `${p.name}${p.defaultValue === undefined ? "" : `=${p.defaultValue}`}`).join(",")},onValueChange,onValueCommitted,...rest},forwardedRef){
const inputs=React.useRef({${props.map((p) => p.name).join(",")},onValueChange,onValueCommitted});useIsomorphicLayoutEffect(()=>{inputs.current={${props.map((p) => p.name).join(",")},onValueChange,onValueCommitted};});
const initialDefaultValue=React.useRef(${initialDefault}).current;
const [localValue,setLocalValue]=React.useState<SliderValue>(()=>${initialModel});
const renderedValue=value??localValue;
const rootRef=React.useRef<HTMLDivElement|null>(null),connection=React.useRef<ReturnType<typeof connectSlider>|undefined>(undefined);
const composedRef=React.useCallback((node:HTMLDivElement|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);
${connection}
useIsomorphicLayoutEffect(()=>{const node=rootRef.current;if(!node)return;const owned=connectSlider(node);connection.current=owned;return()=>{connection.current=undefined;owned.destroy();};},[]);
useIsomorphicLayoutEffect(()=>{connection.current?.syncOptions();},[${inputs.join(",")}]);
useIsomorphicLayoutEffect(()=>{connection.current?.syncModel();},[value]);
return <div {...rest} ${attributes} ref={composedRef}/>;
});SliderRoot.displayName='Slider.Root';export default SliderRoot;`,
};
