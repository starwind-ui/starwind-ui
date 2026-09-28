import { requireColorPickerModelOwnership } from "../../../primitive-output-model/color-picker.js";
import type { AdapterColorPickerFacts } from "../../../primitive-output-model/index.js";
import {
  colorPickerLiveOptions,
  printColorPickerConnection,
} from "../../../shared-recipes/color-picker/connection.js";
import { colorPickerSeeds } from "../../../shared-recipes/color-picker/seeds.js";
import { printSvelteRefAttachment } from "../attachments.js";

export function printColorPickerRoot(f: AdapterColorPickerFacts): string {
  const seeds = colorPickerSeeds(
    f,
    (name) => (name === "value" ? "initialValue" : name === "format" ? "initialFormat" : name),
    { authority: "runtime-binding", defaultValue: "resetValue", format: "resetFormat" },
  );
  requireColorPickerModelOwnership(Object.values(f.controlledness.states));
  if (
    !f.events.valueChange.cancelable ||
    f.events.valueChange.callbackTiming !== "before-state-commit"
  )
    throw new TypeError("Svelte Color Picker requires cancelable value proposals before commit.");
  return `<script lang="ts">
  import { ${f.runtime.factory}, parseColor, createColorPickerInitialState, projectColorPickerInitialPart, type ColorPickerOptions, type ColorPickerValue, type ColorPickerColor, type ColorPickerFormat } from "${f.runtime.importSource}";
  import { tick, untrack, type Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { HTMLAttributes } from "svelte/elements";
  import { setRoot, mergeProjection, type RootContext } from "./context.js";
  type Props = Omit<HTMLAttributes<HTMLDivElement>, keyof ColorPickerOptions | "children"> & ColorPickerOptions & { children?: Snippet; ref?: (element: HTMLDivElement | null) => void };
  let { children, value = $bindable(), value: commandValue, format = $bindable(), format: commandFormat, defaultValue, alpha = true, allowEmpty = false, disabled = false, readOnly = false, name, form, required = false, locale, dir, getAriaValueText, getAreaRoleDescription, getColorDescription, onValueChange, onValueCommitted, onFormatChange, ref, ...rest }: Props = $props();
  const initialValue = untrack(() => value), initialFormat = untrack(() => format);
  const resetValue = untrack(() => ${seeds.defaultValue});
  const resetFormat = ${seeds.format};
  const initial = untrack(() => createColorPickerInitialState(${seeds.projection}));
  let acceptedValue = $state.raw<ColorPickerColor | null>(initial.value);
  let acceptedFormat = $state<ColorPickerFormat>(initial.format);
  let requestRefresh = () => {};
  const context: RootContext = {
    get initialState() { return createColorPickerInitialState({ value: acceptedValue, format: acceptedFormat, alpha, allowEmpty, disabled, readOnly, name, form, required, locale, dir, getAriaValueText, getAreaRoleDescription, getColorDescription }); },
    register() { requestRefresh(); return () => requestRefresh(); },
    refresh() { requestRefresh(); },
  };
  setRoot(context);
  const initialProjection = untrack(() => projectColorPickerInitialPart(context.initialState, { part: "root" }));
  let rootProps = $derived(mergeProjection(initialProjection, rest, { "${f.parts.root.discoveryAttribute}": "", "data-sw-part": "root", role: "group" }));

  ${printColorPickerConnection(f)}
  const attachRuntime: Attachment<HTMLDivElement> = (root) => {
    let alive = true, refreshRevision = 0;
    let connection: ReturnType<typeof connectColorPicker> | undefined;
    const readOptions = (): ColorPickerOptions => ({ value: commandValue, format: commandFormat, ${colorPickerLiveOptions(f).join(", ")}, onValueChange, onValueCommitted, onFormatChange });
    function scheduleRefresh(): void {
      const revision = ++refreshRevision;
      void tick().then(() => { if (alive && revision === refreshRevision) untrack(() => connection?.update()); });
    }
    requestRefresh = scheduleRefresh;
    void tick().then(() => {
      if (!alive) return;
      untrack(() => {
        connection = connectColorPicker(root, {
          seed: ${seeds.constructor},
          read: readOptions,
          observe: (nextValue, nextFormat) => { acceptedValue = nextValue; acceptedFormat = nextFormat; },
          publishValue: (next) => { value = next; },
          publishFormat: (next) => { format = next; },
          afterUpdate: (run) => { void tick().then(() => untrack(run)); },
        });
      });
    });
    $effect(() => { rest.style; rest.id; rest["aria-label"]; rest["aria-labelledby"]; untrack(scheduleRefresh); });
    $effect(() => { readOptions(); untrack(() => connection?.update()); });
    return () => {
      alive = false; refreshRevision += 1; requestRefresh = () => {};
      connection?.destroy(); connection = undefined;
    };
  };
${printSvelteRefAttachment("HTMLDivElement")}
</script>

<div {...rootProps} {@attach attachRuntime} {@attach attachRef}>{@render children?.()}</div>
`;
}
