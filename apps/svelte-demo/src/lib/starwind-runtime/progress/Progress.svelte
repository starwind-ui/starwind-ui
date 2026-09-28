<script module lang="ts">
  import type { ComponentProps } from "svelte";
  import { ProgressRoot } from "@starwind-ui/svelte/progress";
  import { cx } from "tailwind-variants";
  import { progress, progressTrack, progressIndicator } from "./variants.js";
  import { ProgressTrack } from "@starwind-ui/svelte/progress";
  import { ProgressIndicator } from "@starwind-ui/svelte/progress";

  export type ProgressProps = Omit<ComponentProps<typeof ProgressRoot>, "children" | "format" | "locale" | "getAriaValueText"> & { label?: string; variant?: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error"; };
</script>

<script lang="ts">
  let {
    "label": label,
    "value": value = null,
    "max": max = 100,
    "min": min = 0,
    "variant": variant = "default",
    "class": className,
    ...rest
  }: ProgressProps = $props();

  let ariaLabel = $derived(rest["aria-label"] ?? label);

  let boundedMin = $derived(Number.isFinite(min) ? min : 0);

  let boundedMax = $derived(Number.isFinite(max) ? max : 100);

  let normalizedMin = $derived(Math.min(boundedMin, boundedMax));

  let normalizedMax = $derived(Math.max(boundedMin, boundedMax));

  let progressValue = $derived(value == null || !Number.isFinite(Number(value)) ? null : Math.min(Math.max(Number(value), normalizedMin), normalizedMax));

  let isIndeterminate = $derived(progressValue === null);

  let progressPercent = $derived(((progressValue: number | null) => { const isIndeterminate = progressValue === null; return isIndeterminate ? 0 : normalizedMax === normalizedMin ? progressValue >= normalizedMax ? 100 : 0 : Math.round(Math.min(Math.max(((progressValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100, 0), 100)); })(progressValue));

  let indicatorStyle = $derived(serializeIndicatorStyle(isIndeterminate ? undefined : { transform: `translateX(-${100 - progressPercent}%)` }));

  function serializeIndicatorStyle(style: { transform: string } | undefined): string | undefined { return style ? "transform: " + style.transform : undefined; }
</script>

<ProgressRoot
  class={progress({ "variant": isIndeterminate ? "indeterminate" : undefined, "class": cx(className) })}
  max={normalizedMax}
  min={normalizedMin}
  value={progressValue}
  {...rest}
  aria-label={ariaLabel}
  data-slot={"progress"}
>
  <ProgressTrack
    class={progressTrack({  })}
    data-slot={"progress-track"}
  >
    <ProgressIndicator
      class={progressIndicator({ "variant": isIndeterminate ? "indeterminate" : undefined, "color": variant })}
      style={indicatorStyle}
      data-slot={"progress-indicator"}
    />
  </ProgressTrack>
</ProgressRoot>
