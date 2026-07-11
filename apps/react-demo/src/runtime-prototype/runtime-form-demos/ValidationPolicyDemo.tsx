import { useState } from "react";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Form,
} from "../kit";

type PolicyTiming = "blur" | "change" | "input" | "submit";

const policyTimings: PolicyTiming[] = ["submit", "blur", "change", "input"];

export function ValidationPolicyDemo() {
  const [policyValidation, setPolicyValidation] = useState<PolicyTiming>("submit");
  const [policyVisibility, setPolicyVisibility] = useState<PolicyTiming>("submit");
  const [policyOutput, setPolicyOutput] = useState("Validation: submit. Errors: submit.");

  const renderPolicyState = (validation = policyValidation, visibility = policyVisibility) => {
    setPolicyOutput(`Validation: ${validation}. Errors: ${visibility}.`);
  };

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Validation policy sandbox
        </h2>
        <p className="text-muted-foreground text-sm">
          Toggle when validation runs and when errors become visible. The handle field overrides the
          form and validates on input.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">Validate</p>
          <div className="flex flex-wrap gap-2">
            {policyTimings.map((timing) => (
              <Button
                key={timing}
                type="button"
                size="sm"
                variant={policyValidation === timing ? "default" : "outline"}
                aria-pressed={policyValidation === timing}
                onClick={() => {
                  setPolicyValidation(timing);
                  renderPolicyState(timing, policyVisibility);
                }}
              >
                {toPolicyLabel(timing)}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">Show errors</p>
          <div className="flex flex-wrap gap-2">
            {policyTimings.map((timing) => (
              <Button
                key={timing}
                type="button"
                size="sm"
                variant={policyVisibility === timing ? "default" : "outline"}
                aria-pressed={policyVisibility === timing}
                onClick={() => {
                  setPolicyVisibility(timing);
                  renderPolicyState(policyValidation, timing);
                }}
              >
                {toPolicyLabel(timing)}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Form
        className="grid gap-4"
        data-validation-timing={policyValidation}
        data-revalidation-timing="change"
        data-error-visibility={policyVisibility}
        onReset={() => {
          window.setTimeout(() => renderPolicyState(), 0);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          const entries = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);
          setPolicyOutput(entries.length > 0 ? entries.join("\n") : "No field submitted.");
        }}
      >
        <Field name="reactRuntimePolicyEmail">
          <FieldLabel>Policy email</FieldLabel>
          <FieldControl id="react-runtime-policy-email" type="email" required placeholder="ada" />
          <FieldDescription>Uses the selected form policy.</FieldDescription>
          <FieldError match="valueMissing">Enter an email address.</FieldError>
          <FieldError match="typeMismatch">Use a valid email address.</FieldError>
        </Field>

        <Field name="reactRuntimePolicyHandle" validationTiming="input" errorVisibility="input">
          <FieldLabel>Override handle</FieldLabel>
          <FieldControl id="react-runtime-policy-handle" required minLength={3} placeholder="sw" />
          <FieldDescription>
            This field uses friendly policy props for its input override.
          </FieldDescription>
          <FieldError match="valueMissing">Choose a handle.</FieldError>
          <FieldError match="tooShort">Use at least three characters.</FieldError>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Submit policy form</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {policyOutput}
      </output>
    </section>
  );
}

function toPolicyLabel(timing: PolicyTiming): string {
  return timing[0]!.toUpperCase() + timing.slice(1);
}
