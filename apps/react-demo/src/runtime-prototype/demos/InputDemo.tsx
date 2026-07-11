import { useRuntimePrototypeContext } from "../context";
import { Input, Label } from "../kit";

export function InputDemo() {
  const {
    controlledInputValue,
    controlledInputChanges,
    controlledInputNativeChangeValue,
    rejectedInputChanges,
    inputRefSlot,
    setInputRef,
    handleControlledInputValueChange,
    handleControlledInputNativeChange,
    handleRejectedInputValueChange,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Input</h2>
      <form data-runtime-input-form className="grid gap-4 sm:grid-cols-5">
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-default" size="sm">
            Default input
          </Label>
          <Input
            id="react-runtime-input-default"
            ref={setInputRef}
            name="react-runtime-input-default"
            className="runtime-input-custom"
            defaultValue="Ada"
            placeholder="Type a name"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-controlled" size="sm">
            Controlled input
          </Label>
          <Input
            id="react-runtime-input-controlled"
            value={controlledInputValue}
            onChange={handleControlledInputNativeChange}
            onValueChange={handleControlledInputValueChange}
            placeholder="Controlled value"
          />
          <p data-runtime-input-value>Input value: {controlledInputValue}</p>
          <p data-runtime-input-count>Input changes: {controlledInputChanges}</p>
          <p data-runtime-input-native-change>
            Native input change: {controlledInputNativeChangeValue}
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-disabled" size="sm">
            Disabled input
          </Label>
          <Input id="react-runtime-input-disabled" disabled placeholder="Locked" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-rejected" size="sm">
            Rejected input
          </Label>
          <Input
            id="react-runtime-input-rejected"
            value="Ada"
            onValueChange={handleRejectedInputValueChange}
            placeholder="Rejected value"
          />
          <p data-runtime-input-rejected-count>Rejected changes: {rejectedInputChanges}</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-input-file" size="sm">
            File input
          </Label>
          <Input id="react-runtime-input-file" name="react-runtime-input-file" type="file" />
        </div>
      </form>
      <p className="sr-only" data-runtime-input-ref>
        {inputRefSlot}
      </p>
    </section>
  );
}
