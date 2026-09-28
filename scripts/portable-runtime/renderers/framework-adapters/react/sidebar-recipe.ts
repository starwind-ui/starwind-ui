import type { SidebarProjection } from "../../shared-recipes/structured/sidebar/types.js";
import { reactNativeRootProjection } from "./native-recipe-root.js";

const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);
export const reactSidebarProjection: SidebarProjection = {
  read: (name) => name,
  initial: reactNativeRootProjection.initialCell,
  state: (name, initial) =>
    `const [accepted${upper(name)},setAccepted${upper(name)}]=React.useState(${initial});`,
  readState: (name) => `accepted${upper(name)}`,
  writeState: (name, value) => `setAccepted${upper(name)}(${value});`,
  attribute: reactNativeRootProjection.attribute,
  print: ({
    facts: f,
    plan,
    props,
    fields,
    callbacks,
    initial,
    cells,
    controller,
    lifecycle,
    media,
    context,
    attributes,
  }) => {
    const inputs = [
      ...plan.models,
      ...plan.constructorInputs,
      ...plan.models.map((name) => f.events[name].callbackProp),
    ].join(",");
    return `import * as React from 'react';
import {${f.runtime.factory},type ${f.types.openDetails},type ${f.types.mobileOpenDetails},type ${f.types.persistenceStorage}} from '${f.runtime.importSource}';
import {setRef} from '../internal/compose-refs';
import {useIsomorphicLayoutEffect} from '../internal/use-isomorphic-layout-effect';
import {${f.context.name},type ${f.context.typeName}} from './${f.context.name}';
export type ${f.exports.provider}Props=Omit<React.HTMLAttributes<HTMLDivElement>,'onChange'> & {${fields}${callbacks}};
const ${f.exports.provider}=React.forwardRef<HTMLDivElement,${f.exports.provider}Props>(function ${f.exports.provider}({${props.map((p) => `${p.name}${p.defaultValue ? `=${p.defaultValue}` : ""}`).join(",")},${plan.models.map((name) => f.events[name].callbackProp).join(",")},...props},forwardedRef){
const rootRef=React.useRef<HTMLDivElement>(null);
const inputs=React.useRef({${inputs}});useIsomorphicLayoutEffect(()=>{inputs.current={${inputs}};});
${initial}
${cells}
${controller}
${lifecycle}
${media}
useIsomorphicLayoutEffect(()=>connectMedia(${plan.media.input}),[${plan.media.input}]);
useIsomorphicLayoutEffect(()=>{const root=rootRef.current;if(!root)return;connectRuntime(root);return disconnectRuntime;},[${plan.constructorInputs.join(",")},${plan.models.map((name) => `${name}!==undefined`).join(",")}]);
useIsomorphicLayoutEffect(applyParentCommand,[${plan.models.join(",")}]);
const composedRef=React.useCallback((node:HTMLDivElement|null)=>{rootRef.current=node;return setRef(forwardedRef,node);},[forwardedRef]);
const context=React.useMemo<${f.context.typeName}>(()=>({${Object.entries(context)
      .filter(([name]) => name !== "isMobile")
      .map(([name, value]) => `${name}:${value}`)
      .join(",")}}),[acceptedOpen,acceptedMobileOpen,acceptedIsMobile]);
return <${f.context.name}.Provider value={context}><div {...props} ${attributes} ref={composedRef}/></${f.context.name}.Provider>;
});${f.exports.provider}.displayName='Sidebar.Provider';export default ${f.exports.provider};`;
  },
};
