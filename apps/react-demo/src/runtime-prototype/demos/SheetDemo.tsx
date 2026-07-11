import { useRuntimePrototypeContext } from "../context";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  button,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownTrigger,
  Input,
  Label,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../kit";

export function SheetDemo() {
  const {
    controlledSheetOpen,
    setControlledSheetOpen,
    controlledSheetChanges,
    setControlledSheetChanges,
    canceledSheetChanges,
    setCanceledSheetChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Sheet</h2>
      <div className="flex flex-wrap gap-3">
        <Sheet id="react-runtime-sheet-default">
          <SheetTrigger className={button({ variant: "outline" })}>Open React sheet</SheetTrigger>
          <SheetContent className="runtime-sheet-custom" side="right">
            <SheetHeader>
              <SheetTitle>React runtime sheet</SheetTitle>
              <SheetDescription>
                Sheet composes generated Drawer primitive parts with the Starwind Sheet visual
                treatment.
              </SheetDescription>
            </SheetHeader>
            <div className="text-muted-foreground px-4 py-2 text-sm">
              This uncontrolled sheet closes on outside interaction by default.
            </div>
          </SheetContent>
        </Sheet>

        <div id="react-runtime-sheet-directions" className="flex flex-wrap gap-3">
          <Sheet id="react-runtime-sheet-side-top">
            <SheetTrigger asChild>
              <Button id="react-runtime-sheet-side-top-trigger" variant="outline">
                Open React top sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="top">
              <SheetHeader>
                <SheetTitle>React top sheet direction</SheetTitle>
                <SheetDescription>This sheet opens from the top of the screen.</SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-top-name">Name</Label>
                  <Input id="react-runtime-sheet-side-top-name" defaultValue="Pedro Duarte" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-top-username">Username</Label>
                  <Input id="react-runtime-sheet-side-top-username" defaultValue="@peduarte" />
                </div>
              </div>
              <SheetFooter>
                <Button variant="default">Save changes</Button>
                <SheetClose asChild>
                  <Button id="react-runtime-sheet-side-top-close" variant="outline">
                    Close React top sheet
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet id="react-runtime-sheet-side-right">
            <SheetTrigger asChild>
              <Button id="react-runtime-sheet-side-right-trigger" variant="outline">
                Open React right sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>React right sheet direction</SheetTitle>
                <SheetDescription>
                  This sheet opens from the right side of the screen.
                </SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-right-name">Name</Label>
                  <Input id="react-runtime-sheet-side-right-name" defaultValue="Pedro Duarte" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-right-username">Username</Label>
                  <Input id="react-runtime-sheet-side-right-username" defaultValue="@peduarte" />
                </div>
              </div>
              <SheetFooter>
                <Button variant="default">Save changes</Button>
                <SheetClose asChild>
                  <Button id="react-runtime-sheet-side-right-close" variant="outline">
                    Close React right sheet
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet id="react-runtime-sheet-side-bottom">
            <SheetTrigger asChild>
              <Button id="react-runtime-sheet-side-bottom-trigger" variant="outline">
                Open React bottom sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom">
              <SheetHeader>
                <SheetTitle>React bottom sheet direction</SheetTitle>
                <SheetDescription>This sheet opens from the bottom of the screen.</SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-bottom-name">Name</Label>
                  <Input id="react-runtime-sheet-side-bottom-name" defaultValue="Pedro Duarte" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-bottom-username">Username</Label>
                  <Input id="react-runtime-sheet-side-bottom-username" defaultValue="@peduarte" />
                </div>
              </div>
              <SheetFooter>
                <Button variant="default">Save changes</Button>
                <SheetClose asChild>
                  <Button id="react-runtime-sheet-side-bottom-close" variant="outline">
                    Close React bottom sheet
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Sheet id="react-runtime-sheet-side-left">
            <SheetTrigger asChild>
              <Button id="react-runtime-sheet-side-left-trigger" variant="outline">
                Open React left sheet
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>React left sheet direction</SheetTitle>
                <SheetDescription>
                  This sheet opens from the left side of the screen.
                </SheetDescription>
              </SheetHeader>
              <div className="grid flex-1 auto-rows-min gap-6 px-4">
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-left-name">Name</Label>
                  <Input id="react-runtime-sheet-side-left-name" defaultValue="Pedro Duarte" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="react-runtime-sheet-side-left-username">Username</Label>
                  <Input id="react-runtime-sheet-side-left-username" defaultValue="@peduarte" />
                </div>
              </div>
              <SheetFooter>
                <Button variant="default">Save changes</Button>
                <SheetClose asChild>
                  <Button id="react-runtime-sheet-side-left-close" variant="outline">
                    Close React left sheet
                  </Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <Sheet id="react-runtime-sheet-dropdown-sheet">
          <SheetTrigger asChild>
            <Button id="react-runtime-sheet-dropdown-sheet-trigger" variant="secondary">
              Open React sheet menu
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetHeader>
              <SheetTitle>React sheet dropdown portal</SheetTitle>
              <SheetDescription>
                Dropdown content opened from inside this sheet should use the sheet floating root.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-4 overflow-hidden px-4 py-2">
              <label className="grid gap-2 text-sm font-medium">
                Project
                <input
                  id="react-runtime-sheet-dropdown-input"
                  className="border-input bg-background focus-visible:ring-outline/50 h-10 rounded-md border px-3 outline-none focus-visible:ring-3"
                  defaultValue="Portal QA"
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Actions menu</span>
                <Dropdown id="react-runtime-sheet-dropdown">
                  <DropdownTrigger asChild>
                    <Button id="react-runtime-sheet-dropdown-trigger" variant="outline" size="sm">
                      Open React sheet dropdown
                    </Button>
                  </DropdownTrigger>
                  <DropdownContent
                    id="react-runtime-sheet-dropdown-content"
                    side="left"
                    align="start"
                  >
                    <DropdownLabel>Sheet actions</DropdownLabel>
                    <DropdownItem id="react-runtime-sheet-dropdown-rename">
                      Rename project
                    </DropdownItem>
                    <DropdownItem id="react-runtime-sheet-dropdown-duplicate">
                      Duplicate
                    </DropdownItem>
                    <DropdownSub>
                      <DropdownSubTrigger id="react-runtime-sheet-dropdown-sub-trigger">
                        Share
                      </DropdownSubTrigger>
                      <DropdownSubContent id="react-runtime-sheet-dropdown-sub-content">
                        <DropdownItem id="react-runtime-sheet-dropdown-email">
                          Email invite
                        </DropdownItem>
                        <DropdownItem id="react-runtime-sheet-dropdown-copy">
                          Copy link
                        </DropdownItem>
                      </DropdownSubContent>
                    </DropdownSub>
                    <DropdownSeparator />
                    <DropdownItem id="react-runtime-sheet-dropdown-archive">Archive</DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button id="react-runtime-sheet-dropdown-close" variant="outline" size="sm">
                  Close React sheet menu
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet id="react-runtime-sheet-popover">
          <SheetTrigger asChild>
            <Button id="react-runtime-sheet-popover-trigger" variant="secondary">
              Open React sheet popover
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>React sheet popover portal</SheetTitle>
              <SheetDescription>
                Popover content opened from inside this sheet should use the sheet floating root.
              </SheetDescription>
            </SheetHeader>
            <div className="grid flex-1 auto-rows-min gap-4 px-4 py-2">
              <label className="grid gap-2 text-sm font-medium">
                Workspace
                <input
                  id="react-runtime-sheet-popover-input"
                  className="border-input bg-background focus-visible:ring-outline/50 h-10 rounded-md border px-3 outline-none focus-visible:ring-3"
                  defaultValue="Portal QA"
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-medium">Details popover</span>
                <Popover id="react-runtime-sheet-popover-details">
                  <PopoverTrigger asChild>
                    <Button
                      id="react-runtime-sheet-popover-details-trigger"
                      variant="outline"
                      size="sm"
                    >
                      Open React sheet popover details
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    id="react-runtime-sheet-popover-details-content"
                    className="w-72"
                    side="right"
                    align="start"
                  >
                    <PopoverHeader>
                      <PopoverTitle>React sheet popover</PopoverTitle>
                      <PopoverDescription>
                        This popover should render above the sheet without being clipped.
                      </PopoverDescription>
                    </PopoverHeader>
                    <div className="mt-3">
                      <Popover id="react-runtime-sheet-popover-nested">
                        <PopoverTrigger asChild>
                          <Button
                            id="react-runtime-sheet-popover-nested-trigger"
                            variant="outline"
                            size="sm"
                          >
                            Open nested React sheet popover
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          id="react-runtime-sheet-popover-nested-content"
                          className="w-64"
                          side="right"
                          align="start"
                        >
                          <PopoverHeader>
                            <PopoverTitle>Nested React sheet popover</PopoverTitle>
                            <PopoverDescription>
                              Nested content should share the sheet floating root.
                            </PopoverDescription>
                          </PopoverHeader>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button id="react-runtime-sheet-popover-close" variant="outline" size="sm">
                  Close React sheet popover
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet id="react-runtime-sheet-accordion">
          <SheetTrigger asChild>
            <Button id="react-runtime-sheet-accordion-trigger" variant="secondary">
              Open React sheet accordion menu
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex-col">
            <SheetHeader>
              <SheetTitle>React sheet accordion navigation</SheetTitle>
              <SheetDescription>
                Navigate through sections while the sheet remains open.
              </SheetDescription>
            </SheetHeader>
            <nav
              className="flex flex-1 flex-col gap-2 px-4"
              aria-label="React sheet accordion navigation"
            >
              <a
                id="react-runtime-sheet-accordion-home-link"
                href="#"
                className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Home
              </a>
              <a
                id="react-runtime-sheet-accordion-about-link"
                href="#"
                className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                About
              </a>
              <Accordion
                id="react-runtime-sheet-accordion-menu"
                type="single"
                collapsible
                className="w-full space-y-2"
              >
                <AccordionItem value="products" className="border-none">
                  <AccordionTrigger
                    id="react-runtime-sheet-accordion-products-trigger"
                    className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium hover:no-underline"
                  >
                    Products
                  </AccordionTrigger>
                  <AccordionContent id="react-runtime-sheet-accordion-products-content">
                    <div className="flex flex-col gap-1 pl-4">
                      <a
                        id="react-runtime-sheet-accordion-all-products-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        All Products
                      </a>
                      <a
                        id="react-runtime-sheet-accordion-featured-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        Featured
                      </a>
                      <a
                        id="react-runtime-sheet-accordion-new-arrivals-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        New Arrivals
                      </a>
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="services" className="border-none">
                  <AccordionTrigger
                    id="react-runtime-sheet-accordion-services-trigger"
                    className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium hover:no-underline"
                  >
                    Services
                  </AccordionTrigger>
                  <AccordionContent id="react-runtime-sheet-accordion-services-content">
                    <div className="flex flex-col gap-1 pl-4">
                      <a
                        id="react-runtime-sheet-accordion-consulting-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        Consulting
                      </a>
                      <a
                        id="react-runtime-sheet-accordion-development-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        Development
                      </a>
                      <a
                        id="react-runtime-sheet-accordion-support-link"
                        href="#"
                        className="hover:bg-muted rounded-md px-3 py-2 text-sm transition-colors"
                      >
                        Support
                      </a>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <a
                id="react-runtime-sheet-accordion-blog-link"
                href="#"
                className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Blog
              </a>
              <a
                id="react-runtime-sheet-accordion-contact-link"
                href="#"
                className="hover:bg-muted rounded-md px-3 py-2 text-sm font-medium transition-colors"
              >
                Contact
              </a>
            </nav>
            <SheetFooter className="mt-auto">
              <SheetClose asChild>
                <Button
                  id="react-runtime-sheet-accordion-close"
                  variant="outline"
                  className="w-full"
                >
                  Close Menu
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet id="react-runtime-sheet-accordion-faq">
          <SheetTrigger asChild>
            <Button id="react-runtime-sheet-accordion-faq-trigger" variant="secondary">
              Open React sheet FAQ
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="flex-col">
            <SheetHeader>
              <SheetTitle>React sheet FAQ accordion</SheetTitle>
              <SheetDescription>
                The default-open item can be closed without leaving the sheet.
              </SheetDescription>
            </SheetHeader>
            <div className="px-4">
              <Accordion
                id="react-runtime-sheet-accordion-faq-menu"
                type="single"
                defaultValue="availability"
                collapsible
                className="w-full"
              >
                <AccordionItem value="availability">
                  <AccordionTrigger id="react-runtime-sheet-accordion-faq-availability-trigger">
                    Availability
                  </AccordionTrigger>
                  <AccordionContent id="react-runtime-sheet-accordion-faq-availability-content">
                    Runtime sheets keep focus trapped while accordion sections open and close.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="handoff">
                  <AccordionTrigger id="react-runtime-sheet-accordion-faq-handoff-trigger">
                    Handoff
                  </AccordionTrigger>
                  <AccordionContent id="react-runtime-sheet-accordion-faq-handoff-content">
                    Collapsible single accordions work inside the same native dialog surface.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            <SheetFooter className="mt-auto">
              <SheetClose asChild>
                <Button
                  id="react-runtime-sheet-accordion-faq-close"
                  variant="outline"
                  className="w-full"
                >
                  Close FAQ
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet
          id="react-runtime-sheet-controlled"
          open={controlledSheetOpen}
          onOpenChange={(open) => {
            setControlledSheetOpen(open);
            setControlledSheetChanges((count) => count + 1);
          }}
        >
          <SheetTrigger className={button({ variant: "secondary" })}>
            Open controlled sheet
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Controlled sheet</SheetTitle>
              <SheetDescription>
                React owns the open state while the runtime keeps native dialog behavior.
              </SheetDescription>
            </SheetHeader>
            <SheetFooter>
              <SheetClose className={button({ variant: "outline" })}>
                Close controlled sheet
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        <Sheet
          id="react-runtime-sheet-canceled"
          onOpenChange={(open, details) => {
            setCanceledSheetChanges((count) => count + 1);
            if (open) details.cancel();
          }}
        >
          <SheetTrigger className={button({ variant: "ghost" })}>Open canceled sheet</SheetTrigger>
          <SheetContent side="bottom">
            <SheetHeader>
              <SheetTitle>Canceled sheet</SheetTitle>
              <SheetDescription>
                This sheet proves React onOpenChange can cancel before DOM state changes.
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
      <p className="text-muted-foreground text-sm">
        Controlled sheet open: {controlledSheetOpen ? "yes" : "no"}; changes:{" "}
        <span id="react-sheet-count">{controlledSheetChanges}</span>; canceled:{" "}
        <span id="react-sheet-canceled-count">{canceledSheetChanges}</span>
      </p>
    </section>
  );
}
