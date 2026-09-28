<script lang="ts">
  import Field from "$lib/starwind-runtime/field";
  import Form from "$lib/starwind-runtime/form";
  import Textarea from "$lib/starwind-runtime/textarea";
  import { Button } from "$lib/starwind-runtime/button";
  import Checkbox from "$lib/starwind-runtime/checkbox";
  let disabled = $state(false);
</script>

<Form.Root onsubmit={(event) => event.preventDefault()}>
  <div class="grid gap-6">
    <Field.Set {disabled}>
      <Field.Legend>Contact details</Field.Legend>
      <Field.Group>
        <Field.Root name="email">
          <Field.Label>Email</Field.Label>
          <Field.Control name="email" type="email" required placeholder="you@example.com" />
          <Field.Description>We use this address to reply.</Field.Description>
          <Field.Error match="valueMissing">Enter your email address.</Field.Error>
          <Field.Error match="typeMismatch">Enter a valid email address.</Field.Error>
        </Field.Root>
        <Field.Root>
          <Field.Label>Message</Field.Label>
          <Textarea name="message" data-sw-field-control placeholder="How can we help?" />
        </Field.Root>
        <Field.Separator>Preferences</Field.Separator>
        <Field.Root orientation="horizontal">
          <Checkbox id="field-updates" name="updates" data-sw-field-control />
          <Field.Content
            ><Field.Label for="field-updates">Send updates</Field.Label><Field.Description
              >Receive occasional product news.</Field.Description
            ></Field.Content
          >
        </Field.Root>
      </Field.Group>
    </Field.Set>
    <div class="flex flex-wrap gap-3">
      <Button type="submit">Submit</Button><Button type="reset" variant="outline">Reset</Button>
    </div>
    <Checkbox bind:checked={disabled} label="Disable contact fields" />
  </div>
</Form.Root>
