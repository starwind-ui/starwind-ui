import { useRuntimePrototypeContext } from "../context";
import { Alert, AlertDescription, AlertTitle, IconFlame, IconInfoCircle } from "../kit";

export function AlertDemo() {
  const { alertRefSlot, setAlertRef } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Alert</h2>
      <div className="grid gap-4">
        <Alert id="react-runtime-alert-default" ref={setAlertRef} className="runtime-alert-custom">
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>Generated alert anatomy with the default status role.</AlertDescription>
        </Alert>
        <Alert id="react-runtime-alert-warning" variant="warning">
          <AlertTitle>
            <IconInfoCircle className="size-6" /> Check this first
          </AlertTitle>
          <AlertDescription>Warning alerts infer the alert role.</AlertDescription>
        </Alert>
        <Alert id="react-runtime-alert-error-override" variant="error" role="status">
          <AlertTitle>
            <IconFlame className="size-6" /> Non-interruptive error
          </AlertTitle>
          <AlertDescription>An explicit role still wins over variant inference.</AlertDescription>
        </Alert>
      </div>
      <p className="sr-only" data-runtime-alert-ref>
        {alertRefSlot}
      </p>
    </section>
  );
}
