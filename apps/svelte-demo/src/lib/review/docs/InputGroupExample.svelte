<script lang="ts">
  import { InputGroup, InputGroupAddon, InputGroupInput } from "$lib/starwind-runtime/input-group";
</script>

<div class="w-full max-w-sm">
  <InputGroup>
    <InputGroupInput aria-label="Search" placeholder="Search..." />
    <InputGroupAddon>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg
      >
    </InputGroupAddon>
  </InputGroup>
</div>
