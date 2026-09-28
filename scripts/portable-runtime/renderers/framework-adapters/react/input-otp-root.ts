import {
  otpConnection,
  otpInitialSeed,
  otpInputMode,
  otpPattern,
  otpTabIndex,
} from "../../shared-recipes/structured/file-controls/input-otp-recipe.js";
import type { AdapterHiddenInputVisualSlotFacts } from "../types.js";

export function printReactInputOtpRoot(facts: AdapterHiddenInputVisualSlotFacts): string {
  const names = [
    "value",
    "disabled",
    "form",
    "id",
    "maxLength",
    "name",
    "pattern",
    "readOnly",
    "required",
  ] as const;
  const root = facts.exports.root;
  const connection = otpConnection(facts, {
    authority: "parent",
    parentAcceptance: "runtime",
    read: "inputs.current",
    seed: "seed.current",
    current: "currentRef.current",
    notify: (value, detail) => `inputs.current.onValueChange?.(${value}, ${detail});`,
    writeCurrent: (value) => `currentRef.current = ${value}; setCurrent(${value});`,
    publish: () => "",
    untrack: (body) => body,
    afterCommit: (body) => `queueMicrotask(() => { ${body} });`,
  });
  return `import { ${facts.runtime.factory}, type ${facts.event.detailsType} } from "${facts.runtime.importSource}";
import * as React from "react";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";
import { setRef } from "../internal/compose-refs";
export type ${root}Props = Omit<React.HTMLAttributes<HTMLDivElement>, "defaultValue" | "id" | "onChange" | "pattern" | "value"> & {
  ${[facts.props.defaultValue, ...names.map((name) => facts.props[name])].map((prop) => `${prop.name}?: ${prop.type};`).join("\n")}
  onValueChange?: (value: string, details: ${facts.event.detailsType}) => void;
};
const ${root} = React.forwardRef<HTMLDivElement, ${root}Props>(function ${root}(
  { children, defaultValue, ${names.map((name) => `${name}${facts.props[name].defaultValue === undefined ? "" : ` = ${facts.props[name].defaultValue}`}`).join(", ")}, onValueChange, ...props }, forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const seed = React.useRef(${otpInitialSeed("parent", "defaultValue")});
  const [current, setCurrent] = React.useState(seed.current);
  const currentRef = React.useRef(current);
  const patternText = ${otpPattern(facts, "pattern")};
  const inputs = React.useRef({ ${names.map((name) => (name === "pattern" ? "pattern: patternText" : name)).join(", ")}, onValueChange });
  useIsomorphicLayoutEffect(() => { inputs.current = { ${names.map((name) => (name === "pattern" ? "pattern: patternText" : name)).join(", ")}, onValueChange }; });
  ${connection}
  const connectionRef = React.useRef<ReturnType<typeof connectOtp> | undefined>(undefined);
  const composedRef = React.useCallback((node: HTMLDivElement | null) => {
    rootRef.current = node;
    return setRef(forwardedRef, node);
  }, [forwardedRef]);
  useIsomorphicLayoutEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const owned = connectOtp(element);
    connectionRef.current = owned;
    return () => { if (connectionRef.current === owned) connectionRef.current = undefined; owned.destroy(); };
  }, []);
  useIsomorphicLayoutEffect(() => { connectionRef.current?.update(); });
  const renderedValue = value ?? current;
  return <div ref={composedRef} ${facts.attrs.root}
    ${facts.attrs.defaultValue}={seed.current} ${facts.attrs.disabled}={disabled ? "" : undefined}
    ${facts.attrs.form}={form} ${facts.attrs.id}={id} ${facts.attrs.maxLength}={maxLength} ${facts.attrs.name}={name}
    ${facts.attrs.pattern}={patternText} ${facts.attrs.readOnly}={readOnly ? "" : undefined} ${facts.attrs.required}={required ? "" : undefined}
    ${facts.attrs.value}={renderedValue} aria-disabled={disabled} tabIndex={${otpTabIndex("disabled")}} {...props}>
    <input ${facts.attrs.input} autoComplete="${facts.nativeInput.autocompleteValue}" className="${facts.nativeInput.hiddenClassValue}"
      defaultValue={renderedValue} disabled={disabled} form={form} id={id} inputMode={${otpInputMode(facts, "patternText")}}
      maxLength={maxLength} name={name} readOnly={readOnly} required={required} tabIndex={${facts.nativeInput.tabIndexValue}} />
    {children}
  </div>;
});
${root}.displayName = "${facts.displayName}.Root";
export default ${root};
`;
}
