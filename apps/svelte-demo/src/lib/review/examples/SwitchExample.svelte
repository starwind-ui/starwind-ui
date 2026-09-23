<script lang="ts">
  import Switch from "$lib/starwind-runtime/switch";
  let enabled = $state<boolean | undefined>(undefined);
</script>

<Switch
  id="notifications"
  label="Enable notifications"
  name="notifications"
  value="yes"
  uncheckedValue="no"
  defaultChecked
  bind:checked={enabled}
/>
<p aria-live="polite">Notifications: {enabled ? "on" : "off"}</p>
