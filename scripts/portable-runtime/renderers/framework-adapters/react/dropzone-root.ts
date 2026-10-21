import {
  dropzoneConnection,
  dropzoneInitialState,
  dropzoneTabIndex,
} from "../../shared-recipes/structured/file-controls/dropzone-recipe.js";
import type { AdapterFileDropControlFacts } from "../types.js";

export function printReactDropzoneRoot(facts: AdapterFileDropControlFacts): string {
  const root = facts.exports.root;
  const part = facts.parts.root;
  const connection = dropzoneConnection(facts, {
    read: "inputs.current",
    notify: (event, files, detail) =>
      `inputs.current.${event.callbackProp}?.(${files}, ${detail});`,
    untrack: (body) => body,
  });
  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType}, type ${facts.rejectEvent.detailsType} } from "${facts.runtime.importSource}";
import * as React from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
import { observeFormDiscovery } from "../internal/form-discovery";
import { setRef } from "../internal/compose-refs";
export type ${root}Props = Omit<React.LabelHTMLAttributes<HTMLLabelElement>, "onChange"> & {
  disabled?: ${facts.props.disabled.type};
  isUploading?: ${facts.props.isUploading.type};
  onFilesChange?: (files: ${facts.event.valueType}, details: ${facts.event.detailsType}) => void;
  ${facts.rejectEvent.callbackProp}?: (files: ${facts.rejectEvent.valueType}, details: ${facts.rejectEvent.detailsType}) => void;
};
const ${root} = React.forwardRef<HTMLLabelElement, ${root}Props>(function ${root}(
  { disabled = ${facts.props.disabled.defaultValue}, isUploading = ${facts.props.isUploading.defaultValue}, onFilesChange, ${facts.rejectEvent.callbackProp}, ...props }, forwardedRef,
) {
  const rootRef = React.useRef<HTMLLabelElement>(null);
  const inputs = React.useRef({ disabled, isUploading, onFilesChange, ${facts.rejectEvent.callbackProp} });
  useIsomorphicLayoutEffect(() => { inputs.current = { disabled, isUploading, onFilesChange, ${facts.rejectEvent.callbackProp} }; });
  ${connection}
  const connectionRef = React.useRef<ReturnType<typeof connectDropzone> | undefined>(undefined);
  const composedRef = React.useCallback((node: HTMLLabelElement | null) => {
    rootRef.current = node;
    return setRef(forwardedRef, node);
  }, [forwardedRef]);
  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const owned = connectDropzone(root);
    connectionRef.current = owned;
    return () => { connectionRef.current = undefined; owned.destroy(); };
  }, []);
  useIsomorphicLayoutEffect(() => { connectionRef.current?.update(); }, [disabled, isUploading]);
  return <${part.defaultElement} ${facts.attrs.root}
    ${facts.attrs.disabled}={disabled ? "" : undefined}
    ${facts.attrs.dragActive}="${dropzoneInitialState.dragActive}" ${facts.attrs.hasFiles}="${dropzoneInitialState.hasFiles}"
    ${facts.attrs.isUploading}={isUploading ? "true" : "false"}
    ${facts.attrs.ariaDisabled}={disabled ? "true" : "false"} ${facts.attrs.role}="${part.role}"
    tabIndex={${dropzoneTabIndex("disabled")}} ref={composedRef} {...props} />;
});
${root}.displayName = "${facts.displayName}.${part.namespaceKey}";
export default ${root};
`;
}
