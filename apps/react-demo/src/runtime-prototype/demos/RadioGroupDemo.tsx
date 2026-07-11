import { useRuntimePrototypeContext } from "../context";
import { RadioGroup, RadioGroupItem } from "../kit";

export function RadioGroupDemo() {
  const {
    controlledRadioGroupValue,
    setControlledRadioGroupValue,
    controlledRadioGroupChanges,
    setControlledRadioGroupChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 id="react-runtime-radio-group-heading" className="font-heading text-xl font-semibold">
        Radio Group
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <RadioGroup
          data-runtime-radio-group-default
          defaultValue="standard"
          name="react-runtime-delivery"
          aria-labelledby="react-runtime-radio-group-heading"
          className="runtime-radio-group-custom"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <RadioGroupItem
              id="react-runtime-radio-group-standard"
              value="standard"
              variant="primary"
              aria-label="Standard delivery"
            />
            Standard delivery
          </div>
          <div className="flex items-center gap-2 text-sm font-medium">
            <RadioGroupItem
              id="react-runtime-radio-group-express"
              value="express"
              variant="secondary"
              aria-label="Express delivery"
            />
            Express delivery
          </div>
        </RadioGroup>

        <div className="space-y-3">
          <RadioGroup
            data-runtime-radio-group-controlled
            value={controlledRadioGroupValue}
            name="react-runtime-controlled-delivery"
            aria-labelledby="react-runtime-radio-group-heading"
            onValueChange={(value) => {
              setControlledRadioGroupValue(value);
              setControlledRadioGroupChanges((count) => count + 1);
            }}
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <RadioGroupItem
                id="react-runtime-radio-group-overnight"
                value="overnight"
                variant="success"
                aria-label="Overnight"
              />
              Overnight
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              <RadioGroupItem
                id="react-runtime-radio-group-express-controlled"
                value="express"
                variant="warning"
                aria-label="Express"
              />
              Express
            </div>
          </RadioGroup>
          <p data-runtime-radio-group-value>Radio group value: {controlledRadioGroupValue}</p>
          <p data-runtime-radio-group-count>Radio group changes: {controlledRadioGroupChanges}</p>
        </div>
      </div>
    </section>
  );
}
