import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render } from "svelte/server";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";
import AstroAspectRatio from "../../../../apps/demo/src/components/starwind-runtime/aspect-ratio/AspectRatio.astro";
import ReactAspectRatio from "../../../../apps/react-demo/src/components/starwind-runtime/aspect-ratio/AspectRatio.tsx";
import VueAspectRatio from "../../../../apps/vue-demo/src/components/starwind-runtime/aspect-ratio/AspectRatio.vue";
import { renderTree } from "../conformance/emission/render.ts";
import { cases, propsFor } from "./cases.mjs";
import AstroFixture from "./Fixture.astro";
import SvelteFixture from "./Fixture.svelte";

function reactChild(child) {
  if (child === "portrait-media")
    return React.createElement("img", {
      alt: "Portrait",
      className: "h-full w-full object-cover",
      width: 900,
      height: 1600,
      src: "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27900%27 height=%271600%27/%3E",
    });
  if (child === "media")
    return React.createElement("img", {
      alt: "Fixture",
      className: "h-full w-full object-cover",
      src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='3'/%3E",
    });
  if (child === "overlay")
    return React.createElement("span", { className: "absolute inset-0" }, "Overlay");
  if (child === "tall" || child === "overflow")
    return React.createElement(
      "div",
      {
        style: {
          height: 300,
          ...(child === "overflow" ? { position: "absolute", top: 0, width: "100%" } : {}),
        },
      },
      "Content",
    );
  return undefined;
}

function vueChild(child) {
  if (child === "media" || child === "portrait-media")
    return h("img", {
      alt: "Fixture",
      class: "h-full w-full object-cover",
      ...(child === "portrait-media" ? { width: 900, height: 1600 } : {}),
      src:
        child === "portrait-media"
          ? "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27900%27 height=%271600%27/%3E"
          : "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%274%27 height=%273%27/%3E",
    });
  if (child === "overlay") return h("span", { class: "absolute inset-0" }, "Overlay");
  if (child === "tall" || child === "overflow")
    return h(
      "div",
      {
        style: {
          height: "300px",
          ...(child === "overflow" ? { position: "absolute", top: 0, width: "100%" } : {}),
        },
      },
      "Content",
    );
}

export async function renderFixtures(target) {
  if (target === "react")
    return renderToStaticMarkup(
      React.createElement(
        React.Fragment,
        null,
        cases.map((entry) => {
          const component = React.createElement(
            ReactAspectRatio,
            { ...propsFor(entry, target), key: entry.id },
            reactChild(entry.child),
          );
          return entry.hostClass
            ? React.createElement(
                "div",
                { key: entry.id, className: entry.hostClass, style: { width: "320px" } },
                component,
              )
            : component;
        }),
      ),
    );
  if (target === "vue")
    return renderToString(
      createSSRApp({
        render: () =>
          cases.map((entry) => {
            const component = h(
              VueAspectRatio,
              propsFor(entry, target),
              entry.child ? { default: () => vueChild(entry.child) } : undefined,
            );
            return entry.hostClass
              ? h("div", { class: entry.hostClass, style: { width: "320px" } }, [component])
              : component;
          }),
      }),
    );
  if (target === "svelte") return render(SvelteFixture).body;
  return renderTree("astro", { component: AstroFixture, props: {}, children: [] });
}

export function renderReactHydration() {
  return renderToStaticMarkup(
    React.createElement(
      ReactAspectRatio,
      {
        as: "button",
        ratio: 16 / 9,
        id: "interactive",
        "data-owner": "caller",
        "data-slot": "forged",
        "aria-label": "Media",
        style: { width: "320px", color: "rgb(1, 2, 3)" },
      },
      "Content",
    ),
  );
}

export function renderAstroVoid() {
  return renderTree("astro", {
    component: AstroAspectRatio,
    props: {
      as: "img",
      ratio: 16 / 9,
      alt: "Fixture",
      "data-owner": "caller",
      "aria-label": "Void media",
      src: "data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%274%27 height=%273%27/%3E",
      style: "width: 320px; aspect-ratio: 4 / 3; color: rgb(1, 2, 3)",
    },
    children: [],
  });
}
