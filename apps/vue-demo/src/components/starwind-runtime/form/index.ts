import Form from "./Form.vue";
import FormErrorSummary from "./FormErrorSummary.vue";
import { form, formErrorSummary } from "./variants";

export type { FormProps } from "./Form.vue";
export type { FormErrorSummaryProps } from "./FormErrorSummary.vue";

const FormVariants = { form, formErrorSummary };

const FormParts = { ErrorSummary: FormErrorSummary, Root: Form };

export { Form, FormErrorSummary, FormVariants };

export default FormParts;
