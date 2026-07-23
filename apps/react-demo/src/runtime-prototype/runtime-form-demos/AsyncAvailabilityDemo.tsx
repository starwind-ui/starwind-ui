import { createForm } from "@starwind-ui/react/form";
import { useEffect, useRef, useState } from "react";

import {
  Button,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldValidity,
  Form,
} from "../kit";

const unavailableHandles = new Set(["admin", "starwind", "taken"]);

export function AsyncAvailabilityDemo() {
  const asyncFormRef = useRef<HTMLFormElement>(null);
  const [asyncOutput, setAsyncOutput] = useState(
    "Submit to check availability; later accepted changes recheck it.",
  );

  useEffect(() => {
    const form = asyncFormRef.current;
    if (!form) return;

    createForm(form, {
      asyncFieldValidators: {
        reactRuntimeAsyncHandle: async (value, { signal }) => {
          const handle = String(value ?? "")
            .trim()
            .toLowerCase();
          if (handle.length === 0) return null;

          setAsyncOutput(`Checking "${handle}"...`);
          const error = await checkReactHandleAvailability(handle, signal);
          if (!signal.aborted) {
            setAsyncOutput(error ?? `"${handle}" is available.`);
          }
          return error;
        },
      },
      asyncValidationDebounceMs: 250,
      onSubmit: ({ values }) => {
        setAsyncOutput(
          `Managed submit\nreactRuntimeAsyncHandle: ${values.reactRuntimeAsyncHandle}`,
        );
      },
    });
  }, []);

  return (
    <section className="border-border mb-10 border-b pb-10">
      <div className="mb-5 space-y-2">
        <h2 className="font-heading text-2xl font-semibold tracking-tight">Async availability</h2>
        <p className="text-muted-foreground text-sm">
          Submit once to check availability; accepted changes then run the debounced validator while
          you correct the handle.
        </p>
      </div>

      <Form
        ref={asyncFormRef}
        className="grid gap-4"
        data-validation-timing="submit"
        data-revalidation-timing="change"
        data-error-visibility="submit"
        onReset={() => {
          window.setTimeout(
            () =>
              setAsyncOutput("Submit to check availability; later accepted changes recheck it."),
            0,
          );
        }}
      >
        <Field name="reactRuntimeAsyncHandle">
          <FieldLabel>Team handle</FieldLabel>
          <FieldControl
            id="react-runtime-async-handle"
            required
            defaultValue="starwind"
            autoComplete="off"
          />
          <FieldDescription>Try "available", "taken", "admin", or "starwind".</FieldDescription>
          <FieldError match="valueMissing">Enter a team handle.</FieldError>
          <FieldError match="customError">Handle is unavailable.</FieldError>
          <FieldValidity match="valid">Handle is available.</FieldValidity>
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Reserve handle</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="text-muted-foreground mt-3 block text-sm whitespace-pre-wrap">
        {asyncOutput}
      </output>
    </section>
  );
}

function checkReactHandleAvailability(handle: string, signal: AbortSignal): Promise<string | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resolve(unavailableHandles.has(handle) ? `"${handle}" is already reserved.` : null);
    }, 350);

    signal.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
      { once: true },
    );
  });
}
