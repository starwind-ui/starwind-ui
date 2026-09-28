import type { GroupOperations, GroupProjection } from "../../shared-recipes/grouped/groups.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const groupOperations: GroupOperations = {
  fw: {
    ...modelOperations("react", "value", "value"),
    renderAccepted: (_name, next) => `setRenderedValue(${next});`,
  },
  acceptedRenderMode: "uncontrolled-render",
  acceptedRead: "renderedValue",
  frame,
};
function frame(code: string, p: GroupProjection): string {
  if (p.connectPhase !== "after-children" || p.commandPhase !== "after-children")
    throw new Error("Form group frame requires children before connection and commands");
  const names = p.props.map((x) => x.name).join(","),
    destructure = p.props
      .map((x) => x.name + (x.defaultValue !== undefined ? "=" + x.defaultValue : ""))
      .join(",");
  const attrs = p.attrs.map(([name, value]) => `${JSON.stringify(name)}:${value}`).join(",");
  return `import{${p.factory},type ${p.type},type ${p.details}}from'@starwind-ui/runtime/${p.kind}';import * as React from'react';import{setRef}from'../internal/compose-refs';import{useIsomorphicLayoutEffect}from'../internal/use-isomorphic-layout-effect';import{${p.name}Context}from'./${p.name}Context';export type ${p.name}RootProps=Omit<React.HTMLAttributes<HTMLDivElement>,'defaultValue'|'onChange'>&{${p.props.map((x) => `${x.name}?:${x.type};`).join("\n")}onValueChange?:(value:${p.callbackType},detail:${p.details})=>void};
const ${p.name}Root=React.forwardRef<HTMLDivElement,${p.name}RootProps>(function ${p.name}Root({children,${destructure},onValueChange,...rest},forwardedRef){const inputs=React.useRef({${names},onValueChange});inputs.current={${names},onValueChange};const resetSeed=React.useRef(${p.seed}).current;const initialValue=React.useRef(${p.initial}).current;const[renderedValue,setRenderedValue]=React.useState<${p.type}>(initialValue);const connection=React.useRef<{instance?:ReturnType<typeof ${p.factory}>;accepted:${p.type};unsubscribe?:()=>void;unsubscribeSync?:()=>void;observer?:MutationObserver}>({accepted:initialValue}).current;const rootRef=React.useRef<HTMLDivElement|null>(null);const composedRef=React.useCallback((node:HTMLDivElement|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);const selected=${p.selected};${code}
useIsomorphicLayoutEffect(()=>{if(rootRef.current)connect(rootRef.current);return disconnect;},[]);${p.commands.map((c) => `useIsomorphicLayoutEffect(${c.name},[${c.inputs.join(",")}]);`).join("\n")}
const context=React.useMemo(()=>({${p.context.map(([name, expression]) => `${name}:${expression}`).join(",")}}),[${p.context.map(([name]) => (name === "value" ? "selected" : name)).join(",")}]);return <${p.name}Context.Provider value={context}><${p.element} {...rest} {...{${attrs}}} ref={composedRef}>{children}</${p.element}></${p.name}Context.Provider>});${p.name}Root.displayName='${p.name}.Root';export default ${p.name}Root;`;
}
