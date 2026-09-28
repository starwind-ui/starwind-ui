<script lang="ts">
  import { ToggleGroup, ToggleGroupItem } from "$lib/starwind-runtime/toggle-group";
</script>

<ToggleGroup multiple defaultValue={["bold", "italic"]} aria-label="Text formatting">
  <ToggleGroupItem value="bold" aria-label="Bold"
    ><svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"><path d="M6 12h9a4 4 0 0 1 0 8H6V4h8a4 4 0 0 1 0 8" /></svg
    ></ToggleGroupItem
  >
  <ToggleGroupItem value="italic" aria-label="Italic"
    ><svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"><path d="M19 4h-9m4 16H5M15 4 9 20" /></svg
    ></ToggleGroupItem
  >
  <ToggleGroupItem value="underline" aria-label="Underline"
    ><svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"><path d="M6 4v6a6 6 0 0 0 12 0V4M4 20h16" /></svg
    ></ToggleGroupItem
  >
</ToggleGroup>
