import { createForm, type FormExternalErrors } from "@starwind-ui/react/form";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldItem,
  FieldLabel,
  Form,
  FormErrorSummary,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputOtp,
  InputOtpGroup,
  InputOtpSlot,
  NativeSelect,
  NativeSelectOption,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  Slider,
  Switch,
  Textarea,
} from "../kit";

const invalidStateErrors: FormExternalErrors = {
  reactRuntimeInvalidCheckbox: "Checkbox validation message.",
  reactRuntimeInvalidCheckboxGroup: "Checkbox group validation message.",
  reactRuntimeInvalidCombobox: "Combobox validation message.",
  reactRuntimeInvalidInput: "Input validation message.",
  reactRuntimeInvalidInputGroup: "Input group validation message.",
  reactRuntimeInvalidNativeSelect: "Native select validation message.",
  reactRuntimeInvalidOtp: "Input OTP validation message.",
  reactRuntimeInvalidRadioGroup: "Radio group validation message.",
  reactRuntimeInvalidSelect: "Select validation message.",
  reactRuntimeInvalidSlider: "Slider validation message.",
  reactRuntimeInvalidSwitch: "Switch validation message.",
  reactRuntimeInvalidTextarea: "Textarea validation message.",
};

export function InvalidStatesDemo() {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState("External validation errors are applied on load.");

  const applyInvalidStates = useCallback(() => {
    if (!formRef.current) return;
    createForm(formRef.current).setExternalErrors(invalidStateErrors);
    setStatus("External validation errors are visible on every field.");
  }, []);

  const clearInvalidStates = useCallback(() => {
    if (!formRef.current) return;
    createForm(formRef.current).clearExternalErrors();
    setStatus("External validation errors cleared.");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(applyInvalidStates, 0);
    return () => window.clearTimeout(timer);
  }, [applyInvalidStates]);

  return (
    <section className="border-border mt-12 border-t pt-10">
      <div className="mb-8 space-y-3">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Invalid state visibility
        </p>
        <h2 className="font-heading text-2xl font-semibold tracking-tight">All form controls</h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Every field below receives the same runtime external error path so the visible invalid
          state can be compared across native, styled, and composite controls.
        </p>
      </div>

      <Form
        ref={formRef}
        className="space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          applyInvalidStates();
        }}
      >
        <FormErrorSummary aria-label="Invalid state errors">
          <p className="font-medium">Visible invalid states</p>
        </FormErrorSummary>

        <FieldGroup variant="outline">
          <Field name="reactRuntimeInvalidInput">
            <FieldLabel>Input</FieldLabel>
            <FieldControl id="react-runtime-invalid-input" placeholder="Display name" />
            <FieldDescription>
              Native input receives data-error-visible through Field.
            </FieldDescription>
            <FieldError match="customError" messageSource="validation">
              Input validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidTextarea">
            <FieldLabel>Textarea</FieldLabel>
            <Textarea id="react-runtime-invalid-textarea" rows={3} placeholder="Project notes" />
            <FieldError match="customError" messageSource="validation">
              Textarea validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidInputGroup">
            <FieldLabel>Input group</FieldLabel>
            <InputGroup>
              <InputGroupAddon>@</InputGroupAddon>
              <InputGroupInput id="react-runtime-invalid-input-group" placeholder="workspace" />
            </InputGroup>
            <FieldError match="customError" messageSource="validation">
              Input group validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidNativeSelect">
            <FieldLabel>Native select</FieldLabel>
            <NativeSelect id="react-runtime-invalid-native-select" defaultValue="">
              <NativeSelectOption value="">Choose a region</NativeSelectOption>
              <NativeSelectOption value="na">North America</NativeSelectOption>
              <NativeSelectOption value="eu">Europe</NativeSelectOption>
            </NativeSelect>
            <FieldError match="customError" messageSource="validation">
              Native select validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidSelect">
            <FieldLabel>Select</FieldLabel>
            <Select>
              <SelectTrigger id="react-runtime-invalid-select" placeholder="Choose role" />
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError match="customError" messageSource="validation">
              Select validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidCombobox">
            <FieldLabel>Combobox</FieldLabel>
            <Combobox>
              <ComboboxInput
                id="react-runtime-invalid-combobox"
                placeholder="Choose country"
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>No country found.</ComboboxEmpty>
                <ComboboxGroup>
                  <ComboboxItem value="us">United States</ComboboxItem>
                  <ComboboxItem value="ca">Canada</ComboboxItem>
                  <ComboboxItem value="gb">United Kingdom</ComboboxItem>
                </ComboboxGroup>
              </ComboboxContent>
            </Combobox>
            <FieldError match="customError" messageSource="validation">
              Combobox validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidCheckbox" orientation="horizontal">
            <FieldItem>
              <Checkbox id="react-runtime-invalid-checkbox" value="accepted" />
              <div className="grid gap-1">
                <FieldLabel htmlFor="react-runtime-invalid-checkbox">Checkbox</FieldLabel>
                <FieldDescription>Standalone checkbox surface.</FieldDescription>
                <FieldError match="customError" messageSource="validation">
                  Checkbox validation message.
                </FieldError>
              </div>
            </FieldItem>
          </Field>

          <Field name="reactRuntimeInvalidCheckboxGroup">
            <FieldLabel>Checkbox group</FieldLabel>
            <CheckboxGroup>
              <Checkbox
                id="react-runtime-invalid-checkbox-security"
                value="security"
                label="Security"
              />
              <Checkbox
                id="react-runtime-invalid-checkbox-analytics"
                value="analytics"
                label="Analytics"
              />
              <Checkbox
                id="react-runtime-invalid-checkbox-exports"
                value="exports"
                label="Exports"
              />
            </CheckboxGroup>
            <FieldError match="customError" messageSource="validation">
              Checkbox group validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidRadioGroup">
            <FieldLabel>Radio group</FieldLabel>
            <RadioGroup legend="Invalid radio group">
              <label className="flex w-fit items-center gap-3 text-sm">
                <RadioGroupItem id="react-runtime-invalid-radio-basic" value="basic" />
                <span>Basic</span>
              </label>
              <label className="flex w-fit items-center gap-3 text-sm">
                <RadioGroupItem id="react-runtime-invalid-radio-pro" value="pro" />
                <span>Pro</span>
              </label>
            </RadioGroup>
            <FieldError match="customError" messageSource="validation">
              Radio group validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidSwitch" orientation="horizontal">
            <FieldItem>
              <Switch id="react-runtime-invalid-switch" value="enabled" uncheckedValue="disabled" />
              <div className="grid gap-1">
                <FieldLabel htmlFor="react-runtime-invalid-switch">Switch</FieldLabel>
                <FieldDescription>Switch button receives the field error state.</FieldDescription>
                <FieldError match="customError" messageSource="validation">
                  Switch validation message.
                </FieldError>
              </div>
            </FieldItem>
          </Field>

          <Field name="reactRuntimeInvalidSlider">
            <FieldLabel>Slider</FieldLabel>
            <Slider id="react-runtime-invalid-slider" defaultValue={35} />
            <FieldError match="customError" messageSource="validation">
              Slider validation message.
            </FieldError>
          </Field>

          <Field name="reactRuntimeInvalidOtp">
            <FieldLabel>Input OTP</FieldLabel>
            <InputOtp id="react-runtime-invalid-otp" maxLength={6}>
              <InputOtpGroup>
                <InputOtpSlot index={0} />
                <InputOtpSlot index={1} />
                <InputOtpSlot index={2} />
                <InputOtpSlot index={3} />
                <InputOtpSlot index={4} />
                <InputOtpSlot index={5} />
              </InputOtpGroup>
            </InputOtp>
            <FieldError match="customError" messageSource="validation">
              Input OTP validation message.
            </FieldError>
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={applyInvalidStates}>
            Show errors
          </Button>
          <Button type="button" variant="ghost" onClick={clearInvalidStates}>
            Clear errors
          </Button>
        </div>
      </Form>

      <output className="border-border bg-muted text-muted-foreground mt-6 block rounded-md border p-4 text-sm">
        {status}
      </output>
    </section>
  );
}
