import type { ComboboxOperations } from "../../shared-recipes/structured/combobox-operations.js";
import { reactSelectOperations as base } from "./recipe-select-operations.js";

const upper = (name: string) => name[0]!.toUpperCase() + name.slice(1);
export const reactComboboxOperations: ComboboxOperations = {
  observeModel: (c, body) => `useIsomorphicLayoutEffect(() => {
    const nextValue = ${c.name}; if (nextValue === undefined) return;
    const owned = ${c.name === "open" ? "nextValue ? ensureInstance() : instanceRef.current" : "instanceRef.current"};
    if (!owned) return;
    ${body}
  }, [${c.name}${c.name === "open" ? ", disabled, ensureInstance" : ""}]);`,
  settleLabel: (value) => `const settledText = resolveSelectedText(${value});
    setSelectedInputValue({inputValue:settledText,value:${value}});
    rootRef.current?.querySelectorAll<HTMLElement>("[data-sw-combobox-value]").forEach(element => {
      element.textContent = settledText ?? element.getAttribute("data-placeholder") ?? "";
    });`,
  ...base,
  input: (name) =>
    ["value", "inputValue", "open", "onValueChange", "onInputValueChange", "onOpenChange"].includes(
      name,
    )
      ? `${name}Ref.current`
      : name,
  accepted: (channel) => `uncontrolled${upper(channel.name)}Ref.current`,
  resolveLazyInitialText: (value) => `resolveSelectedText(${value})`,
  resolveLazyText: (value) => `resolveSelectedText(${value})`,
  rememberLabel: (value, item, instance) =>
    `setSelectedInputValue({inputValue: (getTextFromComboboxItem(${item}) ?? (${value} === null ? null : findSelectedComboboxItemText(childrenRef.current, ${value})) ?? ${instance}.getInputValue()) || null,value:${value}});`,
  own: (instance) => `instanceRef.current = ${instance};`,
  subscribe: (instance, event, body) => `${instance}.subscribe("${event}", detail => { ${body} });`,
};
