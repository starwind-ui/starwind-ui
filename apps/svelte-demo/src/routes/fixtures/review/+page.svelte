<script lang="ts">
  import ComboboxReview from "$lib/review/fixtures/ComboboxReview.svelte";
  import NavigationMenuReview from "$lib/review/fixtures/NavigationMenuReview.svelte";
  import ContextMenuReview from "$lib/review/fixtures/ContextMenuReview.svelte";
  import DropdownReview from "$lib/review/fixtures/DropdownReview.svelte";
  import MenuCompositionReview from "$lib/review/fixtures/MenuCompositionReview.svelte";
  import OverlayCompositionReview from "$lib/review/fixtures/OverlayCompositionReview.svelte";
  import DialogReview from "$lib/review/fixtures/DialogReview.svelte";
  import ThemeReview from "$lib/review/fixtures/ThemeReview.svelte";
  import SelectReview from "$lib/review/fixtures/SelectReview.svelte";
  import CheckboxReview from "$lib/review/fixtures/CheckboxReview.svelte";
  import ButtonReview from "$lib/review/fixtures/ButtonReview.svelte";
  // This fixture route retains counters and teardown controls for browser regression fixtures.
  const catalog = ["button", "checkbox", "select", "dialog", "theme-toggle"].map((component) => ({
    component,
  }));
  const label = (name: string) =>
    name
      .split("-")
      .map((word) => word[0].toUpperCase() + word.slice(1))
      .join(" ");
</script>

<svelte:head><title>Browser fixtures · Starwind Svelte</title></svelte:head>
<main id="main" class="review-shell">
  <header class="review-hero">
    <p class="eyebrow">Styled components</p>
    <h1>Browser verification fixtures</h1>
    <p>Compare each state, try the actions, and use Tab to check keyboard focus.</p>
    <nav class="catalog-nav" aria-label="Styled components">
      {#each catalog as entry (entry.component)}
        <a href={`#${entry.component}-review`} data-styled-component={entry.component}>
          {label(entry.component)}
        </a>
      {/each}
    </nav>
  </header>

  <ThemeReview />
  <ButtonReview />
  <CheckboxReview />
  <SelectReview />
  <DialogReview />
  <OverlayCompositionReview />
  <ComboboxReview />
  <NavigationMenuReview />
  <ContextMenuReview />
  <DropdownReview />
  <MenuCompositionReview />
</main>
