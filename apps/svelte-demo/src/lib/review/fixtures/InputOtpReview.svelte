<script lang="ts">
  import InputOtp from "$lib/starwind-runtime/input-otp";
  import Field from "$lib/starwind-runtime/field";
  import Form from "$lib/starwind-runtime/form";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string>();
</script>

<div class="grid gap-6">
  <Form.Root onsubmit={(event) => event.preventDefault()}>
    <Field.Root name="verification-code">
      <Field.Label>Verification code</Field.Label>
      <InputOtp.Root data-example="code" size="sm" required bind:value>
        <InputOtp.Group>
          {#each [0, 1, 2] as index}<InputOtp.Slot {index} />{/each}
        </InputOtp.Group>
        <InputOtp.Separator />
        <InputOtp.Group>
          {#each [3, 4, 5] as index}<InputOtp.Slot {index} />{/each}
        </InputOtp.Group>
      </InputOtp.Root>
      <Field.Description>Enter the code from your email.</Field.Description>
      <Field.Error match="valueMissing" messageSource="children">Enter your code.</Field.Error>
    </Field.Root>
    <p class="mt-3 text-sm" data-otp-status>Accepted code: {value || "None"}</p>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button type="submit">Submit code</Button>
      <Button type="reset" variant="outline">Reset code</Button>
    </div>
  </Form.Root>
  <div class="grid gap-2">
    <p class="text-sm">Default size, read-only</p>
    <InputOtp.Root maxLength={4} defaultValue="2468" readOnly aria-label="Read-only code">
      <InputOtp.Group
        >{#each [0, 1, 2, 3] as index}<InputOtp.Slot {index} />{/each}</InputOtp.Group
      >
    </InputOtp.Root>
  </div>
  <div class="grid gap-2">
    <p class="text-sm">Large, disabled</p>
    <InputOtp.Root size="lg" maxLength={4} defaultValue="1357" disabled aria-label="Disabled code">
      <InputOtp.Group
        >{#each [0, 1, 2, 3] as index}<InputOtp.Slot {index} />{/each}</InputOtp.Group
      >
    </InputOtp.Root>
  </div>
</div>
