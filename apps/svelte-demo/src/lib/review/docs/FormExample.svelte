<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Field,
    FieldControl,
    FieldError,
    FieldGroup,
    FieldLabel,
  } from "$lib/starwind-runtime/field";
  import { Form, FormErrorSummary } from "$lib/starwind-runtime/form";
</script>

<div class="w-full max-w-md">
  <Form onsubmit={(event) => event.preventDefault()}>
    <FormErrorSummary aria-label="Profile errors">
      <p class="font-medium">Review the highlighted fields.</p>
    </FormErrorSummary>
    <FieldGroup>
      <Field name="email">
        <FieldLabel>Email</FieldLabel>
        <FieldControl type="email" required placeholder="you@example.com" />
        <FieldError match="valueMissing">Enter your email address.</FieldError>
        <FieldError match="typeMismatch">Enter a valid email address.</FieldError>
      </Field>
      <Button type="submit">Save profile</Button>
    </FieldGroup>
  </Form>
</div>
