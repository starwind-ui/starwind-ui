<script lang="ts">
  import { Button } from "$lib/starwind-runtime/button";
  import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemMedia,
    ItemTitle,
  } from "$lib/starwind-runtime/item";
</script>

<div class="w-full max-w-md flex flex-col gap-6">
  <Item variant="outline">
    <ItemContent>
      <ItemTitle>Basic Item</ItemTitle>
      <ItemDescription>A simple item with title and description.</ItemDescription>
    </ItemContent>
    <ItemActions>
      <Button variant="outline" size="sm">Action</Button>
    </ItemActions>
  </Item>
  <Item variant="outline" size="sm" as="a" href="#item-review">
    <ItemMedia>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-5"><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></svg
      >
    </ItemMedia>
    <ItemContent>
      <ItemTitle>Your profile has been verified.</ItemTitle>
    </ItemContent>
    <ItemActions>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
        class="size-4"><path d="m9 18 6-6-6-6" /></svg
      >
    </ItemActions>
  </Item>
</div>
