import type {
  RadioIndicatorPolicy,
  RadioOperations,
  RadioProjection,
} from "../../shared-recipes/grouped/radio.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const radioOperations: RadioOperations = {
  fw: {
    ...modelOperations("react", "checked", "checked"),
    renderAccepted: (_name, next) => `setRenderedValue(${next});`,
  },
  acceptedRenderMode: "uncontrolled-render",
  acceptedRead: "renderedValue",
  groupValue: (name) => `group?.${name}`,
  frame,
  indicator,
};
function frame(code: string, p: RadioProjection): string {
  const names = p.props.map((x) => x.name).join(","),
    destructure = p.props
      .map(
        (x) =>
          x.name +
          (x.name !== "defaultChecked" && x.defaultValue !== undefined ? "=" + x.defaultValue : ""),
      )
      .join(",");
  const attrs = p.attrs
    .map(([name, value]) => `${JSON.stringify(name === "tabindex" ? "tabIndex" : name)}:${value}`)
    .join(",");
  const inputStyle = p.inputStyle
    .map(
      ([name, value]) =>
        `${name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())}:${/^-?\d+(px)?$/.test(value) ? parseInt(value) : JSON.stringify(value)}`,
    )
    .join(",");
  const input = p.input
    .map(
      ([name, value]) =>
        `${JSON.stringify(name === "tabindex" ? "tabIndex" : name === "checked" ? "defaultChecked" : name === "value" ? "defaultValue" : name)}:${value}`,
    )
    .join(",");
  return `import{createRadio,type RadioCheckedChangeDetails}from'@starwind-ui/runtime/radio';import * as React from'react';import{setRef}from'../internal/compose-refs';import{useIsomorphicLayoutEffect}from'../internal/use-isomorphic-layout-effect';import{useRadioGroupContext}from'../radio-group/RadioGroupContext';
export type RadioRootProps=Omit<React.HTMLAttributes<HTMLSpanElement> & React.ButtonHTMLAttributes<HTMLButtonElement>,'onChange'|'defaultChecked'|'type'|'value'> & {${p.props.map((x) => `${x.name}${x.required ? "" : "?"}:${x.type};`).join("\n")}onCheckedChange?:(checked:boolean,detail:RadioCheckedChangeDetails)=>void};
const RadioRoot=React.forwardRef<HTMLSpanElement|HTMLButtonElement,RadioRootProps>(function RadioRoot({children,${destructure},onCheckedChange,...rest},forwardedRef){const inputs=React.useRef({${names},onCheckedChange});inputs.current={${names},onCheckedChange};const group=useRadioGroupContext();${p.functions.map(([name, expression]) => `function ${name}(){return ${expression};}`).join("\n")}
const initialChecked=React.useRef(${p.initial}).current;const resetSeed=React.useRef(${p.seed}).current;const[renderedValue,setRenderedValue]=React.useState(initialChecked);const connection=React.useRef<{instance?:ReturnType<typeof createRadio>;accepted:boolean;unsubscribe?:()=>void;unsubscribeSync?:()=>void;disabled?:boolean;readOnly?:boolean}>({accepted:initialChecked}).current;const rootRef=React.useRef<HTMLElement|null>(null);const composedRef=React.useCallback((node:HTMLElement|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);const selected=${p.selected};${code}
useIsomorphicLayoutEffect(()=>{if(rootRef.current)connect(rootRef.current);return disconnect;},[${p.reconnect.join(",")}]);${p.commands.map((c) => `${c.phase === "after-parent" ? "React.useEffect" : "useIsomorphicLayoutEffect"}(${c.name},[${c.inputs.join(",")}]);`).join("\n")}
const input=<input {...{${input}}} style={{${inputStyle}}}/>;const element=React.createElement(${p.element},{...rest,...{${attrs}},ref:composedRef},children,${p.inputInside}?input:undefined);return <>{element}{${p.inputOutside}?input:null}</>;
});RadioRoot.displayName='Radio.Root';export default RadioRoot;`;
}
function indicator(p: RadioIndicatorPolicy): string {
  return `import * as React from'react';export type RadioIndicatorProps=React.HTMLAttributes<HTMLSpanElement>&{keepMounted?:boolean};const RadioIndicator=React.forwardRef<HTMLSpanElement,RadioIndicatorProps>(function RadioIndicator({children,keepMounted=false,...rest},ref){return <${p.element} {...rest} ref={ref} ${p.marker}="" data-sw-part="${p.part}" ${p.keepMounted}={keepMounted?'':undefined} ${p.unchecked}="" hidden={${p.initialHidden}}>{children}</${p.element}>});RadioIndicator.displayName='Radio.Indicator';export default RadioIndicator;`;
}
