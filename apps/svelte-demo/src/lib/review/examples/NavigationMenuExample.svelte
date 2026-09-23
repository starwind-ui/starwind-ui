<script lang="ts">
  import Menu from "$lib/starwind-runtime/navigation-menu";
  let value = $state<string | null | undefined>(null);
  let count = $state(0);
</script>

<div class="grid justify-items-start gap-4">
  <Menu.Root bind:value aria-label="Workspace navigation">
    <Menu.List
      ><Menu.Item value="workspace"
        ><Menu.Trigger data-navigation-example="trigger">Workspace</Menu.Trigger><Menu.Content
          data-navigation-example="content"
          ><ul class="grid w-60 gap-1">
            <li>
              <Menu.Link href="#navigation-menu-review" closeOnClick={false}
                ><div class="flex flex-col gap-1">
                  <span class="font-medium">Overview</span><span class="text-muted-foreground"
                    >Browse the current project.</span
                  >
                </div></Menu.Link
              >
            </li>
            <li>
              <Menu.Link href="#navigation-menu-review" closeOnClick={false}>Activity</Menu.Link>
            </li>
            <li>
              <button class="m-2 rounded-md border px-3 py-2 text-sm" onclick={() => count++}
                >Updates: {count}</button
              >
            </li>
          </ul></Menu.Content
        ></Menu.Item
      >
      <Menu.Item value="resources"
        ><Menu.Trigger>Resources</Menu.Trigger><Menu.Content
          ><ul class="w-60">
            <li>
              <Menu.Link href="#navigation-menu-review" closeOnClick={false}>Guides</Menu.Link>
            </li>
            <li>
              <Menu.Link href="#navigation-menu-review" closeOnClick={false}>Support</Menu.Link>
            </li>
          </ul></Menu.Content
        ></Menu.Item
      ></Menu.List
    >
  </Menu.Root>
  <output class="text-sm text-muted-foreground" data-navigation-model
    >Panel: {value ?? "closed"}</output
  >
</div>
