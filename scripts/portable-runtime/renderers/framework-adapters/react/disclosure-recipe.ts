import type { DisclosureRootProjection } from "../../shared-recipes/structured/disclosure/frame.js";
export const reactDisclosureRoot: DisclosureRootProjection = {
  attribute: (name, expression) => (expression === undefined ? name : `${name}={${expression}}`),
  initialCell: (expression) => `React.useRef(${expression}).current`,
  readInput: (name) => name,
  print: ({
    plan,
    fields,
    initial,
    accepted,
    controller,
    lifecycle,
    modelObserver,
    attributes,
  }) => {
    const inputs = [plan.model.name, ...plan.constructorInputs, plan.proposal.callback].join(", ");
    return `import { create${plan.component}, type ${plan.proposal.details} } from "@starwind-ui/runtime/collapsible";
import * as React from "react";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
export const DisclosureDisabledContext = React.createContext(false);
export type ${plan.component}RootProps = Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> & { ${fields} onOpenChange?: (open: boolean, detail: ${plan.proposal.details}) => void };
const ${plan.component}Root = React.forwardRef<HTMLDivElement, ${plan.component}RootProps>(function ${plan.component}Root({ defaultOpen, disabled = false, open, onOpenChange, ...props }, forwardedRef) {
const rootRef = React.useRef<HTMLDivElement>(null);
const inputs = React.useRef({ ${inputs} });
useIsomorphicLayoutEffect(() => { inputs.current = { ${inputs} }; });
${initial}
${accepted}
${controller}
const composedRef = React.useCallback((node: HTMLDivElement | null) => { rootRef.current = node; return setRef(forwardedRef, node); }, [forwardedRef]);
${lifecycle}
useIsomorphicLayoutEffect(() => { const root = rootRef.current; if (!root) return; connectRuntime(root); return disconnectRuntime; }, [${plan.constructorInputs.join(", ")}]);
${modelObserver}
const renderedOpen = open ?? renderedState;
return <DisclosureDisabledContext.Provider value={disabled}><div {...props} ${attributes} ref={composedRef} /></DisclosureDisabledContext.Provider>;
});
${plan.component}Root.displayName = "${plan.component}.Root";
export default ${plan.component}Root;
`;
  },
};
