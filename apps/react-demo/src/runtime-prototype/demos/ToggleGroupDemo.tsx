import { useState } from "react";

import { useRuntimePrototypeContext } from "../context";
import { ToggleGroup, ToggleGroupItem } from "../kit";

export function ToggleGroupDemo() {
  const [liveMultiple, setLiveMultiple] = useState(true);
  const [liveRerenderCount, setLiveRerenderCount] = useState(0);
  const {
    controlledToggleGroupValue,
    setControlledToggleGroupValue,
    controlledToggleGroupChanges,
    setControlledToggleGroupChanges,
    toggleGroupRefSlot,
    setToggleGroupRef,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 id="react-runtime-toggle-group-heading" className="font-heading text-xl font-semibold">
        Toggle Group
      </h2>
      <div className="grid gap-6 sm:grid-cols-2">
        <ToggleGroup
          data-runtime-toggle-group-default
          defaultValue={["bold"]}
          aria-labelledby="react-runtime-toggle-group-heading"
          className="runtime-toggle-group-custom"
        >
          <ToggleGroupItem value="bold">Bold</ToggleGroupItem>
          <ToggleGroupItem value="italic">Italic</ToggleGroupItem>
          <ToggleGroupItem value="underline">Underline</ToggleGroupItem>
        </ToggleGroup>

        <ToggleGroup
          data-runtime-toggle-group-multiple
          multiple
          orientation="vertical"
          variant="outline"
          defaultValue={["left"]}
          aria-labelledby="react-runtime-toggle-group-heading"
        >
          <ToggleGroupItem value="left">Left</ToggleGroupItem>
          <ToggleGroupItem value="center">Center</ToggleGroupItem>
          <ToggleGroupItem value="right">Right</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <ToggleGroup
        data-runtime-toggle-group-controlled
        ref={setToggleGroupRef}
        value={controlledToggleGroupValue}
        onValueChange={(value) => {
          setControlledToggleGroupValue(value);
          setControlledToggleGroupChanges((count) => count + 1);
        }}
        aria-labelledby="react-runtime-toggle-group-heading"
      >
        <ToggleGroupItem value="bold">Controlled bold</ToggleGroupItem>
        <ToggleGroupItem value="italic">Controlled italic</ToggleGroupItem>
      </ToggleGroup>
      <p data-runtime-toggle-group-value>
        Toggle group value: {controlledToggleGroupValue.join(", ")}
      </p>
      <p data-runtime-toggle-group-count>Toggle group changes: {controlledToggleGroupChanges}</p>
      <p className="sr-only" data-runtime-toggle-group-ref>
        {toggleGroupRefSlot}
      </p>
      <ToggleGroup
        data-runtime-toggle-group-cancelled
        defaultValue={["keep"]}
        onValueChange={(_, details) => details.cancel()}
        aria-label="Cancelled toggle group"
      >
        <ToggleGroupItem value="keep">Keep</ToggleGroupItem>
        <ToggleGroupItem value="reject">Reject</ToggleGroupItem>
      </ToggleGroup>
      <div className="space-y-2">
        <ToggleGroup
          data-runtime-toggle-group-live-multiple
          data-rerender-count={liveRerenderCount}
          defaultValue={["left", "center"]}
          multiple={liveMultiple}
          aria-label="Live multiple toggle group"
        >
          <ToggleGroupItem value="left">Live left</ToggleGroupItem>
          <ToggleGroupItem value="center">Live center</ToggleGroupItem>
        </ToggleGroup>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-runtime-toggle-group-live-single
            onClick={() => setLiveMultiple(false)}
          >
            Single mode
          </button>
          <button
            type="button"
            data-runtime-toggle-group-live-multiple-enable
            onClick={() => setLiveMultiple(true)}
          >
            Multiple mode
          </button>
          <button
            type="button"
            data-runtime-toggle-group-live-rerender
            onClick={() => setLiveRerenderCount((count) => count + 1)}
          >
            Rerender live group
          </button>
        </div>
      </div>
    </section>
  );
}
