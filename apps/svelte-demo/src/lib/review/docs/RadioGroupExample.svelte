<script lang="ts">
  import { Label } from "$lib/starwind-runtime/label";
  import { RadioGroup, RadioGroupItem } from "$lib/starwind-runtime/radio-group";
</script>

<div>
  <RadioGroup name="demo-radio" defaultValue="option-1" legend="Choose an option">
    <div class="flex gap-2 items-center">
      <RadioGroupItem id="docs-radio-group-option-1" aria-label="Option 1" value="option-1" />
      <Label for="docs-radio-group-option-1">Option 1</Label>
    </div>
    <div class="flex gap-2 items-center">
      <RadioGroupItem id="docs-radio-group-option-2" aria-label="Option 2" value="option-2" />
      <Label for="docs-radio-group-option-2">Option 2</Label>
    </div>
    <div class="flex gap-2 items-center">
      <RadioGroupItem id="docs-radio-group-option-3" aria-label="Option 3" value="option-3" />
      <Label for="docs-radio-group-option-3">Option 3</Label>
    </div>
  </RadioGroup>
</div>
