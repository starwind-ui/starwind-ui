import { Spinner } from "../kit";

export function SpinnerDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Spinner</h2>
      <div className="flex flex-wrap items-start gap-6">
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Default</p>
          <Spinner />
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Large</p>
          <Spinner className="size-8" />
        </div>
        <div>
          <p className="text-muted-foreground mb-2 text-sm">Custom Color</p>
          <Spinner className="text-primary size-6" />
        </div>
      </div>
    </section>
  );
}
