import ProgressPrimitive from "@starwind-ui/react/progress";
import type * as React from "react";
import { progress, progressIndicator, progressTrack } from "./variants";

export type ProgressProps = Omit<React.ComponentPropsWithoutRef<"div">, "value"> & {
  label?: string;
  max?: number;
  min?: number;
  ref?: React.Ref<HTMLDivElement>;
  value?: number | null;
  variant?: "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";
};

function Progress(props: ProgressProps) {
  const {
    label,
    value = null,
    max = 100,
    min = 0,
    variant = "default",
    ref,
    className,
    ...rest
  } = props;

  const ariaLabel = rest["aria-label"] ?? label;
  const boundedMin = Number.isFinite(min) ? min : 0;
  const boundedMax = Number.isFinite(max) ? max : 100;
  const normalizedMin = Math.min(boundedMin, boundedMax);
  const normalizedMax = Math.max(boundedMin, boundedMax);
  const progressValue =
    value == null || !Number.isFinite(Number(value))
      ? null
      : Math.min(Math.max(Number(value), normalizedMin), normalizedMax);
  const isIndeterminate = progressValue === null;
  const progressPercent = isIndeterminate
    ? 0
    : normalizedMax === normalizedMin
      ? progressValue >= normalizedMax
        ? 100
        : 0
      : Math.round(
          Math.min(
            Math.max(((progressValue - normalizedMin) / (normalizedMax - normalizedMin)) * 100, 0),
            100,
          ),
        );
  const indicatorStyle = isIndeterminate
    ? undefined
    : { transform: `translateX(-${100 - progressPercent}%)` };

  return (
    <ProgressPrimitive.Root
      className={progress({
        variant: isIndeterminate ? "indeterminate" : undefined,
        class: className,
      })}
      max={normalizedMax}
      min={normalizedMin}
      ref={ref}
      value={progressValue}
      {...rest}
      aria-label={ariaLabel}
      data-slot="progress"
    >
      <ProgressPrimitive.Track className={progressTrack()} data-slot="progress-track">
        <ProgressPrimitive.Indicator
          className={progressIndicator({
            variant: isIndeterminate ? "indeterminate" : undefined,
            color: variant,
          })}
          style={indicatorStyle}
          data-slot="progress-indicator"
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  );
}

export default Progress;
