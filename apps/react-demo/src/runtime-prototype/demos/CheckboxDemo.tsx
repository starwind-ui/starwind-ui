import { useRuntimePrototypeContext } from "../context";
import { Checkbox } from "../kit";

export function CheckboxDemo() {
  const {
    controlledCheckboxChecked,
    setControlledCheckboxChecked,
    controlledCheckboxChanges,
    setControlledCheckboxChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Checkbox</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Checkbox
          id="react-runtime-checkbox-default"
          name="react-runtime-checkbox-default"
          value="accepted"
          label="Accept runtime terms"
          variant="primary"
          className="runtime-checkbox-custom"
        />
        <Checkbox id="react-runtime-checkbox-checked" defaultChecked label="Default checked" />
        <Checkbox
          id="react-runtime-checkbox-indeterminate"
          indeterminate
          label="Indeterminate parent"
          variant="warning"
        />
        <Checkbox
          id="react-runtime-checkbox-disabled"
          disabled
          label="Disabled checkbox"
          variant="secondary"
        />
        <Checkbox
          id="react-runtime-checkbox-controlled"
          checked={controlledCheckboxChecked}
          label="Controlled checkbox"
          variant="success"
          onCheckedChange={(checked) => {
            setControlledCheckboxChecked(checked);
            setControlledCheckboxChanges((count) => count + 1);
          }}
        />
      </div>
      <p data-runtime-checkbox-count>Checkbox changes: {controlledCheckboxChanges}</p>
    </section>
  );
}
