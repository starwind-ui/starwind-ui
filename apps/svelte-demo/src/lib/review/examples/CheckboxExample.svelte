<script lang="ts">
  import Checkbox from "$lib/starwind-runtime/checkbox";
  let updates = $state<boolean | undefined>(undefined);
</script>

<Checkbox
  id="updates"
  label="Receive product updates"
  name="updates"
  defaultChecked
  bind:checked={updates}
/>
<p aria-live="polite">Updates: {updates ? "on" : "off"}</p>
