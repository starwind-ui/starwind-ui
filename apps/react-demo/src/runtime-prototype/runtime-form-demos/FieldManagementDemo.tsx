import { createForm } from "@starwind-ui/react/form";
import { useState } from "react";

import {
  Button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  Field,
  FieldContent,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  FieldValidity,
  Form,
  FormErrorSummary,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "../kit";

export function FieldManagementDemo() {
  const [shippingDisabled, setShippingDisabled] = useState(false);
  const [formOutput, setFormOutput] = useState("Submit the form to inspect FormData.");

  return (
    <>
      <Form
        className="space-y-8"
        onReset={(event) => {
          const form = event.currentTarget;
          window.setTimeout(() => {
            createForm(form).clearExternalErrors();
            setFormOutput("Submit the form to inspect FormData.");
          }, 0);
        }}
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formInstance = createForm(form);
          const data = new FormData(form);
          formInstance.clearExternalErrors("reactRuntimeAccountInviteCode");
          if (data.get("reactRuntimeAccountInviteCode") === "used-code") {
            formInstance.setExternalErrors(
              {
                reactRuntimeAccountInviteCode: {
                  message: "Invite code was already used.",
                  source: "server",
                },
              },
              { clearOnChange: true },
            );
            setFormOutput(
              "Server rejected reactRuntimeAccountInviteCode. Change the invite code to clear it.",
            );
            return;
          }

          const entries = Array.from(data.entries()).map(([key, value]) => `${key}: ${value}`);
          setFormOutput(entries.length > 0 ? entries.join("\n") : "No enabled fields submitted.");
        }}
      >
        <FormErrorSummary aria-label="Runtime form errors">
          <p className="font-medium">Review these fields</p>
        </FormErrorSummary>

        <FieldSet id="react-runtime-form-account-fieldset">
          <FieldLegend>Account details</FieldLegend>
          <FieldGroup>
            <Field name="reactRuntimeAccountEmail">
              <FieldLabel>Email</FieldLabel>
              <FieldControl
                id="react-runtime-account-email"
                type="email"
                required
                placeholder="ada@example.com"
              />
              <FieldDescription>
                Used for runtime validation and form serialization.
              </FieldDescription>
              <FieldError match="valueMissing">Enter an email address.</FieldError>
              <FieldError match="typeMismatch">Use a valid email address.</FieldError>
              <FieldValidity match="valid">Email looks good.</FieldValidity>
            </Field>

            <Field name="reactRuntimeAccountHandle" orientation="responsive">
              <FieldLabel>Handle</FieldLabel>
              <FieldContent>
                <FieldControl
                  id="react-runtime-account-handle"
                  required
                  minLength={3}
                  placeholder="starwind"
                />
                <FieldDescription>
                  Responsive Field layout keeps label and control associated.
                </FieldDescription>
                <FieldError match="valueMissing">Choose a handle.</FieldError>
                <FieldError match="tooShort">Use at least three characters.</FieldError>
                <FieldValidity match="valid">Handle length is ready.</FieldValidity>
              </FieldContent>
            </Field>

            <Field name="reactRuntimeAccountInviteCode">
              <FieldLabel>Invite code</FieldLabel>
              <FieldControl
                id="react-runtime-account-invite-code"
                defaultValue="used-code"
                placeholder="used-code"
              />
              <FieldDescription>
                Submitting "used-code" simulates a server response.
              </FieldDescription>
              <FieldError match="customError">Invite code was already used.</FieldError>
            </Field>
          </FieldGroup>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Runtime choices</FieldLegend>
          <FieldDescription>
            Required Select and Combobox fields validate through the managed Form.
          </FieldDescription>
          <FieldGroup variant="outline">
            <Field name="reactRuntimePreferenceTheme">
              <FieldLabel>Theme</FieldLabel>
              <Select required>
                <SelectTrigger id="react-runtime-preference-theme" placeholder="Pick theme" />
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <FieldDescription>Submitted as a normal FormData value.</FieldDescription>
              <FieldError match="valueMissing">Choose a theme.</FieldError>
              <FieldValidity match="valid">Theme selected.</FieldValidity>
            </Field>

            <Field name="reactRuntimePreferenceCountry">
              <FieldLabel>Country</FieldLabel>
              <Combobox required>
                <ComboboxInput
                  id="react-runtime-preference-country"
                  placeholder="Choose country"
                  showClear
                />
                <ComboboxContent>
                  <ComboboxEmpty>No country found.</ComboboxEmpty>
                  <ComboboxGroup>
                    <ComboboxItem value="us">United States</ComboboxItem>
                    <ComboboxItem value="ca">Canada</ComboboxItem>
                    <ComboboxItem value="gb">United Kingdom</ComboboxItem>
                    <ComboboxItem value="au">Australia</ComboboxItem>
                  </ComboboxGroup>
                </ComboboxContent>
              </Combobox>
              <FieldDescription>Filtering still preserves the submitted value.</FieldDescription>
              <FieldError match="valueMissing">Choose a country.</FieldError>
              <FieldValidity match="valid">Country selected.</FieldValidity>
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-foreground text-base font-medium">Shipping group</h2>
            <p className="text-muted-foreground text-sm">
              Toggle this group to verify disabled inheritance into child Field controls.
            </p>
          </div>
          <Button
            id="react-runtime-form-toggle-shipping"
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShippingDisabled((disabled) => !disabled)}
          >
            {shippingDisabled ? "Enable group" : "Disable group"}
          </Button>
        </div>

        <FieldSet id="react-runtime-form-shipping-fieldset" disabled={shippingDisabled}>
          <FieldLegend className="sr-only">Shipping group</FieldLegend>
          <FieldGroup variant="outline">
            <FieldTitle>Delivery address</FieldTitle>
            <Field name="reactRuntimeShippingAddress">
              <FieldLabel>Street address</FieldLabel>
              <FieldControl id="react-runtime-shipping-address" placeholder="1 Infinite Loop" />
              <FieldDescription>Fieldset disabled state should reach this input.</FieldDescription>
            </Field>
            <FieldSeparator>Optional</FieldSeparator>
            <Field name="reactRuntimeShippingInstructions">
              <FieldLabel>Instructions</FieldLabel>
              <FieldControl id="react-runtime-shipping-instructions" placeholder="Leave at desk" />
            </Field>
          </FieldGroup>
        </FieldSet>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit">Submit form</Button>
          <Button type="reset" variant="ghost">
            Reset
          </Button>
        </div>
      </Form>

      <output className="border-border bg-muted text-muted-foreground mt-8 block min-h-24 rounded-md border p-4 text-sm whitespace-pre-wrap">
        {formOutput}
      </output>
    </>
  );
}
