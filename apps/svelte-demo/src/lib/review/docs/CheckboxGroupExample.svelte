<script lang="ts">
  import { Checkbox } from "$lib/starwind-runtime/checkbox";
  import { CheckboxGroup } from "$lib/starwind-runtime/checkbox-group";
</script>

<CheckboxGroup defaultValue={["email"]} aria-label="Notification channels">
  <Checkbox
    id="docs-checkbox-group-notifications-email"
    name="notifications"
    value="email"
    label="Email"
  />
  <Checkbox
    id="docs-checkbox-group-notifications-sms"
    name="notifications"
    value="sms"
    label="SMS"
  />
  <Checkbox
    id="docs-checkbox-group-notifications-push"
    name="notifications"
    value="push"
    label="Push"
  />
</CheckboxGroup>
