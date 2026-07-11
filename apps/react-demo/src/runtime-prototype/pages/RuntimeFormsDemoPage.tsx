import { AsyncAvailabilityDemo } from "../runtime-form-demos/AsyncAvailabilityDemo";
import { CustomValidationDemo } from "../runtime-form-demos/CustomValidationDemo";
import { DynamicFieldsDemo } from "../runtime-form-demos/DynamicFieldsDemo";
import { FieldManagementDemo } from "../runtime-form-demos/FieldManagementDemo";
import { FormTracerDemo } from "../runtime-form-demos/FormTracerDemo";
import { InvalidStatesDemo } from "../runtime-form-demos/InvalidStatesDemo";
import { SchemaAdapterDemo } from "../runtime-form-demos/SchemaAdapterDemo";
import { ValidationPolicyDemo } from "../runtime-form-demos/ValidationPolicyDemo";

export function RuntimeFormsDemoPage() {
  return (
    <div className="min-h-[calc(100lvh-4.25rem)]">
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Runtime form controls
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Field management</h1>
          <p className="text-muted-foreground max-w-2xl">
            Field, Field.Validity, Fieldset, and form grouping behavior in one focused demo.
          </p>
        </div>

        <FormTracerDemo />
        <ValidationPolicyDemo />
        <CustomValidationDemo />
        <AsyncAvailabilityDemo />
        <SchemaAdapterDemo />
        <DynamicFieldsDemo />
        <FieldManagementDemo />
        <InvalidStatesDemo />
      </main>
    </div>
  );
}
