import { Separator } from "../kit";

export function SeparatorDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Separator</h2>
      <div className="max-w-md space-y-4">
        <div>
          <h3 className="font-heading text-base font-semibold">React runtime separator</h3>
          <p className="text-muted-foreground text-sm">
            Horizontal and vertical orientations use the same primitive.
          </p>
        </div>
        <Separator id="react-runtime-separator-horizontal" className="runtime-separator-custom" />
        <div className="text-muted-foreground flex h-5 items-center gap-4 text-sm">
          <span>Docs</span>
          <Separator id="react-runtime-separator-vertical" orientation="vertical" />
          <span>Components</span>
          <Separator orientation="vertical" />
          <span>Runtime</span>
        </div>
      </div>
    </section>
  );
}
