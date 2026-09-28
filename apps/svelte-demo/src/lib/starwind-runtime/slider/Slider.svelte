<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { untrack } from "svelte";
  import type { VariantProps } from "tailwind-variants";
  import { cx } from "tailwind-variants";
  import { SliderRoot as PrimitiveRoot } from "@starwind-ui/svelte/slider";
  import type { SliderValue } from "@starwind-ui/svelte/slider";
  import { slider, sliderControl, sliderTrack, sliderRange, sliderThumb } from "./variants.js";
  import { SliderRoot } from "@starwind-ui/svelte/slider";
  import { SliderControl } from "@starwind-ui/svelte/slider";
  import { SliderTrack } from "@starwind-ui/svelte/slider";
  import { SliderIndicator } from "@starwind-ui/svelte/slider";
  import { SliderThumb } from "@starwind-ui/svelte/slider";

  export type SliderProps = Omit<ComponentProps<typeof PrimitiveRoot>, "children" | "minStepsBetweenValues"> & VariantProps<typeof sliderRange> & VariantProps<typeof sliderThumb>;
</script>

<script lang="ts">
  let {
    "variant": variant = "default",
    "defaultValue": defaultValue,
    "disabled": disabled = false,
    "form": form,
    "largeStep": largeStep = 10,
    "max": max = 100,
    "min": min = 0,
    "name": name,
    "orientation": orientation = "horizontal",
    "step": step = 1,
    "class": className,
    "onValueChange": onValueChange,
    "onValueCommitted": onValueCommitted,
    "ref": ref,
    value = $bindable(),
    "value": commandValue,
    ...rest
  }: SliderProps = $props();

  const copy = (next: SliderValue | undefined) => Array.isArray(next) ? [...next] : next;
  let retainedValue = $state<SliderValue>(untrack(() => copy(value ?? defaultValue ?? 0)!));

  let resolvedValue = $derived(value ?? retainedValue);

  let values = $derived(Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue]);

  let getPercentage = $derived((item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100));

  let rangeStart = $derived(values.length > 1 ? getPercentage(Math.min(...values)) : 0);

  let rangeEnd = $derived(values.length > 1 ? getPercentage(Math.max(...values)) : getPercentage(values[0] ?? min));

  let rangeStyle = $derived(orientation === "horizontal" ? `left: ${rangeStart}%; width: ${rangeEnd - rangeStart}%` : `bottom: ${rangeStart}%; height: ${rangeEnd - rangeStart}%`);

  const equal = (left: SliderValue | undefined, right: SliderValue | undefined) => Array.isArray(left) && Array.isArray(right) ? left.length === right.length && left.every((value, index) => Object.is(value, right[index])) : Object.is(left, right);
  let observedCommand = untrack(() => copy(commandValue));
  $effect(() => {
    const next = copy(commandValue);
    untrack(() => {
      if (equal(next, observedCommand)) return;
      observedCommand = copy(next);
      if (!equal(next, value)) value = copy(next);
    });
  });
  $effect(() => {
    const next = copy(value);
    if (next !== undefined) retainedValue = next;
  });
</script>

<SliderRoot
  class={slider({ "class": cx(className) })}
  defaultValue={defaultValue}
  disabled={disabled}
  form={form}
  largeStep={largeStep}
  max={max}
  min={min}
  name={name}
  onValueChange={onValueChange}
  onValueCommitted={onValueCommitted}
  orientation={orientation}
  ref={ref}
  step={step}
  {...rest}
  data-slot={"slider"}
  bind:value={value}
>
  <SliderControl
    class={sliderControl({  })}
    data-orientation={orientation}
    data-slot={"slider-control"}
  >
    <SliderTrack
      class={sliderTrack({  })}
      data-orientation={orientation}
      data-slot={"slider-track"}
    >
      <SliderIndicator
        class={sliderRange({ "variant": variant })}
        data-orientation={orientation}
        data-slot={"slider-range"}
        style={rangeStyle}
      />
    </SliderTrack>
    {#each values as _, index (index)}
      <SliderThumb
        class={sliderThumb({ "variant": variant })}
        index={index}
        style={orientation === "horizontal" ? `left: ${getPercentage(values[index] ?? min)}%` : `bottom: ${getPercentage(values[index] ?? min)}%`}
        data-orientation={orientation}
        data-slot={"slider-thumb"}
      />
    {/each}
  </SliderControl>
</SliderRoot>
