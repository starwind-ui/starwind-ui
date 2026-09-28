<script lang="ts">
  import Select from "$lib/starwind-runtime/native-select";
  import { Button } from "$lib/starwind-runtime/button";
  let delivery: string | undefined = $state(undefined),
    channels: string[] = $state(["email"]);
  const sizes = ["sm", "md", "lg"] as const;
</script>

<form class="space-y-6" onsubmit={(event) => event.preventDefault()}>
  <div class="grid gap-5 sm:grid-cols-2">
    <div class="space-y-2">
      <label for="delivery-choice" class="block text-sm font-medium">Delivery</label>
      <Select.Root
        id="delivery-choice"
        name="delivery"
        bind:value={delivery}
        aria-describedby="delivery-hint"
      >
        <Select.OptGroup label="Shipping"
          ><Select.Option value="standard" selected>Standard delivery</Select.Option><Select.Option
            value="express">Express delivery</Select.Option
          ></Select.OptGroup
        >
        <Select.OptGroup label="Collection"
          ><Select.Option value="pickup">Store pickup</Select.Option><Select.Option
            value="courier"
            disabled>Courier · unavailable</Select.Option
          ></Select.OptGroup
        >
      </Select.Root>
      <p id="delivery-hint" class="m-0! text-sm text-muted-foreground">
        Choose when your order arrives.
      </p>
    </div>
    <div class="space-y-2">
      <label for="channel-choices" class="block text-sm font-medium">Update channels</label>
      <Select.Root
        id="channel-choices"
        name="channels"
        multiple
        bind:value={channels}
        class="h-auto min-h-24 py-2"
        aria-describedby="channels-hint"
      >
        <Select.Option value="email">Email</Select.Option><Select.Option value="sms"
          >Text message</Select.Option
        ><Select.Option value="app">App notification</Select.Option>
        {#snippet icon()}<span class="sr-only">Choose one or more channels</span>{/snippet}
      </Select.Root>
      <p id="channels-hint" class="m-0! text-sm text-muted-foreground">
        Use Command or Control to choose more than one.
      </p>
    </div>
  </div>
  <div class="flex flex-wrap items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
    <p class="m-0! min-w-0 flex-1 text-sm" aria-live="polite" data-delivery-summary>
      Delivery: {delivery ?? "standard"} · Channels: {channels.join(", ") || "none"}
    </p>
    <Button type="reset" variant="outline" size="sm">Reset choices</Button>
  </div>
  <div class="grid gap-4 sm:grid-cols-3">
    {#each sizes as size}<div class="space-y-2">
        <label class="block text-sm font-medium" for={`native-size-${size}`}
          >{size === "sm" ? "Small" : size === "md" ? "Medium" : "Large"}</label
        ><Select.Root id={`native-size-${size}`} {size}
          ><Select.Option>Personal</Select.Option><Select.Option>Team</Select.Option></Select.Root
        >
      </div>{/each}
  </div>
  <div class="space-y-2">
    <label for="native-disabled" class="block text-sm font-medium">Unavailable plan</label
    ><Select.Root id="native-disabled" disabled
      ><Select.Option>Enterprise · coming soon</Select.Option></Select.Root
    >
  </div>
</form>
