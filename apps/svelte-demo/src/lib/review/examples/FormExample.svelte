<script lang="ts">
  import Form from "$lib/starwind-runtime/form";
  import Input from "$lib/starwind-runtime/input";
  import { Button } from "$lib/starwind-runtime/button";
  import Fieldset from "@starwind-ui/svelte/fieldset";
  import { createForm } from "@starwind-ui/svelte/form";
  let form: HTMLFormElement | null = null;
  let status = $state("Enter your email, then submit.");
  let disabled = $state(false);
</script>

<Form.Root
  ref={(node) => {
    form = node;
  }}
  onsubmit={(event) => {
    event.preventDefault();
    status = `Submitted: ${new FormData(event.currentTarget).get("email")}`;
  }}
  onreset={() => {
    status = "Form reset.";
  }}
>
  <div class="grid gap-4">
    <Form.ErrorSummary>Check the fields below.</Form.ErrorSummary>
    <Fieldset.Root {disabled}>
      <Fieldset.Legend>Contact details</Fieldset.Legend>
      <div class="mt-3 grid gap-2" data-sw-field data-name="email">
        <label for="review-form-email" data-sw-field-label>Email</label>
        <Input
          id="review-form-email"
          name="email"
          type="email"
          required
          data-sw-field-control
          placeholder="ada@example.com"
        />
        <span data-sw-field-error></span>
      </div>
    </Fieldset.Root>
    <div class="flex flex-wrap gap-3">
      <Button type="submit">Submit form</Button>
      <Button type="reset" variant="outline">Reset form</Button>
      <Button
        variant="outline"
        onclick={() => {
          if (form) {
            createForm(form).setExternalErrors({ email: "Use your work email." });
            createForm(form).setErrorsVisible(true);
          }
        }}>Show server error</Button
      >
    </div>
    <label class="flex items-center gap-2"
      ><input type="checkbox" bind:checked={disabled} /> Disable contact details</label
    >
    <p data-form-status>{status}</p>
  </div>
</Form.Root>
