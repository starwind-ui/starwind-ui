import {
  Button,
  button,
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
      </div>
    </section>
  );
}
