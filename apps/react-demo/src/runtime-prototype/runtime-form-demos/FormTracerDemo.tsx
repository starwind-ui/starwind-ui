import { useState } from "react";

import { Button, Field, FieldControl, FieldDescription, FieldLabel, Form } from "../kit";

export function FormTracerDemo() {
  const [tracerOutput, setTracerOutput] = useState("Submit the tracer form to inspect its field.");

  return (
    <section className="border-border mb-10 border-b pb-10">
      <Form
        className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end"
        onReset={() => {
          window.setTimeout(
            () => setTracerOutput("Submit the tracer form to inspect its field."),
            0,
          );
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const entries = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);
          setTracerOutput(entries.length > 0 ? entries.join("\n") : "No field submitted.");
        }}
      >
        <Field name="reactRuntimeTracerName">
          <FieldLabel>Form tracer</FieldLabel>
          <FieldControl
            id="react-runtime-form-tracer-name"
            required
            defaultValue="Ada Lovelace"
            placeholder="Ada Lovelace"
          />
          <FieldDescription>One Form, one Field, normal FormData.</FieldDescription>
        </Field>
        <Button type="submit">Trace</Button>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {tracerOutput}
      </output>
    </section>
  );
}
