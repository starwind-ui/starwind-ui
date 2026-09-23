<script lang="ts">
  import {
    Field,
    FieldControl,
    FieldDescription,
    FieldError,
    FieldLabel,
    FieldValidity,
  } from "$lib/starwind-runtime/field";
</script>

<div class="w-full max-w-md">
  <Field name="displayName">
    <FieldLabel>Display name</FieldLabel>
    <FieldControl required minlength={2} placeholder="Ada Lovelace" />
    <FieldDescription>This name appears on your public profile.</FieldDescription>
    <FieldError match="valueMissing">Enter a display name.</FieldError>
    <FieldError match="tooShort">Use at least two characters.</FieldError>
    <FieldValidity match="valid">Looks good.</FieldValidity>
  </Field>
</div>
