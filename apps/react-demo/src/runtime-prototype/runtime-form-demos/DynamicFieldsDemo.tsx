import { useState } from "react";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  Textarea,
} from "../kit";

export function DynamicFieldsDemo() {
  const [dynamicNotesVisible, setDynamicNotesVisible] = useState(false);
  const [dynamicOutput, setDynamicOutput] = useState(
    "Submit to inspect dynamically registered fields.",
  );

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Dynamic fields</h2>
        <p className="text-muted-foreground text-sm">
          Add and remove optional fields after the Form runtime has already initialized.
        </p>
      </div>

      <Form
        className="grid gap-4"
        onReset={() => {
          window.setTimeout(
            () => setDynamicOutput("Submit to inspect dynamically registered fields."),
            0,
          );
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const entries = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);
          setDynamicOutput(entries.length > 0 ? entries.join("\n") : "No fields submitted.");
        }}
      >
        <Field name="reactRuntimeDynamicTitle">
          <FieldLabel>Title</FieldLabel>
          <FieldControl id="react-runtime-dynamic-title" required defaultValue="Runtime forms" />
          <FieldError match="valueMissing">Enter a title.</FieldError>
        </Field>

        {dynamicNotesVisible ? (
          <Field name="reactRuntimeDynamicNotes">
            <FieldLabel>Release notes</FieldLabel>
            <Textarea id="react-runtime-dynamic-notes" placeholder="What changed?" rows={3} />
            <FieldDescription>Added after initialization and submitted normally.</FieldDescription>
          </Field>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => setDynamicNotesVisible((visible) => !visible)}
          >
            {dynamicNotesVisible ? "Remove release notes" : "Add release notes"}
          </Button>
          <Button type="submit">Submit dynamic form</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {dynamicOutput}
      </output>
    </section>
  );
}
