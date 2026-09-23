import { operations } from "../../shared-recipes/structured/operations.js";
import type { SelectOperations } from "../../shared-recipes/structured/select-operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
/** Syntax/storage mapping into the existing React lazy collection frame. */
export const reactSelectOperations: SelectOperations = {
  fw: operations.react,
  input: (name) =>
    ["open", "value", "onOpenChange", "onValueChange"].includes(name) ? `${name}Ref.current` : name,
  accepted: (channel) =>
    `uncontrolled${upper(channel.name)}Ref.current${channel.name === "value" ? " ?? null" : ""}`,
  render: (channel, value) => `setUncontrolled${upper(channel.name)}(${value});`,
  initial: (channel) =>
    channel.name === "value" ? "defaultValueRef.current" : "uncontrolledOpenRef.current",
  callback: (channel) => `${channel.callback}Ref.current?.(next, detail);`,
  owner: "instanceRef.current",
  root: "root",
  portal: "",
  publish: () => "",
  label: (value, item) =>
    `const label = getTextFromSelectItem(${item ?? "undefined"}); if (label !== null || ${value} === null) setSelectedLabel({ label, value: ${value} });`,
  observe: (inputs, body) =>
    `useIsomorphicLayoutEffect(() => { ${body} }, [${inputs.join(", ")}]);`,
  attribute: (name, expression) => `${name}={${expression}}`,
  // React's post-commit reset owner observer also reconciles its lazy label cache.
  bindReset: "",
  reset: {
    timer: "reset.timer",
    revision: "valueRevisionRef.current",
    generation: "reset.generation",
    isCurrent: "rootRef.current === root && inputRef.current === input",
    initialValue: "defaultValueRef.current ?? null",
    runtime: { read: "instanceRef.current", availability: "lazy" },
    nativeControl: { value: "input.value", needsRender: "reset.needsRender" },
    label: (value) =>
      `setSelectedLabel({ label: findSelectedOptionText(childrenRef.current, ${value}), value: ${value} });`,
  },
};
