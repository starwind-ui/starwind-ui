<script lang="ts">
  import Slider from "$lib/starwind-runtime/slider";
  import { Button } from "$lib/starwind-runtime/button";
  let volume = $state<number | number[]>(35),
    range = $state<number | number[]>([25, 75]),
    height = $state<number | number[]>(40),
    submitted = $state("Not submitted");
  function submit(event: SubmitEvent) {
    event.preventDefault();
    const values = new FormData(event.currentTarget as HTMLFormElement);
    submitted = [...values.values()].join(" to ");
  }
</script>

<div class="grid min-w-0 gap-8 px-2 py-2">
  <div class="grid gap-5">
    <p id="volume-label" class="text-sm font-medium">Volume: {volume}</p>
    <Slider
      id="volume-slider"
      aria-labelledby="volume-label"
      bind:value={volume}
      defaultValue={35}
    />
  </div>
  <form onsubmit={submit} class="grid gap-5">
    <p id="price-label" class="text-sm font-medium">
      Price range: {Array.isArray(range) ? range.join(" to ") : range}
    </p>
    <Slider
      id="price-slider"
      name="price"
      aria-labelledby="price-label"
      bind:value={range}
      defaultValue={[25, 75]}
      variant="primary"
    />
    <div class="flex flex-wrap gap-2">
      <Button type="submit" size="sm">Submit range</Button><Button
        type="reset"
        size="sm"
        variant="outline">Reset range</Button
      >
    </div>
    <p class="text-sm text-muted-foreground" data-slider-submitted>Submitted range: {submitted}</p>
  </form>
  <div class="grid gap-5">
    <p id="disabled-slider-label" class="text-sm font-medium">Disabled</p>
    <Slider id="disabled-slider" value={60} disabled aria-labelledby="disabled-slider-label" />
  </div>
  <div class="grid gap-5">
    <p id="vertical-slider-label" class="text-sm font-medium">Vertical: {height}</p>
    <div class="h-48 w-8 py-2">
      <Slider
        id="vertical-slider"
        orientation="vertical"
        variant="success"
        aria-labelledby="vertical-slider-label"
        bind:value={height}
        defaultValue={40}
      />
    </div>
  </div>
</div>
