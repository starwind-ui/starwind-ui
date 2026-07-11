import { useRuntimePrototypeContext } from "../context";
import { Button, Switch } from "../kit";

export function SwitchDemo() {
  const {
    controlledSwitchChecked,
    setControlledSwitchChecked,
    controlledSwitchChanges,
    setControlledSwitchChanges,
    switchResetRenderCount,
    setSwitchResetRenderCount,
    switchRefSlot,
    setSwitchRef,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4" id="react-runtime-switch-demo">
      <h2 className="font-heading text-xl font-semibold">Switch</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Switch
          id="react-runtime-switch-default"
          name="react-runtime-switch-default"
          value="enabled"
          uncheckedValue="disabled"
          label="Runtime switch"
          variant="primary"
          className="runtime-switch-custom"
        />
        <Switch id="react-runtime-switch-checked" defaultChecked label="Default checked" />
        <Switch
          id="react-runtime-switch-disabled"
          disabled
          label="Disabled switch"
          variant="secondary"
        />
        <Switch
          id="react-runtime-switch-readonly"
          defaultChecked
          readOnly
          label="Read-only switch"
          variant="warning"
        />
        <Switch
          id="react-runtime-switch-controlled"
          ref={setSwitchRef}
          checked={controlledSwitchChecked}
          label="Controlled switch"
          variant="success"
          onCheckedChange={(checked) => {
            setControlledSwitchChecked(checked);
            setControlledSwitchChanges((count) => count + 1);
          }}
        />
        <Switch id="react-runtime-switch-large" size="lg" label="Large switch" variant="info" />
      </div>
      <p data-runtime-switch-controlled>Switch value: {controlledSwitchChecked ? "on" : "off"}</p>
      <p data-runtime-switch-count>Switch changes: {controlledSwitchChanges}</p>
      <p className="sr-only" data-runtime-switch-ref>
        {switchRefSlot}
      </p>
      <form data-runtime-switch-reset-form className="space-y-3">
        <Switch
          id="react-runtime-switch-reset"
          name="react-runtime-switch-reset"
          value="enabled"
          uncheckedValue="disabled"
          defaultChecked
          label={`Reset switch ${switchResetRenderCount}`}
          variant="primary"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setSwitchResetRenderCount((count) => count + 1)}
        >
          Rerender switch reset form
        </Button>
      </form>
    </section>
  );
}
