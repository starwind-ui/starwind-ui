import {
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldItem,
  FieldLabel,
  FieldSeparator,
  RadioGroup,
  RadioGroupItem,
  Switch,
} from "../kit";

export function FieldDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Field</h2>
      <form data-runtime-field-form className="grid gap-6 sm:grid-cols-2">
        <Field
          id="react-runtime-field-input"
          name="react-runtime-field-input"
          className="runtime-field-input"
        >
          <FieldLabel size="sm">Display name</FieldLabel>
          <FieldControl
            id="react-runtime-field-input-control"
            required
            placeholder="Type a display name"
          />
          <FieldDescription id="react-runtime-field-input-description">
            This name is visible in shared spaces.
          </FieldDescription>
          <FieldError id="react-runtime-field-input-error" match="valueMissing">
            Enter a display name.
          </FieldError>
        </Field>

        <Field id="react-runtime-field-checkbox" name="react-runtime-field-checkbox">
          <FieldItem>
            <Checkbox id="react-runtime-field-checkbox-control" value="accepted" />
            <div className="grid gap-1">
              <FieldLabel size="sm">Accept updates</FieldLabel>
              <FieldDescription>Receive product and security updates.</FieldDescription>
            </div>
          </FieldItem>
        </Field>

        <FieldSeparator className="sm:col-span-2">Preferences</FieldSeparator>

        <Field id="react-runtime-field-radio" name="react-runtime-field-radio">
          <FieldLabel size="sm">Plan</FieldLabel>
          <RadioGroup id="react-runtime-field-radio-group" className="grid gap-3">
            <div className="flex items-center gap-2">
              <RadioGroupItem id="react-runtime-field-radio-basic" value="basic" />
              <span className="text-sm">Basic</span>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem id="react-runtime-field-radio-pro" value="pro" />
              <span className="text-sm">Pro</span>
            </div>
          </RadioGroup>
          <FieldDescription>Choose the plan used for billing.</FieldDescription>
        </Field>

        <Field id="react-runtime-field-switch" name="react-runtime-field-switch">
          <FieldItem>
            <Switch
              id="react-runtime-field-switch-control"
              value="enabled"
              uncheckedValue="disabled"
            />
            <div className="grid gap-1">
              <FieldLabel size="sm">Billing alerts</FieldLabel>
              <FieldDescription>Send alerts before renewal.</FieldDescription>
            </div>
          </FieldItem>
        </Field>

        <FieldSeparator className="sm:col-span-2" />
      </form>
    </section>
  );
}
