import { Label } from "../kit";

export function LabelDemo() {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Label</h2>
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-label-sm" size="sm">
            Small label
          </Label>
          <input id="react-runtime-label-sm" className="h-9 rounded-md border px-3" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-label-md">Default label</Label>
          <input id="react-runtime-label-md" className="h-10 rounded-md border px-3" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-label-lg" size="lg">
            Large label
          </Label>
          <input id="react-runtime-label-lg" className="h-11 rounded-md border px-3" disabled />
        </div>
        <div className="grid gap-2">
          <input
            id="react-runtime-label-peer"
            className="peer h-9 rounded-md border px-3"
            disabled
          />
          <Label htmlFor="react-runtime-label-peer" size="sm">
            Peer disabled label
          </Label>
        </div>
      </div>
    </section>
  );
}
