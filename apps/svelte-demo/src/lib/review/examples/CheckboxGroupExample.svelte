<script lang="ts">
  import CheckboxGroup from "$lib/starwind-runtime/checkbox-group";
  import Checkbox from "$lib/starwind-runtime/checkbox";
  let channels = $state<string[] | undefined>();
</script>

<CheckboxGroup defaultValue={["email"]} bind:value={channels} aria-label="Contact channels">
  <Checkbox id="channel-email" name="channels" value="email" label="Email" />
  <Checkbox id="channel-sms" name="channels" value="sms" label="Text message" />
</CheckboxGroup>
<p aria-live="polite">Selected: {channels?.join(", ") || "none"}</p>
