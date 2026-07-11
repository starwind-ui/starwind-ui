import Form from "./Form.astro";
import FormErrorSummary from "./FormErrorSummary.astro";
import { form, formErrorSummary } from "./variants";

const FormVariants = {
  form,
  formErrorSummary,
};

export { Form, FormErrorSummary, FormVariants };

export default {
  ErrorSummary: FormErrorSummary,
  Root: Form,
};
