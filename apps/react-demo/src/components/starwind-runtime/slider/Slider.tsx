import SliderPrimitive from "@starwind-ui/react/slider";
import type * as React from "react";
import type { VariantProps } from "tailwind-variants";
import { slider, sliderControl, sliderRange, sliderThumb, sliderTrack } from "./variants";

export type SliderProps = Omit<
  React.ComponentPropsWithoutRef<"div">,
  "defaultValue" | "onChange" | "value"
> &
  VariantProps<typeof sliderRange> &
  VariantProps<typeof sliderThumb> & {
    defaultValue?: import("@starwind-ui/react/slider").SliderValue;
    disabled?: boolean;
    form?: string;
    largeStep?: number;
    max?: number;
    min?: number;
    name?: string;
    onValueChange?: (
      value: import("@starwind-ui/react/slider").SliderValue,
      details: import("@starwind-ui/react/slider").SliderValueChangeDetails,
    ) => void;
    onValueCommitted?: (
      value: import("@starwind-ui/react/slider").SliderValue,
      details: import("@starwind-ui/react/slider").SliderValueCommitDetails,
    ) => void;
    orientation?: "horizontal" | "vertical";
    ref?: React.Ref<HTMLDivElement>;
    step?: number;
    value?: import("@starwind-ui/react/slider").SliderValue;
  };

function Slider(props: SliderProps) {
  const {
    variant = "default",
    defaultValue = 0,
    disabled = false,
    form,
    largeStep = 10,
    max = 100,
    min = 0,
    name,
    onValueChange,
    onValueCommitted,
    orientation = "horizontal",
    ref,
    step = 1,
    value,
    className,
    ...rest
  } = props;

  const resolvedValue = value ?? defaultValue;
  const values = Array.isArray(resolvedValue) ? resolvedValue : [resolvedValue];
  const getPercentage = (item: number) => (max === min ? 0 : ((item - min) / (max - min)) * 100);
  const rangeStart = values.length > 1 ? getPercentage(Math.min(...values)) : 0;
  const rangeEnd =
    values.length > 1 ? getPercentage(Math.max(...values)) : getPercentage(values[0] ?? min);
  const rangeStyle =
    orientation === "horizontal"
      ? { left: `${rangeStart}%`, width: `${rangeEnd - rangeStart}%` }
      : { bottom: `${rangeStart}%`, height: `${rangeEnd - rangeStart}%` };

  return (
    <SliderPrimitive.Root
      className={slider({ class: className })}
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
      value={value}
      {...rest}
      data-slot="slider"
    >
      <SliderPrimitive.Control
        className={sliderControl()}
        data-orientation={orientation}
        data-slot="slider-control"
      >
        <SliderPrimitive.Track
          className={sliderTrack()}
          data-orientation={orientation}
          data-slot="slider-track"
        >
          <SliderPrimitive.Indicator
            className={sliderRange({ variant })}
            data-orientation={orientation}
            data-slot="slider-range"
            style={rangeStyle}
          />
        </SliderPrimitive.Track>

        {values.map((_, index) => (
          <SliderPrimitive.Thumb
            className={sliderThumb({ variant })}
            key={index}
            index={index}
            style={
              orientation === "horizontal"
                ? { left: `${getPercentage(values[index] ?? min)}%` }
                : { bottom: `${getPercentage(values[index] ?? min)}%` }
            }
            data-orientation={orientation}
            data-slot="slider-thumb"
          />
        ))}
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  );
}

export default Slider;
