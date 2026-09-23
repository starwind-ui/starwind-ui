import type { TabsOperations } from "../../shared-recipes/selection/tabs.js";
import { modelOperations } from "../../shared-recipes/structured/operations.js";
export const tabsOperations: TabsOperations = {
  acceptedRead: "renderedValue",
  fw: {
    ...modelOperations("react", "value", "value"),
    renderAccepted: (_name, next) =>
      `if(inputs.current.value===undefined)setRenderedValue(${next});`,
  },
  root(code, projection) {
    const initial = projection.initial
      .map((item) => `const ${item.name}=React.useRef(${item.expression}).current;`)
      .join("\n");
    const attrs = projection.attrs.map(([name, expression]) => `${name}={${expression}}`).join(" ");
    return `import * as React from 'react';import {createTabs,type TabsValue,type TabsOrientation,type TabsValueChangeDetails} from '@starwind-ui/runtime/tabs';import {TabsContext} from './TabsContext';import {setRef} from '../internal/compose-refs';import {useIsomorphicLayoutEffect} from '../internal/use-isomorphic-layout-effect';
 export type TabsRootProps=Omit<React.HTMLAttributes<HTMLDivElement>,'defaultValue'|'onChange'> & {value?:TabsValue;defaultValue?:TabsValue;orientation?:TabsOrientation;syncKey?:string;onValueChange?:(value:TabsValue,details:TabsValueChangeDetails)=>void};
 const TabsRoot=React.forwardRef<HTMLDivElement,TabsRootProps>(function TabsRoot({value,defaultValue,orientation='horizontal',syncKey,onValueChange,children,...rest},ref){
 const inputs=React.useRef({value,orientation,onValueChange,defaultValue,syncKey});inputs.current={value,orientation,onValueChange,defaultValue,syncKey};
 ${initial}
 const [renderedValue,setRenderedValue]=React.useState<TabsValue>(${projection.seed});
 const connection=React.useRef<{instance?:ReturnType<typeof createTabs>;unsubscribe?:()=>void}>({}).current;
 const rootRef=React.useRef<HTMLDivElement>(null);const composedRef=React.useCallback((element:HTMLDivElement|null)=>{rootRef.current=element;return setRef(ref,element);},[ref]);
 ${code}
 useIsomorphicLayoutEffect(()=>{if(rootRef.current)connect(rootRef.current);return disconnect;},[]);
 useIsomorphicLayoutEffect(applyParent,[value]);useIsomorphicLayoutEffect(refresh,[${projection.refreshInputs.join(",")},children]);
 const selected=${projection.selected};const context=React.useMemo(()=>({value:selected,orientation}),[selected,orientation]);
 return <TabsContext.Provider value={context}><div {...rest} ${attrs} ref={composedRef}>{children}</div></TabsContext.Provider>;
 });export default TabsRoot;`;
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
      .map(([name, expr]) => `${name === "tabindex" ? "tabIndex" : name}={${expr}}`)
      .join(" ");
    return `import * as React from 'react';import {useTabsContext} from './TabsContext';
 export type ${name}Props=Omit<React.ComponentPropsWithoutRef<'${plan.tag}'>,${plan.props.length ? plan.props.map((p) => JSON.stringify(p.name)).join("|") : "never"}> & {${fields}};
 const ${name}=React.forwardRef<${element},${name}Props>(function ${name}({children,${plan.props.map((p) => p.name + (p.default !== undefined ? "=" + p.default : "")).join(",")}${plan.props.length ? "," : ""}...rest},ref){const {orientation,value:selected}=useTabsContext();${plan.active ? "const active=selected===value;" : ""}return <${plan.tag} {...rest} ${attrs} ref={ref}>{children}</${plan.tag}>;});export default ${name};`;
  },
};
