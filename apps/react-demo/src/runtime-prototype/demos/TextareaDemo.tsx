import { useRuntimePrototypeContext } from "../context";
import { Label, Textarea } from "../kit";

export function TextareaDemo() {
  const { textareaRef } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Textarea</h2>
      <form data-runtime-textarea-form className="grid gap-4 sm:grid-cols-3">
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-textarea-default" size="sm">
            Default textarea
          </Label>
          <Textarea
            id="react-runtime-textarea-default"
            ref={textareaRef}
            name="message"
            className="runtime-textarea-custom"
            defaultValue="Seed note"
            placeholder="Write a note"
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-textarea-invalid" size="sm">
            Invalid textarea
          </Label>
          <Textarea
            id="react-runtime-textarea-invalid"
            size="lg"
            aria-invalid="true"
            placeholder="Needs attention"
            rows={3}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="react-runtime-textarea-disabled" size="sm">
            Disabled textarea
          </Label>
          <Textarea id="react-runtime-textarea-disabled" disabled placeholder="Locked" rows={3} />
        </div>
      </form>
    </section>
  );
}
