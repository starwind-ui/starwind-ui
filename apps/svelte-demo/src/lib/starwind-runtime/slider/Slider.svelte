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
    variant = "default",
    defaultValue,
    disabled = false,
    form,
    largeStep = 10,
    max = 100,
    min = 0,
    name,
    orientation = "horizontal",
    step = 1,
    "class": className,
    onValueChange,
    onValueCommitted,
    ref,
    value = $bindable(),
    "value": commandValue,
    ...rest
  }: SliderProps = $props();

  const copy = (next: SliderValue | undefined) => Array.isArray(next) ? [...next] : next;
  const valueControlled = untrack(() => commandValue) !== undefined;
  // A parent-controlled value is read past the local value of a one-way bindable.
  const acceptedInput = () => valueControlled ? commandValue : value;
  let retainedValue = $state<SliderValue>(untrack(() => copy(value ?? defaultValue ?? 0)!));

  let resolvedValue = $derived(acceptedInput() ?? retainedValue);

  let getPaintValues = $derived((input: number | number[]) => {
                const items = Array.isArray(input) ? input : [input];
                if (!items.length) return [min];
                const precision = (String(step).split(".")[1] ?? "").length;
                return items.map((item) => {
                  if (!Number.isFinite(item)) return min;
                  const snapped = step > 0 ? Number((Math.round((item - min) / step) * step + min).toFixed(precision)) : item;
                  return Math.min(Math.max(snapped, min), max);
                }).sort((left, right) => left - right);
              });

  let values = $derived(getPaintValues(resolvedValue));

  let getPercentage = $derived((item: number) => (max <= min ? 0 : ((item - min) / (max - min)) * 100));

  let rangeStart = $derived(values.length > 1 ? getPercentage(Math.min(...values)) : 0);

  let rangeEnd = $derived(values.length > 1 ? getPercentage(Math.max(...values)) : getPercentage(values[0] ?? min));

  let rangeStyle = $derived(orientation === "horizontal" ? `inset-inline-start: ${rangeStart}%; width: ${rangeEnd - rangeStart}%` : `bottom: ${rangeStart}%; height: ${rangeEnd - rangeStart}%`);

  $effect(() => {
    const next = copy(acceptedInput());
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
  bind:value={() => commandValue, (next) => { value = next; }}
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
        style={orientation === "horizontal" ? `inset-inline-start: ${getPercentage(values[index] ?? min)}%` : `bottom: ${getPercentage(values[index] ?? min)}%`}
        data-orientation={orientation}
        data-slot={"slider-thumb"}
      />
    {/each}
  </SliderControl>
</SliderRoot>
