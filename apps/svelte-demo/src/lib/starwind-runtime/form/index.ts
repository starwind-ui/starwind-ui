import Form from "./Form.svelte";
import FormErrorSummary from "./FormErrorSummary.svelte";
import { form, formErrorSummary } from "./variants.js";
export type { FormProps } from "./Form.svelte";
export type { FormErrorSummaryProps } from "./FormErrorSummary.svelte";
const FormVariants = { form, formErrorSummary };
const FormParts = { ErrorSummary: FormErrorSummary, Root: Form };
export { Form, FormErrorSummary, FormVariants };
export default FormParts;
