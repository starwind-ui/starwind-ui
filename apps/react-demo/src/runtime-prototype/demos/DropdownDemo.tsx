import { useRuntimePrototypeContext } from "../context";
import {
  button,
  Dropdown,
  DropdownCheckboxItem,
  DropdownCheckboxItemIndicator,
  DropdownContent,
  DropdownGroup,
  DropdownItem,
  DropdownLabel,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownRadioItemIndicator,
  DropdownSeparator,
  DropdownShortcut,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
} from "../kit";

export function DropdownDemo() {
  const {
    controlledDropdownOpen,
    setControlledDropdownOpen,
    controlledDropdownChanges,
    setControlledDropdownChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Dropdown</h2>
      <div className="flex flex-wrap gap-3">
        <Dropdown id="react-runtime-dropdown-default">
          <DropdownTrigger
            id="react-runtime-dropdown-trigger"
            className={button({ variant: "outline" })}
          >
            Open React menu
          </DropdownTrigger>
          <DropdownContent
            id="react-runtime-dropdown-content"
            className="runtime-dropdown-custom"
            side="bottom"
            align="start"
          >
            <DropdownLabel>Workspace</DropdownLabel>
            <DropdownGroup>
              <DropdownItem id="react-runtime-dropdown-account">
                Account
                <DropdownShortcut>Ctrl+A</DropdownShortcut>
              </DropdownItem>
              <DropdownCheckboxItem
                id="react-runtime-dropdown-checkbox"
                defaultChecked
                showIndicator={false}
              >
                <DropdownCheckboxItemIndicator
                  id="react-runtime-dropdown-checkbox-exported-indicator"
                  className="text-primary"
                >
                  <span className="text-[10px] leading-none font-bold">on</span>
                </DropdownCheckboxItemIndicator>
                Email updates
              </DropdownCheckboxItem>
              <DropdownRadioGroup
                id="react-runtime-dropdown-radio-group"
                defaultValue="compact"
                aria-label="Dropdown density"
              >
                <DropdownRadioItem
                  id="react-runtime-dropdown-radio-compact"
                  value="compact"
                  showIndicator={false}
                >
                  <DropdownRadioItemIndicator
                    id="react-runtime-dropdown-radio-compact-exported-indicator"
                    className="text-primary"
                  >
                    <span className="size-2 rounded-sm bg-current" />
                  </DropdownRadioItemIndicator>
                  Compact density
                </DropdownRadioItem>
                <DropdownRadioItem id="react-runtime-dropdown-radio-spacious" value="spacious">
                  Spacious density
                </DropdownRadioItem>
              </DropdownRadioGroup>
              <DropdownSub>
                <DropdownSubTrigger id="react-runtime-dropdown-sub-trigger">
                  More tools
                </DropdownSubTrigger>
                <DropdownSubContent id="react-runtime-dropdown-sub-content">
                  <DropdownItem id="react-runtime-dropdown-invite">Invite team</DropdownItem>
                </DropdownSubContent>
              </DropdownSub>
            </DropdownGroup>
            <DropdownSeparator />
            <DropdownItem disabled>Disabled item</DropdownItem>
          </DropdownContent>
        </Dropdown>

        <Dropdown
          id="react-runtime-dropdown-controlled"
          open={controlledDropdownOpen}
          onOpenChange={(open) => {
            setControlledDropdownOpen(open);
            setControlledDropdownChanges((count) => count + 1);
          }}
        >
          <DropdownTrigger className={button({ variant: "secondary" })}>
            Open controlled menu
          </DropdownTrigger>
          <DropdownContent id="react-runtime-dropdown-controlled-content">
            <DropdownItem>Controlled item</DropdownItem>
          </DropdownContent>
        </Dropdown>

        <Dropdown id="react-runtime-dropdown-as-child">
          <DropdownTrigger asChild className={button({ variant: "ghost" })}>
            <button id="react-runtime-dropdown-as-child-trigger" type="button">
              As child menu
            </button>
          </DropdownTrigger>
          <DropdownContent id="react-runtime-dropdown-as-child-content">
            <DropdownItem id="react-runtime-dropdown-as-child-item">
              Child trigger action
            </DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
      <p className="text-muted-foreground text-sm">
        Controlled menu open: {controlledDropdownOpen ? "yes" : "no"}; changes:{" "}
        <span id="react-dropdown-count">{controlledDropdownChanges}</span>
      </p>
    </section>
  );
}
