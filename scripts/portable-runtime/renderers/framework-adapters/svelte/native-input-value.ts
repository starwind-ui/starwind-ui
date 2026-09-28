import { initialModelValue } from "../../shared-recipes/initial-state.js";
import {
  nativeInputConnection,
  nativeInputSeed,
} from "../../shared-recipes/structured/document-controls/input-recipe.js";
import type { AdapterComponentFile, AdapterIndexFile, AdapterPrintedFile } from "../types.js";
import { printSvelteRefAttachment } from "./attachments.js";

export function printSvelteNativeInputValueIndex(file: AdapterIndexFile): AdapterPrintedFile {
  if (file.family?.kind !== "native-input-value")
    throw new TypeError("Input requires native-value facts.");
  const { root, namespace } = file.family.facts.exports;
  return {
    path: file.path,
    contents: `import ${root} from "./${root}.svelte";
const ${namespace} = { Root: ${root} };
export { ${namespace}, ${root} };
export default ${namespace};\n`,
  };
}

export function printSvelteNativeInputValueComponent(
  file: AdapterComponentFile,
): AdapterPrintedFile {
  if (file.component.family?.kind !== "native-input-value")
    throw new TypeError("Input requires native-value facts.");
  const facts = file.component.family.facts;
  const connection = nativeInputConnection(facts, {
    model: "value",
    defaultValue: "seed",
    disabled: "disabled",
    authority: "binding",
    transport: "runtime-notification",
    notify: (next, detail) => `onValueChange?.(${next}, ${detail});`,
    publish: (next) => `value = ${next};`,
    untrack: (body) => `untrack(() => { ${body} });`,
  });
  return {
    path: `${file.path}.svelte`,
    contents: `<script lang="ts">
  import { ${facts.runtime.factory}, type InputValue, type InputValueChangeDetails } from "${facts.runtime.importSource}";
  import { untrack } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import { observeFormDiscovery } from "../_internal/form-discovery.js";
  import type { HTMLInputAttributes } from "svelte/elements";
  type Props = Omit<HTMLInputAttributes, "children" | "value" | "defaultValue" | "disabled"> & {
    disabled?: boolean;
    value?: InputValue;
    defaultValue?: InputValue;
    onValueChange?: (value: string, detail: InputValueChangeDetails) => void;
    ref?: (element: HTMLInputElement | null) => void;
  };
  let { value = $bindable(), defaultValue, disabled = ${facts.props.disabled.defaultValue}, type, onValueChange, ref, ...rest }: Props = $props();
  const seed = untrack(() => ${nativeInputSeed("defaultValue", "value")});
  const initialMarkup = untrack(() => type === "file" ? undefined : ${initialModelValue("value", "defaultValue")});
  ${connection}
  const attachInput: Attachment<HTMLInputElement> = (element) => {
    const connection = untrack(() => connectInput(element));
    $effect(() => {
      const next = value;
      untrack(() => connection.synchronize(next));
    });
    $effect(() => {
      const next = disabled;
      untrack(() => connection.instance.${facts.runtime.disabledSetter.method}(next));
    });
    let appliedType = untrack(() => type);
    $effect(() => {
      const next = type;
      if (next === appliedType) return;
      appliedType = next;
      untrack(() => connection.synchronize(connection.instance.${facts.runtime.valueGetter}()));
    });
    return () => connection.destroy();
  };
${printSvelteRefAttachment("HTMLInputElement")}
</script>
<input {...rest} {type} value={initialMarkup} {disabled} ${facts.attrs.root}="" ${facts.attrs.stateDisabled}={disabled ? "" : undefined} {@attach attachInput} {@attach attachRef} />
`,
  };
}
