import { useRuntimePrototypeContext } from "../context";
import { Checkbox, CheckboxGroup } from "../kit";

export function CheckboxGroupDemo() {
  const {
    controlledCheckboxGroupValue,
    setControlledCheckboxGroupValue,
    controlledCheckboxGroupChanges,
    setControlledCheckboxGroupChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 id="react-runtime-checkbox-group-heading" className="font-heading text-xl font-semibold">
        Checkbox Group
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <CheckboxGroup
          data-runtime-checkbox-group-default
          defaultValue={["email"]}
          aria-labelledby="react-runtime-checkbox-group-heading"
          className="runtime-checkbox-group-custom"
        >
          <Checkbox
            id="react-runtime-checkbox-group-email"
            name="react-runtime-preferences"
            value="email"
            label="Email alerts"
            variant="primary"
          />
          <Checkbox
            id="react-runtime-checkbox-group-sms"
            name="react-runtime-preferences"
            value="sms"
            label="SMS alerts"
            variant="secondary"
          />
        </CheckboxGroup>

        <div className="space-y-3">
          <CheckboxGroup
            data-runtime-checkbox-group-controlled
            aria-labelledby="react-runtime-checkbox-group-heading"
            value={controlledCheckboxGroupValue}
            onValueChange={(value) => {
              setControlledCheckboxGroupValue(value);
              setControlledCheckboxGroupChanges((count) => count + 1);
            }}
          >
            <Checkbox
              id="react-runtime-checkbox-group-security"
              name="react-runtime-controlled-preferences"
              value="security"
              label="Security notices"
              variant="success"
            />
            <Checkbox
              id="react-runtime-checkbox-group-product"
              name="react-runtime-controlled-preferences"
              value="product"
              label="Product updates"
              variant="warning"
            />
          </CheckboxGroup>
          <p data-runtime-checkbox-group-value>
            Checkbox group value: {controlledCheckboxGroupValue.join(", ")}
          </p>
          <p data-runtime-checkbox-group-count>
            Checkbox group changes: {controlledCheckboxGroupChanges}
          </p>
        </div>
      </div>
    </section>
  );
}
