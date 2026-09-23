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
        "react",
        kind === "toggle" ? "pressed" : "value",
        kind === "toggle" ? "pressed" : "value",
      ),
      renderAccepted: (_name, next) =>
        `if(inputs.current.${kind === "toggle" ? "pressed" : "value"}===undefined)setRenderedValue(${next});`,
    },
    acceptedRead: "renderedValue",
    groupExists: "toggleGroup!==undefined",
    groupValue: "toggleGroup!.value",
    groupDisabled: "toggleGroup?.disabled===true",
    frame,
  };
}
function frame(kind: Kind, code: string, p: Projection): string {
  const group = kind === "toggle-group",
    name = group ? "ToggleGroupRoot" : "ToggleRoot",
    factory = group ? "createToggleGroup" : "createToggle",
    event = group ? "onValueChange" : "onPressedChange",
    detail = group ? "ToggleGroupValueChangeDetails" : "TogglePressedChangeDetails",
    type = group ? "ToggleGroupValue" : "boolean",
    element = group ? "HTMLDivElement" : "HTMLButtonElement | HTMLSpanElement";
  const props = p.props.map((x) => `${x.name}?:${x.type};`).join("\n");
  const destructure = p.props
    .map((x) => x.name + (x.defaultValue !== undefined ? "=" + x.defaultValue : ""))
    .join(",");
  const names = p.props.map((x) => x.name).join(",");
  const attrs = p.attrs
    .map(([name, value]) => `${JSON.stringify(name === "tabindex" ? "tabIndex" : name)}:${value}`)
    .join(",");
  const effects = p.commands
    .map(
      (c) =>
        `${c.phase === "after-parent" ? "React.useEffect" : "useIsomorphicLayoutEffect"}(${c.name},[${c.inputs.join(",")}]);`,
    )
    .join("\n");
  return `import{${factory},type ${detail}${group ? ",type ToggleGroupValue" : ""}}from'@starwind-ui/runtime/${kind}';import * as React from'react';import{setRef}from'../internal/compose-refs';import{useIsomorphicLayoutEffect}from'../internal/use-isomorphic-layout-effect';${group ? "import{ToggleGroupContext}from'./ToggleGroupContext';" : "import{useToggleGroupContext}from'../toggle-group/ToggleGroupContext';"}
export type ${name}Props=Omit<${group ? "React.HTMLAttributes<HTMLDivElement>" : "React.ButtonHTMLAttributes<HTMLButtonElement> & React.HTMLAttributes<HTMLSpanElement>"},${group ? "'defaultValue'|'onChange'" : "'onChange'|'aria-pressed'|'defaultPressed'|'type'|'value'"}> & {${props}${event}?:(value:${type},detail:${detail})=>void};
const ${name}=React.forwardRef<${element},${name}Props>(function ${name}({children,${destructure},${event},...rest},forwardedRef){const inputs=React.useRef({${names},${event}});inputs.current={${names},${event}};
const initialDefault=React.useRef(${p.initial}).current;const[renderedValue,setRenderedValue]=React.useState<${type}>(initialDefault);const connection=React.useRef<{instance?:ReturnType<typeof ${factory}>;unsubscribe?:()=>void;observer?:MutationObserver;ownDisabled?:boolean;accepted:${type}}>({accepted:initialDefault}).current;const rootRef=React.useRef<${element}|null>(null);const composedRef=React.useCallback((node:${element}|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);
${group ? "" : `const toggleGroup=useToggleGroupContext();const isGroupOwned=toggleGroup!==undefined;const groupPressed=${p.groupPressed};`}
const effectiveDisabled=${p.disabled};const selected=${group ? `React.useMemo(()=>${p.selected},[value,multiple,renderedValue])` : p.selected};${code}
useIsomorphicLayoutEffect(()=>{if(rootRef.current)connect(rootRef.current);return disconnect;},[${p.reconnect.join(",")}]);${effects}
${group ? `const context=React.useMemo(()=>({disabled,loopFocus,multiple,orientation,value:selected}),[disabled,loopFocus,multiple,orientation,selected]);return <ToggleGroupContext.Provider value={context}><div {...rest} {...{${attrs}}} ref={composedRef}>{children}</div></ToggleGroupContext.Provider>;` : `return React.createElement(nativeButton?'button':'span',{...rest,...{${attrs}},ref:composedRef},children);`}
});${name}.displayName='${group ? "ToggleGroup" : "Toggle"}.Root';export default ${name};`;
}
