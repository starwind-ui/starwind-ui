<script lang="ts">
  import { NativeSelect, NativeSelectOption } from "$lib/starwind-runtime/native-select";
</script>

<div>
  <NativeSelect aria-label="Select a fruit" class="w-[240px]">
    <NativeSelectOption value="" disabled>Select a fruit</NativeSelectOption>
    <NativeSelectOption value="apple">Apple</NativeSelectOption>
    <NativeSelectOption value="banana">Banana</NativeSelectOption>
    <NativeSelectOption value="blueberry">Blueberry</NativeSelectOption>
    <NativeSelectOption value="pineapple">Pineapple</NativeSelectOption>
  </NativeSelect>
</div>
