import * as React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";

import { createPassivePart } from "../build/passive-part";

const Factory = createPassivePart("h2", { "aria-hidden": "true", "data-sw-title": true });
const Written = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  function Written(props, forwardedRef) {
    return <h2 aria-hidden="true" data-sw-title ref={forwardedRef} {...props} />;
  },
);

function render(element: React.ReactElement): { container: HTMLElement; unmount: () => void } {
  const container = document.createElement("div");
  const root = createRoot(container);
  flushSync(() => root.render(element));
  return { container, unmount: () => flushSync(() => root.unmount()) };
}

describe("createPassivePart", () => {
  it.each([
    ["no props", {}],
    ["children and class", { children: "Title", className: "title" }],
    ["consumer overrides", { "aria-hidden": "false", "data-sw-title": undefined, id: "id" }],
  ])("renders the same markup as the written part with %s", (_name, props) => {
    const factory = render(<Factory {...props} />);
    const written = render(<Written {...(props as React.HTMLAttributes<HTMLHeadingElement>)} />);

    expect(factory.container.innerHTML).toBe(written.container.innerHTML);
    factory.unmount();
    written.unmount();
  });

  it("forwards object refs and ref callbacks to the element", () => {
    const objectRef = React.createRef<HTMLElement>();
    const callbackValues: (HTMLElement | null)[] = [];
    const object = render(<Factory ref={objectRef as React.RefObject<HTMLDivElement>} />);
    const callback = render(<Factory ref={(node) => void callbackValues.push(node)} />);

    expect(objectRef.current?.tagName).toBe("H2");
    expect(callbackValues[0]?.tagName).toBe("H2");
    object.unmount();
    callback.unmount();
    expect(objectRef.current).toBe(null);
    expect(callbackValues.at(-1)).toBe(null);
  });

  it("forwards event handlers", () => {
    let clicks = 0;
    const view = render(<Factory onClick={() => (clicks += 1)} />);

    view.container.querySelector("h2")?.click();
    expect(clicks).toBe(1);
    view.unmount();
  });
});
