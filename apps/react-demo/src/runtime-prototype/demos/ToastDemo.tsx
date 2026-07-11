import { useRuntimePrototypeContext } from "../context";
import { Button, Toaster, toast } from "../kit";

export function ToastDemo() {
  const { toastActionCount, setToastActionCount } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Toast</h2>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          id="react-runtime-toast-default"
          variant="outline"
          onClick={() => {
            toast("React runtime toast", {
              description: "Generated React Toaster.",
              duration: 0,
            });
          }}
        >
          Default toast
        </Button>
        <Button
          id="react-runtime-toast-success"
          variant="secondary"
          onClick={() => {
            toast.success("Sync complete", {
              description: "Success variant and icon template.",
              duration: 0,
            });
          }}
        >
          Success toast
        </Button>
        <Button
          id="react-runtime-toast-error"
          variant="error"
          onClick={() => {
            toast.error("Deploy failed", {
              description: "Error variant and icon template.",
              duration: 0,
            });
          }}
        >
          Error toast
        </Button>
        <Button
          id="react-runtime-toast-warning"
          variant="warning"
          onClick={() => {
            toast.warning("Quota nearly full", {
              description: "Warning variant and icon template.",
              duration: 0,
            });
          }}
        >
          Warning toast
        </Button>
        <Button
          id="react-runtime-toast-info"
          variant="info"
          onClick={() => {
            toast.info("Runtime note", {
              description: "Info variant and icon template.",
              duration: 0,
            });
          }}
        >
          Info toast
        </Button>
        <Button
          id="react-runtime-toast-loading"
          variant="outline"
          onClick={() => {
            toast.loading("Uploading bundle", {
              description: "Direct loading toast.",
              duration: 0,
            });
          }}
        >
          Loading toast
        </Button>
        <Button
          id="react-runtime-toast-action"
          variant="outline"
          onClick={() => {
            toast.info("Undo available", {
              action: {
                label: "Undo",
                onClick: () => setToastActionCount((count) => count + 1),
              },
              description: "Action callback wired through the runtime manager.",
              duration: 0,
            });
          }}
        >
          Action toast
        </Button>
        <Button
          id="react-runtime-toast-update"
          variant="outline"
          onClick={() => {
            const id = toast.loading("Working on it", {
              description: "This loading toast updates in place.",
            });
            window.setTimeout(() => {
              toast.update(id, {
                description: "The existing toast changed variant and content.",
                duration: 0,
                title: "Updated toast",
                variant: "success",
              });
            }, 1200);
          }}
        >
          Update toast
        </Button>
        <Button
          id="react-runtime-toast-update-sequence"
          variant="outline"
          onClick={() => {
            const id = toast("Processing...", {
              description: "Step 1 of 3",
              duration: 0,
            });

            window.setTimeout(() => {
              toast.update(id, {
                description: "Step 2 of 3",
                title: "Still working...",
              });
            }, 1500);

            window.setTimeout(() => {
              toast.update(id, {
                description: "All steps finished",
                duration: 0,
                title: "Complete!",
                variant: "success",
              });
            }, 3000);
          }}
        >
          Create & update sequence
        </Button>
        <Button
          id="react-runtime-toast-promise"
          variant="primary"
          onClick={() => {
            void toast.promise(
              new Promise<string>((resolve) => {
                window.setTimeout(() => resolve("React"), 1200);
              }),
              {
                error: {
                  description: "Promise rejection path rendered.",
                  duration: 0,
                  title: "Promise failed",
                },
                loading: {
                  description: "Promise lifecycle starts as loading.",
                  duration: 0,
                  title: "Promise loading",
                },
                success: (value) => ({
                  description: "Promise lifecycle updated the toast.",
                  duration: 0,
                  title: `Loaded ${value}`,
                }),
              },
            );
          }}
        >
          Promise toast
        </Button>
        <Button
          id="react-runtime-toast-promise-reject"
          variant="outline"
          onClick={() => {
            void toast.promise(
              new Promise<string>((_resolve, reject) => {
                window.setTimeout(() => reject(new Error("Rejected")), 900);
              }),
              {
                error: {
                  description: "Promise rejection path rendered.",
                  duration: 0,
                  title: "Promise failed",
                },
                loading: {
                  description: "Waiting for rejected promise.",
                  duration: 0,
                  title: "Promise loading",
                },
                success: {
                  description: "This branch should not render.",
                  duration: 0,
                  title: "Promise resolved",
                },
              },
            );
          }}
        >
          Promise reject
        </Button>
        <Button
          id="react-runtime-toast-many"
          variant="outline"
          onClick={() => {
            Array.from({ length: 6 }, (_, index) => index + 1).forEach((index) => {
              toast(`Runtime toast ${index}`, {
                description: "Multiple toast limit coverage.",
                duration: 0,
              });
            });
          }}
        >
          Many toasts
        </Button>
        <Button
          id="react-runtime-toast-dismiss"
          variant="ghost"
          onClick={() => {
            toast.dismiss();
          }}
        >
          Dismiss toasts
        </Button>
      </div>
      <p className="text-muted-foreground text-sm" data-runtime-toast-action-count>
        Toast actions: {toastActionCount}
      </p>
      <Toaster id="react-runtime-toast-viewport" duration={0} limit={5} />
    </section>
  );
}
