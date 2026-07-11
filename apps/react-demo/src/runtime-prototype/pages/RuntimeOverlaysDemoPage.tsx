import type {
  DialogCloseCompleteDetails,
  DialogOpenChangeDetails,
} from "@starwind-ui/react/dialog";
import type {
  DrawerCloseCompleteDetails,
  DrawerOpenChangeDetails,
} from "@starwind-ui/react/drawer";
import type { MenuCloseCompleteDetails, MenuOpenChangeDetails } from "@starwind-ui/react/menu";
import type {
  PopoverCloseCompleteDetails,
  PopoverOpenChangeDetails,
} from "@starwind-ui/react/popover";
import { useCallback, useState } from "react";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Dropdown,
  DropdownContent,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownTrigger,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../kit";

type OverlayPhase = "closed" | "closing" | "open";

export function RuntimeOverlaysDemoPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogPhase, setDialogPhase] = useState<OverlayPhase>("closed");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetPhase, setSheetPhase] = useState<OverlayPhase>("closed");
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [popoverPhase, setPopoverPhase] = useState<OverlayPhase>("closed");
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPhase, setMenuPhase] = useState<OverlayPhase>("closed");
  const [cancelOutside, setCancelOutside] = useState(true);
  const [logs, setLogs] = useState<string[]>(["Waiting for overlay lifecycle events."]);

  const pushLog = useCallback((message: string) => {
    setLogs((current) => [message, ...current].slice(0, 9));
  }, []);

  const handleDialogOpenChange = useCallback(
    (nextOpen: boolean, details: DialogOpenChangeDetails) => {
      if (!nextOpen && details.reason === "outside-press" && cancelOutside) {
        details.cancel();
        pushLog("Dialog: canceled outside-press");
        return;
      }

      setDialogOpen(nextOpen);
      setDialogPhase(nextOpen ? "open" : "closing");
      pushLog(`Dialog: ${nextOpen ? "opened" : "closing"} via ${details.reason}`);
    },
    [cancelOutside, pushLog],
  );

  const handleDialogCloseComplete = useCallback(
    (details: DialogCloseCompleteDetails) => {
      setDialogPhase("closed");
      pushLog(`Dialog: close complete after ${details.reason}`);
    },
    [pushLog],
  );

  const handleSheetOpenChange = useCallback(
    (nextOpen: boolean, details: DrawerOpenChangeDetails) => {
      if (!nextOpen && details.reason === "outside-press" && cancelOutside) {
        details.cancel();
        pushLog("Sheet: canceled outside-press");
        return;
      }

      setSheetOpen(nextOpen);
      setSheetPhase(nextOpen ? "open" : "closing");
      pushLog(`Sheet: ${nextOpen ? "opened" : "closing"} via ${details.reason}`);
    },
    [cancelOutside, pushLog],
  );

  const handleSheetCloseComplete = useCallback(
    (details: DrawerCloseCompleteDetails) => {
      setSheetPhase("closed");
      pushLog(`Sheet: close complete after ${details.reason}`);
    },
    [pushLog],
  );

  const handlePopoverOpenChange = useCallback(
    (nextOpen: boolean, details: PopoverOpenChangeDetails) => {
      if (!nextOpen && details.reason === "outside-press" && cancelOutside) {
        details.cancel();
        pushLog("Popover: canceled outside-press");
        return;
      }

      setPopoverOpen(nextOpen);
      setPopoverPhase(nextOpen ? "open" : "closing");
      pushLog(`Popover: ${nextOpen ? "opened" : "closing"} via ${details.reason}`);
    },
    [cancelOutside, pushLog],
  );

  const handlePopoverCloseComplete = useCallback(
    (details: PopoverCloseCompleteDetails) => {
      setPopoverPhase("closed");
      pushLog(`Popover: close complete after ${details.reason}`);
    },
    [pushLog],
  );

  const handleMenuOpenChange = useCallback(
    (nextOpen: boolean, details: MenuOpenChangeDetails) => {
      if (!nextOpen && details.reason === "outside-press" && cancelOutside) {
        details.cancel();
        pushLog("Menu: canceled outside-press");
        return;
      }

      setMenuOpen(nextOpen);
      setMenuPhase(nextOpen ? "open" : "closing");
      pushLog(`Menu: ${nextOpen ? "opened" : "closing"} via ${details.reason}`);
    },
    [cancelOutside, pushLog],
  );

  const handleMenuCloseComplete = useCallback(
    (details: MenuCloseCompleteDetails) => {
      setMenuPhase("closed");
      pushLog(`Menu: close complete after ${details.reason}`);
    },
    [pushLog],
  );

  return (
    <div className="min-h-[calc(100lvh-4.25rem)]">
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Runtime overlays
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Overlay lifecycle</h1>
          <p className="text-muted-foreground max-w-2xl">
            Controlled dialog and sheet roots can cancel dismissals, track close reasons, and wait
            for exit motion before marking the lifecycle complete.
          </p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Dialog</h2>
                <p className="text-muted-foreground text-sm">Phase: {dialogPhase}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogOpen(true);
                    setDialogPhase("open");
                    pushLog("Dialog: app opened programmatically");
                  }}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDialogOpen(false);
                    setDialogPhase("closing");
                    pushLog("Dialog: app requested programmatic close");
                  }}
                >
                  Programmatic close
                </Button>
              </div>
            </div>

            <Dialog
              open={dialogOpen}
              onOpenChange={handleDialogOpenChange}
              onCloseComplete={handleDialogCloseComplete}
            >
              <DialogTrigger asChild>
                <Button type="button">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled lifecycle dialog</DialogTitle>
                  <DialogDescription>
                    Close with the button, Escape, or backdrop to inspect lifecycle reasons.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button data-sw-dialog-close type="button" variant="outline">
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Sheet</h2>
                <p className="text-muted-foreground text-sm">Phase: {sheetPhase}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSheetOpen(true);
                    setSheetPhase("open");
                    pushLog("Sheet: app opened programmatically");
                  }}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSheetOpen(false);
                    setSheetPhase("closing");
                    pushLog("Sheet: app requested programmatic close");
                  }}
                >
                  Programmatic close
                </Button>
              </div>
            </div>

            <Sheet
              open={sheetOpen}
              onOpenChange={handleSheetOpenChange}
              onCloseComplete={handleSheetCloseComplete}
            >
              <SheetTrigger asChild>
                <Button type="button">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Controlled lifecycle sheet</SheetTitle>
                  <SheetDescription>
                    This uses the shared Dialog lifecycle without drawer swipe or snap behavior.
                  </SheetDescription>
                </SheetHeader>
                <SheetFooter>
                  <Button data-sw-drawer-close type="button" variant="outline">
                    Close
                  </Button>
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Popover</h2>
                <p className="text-muted-foreground text-sm">Phase: {popoverPhase}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPopoverOpen(true);
                    setPopoverPhase("open");
                    pushLog("Popover: app opened programmatically");
                  }}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPopoverOpen(false);
                    setPopoverPhase("closing");
                    pushLog("Popover: app requested programmatic close");
                  }}
                >
                  Programmatic close
                </Button>
              </div>
            </div>

            <Popover
              open={popoverOpen}
              onOpenChange={handlePopoverOpenChange}
              onCloseComplete={handlePopoverCloseComplete}
            >
              <PopoverTrigger asChild>
                <Button type="button" variant="outline">
                  Open popover
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <PopoverHeader>
                  <PopoverTitle>Controlled lifecycle popover</PopoverTitle>
                  <PopoverDescription>
                    Close with the button, Escape, trigger, or outside press to inspect reasons.
                  </PopoverDescription>
                </PopoverHeader>
                <Button data-sw-popover-close type="button" variant="outline" size="sm">
                  Close
                </Button>
              </PopoverContent>
            </Popover>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Dropdown</h2>
                <p className="text-muted-foreground text-sm">Phase: {menuPhase}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(true);
                    setMenuPhase("open");
                    pushLog("Menu: app opened programmatically");
                  }}
                >
                  Open
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setMenuOpen(false);
                    setMenuPhase("closing");
                    pushLog("Menu: app requested programmatic close");
                  }}
                >
                  Programmatic close
                </Button>
              </div>
            </div>

            <Dropdown
              open={menuOpen}
              onOpenChange={handleMenuOpenChange}
              onCloseComplete={handleMenuCloseComplete}
            >
              <DropdownTrigger asChild>
                <Button type="button" variant="outline">
                  Open menu
                </Button>
              </DropdownTrigger>
              <DropdownContent>
                <DropdownLabel>Lifecycle actions</DropdownLabel>
                <DropdownSeparator />
                <DropdownItem>Archive</DropdownItem>
                <DropdownItem>Duplicate</DropdownItem>
              </DropdownContent>
            </Dropdown>
          </section>

          <section className="space-y-3">
            <label className="flex w-fit items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={cancelOutside}
                onChange={(event) => setCancelOutside(event.target.checked)}
              />
              <span>Cancel outside dismissal</span>
            </label>
            <output className="border-border bg-muted text-muted-foreground block min-h-36 rounded-md border p-4 text-sm whitespace-pre-wrap">
              {logs.join("\n")}
            </output>
          </section>
        </div>
      </main>
    </div>
  );
}
