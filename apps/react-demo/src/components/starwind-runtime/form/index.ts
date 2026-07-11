import Form from "./Form";
import FormErrorSummary from "./FormErrorSummary";
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
