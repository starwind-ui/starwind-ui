import {
  createForm,
  type FormSchemaResult,
  type FormValues,
  validateFormSchema,
} from "@starwind-ui/react/form";
import { useState } from "react";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
  FormErrorSummary,
} from "../kit";

export function SchemaAdapterDemo() {
  const [schemaOutput, setSchemaOutput] = useState(
    "Submit to map schema-style errors into FieldError.",
  );

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Schema adapter</h2>
        <p className="text-muted-foreground text-sm">
          A small helper maps schema-style parser issues into Field errors without adding a schema
          dependency.
        </p>
      </div>

      <Form
        className="grid gap-4"
        onReset={(event) => {
          const form = event.currentTarget;
          window.setTimeout(() => {
            createForm(form).clearExternalErrors();
            setSchemaOutput("Submit to map schema-style errors into FieldError.");
          }, 0);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formInstance = createForm(form);
          formInstance.clearExternalErrors();

          const validation = validateFormSchema(
            readReactFormValues(form),
            reactRuntimeSchemaParser,
          );
          if (!validation.valid) {
            formInstance.setExternalErrors(validation.errors, { clearOnChange: true });
            setSchemaOutput(
              `Schema rejected\n${renderReactSchemaErrorLines(validation.errors).join("\n")}`,
            );
            return;
          }

          const entries = Array.from(new FormData(form).entries()).map(
            ([key, value]) => `${key}: ${value}`,
          );
          setSchemaOutput(`Schema accepted\n${entries.join("\n")}`);
        }}
      >
        <FormErrorSummary aria-label="Schema errors">
          <p className="font-medium">Review these errors</p>
        </FormErrorSummary>

        <Field name="reactRuntimeSchemaEmail">
          <FieldLabel>Work email</FieldLabel>
          <FieldControl id="react-runtime-schema-email" defaultValue="ada@personal.test" />
          <FieldDescription>Use an @example.com address to pass the schema.</FieldDescription>
          <FieldError match="customError">Email failed schema validation.</FieldError>
        </Field>

        <Field name="reactRuntimeSchemaProject">
          <FieldLabel>Project key</FieldLabel>
          <FieldControl id="react-runtime-schema-project" defaultValue="sw" />
          <FieldDescription>Use at least four characters.</FieldDescription>
          <FieldError match="customError">Project key failed schema validation.</FieldError>
        </Field>

        <Field name="_form">
          <FieldError match="customError">The schema rejected this submission.</FieldError>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Validate schema</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {schemaOutput}
      </output>
    </section>
  );
}

function readRuntimeFormValue(value: FormValues[string] | undefined): string {
  return Array.isArray(value) ? String(value[0] ?? "") : String(value ?? "");
}

function readReactFormValues(form: HTMLFormElement): FormValues {
  const values: FormValues = {};
  const data = new FormData(form);

  data.forEach((value, key) => {
    const currentValue = values[key];
    if (currentValue === undefined) {
      values[key] = value;
      return;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value);
      return;
    }

    values[key] = [currentValue, value];
  });

  return values;
}

type ReactSchemaDemoErrorEntry = string | { readonly message: string };
type ReactSchemaDemoErrors = Record<
  string,
  ReactSchemaDemoErrorEntry | readonly ReactSchemaDemoErrorEntry[]
>;

function renderReactSchemaErrorLines(errors: ReactSchemaDemoErrors): string[] {
  return Object.entries(errors).flatMap(([key, input]) => {
    const entries = Array.isArray(input) ? input : [input];
    return entries.map((entry) => `${key}: ${typeof entry === "string" ? entry : entry.message}`);
  });
}

function reactRuntimeSchemaParser(values: FormValues): FormSchemaResult {
  const email = readRuntimeFormValue(values.reactRuntimeSchemaEmail);
  const project = readRuntimeFormValue(values.reactRuntimeSchemaProject);
  const issues: Array<{ message: string; path?: string }> = [];

  if (!email.endsWith("@example.com")) {
    issues.push({
      message: "Use an @example.com work email.",
      path: "reactRuntimeSchemaEmail",
    });
  }

  if (project.length < 4) {
    issues.push({
      message: "Use at least four characters.",
      path: "reactRuntimeSchemaProject",
    });
  }

  if (project.toLowerCase() === "root") {
    issues.push({ message: "The root project key is reserved." });
  }

  return issues.length > 0 ? { issues, success: false } : { success: true };
}
