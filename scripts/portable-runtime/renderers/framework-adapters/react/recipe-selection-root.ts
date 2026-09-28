import type { FrameworkOperations } from "../../shared-recipes/structured/operations.js";
import type { ConnectionRecipe } from "../../shared-recipes/structured/plan.js";
import type { SelectionRootProjection } from "../../shared-recipes/structured/root-frame.js";
export const reactSelectionRootProjection: SelectionRootProjection = {
  readProp: (name) => name,
  callbackType: (plan) =>
    plan.proposal.arguments === "details"
      ? `(detail: ${plan.proposal.details}) => void`
      : `(value: ${plan.model.type}, detail: ${plan.proposal.details}) => void`,
  destructureProp: (name, defaultValue) => `${name}${defaultValue ? ` = ${defaultValue}` : ""}`,
  marker: (name) => name,
  attribute: (name, value) => `${name}={${value}}`,
  print(input) {
    const {
      frame,
      plan,
      fw,
      name,
      publicName,
      code,
      controller,
      accepted,
      callbackType,
      fields,
      destructure,
      attributes,
      callback,
      imports,
      initialBody,
      serializeDefault,
      helpers,
      before,
    } = input;
    return `${before}${imports}
import * as React from "react";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
export type ${frame.component}RootProps = Omit<React.HTMLAttributes<HTMLDivElement>, "${plan.model.default}" | "onChange"> & {
${fields}
${callback}?: ${callbackType};
};
const ${frame.component}Root = React.forwardRef<HTMLDivElement, ${frame.component}RootProps>(function ${frame.component}Root(
{ ${destructure}, ${callback}, ...props }, forwardedRef) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputs = React.useRef({ ${[publicName, ...plan.constructorInputs, callback].join(", ")} });
  useIsomorphicLayoutEffect(() => { inputs.current = { ${[publicName, ...plan.constructorInputs, callback].join(", ")} }; });
  const initial = React.useRef<${plan.model.type} | undefined>(undefined);
  if (initial.current === undefined) {
    ${initialBody}
    initial.current = copyModel(initialValue);
  }
  const initialValue = initial.current;
  ${serializeDefault}
  ${accepted}
  ${controller}
  const composedRef = React.useCallback((node: HTMLDivElement | null) => { rootRef.current = node; return setRef(forwardedRef, node); }, [forwardedRef]);
  ${code}
  ${observeElementConnection(plan, fw)}
  return <${frame.element} ${attributes} ref={composedRef} {...props} />;
});
${frame.component}Root.displayName = "${frame.component}.Root";
export default ${frame.component}Root;
${helpers}
`;
  },
};
function observeElementConnection(plan: ConnectionRecipe, fw: FrameworkOperations): string {
  return `useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    connectRuntime(root);
    return disconnectRuntime;
  }, [${plan.constructorInputs.join(", ")}]);
  ${fw.observeModel(plan.model.name)}`;
}
