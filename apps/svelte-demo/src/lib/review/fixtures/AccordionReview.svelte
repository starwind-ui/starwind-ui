<script lang="ts">
  import Accordion from "$lib/starwind-runtime/accordion";
  let single = $state<string | string[] | null>("shipping");
  let multiple = $state<string | string[] | null>(["materials", "care"]);
</script>

<div class="grid min-w-0 gap-6">
  <div>
    <p class="mb-2 text-sm font-medium">Single section</p>
    <Accordion.Root id="single-accordion" bind:value={single}>
      <Accordion.Item value="shipping"
        ><Accordion.Trigger>When will my order arrive?</Accordion.Trigger><Accordion.Content
          >Orders ship within two business days. You will receive a tracking link by email.</Accordion.Content
        ></Accordion.Item
      >
      <Accordion.Item value="returns"
        ><Accordion.Trigger>Can I return an item?</Accordion.Trigger><Accordion.Content
          >Return unused items within 30 days of delivery.</Accordion.Content
        ></Accordion.Item
      >
      <Accordion.Item value="unavailable" disabled
        ><Accordion.Trigger>Gift wrapping is unavailable</Accordion.Trigger><Accordion.Content
          >Gift wrapping options will appear here.</Accordion.Content
        ></Accordion.Item
      >
    </Accordion.Root>
  </div>
  <div>
    <p class="mb-2 text-sm font-medium">Multiple sections</p>
    <Accordion.Root id="multiple-accordion" type="multiple" bind:value={multiple}>
      <Accordion.Item value="materials"
        ><Accordion.Trigger>Materials</Accordion.Trigger><Accordion.Content
          >Made with recycled paper and water-based ink.</Accordion.Content
        ></Accordion.Item
      >
      <Accordion.Item value="care"
        ><Accordion.Trigger>Care instructions</Accordion.Trigger><Accordion.Content
          >Keep the package dry and recycle it after use.</Accordion.Content
        ></Accordion.Item
      >
    </Accordion.Root>
  </div>
</div>
