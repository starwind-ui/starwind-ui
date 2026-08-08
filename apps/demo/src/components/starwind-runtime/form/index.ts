import Form from "./Form.astro";
import FormErrorSummary from "./FormErrorSummary.astro";
import { form, formErrorSummary } from "./variants";

const FormVariants = {
  form,
  formErrorSummary,
};

const FormParts = {
  ErrorSummary: FormErrorSummary,
  Root: Form,
};

export { Form, FormErrorSummary, FormVariants };

export default FormParts;
