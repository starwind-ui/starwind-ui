<script lang="ts">
  import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
  } from "$lib/starwind-runtime/select";
</script>

<div class="w-full max-w-[12rem]">
  <Select id="docs-select-select-framework" name="framework" defaultValue="astro" required>
    <SelectTrigger
      aria-label="Choose a framework"
      class="w-full"
      placeholder="Choose a framework"
    />
    <SelectContent>
      <SelectGroup>
        <SelectLabel>Frameworks</SelectLabel>
        <SelectItem value="astro">Astro</SelectItem>
        <SelectItem value="react">React</SelectItem>
        <SelectItem value="vue">Vue</SelectItem>
      </SelectGroup>
      <SelectSeparator />
      <SelectItem value="solid">Solid</SelectItem>
    </SelectContent>
  </Select>
</div>
