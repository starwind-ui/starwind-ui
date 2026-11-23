import React from "react";
import { flushSync } from "react-dom";
import { hydrateRoot } from "react-dom/client";
import AspectRatio from "../../../../apps/react-demo/src/components/starwind-runtime/aspect-ratio/AspectRatio.tsx";

const host = document.getElementById("hydrate");
const original = host.firstElementChild;
const errors = [];
const refs = [];
let clicks = 0;
let props = { as: "button", ratio: 16 / 9 };
let current;
const ref = (element) => {
  current = element;
  refs.push(element?.tagName ?? null);
};
function element() {
  return React.createElement(
    AspectRatio,
    {
      ...props,
      ref,
      id: "interactive",
      "data-owner": "caller",
      "data-slot": "forged",
      "aria-label": "Media",
      style: { width: "320px", color: "rgb(1, 2, 3)" },
      onClick: () => clicks++,
    },
    props.as === "img" ? undefined : "Content",
  );
}

const root = hydrateRoot(host, element(), {
  onRecoverableError: (error) => errors.push(error.message),
});
window.aspectRatioFixture = {
  get state() {
    return {
      hydrated: current === original,
      currentTag: current?.tagName,
      refOwnsRoot: current === host.firstElementChild,
      refs,
      clicks,
      errors,
    };
  },
  update(next) {
    props = { ...props, ...next };
    flushSync(() => root.render(element()));
  },
  unmount() {
    flushSync(() => root.unmount());
  },
};
