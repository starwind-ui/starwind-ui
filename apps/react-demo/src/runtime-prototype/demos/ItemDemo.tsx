import {
  Button,
  IconChevronRight,
  IconCircleCheck,
  IconInfoCircle,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "../kit";

const itemImageSrc =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' fill='%23e5e7eb'/%3E%3Ccircle cx='20' cy='16' r='7' fill='%236b7280'/%3E%3Cpath d='M8 36c2.4-8 8-12 12-12s9.6 4 12 12' fill='%236b7280'/%3E%3C/svg%3E";

export function ItemDemo() {
  return (
    <section className="space-y-4" id="runtime-item-demo">
      <h2 className="font-heading text-xl font-semibold">Item</h2>
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium">Basic Group</p>
          <ItemGroup id="runtime-item-group" className="gap-3">
            <Item id="runtime-item-basic" variant="outline" role="listitem">
              <ItemContent>
                <ItemTitle>Basic item</ItemTitle>
                <ItemDescription>A simple item with title and description.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Review
                </Button>
              </ItemActions>
            </Item>
            <Item id="runtime-item-group-status" variant="outline" size="sm" role="listitem">
              <ItemMedia>
                <IconCircleCheck className="size-5" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Your profile has been verified.</ItemTitle>
              </ItemContent>
              <ItemActions>
                <IconChevronRight className="size-4" />
              </ItemActions>
            </Item>
          </ItemGroup>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Media Variants</p>
          <div className="flex flex-col gap-3">
            <Item id="runtime-item-icon" variant="outline">
              <ItemMedia id="runtime-item-media-icon" variant="icon">
                <IconInfoCircle />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Security alert</ItemTitle>
                <ItemDescription>New login detected from an unknown device.</ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button size="sm" variant="outline">
                  Inspect
                </Button>
              </ItemActions>
            </Item>
            <Item id="runtime-item-image" variant="outline">
              <ItemMedia id="runtime-item-media-image" variant="image">
                <img src={itemImageSrc} alt="" loading="lazy" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Runtime avatar</ItemTitle>
                <ItemDescription>
                  Image media keeps thumbnails clipped to the media frame.
                </ItemDescription>
              </ItemContent>
            </Item>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Variants</p>
          <div className="flex flex-col gap-3">
            <Item id="runtime-item-link" size="sm" as="a" href="#runtime-item-link-target">
              <ItemContent>
                <ItemTitle>Default link variant</ItemTitle>
                <ItemDescription>Transparent shell for standard linked content.</ItemDescription>
              </ItemContent>
            </Item>
            <Item id="runtime-item-outline" variant="outline">
              <ItemContent>
                <ItemTitle>Outline variant</ItemTitle>
                <ItemDescription>Outlined item with a visible border.</ItemDescription>
              </ItemContent>
            </Item>
            <Item id="runtime-item-muted" variant="muted">
              <ItemContent>
                <ItemTitle>Muted variant</ItemTitle>
                <ItemDescription>Muted background for secondary content.</ItemDescription>
              </ItemContent>
            </Item>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-medium">Header Footer Separator</p>
          <Item id="runtime-item-header-footer" variant="muted">
            <ItemHeader id="runtime-item-header">
              <ItemTitle>Deployment summary</ItemTitle>
              <span className="text-muted-foreground text-xs">Queued</span>
            </ItemHeader>
            <ItemSeparator id="runtime-item-separator" />
            <ItemContent>
              <ItemDescription>
                The footer and separator remain part of the item layout contract.
              </ItemDescription>
            </ItemContent>
            <ItemFooter id="runtime-item-footer">
              <span className="text-muted-foreground text-sm">2 checks</span>
              <Button variant="outline" size="sm">
                Details
              </Button>
            </ItemFooter>
          </Item>
        </div>
      </div>
      <a id="runtime-item-link-target" className="sr-only" href="#runtime-item-demo">
        Item target
      </a>
    </section>
  );
}
