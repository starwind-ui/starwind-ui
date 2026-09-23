import type { TimedRootProjection } from "../../shared-recipes/structured/timed/frame.js";
import { reactNativeRootProjection } from "./native-recipe-root.js";
export const reactTimedRoot: TimedRootProjection = {
  read: (name) => name,
  initial: reactNativeRootProjection.initialCell,
  attribute: reactNativeRootProjection.attribute,
  observe: (inputs, body) =>
    `useIsomorphicLayoutEffect(() => { ${body} }, [${inputs.join(", ")}]);`,
  print: ({
    facts: f,
    plan,
    props,
    fields,
    initial,
    accepted,
    controller,
    lifecycle,
    attributes,
    placement,
    connectSurface,
    disabledSync,
    observeModel,
  }) => {
    const inputs = [
      "open",
      ...plan.constructorInputs,
      ...(plan.initialInputs ?? []),
      "onOpenChange",
    ].join(", ");
    return `import { createPortalBinding, ${f.runtime.factory}, refresh${plan.component}PortalSurface, type ${plan.proposal.details} } from "${f.runtime.importSource}";
import * as React from "react";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
import { ReactPortalScopeProvider, useReactPortalScope, useReactPortalRuntimeLifecycle } from "../internal/portal";
export const TimedPlacementContext = React.createContext<((element:HTMLElement,attributes:Record<string,string>|null)=>void)|undefined>(undefined);
export type ${f.exports.root}Props = Omit<React.HTMLAttributes<HTMLDivElement>,"onChange"> & { ${fields} onOpenChange?:(open:boolean,detail:${plan.proposal.details})=>void; };
const ${f.exports.root} = React.forwardRef<HTMLDivElement,${f.exports.root}Props>(function ${f.exports.root}({ ${props.map((p) => `${p.name}${p.defaultValue ? ` = ${p.defaultValue}` : ""}`).join(", ")}, onOpenChange,...props },forwardedRef){
const rootRef=React.useRef<HTMLDivElement>(null);
const inputs=React.useRef({${inputs}});
useIsomorphicLayoutEffect(()=>{ inputs.current={${inputs}}; });
${initial}
${accepted}
${controller}
${placement}
const publishPlacement=React.useCallback(registerPlacement,[]);
const composedRef=React.useCallback((node:HTMLDivElement|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);
${lifecycle}
${connectSurface}
const portalScope=useReactPortalScope(rootRef,createPortalBinding);
const initializePortalRuntime=React.useCallback(()=>{ const root=rootRef.current; if(!root)return;
${
  plan.surface.requirePortal
    ? `const snapshot=createPortalBinding(root).getSnapshot();
if(snapshot.status==='ready' && snapshot.parts.portals.length===0) throw new Error("Starwind UI: <${plan.component}.Portal> is missing.");`
    : ""
}
connectSurface(root);return disconnectRuntime;
},[${plan.constructorInputs.join(", ")}]);
useReactPortalRuntimeLifecycle(portalScope,initializePortalRuntime);
useIsomorphicLayoutEffect(()=>{if(portalScope.isReady()&&rootRef.current)refresh${plan.component}PortalSurface(rootRef.current);},[portalScope.activation]);
${observeModel}
${disabledSync}
const renderedOpen=open??renderedState;
return <ReactPortalScopeProvider scope={portalScope}><TimedPlacementContext.Provider value={publishPlacement}><div {...props} ${attributes} ref={composedRef}/></TimedPlacementContext.Provider></ReactPortalScopeProvider>;
});
${f.exports.root}.displayName="${plan.component}.Root";
export default ${f.exports.root};
`;
  },
};

import { partAttributes } from "../../shared-recipes/structured/part-policy.js";
import {
  timedPartPolicy,
  timedPlacementInputs,
} from "../../shared-recipes/structured/timed/recipe.js";
import type { AdapterTimedFloatingOverlayFacts as Facts } from "../types.js";
export function printReactTimedPlacement(f: Facts, part: "positioner" | "popup"): string {
  const inputs = timedPlacementInputs(f),
    name = f.exports[part];
  const props = inputs.map(([, name]) => f.props[name as keyof Facts["props"]]);
  return `import * as React from 'react';
import {useComposedRefs} from '../internal/compose-refs';
import {useIsomorphicLayoutEffect} from '../internal/use-isomorphic-layout-effect';
import {TimedPlacementContext} from './${f.exports.root}';
export type ${name}Props=${part === "popup" && f.popup.omitTabIndexProps ? 'Omit<React.HTMLAttributes<HTMLDivElement>,"tabIndex"|"tabindex">' : "React.HTMLAttributes<HTMLDivElement>"}&{${props.map((p) => `${p.name}?:${p.type};`).join("")}};
const ${name}=React.forwardRef<HTMLDivElement,${name}Props>(function ${name}({${props.map((p) => `${p.name}=${p.defaultValue}`).join(", ")},...props},forwardedRef){
const register=React.useContext(TimedPlacementContext),element=React.useRef<HTMLDivElement>(null);
const composedRef=useComposedRefs(forwardedRef,element);
useIsomorphicLayoutEffect(()=>{const node=element.current;if(!node)return;register?.(node,{${inputs.map(([attr, input]) => `${JSON.stringify(attr)}:String(${input})`).join(", ")}});return ()=>register?.(node,null);},[register,${inputs.map(([, input]) => input).join(", ")}]);
return <div {...props} ${partAttributes("react", timedPartPolicy(f, part))} ref={composedRef}/>;
});
${name}.displayName='${f.displayName}.${part === "popup" ? "Popup" : "Positioner"}';export default ${name};
`;
}

export function printReactTimedPassive(f: Facts, part: "arrow" | "backdrop" | "viewport"): string {
  const name = f.exports[part]!,
    element = f.parts[part]!.defaultElement;
  return `import * as React from 'react';
export type ${name}Props=React.HTMLAttributes<HTMLDivElement>;
const ${name}=React.forwardRef<HTMLDivElement,${name}Props>(function ${name}(props,ref){return <${element} {...props} ${partAttributes("react", timedPartPolicy(f, part))} ref={ref}/>;});
${name}.displayName='${f.displayName}.${f.parts[part]!.namespaceKey}';export default ${name};\n`;
}
