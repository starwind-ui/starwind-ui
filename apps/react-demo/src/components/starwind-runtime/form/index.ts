"use client";

import Form from "./Form";
import FormErrorSummary from "./FormErrorSummary";
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
