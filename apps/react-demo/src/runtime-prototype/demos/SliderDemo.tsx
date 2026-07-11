import type { FormEvent } from "react";
import { useState } from "react";
import { useRuntimePrototypeContext } from "../context";
import { Button, Label, Slider } from "../kit";

const sliderVariants = [
  "default",
  "primary",
  "secondary",
  "info",
  "success",
  "warning",
  "error",
] as const;

export function SliderDemo() {
  const {
    controlledSliderValue,
    setControlledSliderValue,
    controlledSliderChanges,
    setControlledSliderChanges,
  } = useRuntimePrototypeContext();
  const [formOutput, setFormOutput] = useState("Slider form data: pending");

  const handleSliderSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = Array.from(new FormData(event.currentTarget).entries()).map(
      ([name, value]) => `${name}: ${value}`,
    );
    setFormOutput(`Slider form data: ${entries.join(", ")}`);
  };

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Slider</h2>
      <form
        data-runtime-slider-form
        className="grid gap-6 sm:grid-cols-2"
        onSubmit={handleSliderSubmit}
      >
        <div className="grid gap-3">
          <Label htmlFor="react-runtime-slider-volume" size="sm">
            Volume
          </Label>
          <Slider
            id="react-runtime-slider-volume"
            name="react-runtime-slider-volume"
            defaultValue={25}
            variant="primary"
            aria-label="React runtime volume"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="react-runtime-slider-range" size="sm">
            Range
          </Label>
          <Slider
            id="react-runtime-slider-range"
            name="react-runtime-slider-range"
            defaultValue={[20, 80]}
            variant="secondary"
            aria-label="React runtime range"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="react-runtime-slider-controlled" size="sm">
            Controlled
          </Label>
          <Slider
            id="react-runtime-slider-controlled"
            value={controlledSliderValue}
            onValueChange={(nextValue) => {
              setControlledSliderValue(nextValue);
              setControlledSliderChanges((count) => count + 1);
            }}
            variant="success"
            aria-label="React controlled runtime slider"
          />
          <p data-runtime-slider-value>Slider value: {String(controlledSliderValue)}</p>
          <p data-runtime-slider-count>Slider changes: {controlledSliderChanges}</p>
        </div>
        <div className="grid h-32 gap-3">
          <Label htmlFor="react-runtime-slider-vertical" size="sm">
            Vertical
          </Label>
          <Slider
            id="react-runtime-slider-vertical"
            defaultValue={60}
            orientation="vertical"
            variant="warning"
            aria-label="React runtime vertical slider"
          />
        </div>
        <div className="grid gap-3 sm:col-span-2">
          <h3 className="font-heading text-base font-semibold">Variants</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sliderVariants.map((variant, index) => (
              <div key={variant} className="grid gap-2">
                <Label htmlFor={`react-runtime-slider-variant-${variant}`} size="sm">
                  {variant}
                </Label>
                <Slider
                  id={`react-runtime-slider-variant-${variant}`}
                  defaultValue={20 + index * 10}
                  variant={variant}
                  aria-label={`React runtime ${variant} slider`}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="grid gap-3">
          <Label htmlFor="react-runtime-slider-disabled" size="sm">
            Disabled
          </Label>
          <Slider
            id="react-runtime-slider-disabled"
            defaultValue={35}
            disabled
            variant="info"
            aria-label="React runtime disabled slider"
          />
        </div>
        <div className="grid gap-3">
          <Label htmlFor="react-runtime-slider-form-value" size="sm">
            Form value
          </Label>
          <Slider
            id="react-runtime-slider-form-value"
            name="react-runtime-slider-form-value"
            defaultValue={42}
            variant="error"
            aria-label="React runtime form slider"
          />
          <Button type="submit" variant="outline" size="sm">
            Submit sliders
          </Button>
          <output className="text-muted-foreground text-sm" data-runtime-slider-output>
            {formOutput}
          </output>
        </div>
      </form>
    </section>
  );
}
