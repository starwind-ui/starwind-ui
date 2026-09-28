<script lang="ts">
  import { FormRoot, FormErrorSummary } from "../../../../packages/svelte/src/form/index.js";
  import StyledForm from "../../../../apps/svelte-demo/src/lib/starwind-runtime/form/Form.svelte";
  import type { FormOptions, FormExternalErrors, FormExternalErrorOptions } from "@starwind-ui/runtime/form";
  let { styled = false }: { styled?: boolean } = $props();
  let options = $state.raw<FormOptions>();
  let errors = $state.raw<FormExternalErrors>();
  let errorOptions = $state.raw<FormExternalErrorOptions>();
  export function update(next: {options?: FormOptions; errors?: FormExternalErrors; errorOptions?: FormExternalErrorOptions}) {
    options = next.options; errors = next.errors; errorOptions = next.errorOptions;
  }
  const Root = styled ? StyledForm : FormRoot;
</script>
<Root {options} {errors} {errorOptions} onsubmit={(event) => event.preventDefault()}>
  <FormErrorSummary />
  <div data-sw-field data-name="email">
    <label data-sw-field-label for="email">Email</label>
    <input data-sw-field-control id="email" name="email" />
    <span data-sw-field-error></span>
  </div>
  <button type="submit">Submit</button>
</Root>
