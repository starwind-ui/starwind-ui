import { useRuntimePrototypeContext } from "../context";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  button,
} from "../kit";

export function AlertDialogDemo() {
  const {
    controlledAlertDialogOpen,
    setControlledAlertDialogOpen,
    controlledAlertDialogChanges,
    setControlledAlertDialogChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Alert Dialog</h2>
      <div className="flex flex-wrap gap-3">
        <AlertDialog id="react-runtime-alert-dialog-default">
          <AlertDialogTrigger className={button({ variant: "error" })}>
            Discard React draft
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard React draft?</AlertDialogTitle>
              <AlertDialogDescription>
                This Alert Dialog uses the same generated styled API as Astro and requires an
                explicit action by default.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Discard</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          id="react-runtime-alert-dialog-controlled"
          open={controlledAlertDialogOpen}
          onOpenChange={(open) => {
            setControlledAlertDialogOpen(open);
            setControlledAlertDialogChanges((count) => count + 1);
          }}
        >
          <AlertDialogTrigger className={button({ variant: "outline" })}>
            Open controlled alert
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Controlled alert dialog</AlertDialogTitle>
              <AlertDialogDescription>
                React owns this open state while the runtime still handles native dialog behavior.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      <p className="text-muted-foreground text-sm">
        Controlled alert open: {controlledAlertDialogOpen ? "yes" : "no"}; changes:{" "}
        <span id="react-alert-dialog-count">{controlledAlertDialogChanges}</span>
      </p>
    </section>
  );
}
