import { useRuntimePrototypeContext } from "../context";
import { IconBold, IconHeart, IconItalic, IconStar, IconUnderline, Toggle } from "../kit";

export function ToggleDemo() {
  const {
    controlledTogglePressed,
    setControlledTogglePressed,
    controlledToggleChanges,
    setControlledToggleChanges,
    toggleRefSlot,
    setToggleRef,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4" id="react-runtime-toggle-demo">
      <h2 className="font-heading text-xl font-semibold">Toggle</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <Toggle id="react-runtime-toggle-default" className="runtime-toggle-custom">
            Default toggle
          </Toggle>
          <Toggle id="react-runtime-toggle-pressed" defaultPressed>
            Default pressed
          </Toggle>
          <Toggle id="react-runtime-toggle-disabled" disabled variant="outline">
            Disabled toggle
          </Toggle>
          <Toggle id="react-runtime-toggle-outline" variant="outline">
            Outline toggle
          </Toggle>
          <Toggle
            id="react-runtime-toggle-controlled"
            defaultPressed
            ref={setToggleRef}
            pressed={controlledTogglePressed}
            value="controlled-toggle"
            onPressedChange={(pressed) => {
              setControlledTogglePressed(pressed);
              setControlledToggleChanges((count) => count + 1);
            }}
          >
            Controlled toggle
          </Toggle>
          <Toggle id="react-runtime-toggle-large" size="lg">
            Large toggle
          </Toggle>
          <Toggle id="react-runtime-toggle-non-native" nativeButton={false} variant="outline">
            Non-native toggle
          </Toggle>
          <Toggle id="react-runtime-toggle-sync-primary" syncGroup="react-runtime-toggle-sync-demo">
            Sync primary
          </Toggle>
          <Toggle
            id="react-runtime-toggle-sync-secondary"
            syncGroup="react-runtime-toggle-sync-demo"
          >
            Sync secondary
          </Toggle>
        </div>

        <div className="flex flex-wrap gap-3">
          <Toggle
            id="react-runtime-toggle-bold"
            aria-label="Toggle bold"
            size="sm"
            variant="outline"
          >
            <IconBold />
          </Toggle>
          <Toggle
            id="react-runtime-toggle-italic"
            aria-label="Toggle italic"
            size="sm"
            variant="outline"
          >
            <IconItalic />
          </Toggle>
          <Toggle
            id="react-runtime-toggle-underline"
            aria-label="Toggle underline"
            size="sm"
            variant="outline"
          >
            <IconUnderline />
          </Toggle>
          <Toggle id="react-runtime-toggle-favorite" aria-label="Toggle favorite" size="sm">
            <IconHeart />
          </Toggle>
          <Toggle id="react-runtime-toggle-star" aria-label="Toggle star" size="sm">
            <IconStar />
          </Toggle>
        </div>
      </div>
      <p data-runtime-toggle-controlled>Toggle value: {controlledTogglePressed ? "on" : "off"}</p>
      <p data-runtime-toggle-count>Toggle changes: {controlledToggleChanges}</p>
      <p className="sr-only" data-runtime-toggle-ref>
        {toggleRefSlot}
      </p>
    </section>
  );
}
