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

type PolicyTiming = "blur" | "change" | "submit";

const policyTimings: PolicyTiming[] = ["submit", "blur", "change"];

export function ValidationPolicyDemo() {
  const [policyValidation, setPolicyValidation] = useState<PolicyTiming>("submit");
  const [policyRevalidation, setPolicyRevalidation] = useState<PolicyTiming>("change");
  const [policyVisibility, setPolicyVisibility] = useState<PolicyTiming>("submit");
  const [policyOutput, setPolicyOutput] = useState(
    "Before submit: submit. After submit: change. Errors: submit.",
  );

  const renderPolicyState = (
    validation = policyValidation,
    revalidation = policyRevalidation,
    visibility = policyVisibility,
  ) => {
    setPolicyOutput(
      `Before submit: ${validation}. After submit: ${revalidation}. Errors: ${visibility}.`,
    );
  };

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">
          Validation policy sandbox
        </h2>
        <p className="text-muted-foreground text-sm">
          Choose separate validation triggers before and after the first submit attempt. The default
          starts on submit, then revalidates accepted changes.
        </p>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">Before submit</p>
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
                  renderPolicyState(timing, policyRevalidation, policyVisibility);
                }}
              >
                {toPolicyLabel(timing)}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm font-medium">After submit</p>
          <div className="flex flex-wrap gap-2">
            {policyTimings.map((timing) => (
              <Button
                key={timing}
                type="button"
                size="sm"
                variant={policyRevalidation === timing ? "default" : "outline"}
                aria-pressed={policyRevalidation === timing}
                onClick={() => {
                  setPolicyRevalidation(timing);
                  renderPolicyState(policyValidation, timing, policyVisibility);
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
                  renderPolicyState(policyValidation, policyRevalidation, timing);
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
        data-revalidation-timing={policyRevalidation}
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

        <Field
          name="reactRuntimePolicyHandle"
          validationTiming="change"
          revalidationTiming="blur"
          errorVisibility="change"
        >
          <FieldLabel>Reverse-policy handle</FieldLabel>
          <FieldControl id="react-runtime-policy-handle" required minLength={3} placeholder="sw" />
          <FieldDescription>
            This Field validates on change before submit, then only on blur afterward.
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
