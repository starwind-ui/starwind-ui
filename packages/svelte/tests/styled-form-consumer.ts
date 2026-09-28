import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledFormConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["form", "input"]);
export const formImports = `import StyledForm, { Form, FormErrorSummary, FormVariants, type FormProps, type FormErrorSummaryProps } from "./form/index.js";
import PrimitiveForm, { FormRoot, FormErrorSummary as PrimitiveSummary, createForm, createFormSchemaValidator, validateFormSchema, type FormExternalErrorOptions, type FormExternalErrors, type FormInstance, type FormOptions, type FormResetValidationOptions, type FormSchemaResult, type FormValidateOptions, type FormValidationCause, type FormValidationOutcome, type FormValidationTiming, type FormValues } from "@starwind-ui/svelte/form";
import Fieldset, { FieldsetRoot, FieldsetLegend } from "@starwind-ui/svelte/fieldset";`;
export const formPositive = `<script lang="ts">
${formImports}
import { createAttachmentKey } from "svelte/attachments";
const timing: FormValidationTiming = "change";
const options: FormOptions = { fieldValidators: { email(value) { return value ? null : "Required"; } } };
const formRef = (node: HTMLFormElement | null) => { if (node) { const instance: FormInstance = createForm(node); instance.setOptions(options); } };
const setRef = (node: HTMLFieldSetElement | null) => { void node?.disabled; };
const divRef = (node: HTMLDivElement | null) => { void node?.hidden; };
const formProps: FormProps = { errorVisibility: timing, validationTiming: "manual", "data-validation-timing": "submit", action: "/submit", method: "post", ref: formRef };
const summaryProps: FormErrorSummaryProps = { role: "alert", "aria-live": "assertive", "aria-atomic": false, hidden: false, ref: divRef };
const attached = { [createAttachmentKey()]: (node: HTMLFormElement) => { void node.action; return () => {}; } };
const schema = (values: FormValues): FormSchemaResult => values.email ? { success: true } : { success: false, issues: [{ path: ["email"], message: "Required" }] };
const errors: FormExternalErrors = validateFormSchema({}, schema).errors;
const errorOptions: FormExternalErrorOptions = { clearOnChange: true };
const resetOptions: FormResetValidationOptions = { externalErrors: "preserve" };
const validateOptions: FormValidateOptions = { names: ["email"], focus: true };
const cause: FormValidationCause = "manual";
const outcome: FormValidationOutcome = { status: "complete", errors: [], valid: true };
void [errors, errorOptions, resetOptions, validateOptions, cause, outcome, createFormSchemaValidator(schema), FormVariants.form(), FormVariants.formErrorSummary()];
</script>
<Form {...formProps} {...attached} onsubmit={(event) => { const node: HTMLFormElement = event.currentTarget; void node; }}><FormErrorSummary {...summaryProps}>Review the fields.</FormErrorSummary><Fieldset.Root disabled name="fieldset" ref={setRef}><Fieldset.Legend ref={divRef}>Details</Fieldset.Legend><input name="email" /></Fieldset.Root></Form>
<StyledForm.Root ref={formRef}><StyledForm.ErrorSummary ref={divRef} /></StyledForm.Root>
<PrimitiveForm.Root ref={formRef} errorVisibility="blur"><PrimitiveForm.ErrorSummary ref={divRef} /></PrimitiveForm.Root>
<FormRoot ref={formRef}><PrimitiveSummary ref={divRef} /><FieldsetRoot ref={setRef}><FieldsetLegend ref={divRef}>Named</FieldsetLegend></FieldsetRoot></FormRoot>`;
