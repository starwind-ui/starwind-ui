import type { NativeRootProjection } from "../../shared-recipes/structured/native-frame-types.js";

/** Native overlay react projection. Portal transport is a named target exception. */
export const reactNativeRootProjection: NativeRootProjection = {
  surfaceOperations: { "activate-placement": "", "connect-controller": "connectRuntime(root);" },
  readProp: (name) => name,
  initialCell: (expression) => `React.useRef(${expression}).current`,
  attribute: (name, value) => (value === undefined ? name : `${name}={${value}}`),
  destructure: (props) =>
    props
      .map(
        (prop) =>
          `${prop.name}${prop.defaultValue && prop.name !== "defaultOpen" ? ` = ${prop.defaultValue}` : ""}`,
      )
      .join(", "),
  runtimeImports: (component, portal) =>
    portal ? `, createPortalBinding, refresh${component}PortalSurface` : "",
  printRoot({
    component,
    plan,
    portal,
    popup,
    props,
    fields,
    destructure,
    callbacks,
    imports,
    initial,
    accepted,
    controller,
    refresh,
    lifecycle,
    attributes,
    modelObserver,
    surfaceConnection,
  }) {
    const inputs = ["open", ...plan.constructorInputs, "onOpenChange", "onCloseComplete"].join(
      ", ",
    );
    const connect = `const root = rootRef.current; if (!root) return; ${surfaceConnection} return disconnectRuntime;`;
    return `${imports}
import * as React from "react";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
${portal ? 'import { ReactPortalScopeProvider, useReactPortalScope, useReactPortalRuntimeLifecycle } from "../internal/portal";' : ""}
export const NativeOverlayControlContext = React.createContext<(() => void) | undefined>(undefined);
export type ${component}RootProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & { ${fields}\n${callbacks} };
const ${component}Root = React.forwardRef<HTMLDivElement, ${component}RootProps>(function ${component}Root(
{ ${destructure}, onOpenChange, onCloseComplete, ...props }, forwardedRef) {
const rootRef = React.useRef<HTMLDivElement>(null);
const inputs = React.useRef({ ${inputs} });
useIsomorphicLayoutEffect(() => { inputs.current = { ${inputs} }; });
${initial}
${accepted}
${controller}
${refresh}
const requestRefresh = React.useCallback(refreshControls, []);
const composedRef = React.useCallback((node: HTMLDivElement | null) => { rootRef.current = node; return setRef(forwardedRef, node); }, [forwardedRef]);
${lifecycle}
${
  portal
    ? `const portalScope = useReactPortalScope(rootRef, createPortalBinding);
const initializePortalRuntime = React.useCallback(() => { ${connect} }, [${plan.constructorInputs.join(", ")}]);
useReactPortalRuntimeLifecycle(portalScope, initializePortalRuntime);
useIsomorphicLayoutEffect(() => { if (portalScope.isReady() && rootRef.current) refresh${component}PortalSurface(rootRef.current); }, [portalScope.activation]);`
    : `useIsomorphicLayoutEffect(() => { ${connect} }, [${plan.constructorInputs.join(", ")}]);`
}
${modelObserver}
const renderedOpen = open ?? renderedState;
return ${portal ? "<ReactPortalScopeProvider scope={portalScope}>" : ""}<NativeOverlayControlContext.Provider value={requestRefresh}><div ${attributes} ref={composedRef} {...props} /></NativeOverlayControlContext.Provider>${portal ? "</ReactPortalScopeProvider>" : ""};
});
${component}Root.displayName = "${component}.Root";
export default ${component}Root;
`;
  },
};
