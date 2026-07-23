import {
  Button,
  button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../kit";

export function DialogDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Dialog</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Dialog id="react-runtime-dialog-default">
          <DialogTrigger className={button()}>Open dialog</DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Native dialog from React</DialogTitle>
              <DialogDescription>
                The styled React wrapper keeps the same DialogContent ergonomics as Starwind and
                shadcn: backdrop, popup, and close button are composed together.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose className={button({ variant: "secondary" })}>Close</DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <DialogTrigger
          targetId="react-runtime-dialog-edit-profile"
          className={button({ variant: "outline" })}
        >
          Edit profile
        </DialogTrigger>

        <Dialog id="react-runtime-dialog-edit-profile">
          <DialogTrigger asChild>
            <Button id="react-runtime-dialog-edit-profile-trigger" variant="secondary">
              Open edit form
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit profile</DialogTitle>
              <DialogDescription>
                Update the profile details used in the runtime demo.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="react-runtime-dialog-name" size="sm">
                  Name
                </Label>
                <Input id="react-runtime-dialog-name" defaultValue="Ada Lovelace" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="react-runtime-dialog-username" size="sm">
                  Username
                </Label>
                <Input id="react-runtime-dialog-username" defaultValue="@ada" />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="primary" size="sm">
                  Save changes
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog id="react-runtime-nested-dialog-parent">
          <DialogTrigger asChild>
            <Button id="react-runtime-nested-dialog-parent-trigger" variant="outline">
              Open nested parent
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>React nested parent</DialogTitle>
              <DialogDescription>
                Mirrors the old Starwind nested dialog demo with deeper dialog levels.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
              <Dialog id="react-runtime-nested-dialog-level-one">
                <DialogTrigger asChild>
                  <Button
                    id="react-runtime-nested-dialog-level-one-trigger"
                    variant="secondary"
                    size="sm"
                  >
                    Open nested level 1
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>React nested level 1</DialogTitle>
                    <DialogDescription>
                      This level can open another dialog without closing its parent.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="mt-4 flex-col gap-2 sm:flex-row">
                    <Dialog id="react-runtime-nested-dialog-level-two">
                      <DialogTrigger asChild>
                        <Button
                          id="react-runtime-nested-dialog-level-two-trigger"
                          variant="primary"
                          size="sm"
                        >
                          Open nested level 2
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>React nested level 2</DialogTitle>
                          <DialogDescription>
                            Closing this second nested level should let the older dialogs resize
                            immediately while this level exits.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                          <DialogClose asChild>
                            <Button
                              id="react-runtime-nested-dialog-level-two-close"
                              variant="outline"
                              size="sm"
                            >
                              Close level 2
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <DialogClose asChild>
                      <Button
                        id="react-runtime-nested-dialog-level-one-close"
                        variant="outline"
                        size="sm"
                      >
                        Close level 1
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <DialogClose asChild>
                <Button id="react-runtime-nested-dialog-parent-close" variant="outline" size="sm">
                  Close parent
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog id="react-runtime-dialog-overlay-lab">
          <DialogTrigger asChild>
            <Button id="react-runtime-dialog-overlay-lab-trigger" variant="outline">
              Open overlay lab
            </Button>
          </DialogTrigger>
          <DialogContent
            id="react-runtime-dialog-overlay-lab-content"
            className="max-h-[calc(100vh-4rem)] max-w-2xl overflow-y-auto"
          >
            <DialogHeader>
              <DialogTitle>Overlays inside a dialog</DialogTitle>
              <DialogDescription>
                Open each control to verify that its floating content remains interactive without
                closing the parent dialog.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4 sm:grid-cols-2">
              <div className="min-w-0 space-y-3 rounded-lg border p-4">
                <h3 className="font-heading text-sm font-semibold">Popover</h3>
                <Popover id="react-runtime-dialog-popover">
                  <PopoverTrigger
                    id="react-runtime-dialog-popover-trigger"
                    className={button({ variant: "outline", size: "sm" })}
                  >
                    Open popover
                  </PopoverTrigger>
                  <PopoverContent
                    id="react-runtime-dialog-popover-content"
                    side="bottom"
                    align="start"
                  >
                    <PopoverHeader>
                      <PopoverTitle>Dialog popover</PopoverTitle>
                      <PopoverDescription>
                        This popup should stay above and inside the modal dialog.
                      </PopoverDescription>
                    </PopoverHeader>
                    <Dialog id="react-runtime-dialog-overlay-nested">
                      <DialogTrigger asChild>
                        <Button
                          id="react-runtime-dialog-overlay-nested-trigger"
                          variant="secondary"
                          size="sm"
                        >
                          Open nested overlay dialog
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        id="react-runtime-dialog-overlay-nested-content"
                        className="max-h-64 max-w-sm overflow-hidden"
                      >
                        <DialogHeader>
                          <DialogTitle>Nested overlay dialog</DialogTitle>
                          <DialogDescription>
                            Its popover should escape this deliberately clipped dialog surface.
                          </DialogDescription>
                        </DialogHeader>
                        <div
                          data-runtime-dialog-overlay-clip
                          className="h-16 overflow-hidden rounded border p-2"
                        >
                          <Popover id="react-runtime-dialog-overlay-nested-popover">
                            <PopoverTrigger
                              id="react-runtime-dialog-overlay-nested-popover-trigger"
                              className={button({ variant: "outline", size: "sm" })}
                            >
                              Open nested popover
                            </PopoverTrigger>
                            <PopoverContent
                              id="react-runtime-dialog-overlay-nested-popover-content"
                              className="w-80"
                              side="bottom"
                              align="start"
                            >
                              <PopoverTitle>Nested dialog popover</PopoverTitle>
                              <PopoverDescription>
                                This content remains interactive outside the clipped region.
                              </PopoverDescription>
                              <Button
                                id="react-runtime-dialog-overlay-nested-popover-action"
                                size="sm"
                              >
                                Confirm nested action
                              </Button>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button
                              id="react-runtime-dialog-overlay-nested-close"
                              variant="outline"
                              size="sm"
                            >
                              Close nested dialog
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                    <Button id="react-runtime-dialog-popover-action" variant="ghost" size="sm">
                      Confirm parent action
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="min-w-0 space-y-3 rounded-lg border p-4">
                <h3 className="font-heading text-sm font-semibold">Select</h3>
                <Select
                  id="react-runtime-dialog-select"
                  defaultValue="system"
                  name="reactRuntimeDialogTheme"
                  className="w-full"
                >
                  <SelectTrigger
                    id="react-runtime-dialog-select-trigger"
                    className="w-full"
                    placeholder="Choose a theme"
                  />
                  <SelectContent
                    id="react-runtime-dialog-select-content"
                    alignItemWithTrigger={false}
                  >
                    <SelectItem id="react-runtime-dialog-select-light" value="light">
                      Light
                    </SelectItem>
                    <SelectItem id="react-runtime-dialog-select-system" value="system">
                      System
                    </SelectItem>
                    <SelectItem id="react-runtime-dialog-select-dark" value="dark">
                      Dark
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-3 rounded-lg border p-4">
                <h3 className="font-heading text-sm font-semibold">Combobox</h3>
                <Combobox id="react-runtime-dialog-combobox" name="reactRuntimeDialogFruit">
                  <ComboboxLabel>Fruit</ComboboxLabel>
                  <ComboboxInput
                    id="react-runtime-dialog-combobox-input"
                    placeholder="Search fruit"
                  />
                  <ComboboxContent id="react-runtime-dialog-combobox-content">
                    <ComboboxEmpty>No fruit found.</ComboboxEmpty>
                    <ComboboxItem id="react-runtime-dialog-combobox-apple" value="apple">
                      Apple
                    </ComboboxItem>
                    <ComboboxItem id="react-runtime-dialog-combobox-apricot" value="apricot">
                      Apricot
                    </ComboboxItem>
                    <ComboboxItem id="react-runtime-dialog-combobox-banana" value="banana">
                      Banana
                    </ComboboxItem>
                  </ComboboxContent>
                </Combobox>
              </div>

              <div className="min-w-0 space-y-3 rounded-lg border p-4">
                <h3 className="font-heading text-sm font-semibold">Dropdown</h3>
                <Dropdown id="react-runtime-dialog-dropdown">
                  <DropdownTrigger
                    id="react-runtime-dialog-dropdown-trigger"
                    className={button({ variant: "outline", size: "sm" })}
                  >
                    Open menu
                  </DropdownTrigger>
                  <DropdownContent
                    id="react-runtime-dialog-dropdown-content"
                    side="bottom"
                    align="start"
                  >
                    <DropdownLabel>Project actions</DropdownLabel>
                    <DropdownItem id="react-runtime-dialog-dropdown-duplicate">
                      Duplicate
                    </DropdownItem>
                    <DropdownItem id="react-runtime-dialog-dropdown-rename">Rename</DropdownItem>
                    <DropdownItem id="react-runtime-dialog-dropdown-archive">Archive</DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button id="react-runtime-dialog-overlay-lab-close" variant="outline" size="sm">
                  Close lab
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
