<script lang="ts">
  import Menu from "$lib/starwind-runtime/navigation-menu";
  import { Button } from "$lib/starwind-runtime/button";
  let value = $state<string | null | undefined>(null),
    cancel = $state(false),
    key = $state(0),
    count = $state(0);
</script>

<section
  id="navigation-menu-fixture"
  class="review-card"
  aria-labelledby="navigation-menu-fixture-heading"
>
  <h2 id="navigation-menu-fixture-heading">Navigation Menu lifecycle</h2>
  <div class="flex flex-wrap gap-3">
    <Button variant="outline" onclick={() => key++}>Replace Navigation Menu Content</Button><Button
      variant="outline"
      onclick={() => (cancel = !cancel)}
      >Cancel navigation proposals: {cancel ? "on" : "off"}</Button
    >
  </div>
  <Menu.Root
    bind:value
    onValueChange={(_next, detail) => {
      if (cancel) detail.cancel();
    }}
    aria-label="Navigation fixture"
  >
    <Menu.List
      ><Menu.Item value="project"
        ><Menu.Trigger data-navigation-fixture-trigger
          >{#snippet child({ props, children })}<Button {...props} variant="outline"
              >{@render children?.()}</Button
            >{/snippet}Project</Menu.Trigger
        >
        {#key key}<Menu.Content data-navigation-fixture-content
            ><div class="grid w-56 gap-2 p-2">
              <Menu.Link href="#navigation-menu-fixture" closeOnClick={false}
                >Project overview</Menu.Link
              ><Button variant="outline" onclick={() => count++}>Live count: {count}</Button>
            </div></Menu.Content
          >{/key}
      </Menu.Item></Menu.List
    ></Menu.Root
  >
  <output data-navigation-fixture-model>Value: {value ?? "closed"}</output>
</section>
