import type { ComboboxOperations } from "../../shared-recipes/structured/combobox-operations.js";
import { vueSelectOperations as base } from "./recipe-select-operations.js";
export const vueComboboxOperations: ComboboxOperations = {
  observeModel: (
    c,
    body,
  ) => `watch(() => props.${c.name === "value" ? "modelValue" : c.name}, (nextValue, previous) => {
    if ((nextValue === undefined) !== (previous === undefined)) {
      if (nextValue === undefined && instance) uncontrolled${c.name[0]!.toUpperCase() + c.name.slice(1)}.value = instance.${c.getter}();
      void recreate(); return;
    }
    const owned = instance; if (nextValue === undefined || !owned) return;
    ${body}
  }, {flush:'post'});`,
  settleLabel: () => "",
  ...base,
  root: "rootRef.value!",
  portal: "portalReference: portalReference ?? undefined,",
  nativeInputRestoresCanceledValue: false,
  selectedText: () => "created.getInputValue()",
  rememberLabel: () => "",
  own: (instance) => `instance = ${instance};`,
  subscribe: (instance, event, body) =>
    `unsubscribeAccepted.push(${instance}.subscribe("${event}", detail => { ${body} }));`,
};
