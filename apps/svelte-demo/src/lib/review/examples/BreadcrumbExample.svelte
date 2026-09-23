<script lang="ts">
  import Breadcrumb, { BreadcrumbVariants } from "$lib/starwind-runtime/breadcrumb";
  import BreadcrumbRouterLink from "./BreadcrumbRouterLink.svelte";
</script>

<div class="space-y-7">
  <div>
    <h3 class="mb-3 text-sm font-medium">Documentation path</h3>
    <Breadcrumb.Root aria-label="Documentation path"
      ><Breadcrumb.List>
        <Breadcrumb.Item
          ><Breadcrumb.Link href="#breadcrumb-review">Home</Breadcrumb.Link></Breadcrumb.Item
        >
        <Breadcrumb.Separator />
        <Breadcrumb.Item
          ><Breadcrumb.Link asChild
            ><a
              href="#breadcrumb-review"
              class={BreadcrumbVariants.breadcrumbLink()}
              data-review-direct-anchor>Components</a
            ></Breadcrumb.Link
          ></Breadcrumb.Item
        >
        <Breadcrumb.Separator />
        <Breadcrumb.Item><Breadcrumb.Page>Breadcrumb</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root
    >
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Compact path</h3>
    <Breadcrumb.Root aria-label="Compact path"
      ><Breadcrumb.List>
        <Breadcrumb.Item
          ><Breadcrumb.Link asChild
            ><BreadcrumbRouterLink
              to="#breadcrumb-review"
              class={BreadcrumbVariants.breadcrumbLink()}>Workspace</BreadcrumbRouterLink
            ></Breadcrumb.Link
          ></Breadcrumb.Item
        >
        <Breadcrumb.Separator />
        <Breadcrumb.Item><Breadcrumb.Ellipsis /></Breadcrumb.Item>
        <Breadcrumb.Separator />
        <Breadcrumb.Item><Breadcrumb.Page>Project</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root
    >
  </div>
  <div>
    <h3 class="mb-3 text-sm font-medium">Custom separator and label</h3>
    <Breadcrumb.Root aria-label="Custom path"
      ><Breadcrumb.List>
        <Breadcrumb.Item
          ><Breadcrumb.Link href="#breadcrumb-review">Library</Breadcrumb.Link></Breadcrumb.Item
        >
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <Breadcrumb.Item
          ><Breadcrumb.Ellipsis
            >{#snippet icon()}<span class="text-base">···</span>{/snippet}<span class="sr-only"
              >More folders</span
            ></Breadcrumb.Ellipsis
          ></Breadcrumb.Item
        >
        <Breadcrumb.Separator>/</Breadcrumb.Separator>
        <Breadcrumb.Item><Breadcrumb.Page>Assets</Breadcrumb.Page></Breadcrumb.Item>
      </Breadcrumb.List></Breadcrumb.Root
    >
  </div>
</div>
