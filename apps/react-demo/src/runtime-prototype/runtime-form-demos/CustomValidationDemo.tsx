import { createForm, type FormValues } from "@starwind-ui/react/form";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
} from "../kit";

export function CustomValidationDemo() {
  const customFormRef = useRef<HTMLFormElement>(null);
  const [customOutput, setCustomOutput] = useState("Submit to run custom validators.");

  useEffect(() => {
    const form = customFormRef.current;
    if (!form) return;

    createForm(form, {
      fieldValidators: {
        reactRuntimeCustomProject: (value) =>
          value === "admin" ? "The admin project slug is reserved." : null,
      },
      formValidators: (values) => {
        const workspace = readRuntimeFormValue(values.reactRuntimeCustomWorkspace);
        const project = readRuntimeFormValue(values.reactRuntimeCustomProject);

        return workspace.length > 0 && project === workspace
          ? {
              reactRuntimeCustomProject: "Project slug must differ from the workspace slug.",
            }
          : null;
      },
      onSubmit: ({ values }) => {
        const entries = Object.entries(values).map(([key, value]) => {
          const renderedValue = Array.isArray(value) ? value.join(", ") : value;
          return `${key}: ${renderedValue}`;
        });
        setCustomOutput(`Managed submit\n${entries.join("\n")}`);
      },
    });
  }, []);

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Custom validation and managed submit
        </h2>
        <p className="text-muted-foreground text-sm">
          Field and form validators add domain rules while the managed submit path receives plain
          form values.
        </p>
      </div>

      <Form
        ref={customFormRef}
        className="grid gap-4"
        onReset={() => {
          window.setTimeout(() => setCustomOutput("Submit to run custom validators."), 0);
        }}
      >
        <Field name="reactRuntimeCustomWorkspace">
          <FieldLabel>Workspace slug</FieldLabel>
          <FieldControl id="react-runtime-custom-workspace" required defaultValue="starwind" />
          <FieldError match="valueMissing">Enter a workspace slug.</FieldError>
        </Field>

        <Field name="reactRuntimeCustomProject">
          <FieldLabel>Project slug</FieldLabel>
          <FieldControl id="react-runtime-custom-project" required defaultValue="starwind" />
          <FieldDescription>Try "admin" or the same value as the workspace slug.</FieldDescription>
          <FieldError match="valueMissing">Enter a project slug.</FieldError>
          <FieldError match="customError" messageSource="validation">
            Project slug must pass custom validation.
          </FieldError>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Create project</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {customOutput}
      </output>
    </section>
  );
}

function readRuntimeFormValue(value: FormValues[string] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}
