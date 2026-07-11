import { useRuntimePrototypeContext } from "../context";
import {
  button,
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuCheckboxItemIndicator,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuRadioItemIndicator,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "../kit";

export function ContextMenuDemo() {
  const {
    controlledContextMenuOpen,
    setControlledContextMenuOpen,
    controlledContextMenuChanges,
    setControlledContextMenuChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Context Menu</h2>
      <div className="flex flex-wrap gap-3">
        <ContextMenu id="react-runtime-context-menu-default">
          <ContextMenuTrigger
            id="react-runtime-context-menu-trigger"
            className="border-input bg-card text-card-foreground focus-visible:ring-outline/50 flex min-h-28 w-full max-w-md items-center justify-center rounded-md border border-dashed px-6 py-4 text-sm outline-none select-none focus-visible:ring-3"
          >
            Right click React area
          </ContextMenuTrigger>
          <ContextMenuContent
            id="react-runtime-context-menu-content"
            className="runtime-context-menu-custom"
            side="bottom"
            align="start"
          >
            <ContextMenuLabel>Canvas</ContextMenuLabel>
            <ContextMenuGroup>
              <ContextMenuItem id="react-runtime-context-menu-rename">
                Rename
                <ContextMenuShortcut>F2</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuCheckboxItem
                id="react-runtime-context-menu-checkbox"
                defaultChecked
                showIndicator={false}
              >
                <ContextMenuCheckboxItemIndicator
                  id="react-runtime-context-menu-checkbox-exported-indicator"
                  className="text-primary"
                >
                  <span className="text-[10px] leading-none font-bold">on</span>
                </ContextMenuCheckboxItemIndicator>
                Show guides
              </ContextMenuCheckboxItem>
              <ContextMenuRadioGroup
                id="react-runtime-context-menu-radio-group"
                defaultValue="grid"
                aria-label="Canvas snap mode"
              >
                <ContextMenuRadioItem
                  id="react-runtime-context-menu-radio-grid"
                  value="grid"
                  showIndicator={false}
                >
                  <ContextMenuRadioItemIndicator
                    id="react-runtime-context-menu-radio-grid-exported-indicator"
                    className="text-primary"
                  >
                    <span className="size-2 rounded-sm bg-current" />
                  </ContextMenuRadioItemIndicator>
                  Snap to grid
                </ContextMenuRadioItem>
                <ContextMenuRadioItem
                  id="react-runtime-context-menu-radio-freeform"
                  value="freeform"
                >
                  Freeform
                </ContextMenuRadioItem>
              </ContextMenuRadioGroup>
              <ContextMenuSub>
                <ContextMenuSubTrigger id="react-runtime-context-menu-sub-trigger">
                  Insert
                </ContextMenuSubTrigger>
                <ContextMenuSubContent id="react-runtime-context-menu-sub-content">
                  <ContextMenuItem id="react-runtime-context-menu-frame">Frame</ContextMenuItem>
                </ContextMenuSubContent>
              </ContextMenuSub>
            </ContextMenuGroup>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>Locked action</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        <ContextMenu
          id="react-runtime-context-menu-controlled"
          open={controlledContextMenuOpen}
          onOpenChange={(open) => {
            setControlledContextMenuOpen(open);
            setControlledContextMenuChanges((count) => count + 1);
          }}
        >
          <ContextMenuTrigger
            id="react-runtime-context-menu-controlled-trigger"
            className={button({ variant: "secondary" })}
          >
            Right click controlled area
          </ContextMenuTrigger>
          <ContextMenuContent id="react-runtime-context-menu-controlled-content">
            <ContextMenuItem>Controlled context item</ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
      </div>
      <p className="text-muted-foreground text-sm">
        Controlled context menu open: {controlledContextMenuOpen ? "yes" : "no"}; changes:{" "}
        <span id="react-context-menu-count">{controlledContextMenuChanges}</span>
      </p>
    </section>
  );
}
