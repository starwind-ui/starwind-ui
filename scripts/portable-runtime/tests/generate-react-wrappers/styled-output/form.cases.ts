import { expect, expectAttributeCount, readGeneratedFile } from "../shared.js";

export async function assertReactStyledFormOutput(outputRoot: string): Promise<void> {
  const select = await readGeneratedFile(outputRoot, "select/Select.tsx");
  const selectTrigger = await readGeneratedFile(outputRoot, "select/SelectTrigger.tsx");
  const selectContent = await readGeneratedFile(outputRoot, "select/SelectContent.tsx");
  const selectItem = await readGeneratedFile(outputRoot, "select/SelectItem.tsx");
  const selectVariants = await readGeneratedFile(outputRoot, "select/variants.ts");
  const selectIndex = await readGeneratedFile(outputRoot, "select/index.ts");
  const combobox = await readGeneratedFile(outputRoot, "combobox/Combobox.tsx");
  const comboboxInputGroup = await readGeneratedFile(outputRoot, "combobox/ComboboxInputGroup.tsx");
  const comboboxVariants = await readGeneratedFile(outputRoot, "combobox/variants.ts");
  const comboboxInput = await readGeneratedFile(outputRoot, "combobox/ComboboxInput.tsx");
  const comboboxTrigger = await readGeneratedFile(outputRoot, "combobox/ComboboxTrigger.tsx");
  const comboboxClear = await readGeneratedFile(outputRoot, "combobox/ComboboxClear.tsx");
  const comboboxValue = await readGeneratedFile(outputRoot, "combobox/ComboboxValue.tsx");
  const comboboxContent = await readGeneratedFile(outputRoot, "combobox/ComboboxContent.tsx");
  const comboboxItem = await readGeneratedFile(outputRoot, "combobox/ComboboxItem.tsx");
  const comboboxIndex = await readGeneratedFile(outputRoot, "combobox/index.ts");
  const checkbox = await readGeneratedFile(outputRoot, "checkbox/Checkbox.tsx");
  const checkboxVariants = await readGeneratedFile(outputRoot, "checkbox/variants.ts");
  const checkboxStyles = await readGeneratedFile(outputRoot, "checkbox/styles.css");
  const checkboxIndex = await readGeneratedFile(outputRoot, "checkbox/index.ts");
  const checkboxGroup = await readGeneratedFile(outputRoot, "checkbox-group/CheckboxGroup.tsx");
  const checkboxGroupVariants = await readGeneratedFile(outputRoot, "checkbox-group/variants.ts");
  const checkboxGroupIndex = await readGeneratedFile(outputRoot, "checkbox-group/index.ts");
  const radioGroup = await readGeneratedFile(outputRoot, "radio-group/RadioGroup.tsx");
  const radioGroupItem = await readGeneratedFile(outputRoot, "radio-group/RadioGroupItem.tsx");
  const radioGroupVariants = await readGeneratedFile(outputRoot, "radio-group/variants.ts");
  const radioGroupIndex = await readGeneratedFile(outputRoot, "radio-group/index.ts");
  const input = await readGeneratedFile(outputRoot, "input/Input.tsx");
  const inputVariants = await readGeneratedFile(outputRoot, "input/variants.ts");
  const inputIndex = await readGeneratedFile(outputRoot, "input/index.ts");
  const inputGroup = await readGeneratedFile(outputRoot, "input-group/InputGroup.tsx");
  const inputGroupAddon = await readGeneratedFile(outputRoot, "input-group/InputGroupAddon.tsx");
  const inputGroupButton = await readGeneratedFile(outputRoot, "input-group/InputGroupButton.tsx");
  const inputGroupInput = await readGeneratedFile(outputRoot, "input-group/InputGroupInput.tsx");
  const inputGroupText = await readGeneratedFile(outputRoot, "input-group/InputGroupText.tsx");
  const inputGroupTextarea = await readGeneratedFile(
    outputRoot,
    "input-group/InputGroupTextarea.tsx",
  );
  const inputGroupVariants = await readGeneratedFile(outputRoot, "input-group/variants.ts");
  const inputGroupIndex = await readGeneratedFile(outputRoot, "input-group/index.ts");
  const form = await readGeneratedFile(outputRoot, "form/Form.tsx");
  const formErrorSummary = await readGeneratedFile(outputRoot, "form/FormErrorSummary.tsx");
  const formVariants = await readGeneratedFile(outputRoot, "form/variants.ts");
  const formIndex = await readGeneratedFile(outputRoot, "form/index.ts");
  const field = await readGeneratedFile(outputRoot, "field/Field.tsx");
  const fieldContent = await readGeneratedFile(outputRoot, "field/FieldContent.tsx");
  const fieldControl = await readGeneratedFile(outputRoot, "field/FieldControl.tsx");
  const fieldDescription = await readGeneratedFile(outputRoot, "field/FieldDescription.tsx");
  const fieldError = await readGeneratedFile(outputRoot, "field/FieldError.tsx");
  const fieldGroup = await readGeneratedFile(outputRoot, "field/FieldGroup.tsx");
  const fieldItem = await readGeneratedFile(outputRoot, "field/FieldItem.tsx");
  const fieldLabel = await readGeneratedFile(outputRoot, "field/FieldLabel.tsx");
  const fieldLegend = await readGeneratedFile(outputRoot, "field/FieldLegend.tsx");
  const fieldSeparator = await readGeneratedFile(outputRoot, "field/FieldSeparator.tsx");
  const fieldSet = await readGeneratedFile(outputRoot, "field/FieldSet.tsx");
  const fieldTitle = await readGeneratedFile(outputRoot, "field/FieldTitle.tsx");
  const fieldValidity = await readGeneratedFile(outputRoot, "field/FieldValidity.tsx");
  const fieldVariants = await readGeneratedFile(outputRoot, "field/variants.ts");
  const fieldIndex = await readGeneratedFile(outputRoot, "field/index.ts");
  const inputOtp = await readGeneratedFile(outputRoot, "input-otp/InputOtp.tsx");
  const inputOtpGroup = await readGeneratedFile(outputRoot, "input-otp/InputOtpGroup.tsx");
  const inputOtpSlot = await readGeneratedFile(outputRoot, "input-otp/InputOtpSlot.tsx");
  const inputOtpSeparator = await readGeneratedFile(outputRoot, "input-otp/InputOtpSeparator.tsx");
  const inputOtpVariants = await readGeneratedFile(outputRoot, "input-otp/variants.ts");
  const inputOtpIndex = await readGeneratedFile(outputRoot, "input-otp/index.ts");
  const progress = await readGeneratedFile(outputRoot, "progress/Progress.tsx");
  const progressVariants = await readGeneratedFile(outputRoot, "progress/variants.ts");
  const progressIndex = await readGeneratedFile(outputRoot, "progress/index.ts");
  const slider = await readGeneratedFile(outputRoot, "slider/Slider.tsx");
  const sliderVariants = await readGeneratedFile(outputRoot, "slider/variants.ts");
  const sliderIndex = await readGeneratedFile(outputRoot, "slider/index.ts");
  const switchComponent = await readGeneratedFile(outputRoot, "switch/Switch.tsx");
  const switchVariants = await readGeneratedFile(outputRoot, "switch/variants.ts");
  const switchIndex = await readGeneratedFile(outputRoot, "switch/index.ts");

  expect(select).toContain('SelectPrimitive from "../primitives/react/select"');
  expect(select).toContain("<SelectPrimitive.Root");
  expect(select).toContain("modal?: boolean");
  expect(select).toContain("modal = true");
  expect(select).toContain("modal={modal}");
  expect(select).toContain('data-slot="select"');
  expect(selectTrigger).toContain("<SelectPrimitive.Trigger");
  expect(selectTrigger).toContain("<SelectPrimitive.Value");
  expect(selectTrigger).toContain("<SelectPrimitive.Icon");
  expect(selectTrigger).toContain("{!asChild && showIcon && (");
  expect(selectTrigger).toContain('size = "md"');
  expect(selectTrigger).toContain('data-slot="select-trigger"');
  expect(selectContent).toContain("<SelectPrimitive.Portal");
  expect(selectContent).toContain("<SelectPrimitive.Popup");
  expect(selectContent).toContain("<SelectPrimitive.List");
  expect(selectContent).toContain("alignItemWithTrigger?: boolean");
  expect(selectContent).toContain("alignItemWithTrigger = true");
  expect(selectContent).toContain("alignItemWithTrigger={alignItemWithTrigger}");
  expect(selectContent).toContain("keepMounted?: boolean");
  expect(selectContent).toContain("keepMounted = false");
  expect(selectContent).toContain("keepMounted={keepMounted}");
  expect(selectContent).toContain('data-align-trigger={alignItemWithTrigger ? "true" : "false"}');
  expect(selectContent).not.toContain("alignItemsWithTrigger");
  expect(selectContent).toContain('size = "md"');
  expect(selectContent).toContain("selectContent({ size, class: className })");
  expect(selectContent).not.toContain("selectContent({ side, align");
  expect(selectContent).toContain('data-slot="select-content"');
  expect(selectItem).toContain("<SelectPrimitive.Item");
  expect(selectItem).toContain("<SelectPrimitive.ItemText");
  expect(selectItem).toContain("<SelectPrimitive.ItemIndicator");
  expect(selectVariants).not.toContain("starwind-select");
  expect(selectVariants).toContain("relative");
  expect(selectVariants).toContain("flex items-center justify-between");
  expect(selectVariants).toContain("min-w-[8rem]");
  expect(selectVariants).toContain(
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
  );
  expect(selectVariants).toContain(
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
  );
  expect(selectVariants).toContain(
    "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
  );
  expect(selectVariants).toContain(
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
  );
  expect(selectVariants).toContain(
    "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
  );
  expect(selectVariants).toContain("data-[align-trigger=true]:!animate-none");
  expect(selectVariants).toContain("origin-(--transform-origin)");
  expect(selectVariants).toContain('md: "text-base [&_[data-slot=select-label]]:text-sm"');
  expect(selectVariants).toContain("defaultVariants:");
  expect(selectVariants).toContain('size: "md"');
  expect(selectVariants).not.toContain("side: {");
  expect(selectVariants).not.toContain("align: {");
  expect(selectVariants).not.toContain("compoundVariants:");
  expect(selectVariants).toContain("rounded-sm py-1.5 pr-8 pl-2 outline-none");
  expect(selectVariants).toContain('md: "h-11 px-3 text-base"');
  expect(selectIndex).toContain("SelectTrigger");
  expect(selectIndex).toContain("SelectItemIndicator");
  expect(selectIndex).toContain("Root: Select");
  expect(combobox).toContain('ComboboxPrimitive from "../primitives/react/combobox"');
  expect(combobox).toContain("<ComboboxPrimitive.Root");
  expect(combobox).toContain("modal?: boolean");
  expect(combobox).toContain("modal = false");
  expect(combobox).toContain("modal={modal}");
  expect(combobox).toContain('data-slot="combobox"');
  expect(comboboxInputGroup).toContain('import { InputGroup } from "../input-group";');
  expect(comboboxInputGroup).toContain("<InputGroup");
  expect(comboboxInputGroup).toContain("data-sw-combobox-input-group");
  expect(comboboxInputGroup).toContain('size = "md"');
  expect(comboboxVariants).toContain("[&>[data-align=inline-end]:has(>div>button)]:mr-[-0.3rem]");
  expect(comboboxInput).toContain(
    'import { InputGroup, InputGroupAddon, InputGroupButton } from "../input-group";',
  );
  expect(comboboxInput).toContain("children?: React.ReactNode");
  expect(comboboxInput).toContain("<InputGroup");
  expect(comboboxInput).toContain("<ComboboxPrimitive.Input");
  expect(comboboxInput).toContain("<InputGroupAddon");
  expect(comboboxInput).toContain('align="inline-end"');
  expect(comboboxInput).toContain("<ComboboxPrimitive.Trigger");
  expect(comboboxInput).toContain("<InputGroupButton");
  expect(comboboxInput).toContain("group-has-data-[slot=combobox-clear]/input-group:hidden");
  expect(comboboxInput).toContain("showTrigger");
  expect(comboboxInput).toContain("showClear");
  expect(comboboxTrigger).toContain("<ComboboxPrimitive.Trigger");
  expect(comboboxTrigger).toContain("showIcon");
  expect(comboboxTrigger).toContain("iconClass");
  expect(comboboxTrigger).toContain("{!asChild && showIcon && (icon ?? (");
  expect(comboboxTrigger).not.toContain("({icon");
  expect(comboboxClear).toContain("<ComboboxPrimitive.Clear");
  expect(comboboxClear).toContain("<InputGroupButton");
  expect(comboboxClear).toContain("asChild={true}");
  expect(comboboxClear).toContain("Clear selection");
  expect(comboboxValue).toContain("placeholder?: string");
  expect(comboboxValue).toContain("placeholder={placeholder}");
  expect(comboboxContent).toContain("<ComboboxPrimitive.Portal");
  expect(comboboxContent).toContain("<ComboboxPrimitive.Popup");
  expect(comboboxContent).toContain("<ComboboxPrimitive.List");
  expect(comboboxContent).toContain("keepMounted?: boolean");
  expect(comboboxContent).toContain("keepMounted = false");
  expect(comboboxContent).toContain("keepMounted={keepMounted}");
  expect(comboboxContent).toContain('size = "md"');
  expect(comboboxContent).toContain("comboboxContent({ size, class: className })");
  expect(comboboxContent).not.toContain("comboboxContent({ side, align");
  expect(comboboxItem).toContain("<ComboboxPrimitive.Item");
  expect(comboboxItem).toContain("<ComboboxPrimitive.ItemText");
  expect(comboboxItem).toContain("<ComboboxPrimitive.ItemIndicator");
  expect(comboboxVariants).not.toContain("starwind-combobox");
  expect(comboboxVariants).toContain("relative");
  expect(comboboxVariants).toContain("w-auto transition-[color,box-shadow]");
  expect(comboboxVariants).toContain("min-w-[8rem]");
  expect(comboboxVariants).toContain(
    "data-[side=bottom]:slide-in-from-top-2 data-[side=bottom]:slide-out-to-top-2",
  );
  expect(comboboxVariants).toContain(
    "data-[side=top]:slide-in-from-bottom-2 data-[side=top]:slide-out-to-bottom-2",
  );
  expect(comboboxVariants).toContain(
    "data-[side=right]:slide-in-from-left-2 data-[side=right]:slide-out-to-left-2",
  );
  expect(comboboxVariants).toContain(
    "data-[side=left]:slide-in-from-right-2 data-[side=left]:slide-out-to-right-2",
  );
  expect(comboboxVariants).toContain("origin-(--transform-origin)");
  expect(comboboxVariants).toContain(
    'md: "text-base [&_[data-slot=combobox-group-label]]:text-sm"',
  );
  expect(comboboxVariants).toContain("defaultVariants:");
  expect(comboboxVariants).toContain('size: "md"');
  expect(comboboxVariants).not.toContain("side: {");
  expect(comboboxVariants).not.toContain("align: {");
  expect(comboboxVariants).not.toContain("compoundVariants:");
  expect(comboboxVariants).toContain("appearance-none rounded-none border-0 bg-transparent");
  expect(comboboxVariants).toContain("py-1 pr-1 pl-3 shadow-none");
  expect(comboboxVariants).toContain("outline-none");
  expect(comboboxVariants).toContain("ring-0");
  expect(comboboxVariants).toContain("rounded-sm py-1.5 pr-8 pl-2 outline-none");
  expect(comboboxVariants).toContain("focus-within:ring-3");
  expect(comboboxVariants).toContain("data-error-visible:text-error data-error-visible:ring-0");
  expect(comboboxVariants).toContain(
    "has-[[data-slot=combobox-input][data-error-visible]]:border-error",
  );
  expect(comboboxVariants).toContain(
    'md: "h-11 text-base [&_[data-slot=combobox-input]]:text-base"',
  );
  expect(comboboxVariants).toContain("[&_svg:not([class*='size-'])]:size-4");
  expect(comboboxIndex).toContain("ComboboxInputGroup");
  expect(comboboxIndex).toContain("ComboboxClear");
  expect(comboboxIndex).toContain("Root: Combobox");
  expect(checkbox).toContain('CheckboxPrimitive from "../primitives/react/checkbox"');
  expect(checkbox).toContain('import { IconCheck as Check } from "@tabler/icons-react";');
  expect(checkbox).toContain('import "./styles.css";');
  expect(checkbox).toContain("<CheckboxPrimitive.Root");
  expect(checkbox).toContain("<CheckboxPrimitive.Indicator");
  expect(checkbox).toContain("keepMounted");
  expect(checkbox).toContain(
    'Omit<React.ComponentPropsWithoutRef<"span">, "defaultChecked" | "id" | "onChange">',
  );
  expect(checkbox).toContain("id?: string");
  expect(checkbox).toContain("label?: string");
  expect(checkbox).toContain('const ariaLabel = rest["aria-label"] ?? label;');
  expect(checkbox).toContain("aria-label={ariaLabel}");
  expect(checkbox).toContain('data-slot="checkbox"');
  expect(checkbox).toContain('data-slot="checkbox-label"');
  expect(checkbox).toContain("data-sw-checkbox-check-icon");
  expect(checkbox).not.toContain('from "@starwind-ui/runtime"');
  expect(checkboxVariants).not.toContain("starwind-checkbox");
  expect(checkboxVariants).toContain("relative flex items-center space-x-2");
  expect(checkboxVariants).toContain("relative flex");
  expect(checkboxVariants).toContain("items-center justify-center");
  expect(checkboxVariants).toContain("data-checked:bg-primary");
  expect(checkboxVariants).toContain("data-disabled:cursor-not-allowed");
  expect(checkboxVariants).toContain(
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
  );
  expect(checkboxVariants).toContain("grid place-content-center p-0.5");
  expect(checkboxVariants).toContain("opacity-0");
  expect(checkboxVariants).toContain("[&>svg]:size-full");
  expect(checkboxStyles).toContain("[data-sw-checkbox-check-icon]");
  expect(checkboxStyles).not.toContain(".starwind-check-icon");
  expect(checkboxStyles).toContain("stroke-dasharray: 65;");
  expect(checkboxStyles).toContain(
    '[data-sw-checkbox][data-checked] [data-slot="checkbox-indicator"]',
  );
  expect(checkboxStyles).toContain("@keyframes draw-check");
  expect(checkboxIndex).toContain("export default Checkbox;");
  expect(checkboxIndex).not.toContain("styles.css");
  expect(checkboxIndex).not.toContain("CheckboxIndicator");
  expect(checkboxGroup).toContain(
    'CheckboxGroupPrimitive from "../primitives/react/checkbox-group"',
  );
  expect(checkboxGroup).toContain("<CheckboxGroupPrimitive.Root");
  expect(checkboxGroup).toContain('value?: import("@starwind-ui/runtime").CheckboxGroupValue;');
  expect(checkboxGroup).toContain("value={value}");
  expect(checkboxGroup).toContain("defaultValue={defaultValue}");
  expect(checkboxGroup).toContain("onValueChange={onValueChange}");
  expect(checkboxGroup).toContain("disabled={disabled}");
  expect(checkboxGroup).toContain('data-slot="checkbox-group"');
  expect(checkboxGroup).not.toContain('from "@starwind-ui/runtime"');
  expect(checkboxGroupVariants).not.toContain("starwind-checkbox-group");
  expect(checkboxGroupVariants).toContain("grid gap-3");
  expect(checkboxGroupIndex).toContain("export default CheckboxGroup;");
  expect(checkboxGroupIndex).not.toContain("Root: CheckboxGroup");
  expect(radioGroup).toContain('RadioGroupPrimitive from "../primitives/react/radio-group"');
  expect(radioGroup).toContain("<RadioGroupPrimitive.Root");
  expect(radioGroup).toContain('value?: import("@starwind-ui/runtime").RadioGroupValue;');
  expect(radioGroup).toContain("onValueChange={onValueChange}");
  expect(radioGroup).toContain("orientation={orientation}");
  expect(radioGroup).toContain('data-slot="radio-group"');
  expect(radioGroup).not.toContain('from "@starwind-ui/runtime"');
  expect(radioGroupItem).toContain('RadioPrimitive from "../primitives/react/radio"');
  expect(radioGroupItem).toContain("<RadioPrimitive.Root");
  expect(radioGroupItem).toContain("<RadioPrimitive.Indicator");
  expect(radioGroupItem).toContain("icon?: React.ReactNode;");
  expect(radioGroupItem).toContain('data-slot="radio-group-item"');
  expect(radioGroupVariants).not.toContain("starwind-radio");
  expect(radioGroupVariants).toContain("disabled:cursor-not-allowed disabled:opacity-70");
  expect(radioGroupVariants).toContain("group-data-error-visible/radio:border-error");
  expect(radioGroupVariants).toContain("flex items-center justify-center");
  expect(radioGroupVariants).toContain("[&>svg]:size-full [&>svg]:shrink-0");
  expect(radioGroupVariants).toContain('sm: "size-2"');
  expect(radioGroupVariants).toContain('md: "size-3"');
  expect(radioGroupVariants).toContain('lg: "size-4"');
  expect(radioGroupIndex).toContain("RadioGroupItem");
  expect(radioGroupIndex).toContain("Root: RadioGroup");
  expect(radioGroupIndex).toContain("Item: RadioGroupItem");
  expect(input).toContain('InputPrimitive from "../primitives/react/input"');
  expect(input).toContain("<InputPrimitive.Root");
  expect(input).toContain(
    'Omit<React.ComponentPropsWithoutRef<"input">, "children" | "defaultValue" | "size" | "value">',
  );
  expect(input).toContain('value?: import("@starwind-ui/runtime").InputValue;');
  expect(input).toContain('"data-slot"?: string;');
  expect(input).toContain("onValueChange={onValueChange}");
  expect(input).toContain("value={value}");
  expect(input).toContain("defaultValue={defaultValue}");
  expect(input).toContain("input({ size, class: className })");
  expect(input).toContain("ref={ref}");
  expect(input).toContain('"data-slot": dataSlot = "input"');
  expect(input).toContain("data-slot={dataSlot}");
  expect(input).toMatch(/data-slot=\{dataSlot\}[\s\S]*\{\.\.\.rest\}/);
  expect(input).not.toContain('from "@starwind-ui/runtime"');
  expect(inputVariants).toContain("border-input dark:bg-input/30");
  expect(inputVariants).toContain(
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
  );
  expect(inputVariants).toContain("file:text-foreground file:my-auto");
  expect(inputIndex).toContain("export default Input;");
  expect(inputIndex).not.toContain("Root: Input");
  expect(inputGroup).not.toContain("../primitives");
  expect(inputGroup).toContain('React.ComponentPropsWithoutRef<"div">');
  expect(inputGroup).toContain('role="group"');
  expect(inputGroup).toContain("inputGroup({ class: className })");
  expect(inputGroup).toContain('data-slot="input-group"');
  expect(inputGroupAddon).toContain("data-align={align}");
  expect(inputGroupAddon).toContain("inputGroupAddon({ align, class: className })");
  expect(inputGroupAddon).toContain('data-slot="input-group-addon"');
  expect(inputGroupButton).toContain('import { Button } from "../button";');
  expect(inputGroupButton).toContain('Omit<React.ComponentProps<typeof Button>, "size">');
  expect(inputGroupButton).toContain('variant = "ghost"');
  expect(inputGroupButton).toContain("<Button");
  expect(inputGroupButton).toContain("size={size}");
  expect(inputGroupButton).toContain("inputGroupButton({ size, class: className })");
  expect(inputGroupInput).toContain('import { Input } from "../input";');
  expect(inputGroupInput).toContain("React.ComponentProps<typeof Input>");
  expect(inputGroupInput).toContain("<Input");
  expect(inputGroupInput).toContain("inputGroupInput({ class: className })");
  expect(inputGroupInput).toContain('data-slot="input-group-control"');
  expect(inputGroupText).toContain("<span");
  expect(inputGroupText).toContain("inputGroupText({ class: className })");
  expect(inputGroupTextarea).toContain('import { Textarea } from "../textarea";');
  expect(inputGroupTextarea).toContain("React.ComponentProps<typeof Textarea>");
  expect(inputGroupTextarea).toContain("<Textarea");
  expect(inputGroupTextarea).toContain("inputGroupTextarea({ class: className })");
  expect(inputGroupTextarea).toContain('data-slot="input-group-control"');
  expect(inputGroupVariants).toContain("group/input-group relative flex h-11");
  expect(inputGroupVariants).toContain(
    "has-[[data-slot][data-error-visible]]:border-error has-[[data-slot][data-error-visible]]:ring-error/40 has-[[data-slot][data-error-visible]]:ring-3",
  );
  expect(inputGroupVariants).toContain("order-last pr-2.5 has-[>button]:mr-[-0.3rem]");
  expect(inputGroupVariants).toContain('"icon-sm": "size-8 p-0 has-[>svg]:p-0"');
  expect(inputGroupIndex).toContain("Root: InputGroup");
  expect(inputGroupIndex).toContain("Button: InputGroupButton");
  expect(inputGroupIndex).toContain("Textarea: InputGroupTextarea");
  expect(form).toContain('FormPrimitive from "../primitives/react/form"');
  expect(form).toContain("<FormPrimitive.Root");
  expect(form).toContain("form({ class: className })");
  expect(form).toContain(
    'validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(form).toContain(
    'revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(form).toContain(
    'errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(form).toContain("validationTiming={validationTiming}");
  expect(form).toContain("revalidationTiming={revalidationTiming}");
  expect(form).toContain("errorVisibility={errorVisibility}");
  expect(form).toMatch(/validationTiming=\{validationTiming\}[\s\S]*\{\.\.\.rest\}/);
  expect(form).toMatch(/errorVisibility=\{errorVisibility\}[\s\S]*\{\.\.\.rest\}/);
  expect(form).toContain('data-slot="form"');
  expect(formErrorSummary).toContain("<FormPrimitive.ErrorSummary");
  expect(formErrorSummary).toContain("formErrorSummary({ class: className })");
  expect(formErrorSummary).toContain('data-slot="form-error-summary"');
  expect(formErrorSummary).toContain("{children}");
  expect(formVariants).toContain("min-w-0");
  expect(formVariants).toContain("border-error/40 bg-error/7 text-error");
  expect(formVariants).toContain("[&_[data-sw-form-error-summary-list]]:mt-2");
  expect(formVariants).toContain("[&_[data-sw-form-error-summary-item]]:underline");
  expect(formIndex).toContain("Root: Form");
  expect(formIndex).toContain("ErrorSummary: FormErrorSummary");
  expect(formIndex).toContain("FormErrorSummary");
  expect(formIndex).toContain("FormVariants");
  expect(field).toContain('FieldPrimitive from "../primitives/react/field"');
  expect(field).toContain("<FieldPrimitive.Root");
  expect(field).toContain("field({ orientation, class: className })");
  expect(field).toContain("name={name}");
  expect(field).toContain(
    'validationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(field).toContain(
    'revalidationTiming?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(field).toContain(
    'errorVisibility?: import("@starwind-ui/runtime/form").FormValidationTiming;',
  );
  expect(field).toContain("validationTiming={validationTiming}");
  expect(field).toContain("revalidationTiming={revalidationTiming}");
  expect(field).toContain("errorVisibility={errorVisibility}");
  expect(field).toMatch(/validationTiming=\{validationTiming\}[\s\S]*\{\.\.\.rest\}/);
  expect(field).toMatch(/errorVisibility=\{errorVisibility\}[\s\S]*\{\.\.\.rest\}/);
  expect(field).toContain('data-slot="field"');
  expect(fieldSet).toContain('FieldsetPrimitive from "../primitives/react/fieldset"');
  expect(fieldSet).toContain("<FieldsetPrimitive.Root");
  expect(fieldSet).toContain("disabled={disabled}");
  expect(fieldSet).toContain('data-slot="field-set"');
  expect(fieldLegend).toContain("<FieldsetPrimitive.Legend");
  expect(fieldLegend).toContain("fieldLegend({ variant, class: className })");
  expect(fieldLegend).toContain('data-slot="field-legend"');
  expect(fieldGroup).toContain("fieldGroup({ variant, class: className })");
  expect(fieldGroup).toContain("data-variant={variant}");
  expect(fieldGroup).toContain('data-slot="field-group"');
  expect(fieldGroup).toContain("<div");
  expect(fieldGroup).not.toContain("FieldPrimitive");
  expect(fieldGroup).not.toContain("FieldsetPrimitive");
  expect(fieldContent).toContain("fieldContent({ class: className })");
  expect(fieldContent).toContain('data-slot="field-content"');
  expect(fieldContent).toContain("<div");
  expect(fieldContent).not.toContain("FieldPrimitive");
  expect(fieldContent).not.toContain("FieldsetPrimitive");
  expect(fieldTitle).toContain("fieldTitle({ class: className })");
  expect(fieldTitle).toContain('data-slot="field-title"');
  expect(fieldTitle).toContain("<div");
  expect(fieldTitle).not.toContain("FieldPrimitive");
  expect(fieldTitle).not.toContain("FieldsetPrimitive");
  expect(fieldControl).toContain("<FieldPrimitive.Control");
  expect(fieldControl).toContain("fieldControl({ size, class: className })");
  expect(fieldControl).toContain("onValueChange={onValueChange}");
  expect(fieldControl).toContain('data-slot="field-control"');
  expect(fieldDescription).toContain("<FieldPrimitive.Description");
  expect(fieldDescription).toContain('data-slot="field-description"');
  expect(fieldError).toContain("<FieldPrimitive.Error");
  expect(fieldError).toContain("match={match}");
  expect(fieldError).toContain('messageSource?: "children" | "validation"');
  expect(fieldError).toContain("messageSource={messageSource}");
  expect(fieldError).toContain('data-slot="field-error"');
  expect(fieldValidity).toContain("<FieldPrimitive.Validity");
  expect(fieldValidity).toContain("match={match}");
  expect(fieldValidity).toContain('data-slot="field-validity"');
  expect(fieldItem).toContain("<FieldPrimitive.Item");
  expect(fieldItem).toContain('data-slot="field-item"');
  expect(fieldItem).not.toContain("<FieldPrimitive.Root");
  expect(fieldItem).not.toContain("<FieldPrimitive.Control");
  expect(fieldLabel).toContain("<FieldPrimitive.Label");
  expect(fieldLabel).toContain("fieldLabel({ size, class: className })");
  expect(fieldSeparator).toContain('import { Separator } from "../separator"');
  expect(fieldSeparator).toContain("const hasContent = Boolean(children)");
  expect(fieldSeparator).toContain('data-slot="field-separator"');
  expect(fieldSeparator).not.toContain("FieldPrimitive");
  expect(fieldSeparator).not.toContain("FieldsetPrimitive");
  expect(fieldSeparator).toContain("data-content={hasContent}");
  expect(fieldSeparator).toContain("<Separator");
  expect(fieldSeparator).toContain('className="absolute inset-0 top-1/2"');
  expect(fieldSeparator).toContain("fieldSeparatorContent()");
  expect(fieldSeparator).toContain('data-slot="field-separator-content"');
  expect(fieldVariants).not.toContain("starwind-field");
  expect(fieldVariants).toContain("group/field min-w-0");
  expect(fieldVariants).toContain("flex flex-col gap-2");
  expect(fieldVariants).toContain("group/field-group flex min-w-0 flex-col gap-6");
  expect(fieldVariants).toContain("flex min-w-0 flex-col gap-6 border-0 p-0");
  expect(fieldVariants).toContain("data-invalid:text-error");
  expect(fieldVariants).toContain(
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
  );
  expect(fieldVariants).toContain("data-valid:text-success");
  expect(fieldVariants).toContain("relative -my-2 h-5 text-sm");
  expect(fieldVariants).toContain("bg-background text-muted-foreground");
  expect(fieldIndex).toContain("Content: FieldContent");
  expect(fieldIndex).toContain("Control: FieldControl");
  expect(fieldIndex).toContain("Group: FieldGroup");
  expect(fieldIndex).toContain("Item: FieldItem");
  expect(fieldIndex).toContain("Legend: FieldLegend");
  expect(fieldIndex).toContain("Root: Field");
  expect(fieldIndex).toContain("Separator: FieldSeparator");
  expect(fieldIndex).toContain("Set: FieldSet");
  expect(fieldIndex).toContain("Title: FieldTitle");
  expect(fieldIndex).toContain("Validity: FieldValidity");
  expect(inputOtp).toContain('InputOtpPrimitive from "../primitives/react/input-otp"');
  expect(inputOtp).toContain("<InputOtpPrimitive.Root");
  expect(inputOtp).toContain("onValueChange?:");
  expect(inputOtp).toContain("pattern={pattern}");
  expect(inputOtp).toContain('data-slot="input-otp"');
  expect(inputOtp).not.toContain('from "@starwind-ui/runtime"');
  expect(inputOtpGroup).toContain("<InputOtpPrimitive.Group");
  expect(inputOtpGroup).toContain('data-slot="input-otp-group"');
  expect(inputOtpSlot).toContain("<InputOtpPrimitive.Slot");
  expect(inputOtpSlot).toContain("inputOtpSlot({ size, class: className })");
  expect(inputOtpSlot).toContain('data-slot="input-otp-slot"');
  expect(inputOtpSeparator).toContain('import { IconMinus as Minus } from "@tabler/icons-react";');
  expect(inputOtpSeparator).toContain("<InputOtpPrimitive.Separator");
  expect(inputOtpSeparator).toContain("icon?: React.ReactNode;");
  expect(inputOtpVariants).not.toContain("starwind-input-otp");
  expect(inputOtpVariants).toContain("flex items-center gap-2 outline-none");
  expect(inputOtpVariants).toContain("data-[active=true]:border-outline");
  expect(inputOtpVariants).toContain("data-[active=true]:data-error-visible:ring-error/40");
  expect(inputOtpVariants).toContain(
    "data-error-visible:border-error data-[active=true]:data-error-visible:border-error",
  );
  expect(inputOtpIndex).toContain("const REGEXP_ONLY_DIGITS = /^[0-9]+$/;");
  expect(inputOtpIndex).toContain("REGEXP_ONLY_DIGITS_AND_CHARS");
  expect(inputOtpIndex).toContain("Root: InputOtp");
  expect(inputOtpIndex).toContain("Slot: InputOtpSlot");
  expect(progress).toContain('ProgressPrimitive from "../primitives/react/progress"');
  expect(progress).toContain("<ProgressPrimitive.Root");
  expect(progress).toContain("<ProgressPrimitive.Track");
  expect(progress).toContain("<ProgressPrimitive.Indicator");
  expect(progress).toContain("label?: string");
  expect(progress).toContain('const ariaLabel = rest["aria-label"] ?? label;');
  expect(progress).toContain("aria-label={ariaLabel}");
  expect(progress).toContain("value={progressValue}");
  expect(progress).toContain('data-slot="progress"');
  expect(progress).not.toContain('from "@starwind-ui/runtime"');
  expect(progressVariants).not.toContain("starwind-progress");
  expect(progressVariants).toContain("bg-muted h-2 w-full overflow-hidden rounded-full");
  expect(progressVariants).toContain("h-full w-full flex-1 transition-transform");
  expect(progressIndex).toContain("export default Progress;");
  expect(progressIndex).not.toContain("Root: Progress");
  expect(slider).toContain('SliderPrimitive from "../primitives/react/slider"');
  expect(slider).toContain("<SliderPrimitive.Root");
  expect(slider).toContain("<SliderPrimitive.Control");
  expect(slider).toContain("<SliderPrimitive.Track");
  expect(slider).toContain("<SliderPrimitive.Indicator");
  expect(slider).toContain("<SliderPrimitive.Thumb");
  expect(slider).toContain('defaultValue?: import("@starwind-ui/runtime").SliderValue;');
  expect(slider).toContain('value?: import("@starwind-ui/runtime").SliderValue;');
  expect(slider).toContain("onValueChange?:");
  expect(slider).toContain("onValueCommitted?:");
  expect(slider).toContain("const getPercentage =");
  expect(slider).toContain("const rangeStyle =");
  expect(slider).toContain("values.map((_, index) => (");
  expect(slider).not.toContain("inputName=");
  expect(slider).toContain("defaultValue={defaultValue}");
  expect(slider).toContain("largeStep={largeStep}");
  expect(slider).toContain("orientation={orientation}");
  expect(slider).toContain("value={value}");
  expect(slider).toContain("ref={ref}");
  expect(slider).toContain("slider({ class: className })");
  expect(slider).toContain("sliderRange({ variant })");
  expect(slider).toContain("style={rangeStyle}");
  expect(slider).toContain('orientation === "horizontal"');
  expect(slider).toContain('data-slot="slider"');
  expect(slider).toContain('data-slot="slider-thumb"');
  expectAttributeCount(slider, "data-orientation", 4);
  expect(slider).not.toContain('from "@starwind-ui/runtime"');
  expect(sliderVariants).not.toContain("starwind-slider");
  expect(sliderVariants).toContain("relative flex w-full");
  expect(sliderVariants).toContain("data-error-visible:bg-error");
  expect(sliderVariants).toContain("data-[orientation=horizontal]:h-full");
  expect(sliderVariants).toContain("absolute block size-4");
  expect(sliderVariants).toContain(
    "data-error-visible:border-error data-error-visible:ring-error/50",
  );
  expect(sliderIndex).toContain("export default Slider;");
  expect(sliderIndex).not.toContain("Root: Slider");
  expect(switchComponent).toContain('SwitchPrimitive from "../primitives/react/switch"');
  expect(switchComponent).toContain("<SwitchPrimitive.Root");
  expect(switchComponent).toContain("<SwitchPrimitive.Thumb");
  expect(switchComponent).toContain("id: string;");
  expect(switchComponent).toContain("label?: string;");
  expect(switchComponent).toContain("checked?: boolean;");
  expect(switchComponent).toContain("defaultChecked?: boolean;");
  expect(switchComponent).toContain("onCheckedChange?:");
  expect(switchComponent).toContain('variant = "default"');
  expect(switchComponent).toContain('size = "md"');
  expect(switchComponent).toContain('rest["aria-label"] ?? label ?? "switch"');
  expect(switchComponent).toContain("nativeButton");
  expect(switchComponent).toContain("style={switchStyle as React.CSSProperties}");
  expect(switchComponent).toContain("style={thumbStyle as React.CSSProperties}");
  expect(switchComponent).toContain("switchButton({ variant, class: className })");
  expect(switchComponent).toContain("switchToggle({ size })");
  expect(switchComponent).toContain("switchLabel({ size })");
  expect(switchComponent).toContain("ref={ref}");
  expect(switchComponent).toContain('data-slot="switch-button"');
  expect(switchComponent).toContain('data-slot="switch-toggle"');
  expect(switchComponent).toContain('data-slot="switch-label"');
  expect(switchComponent).not.toContain('from "@starwind-ui/runtime"');
  expect(switchVariants).not.toContain("starwind-switch");
  expect(switchVariants).toContain("flex items-center");
  expect(switchVariants).toContain("border-input bg-muted inline-flex");
  expect(switchVariants).toContain("group peer ring-offset-background");
  expect(switchVariants).toContain(
    "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40",
  );
  expect(switchVariants).toContain("group-aria-checked:translate-x-(--translation)");
  expect(switchVariants).toContain("peer-disabled:cursor-not-allowed");
  expect(switchIndex).toContain("export default Switch;");
  expect(switchIndex).not.toContain("Root: Switch");
}
