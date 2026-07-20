import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { compileScript, parse } from "@vue/compiler-sfc";
import { createSSRApp, defineComponent, h } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it } from "vitest";

import { generateStarwindVueWrappers } from "../../generate-vue-wrappers.js";
import { formatGeneratedOutput } from "../../format-generated-output.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { vuePrimitiveComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import { generateFrameworkStyledWrappers } from "../../renderers/framework-wrapper-generator.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const EXPECTED_INVENTORY = {
  avatar: ["Avatar.vue", "AvatarFallback.vue", "AvatarImage.vue", "index.ts", "variants.ts"],
  button: ["Button.vue", "index.ts", "variants.ts"],
  checkbox: ["Checkbox.vue", "index.ts", "styles.css", "variants.ts"],
  progress: ["Progress.vue", "index.ts", "variants.ts"],
  "scroll-area": [
    "ScrollArea.vue",
    "ScrollAreaContent.vue",
    "ScrollAreaCorner.vue",
    "ScrollAreaThumb.vue",
    "ScrollAreaViewport.vue",
    "ScrollBar.vue",
    "index.ts",
    "styles.css",
    "variants.ts",
  ],
  select: [
    "Select.vue",
    "SelectContent.vue",
    "SelectGroup.vue",
    "SelectItem.vue",
    "SelectItemIndicator.vue",
    "SelectItemText.vue",
    "SelectLabel.vue",
    "SelectScrollDownButton.vue",
    "SelectScrollUpButton.vue",
    "SelectSeparator.vue",
    "SelectTrigger.vue",
    "SelectValue.vue",
    "index.ts",
    "variants.ts",
  ],
  "theme-toggle": ["ThemeToggle.vue", "index.ts", "variants.ts"],
} as const;

const vuePrimitiveSubpathPattern = vuePrimitiveComponents.join("|");

const BROWSER_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./styled/select/index.ts";

const childElement = ref(null);
const controlledOpen = ref(false);
const controlledValue = ref(null);
const triggerComponent = ref(null);
let childClicks = 0;
let cancelNextOpen = true;
let cancelNextValue = true;
const modelEvents = [];
let wrapperClicks = 0;

const Fixture = defineComponent({
  setup() {
    return () =>
      h(
        Select,
        {
          modal: false,
          modelValue: controlledValue.value,
          open: controlledOpen.value,
          onOpenChange: (open, detail) => {
            modelEvents.push("open:detail:" + open + ":" + (cancelNextOpen ? "cancel" : "allow"));
            if (cancelNextOpen) {
              cancelNextOpen = false;
              detail.cancel();
            }
          },
          "onUpdate:open": (open) => modelEvents.push("open:update:" + open),
          onValueChange: (value, detail) => {
            modelEvents.push("value:detail:" + value + ":" + (cancelNextValue ? "cancel" : "allow"));
            if (cancelNextValue) {
              cancelNextValue = false;
              detail.cancel();
            }
          },
          "onUpdate:modelValue": (value) => modelEvents.push("value:update:" + value),
        },
        {
          default: () => [
            h(
              SelectTrigger,
              {
                asChild: true,
                onClick: () => {
                  wrapperClicks += 1;
                },
                ref: triggerComponent,
              },
              {
                default: () =>
                  h(
                    "button",
                    {
                      onClick: () => {
                        childClicks += 1;
                      },
                      ref: childElement,
                    },
                    "Choose fruit",
                  ),
              },
            ),
            h(
              SelectContent,
              { alignItemWithTrigger: false },
              {
                default: () => h(SelectItem, { value: "apple" }, { default: () => "Apple" }),
              },
            ),
          ],
        },
      );
  },
});

function waitForPaint() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

try {
  const warnings = [];
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();
  await waitForPaint();

  const trigger = document.querySelector("[data-sw-select-trigger]");
  const root = document.querySelector("[data-sw-select]");
  const popup = document.querySelector("[data-sw-select-popup]");
  const exposed = triggerComponent.value;
  if (!(trigger instanceof HTMLButtonElement)) throw new Error("Select trigger did not mount.");
  if (!(root instanceof HTMLElement)) throw new Error("Select root did not mount.");
  if (!(popup instanceof HTMLElement)) throw new Error("Select popup did not mount.");
  if (!exposed) throw new Error("SelectTrigger did not expose its public ref.");

  const refsSame = childElement.value === trigger && exposed.element === trigger;
  const controllerDiscovered =
    trigger.type === "button" &&
    trigger.id.length > 0 &&
    popup.id.length > 0 &&
    trigger.getAttribute("aria-controls") === popup.id;

  trigger.click();
  await nextTick();
  await waitForPaint();
  const canceledOpenProposal =
    root.dataset.state === "closed" &&
    modelEvents.join("|") === "open:detail:true:cancel";

  trigger.click();
  await nextTick();
  await waitForPaint();
  const controlledOpenOwnership =
    root.dataset.state === "closed" &&
    modelEvents.join("|") ===
      "open:detail:true:cancel|open:detail:true:allow|open:update:true";

  controlledOpen.value = true;
  await nextTick();
  await waitForPaint();
  const externalOpenSynchronized =
    root.dataset.state === "open" &&
    trigger.getAttribute("aria-expanded") === "true" &&
    popup.hidden === false &&
    modelEvents.length === 3;

  const item = document.querySelector("[data-sw-select-item]");
  if (!(item instanceof HTMLElement)) throw new Error("Select item did not mount.");
  item.click();
  await nextTick();
  const canceledValueProposal =
    root.dataset.value === undefined &&
    root.dataset.state === "open" &&
    modelEvents.join("|") ===
      "open:detail:true:cancel|open:detail:true:allow|open:update:true|value:detail:apple:cancel";

  item.click();
  await nextTick();
  const controlledValueOwnership =
    root.dataset.value === undefined &&
    root.dataset.state === "open" &&
    modelEvents.join("|") ===
      "open:detail:true:cancel|open:detail:true:allow|open:update:true|value:detail:apple:cancel|value:detail:apple:allow|value:update:apple|open:detail:false:allow|open:update:false";

  controlledValue.value = "apple";
  controlledOpen.value = false;
  await nextTick();
  await waitForPaint();
  const externalModelsSynchronized =
    root.dataset.value === "apple" &&
    root.dataset.state === "closed" &&
    trigger.getAttribute("aria-expanded") === "false" &&
    modelEvents.length === 8;

  app.unmount();
  await nextTick();
  const refsCleared =
    childElement.value === null && triggerComponent.value === null && exposed.element === null;

  document.documentElement.dataset.starwindStyledResult = JSON.stringify({
    childClicks,
    canceledOpenProposal,
    canceledValueProposal,
    controllerDiscovered,
    controlledOpenOwnership,
    controlledValueOwnership,
    externalModelsSynchronized,
    externalOpenSynchronized,
    modelEvents,
    ok: true,
    refsCleared,
    refsSame,
    wrapperClicks,
    warnings,
  });
} catch (error) {
  document.documentElement.dataset.starwindStyledResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
    ok: false,
  });
}
`;

const AVATAR_HYDRATION_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { Avatar, AvatarFallback, AvatarImage } from "./styled/avatar/index.ts";

const avatarComponent = ref(null);
const fallbackComponent = ref(null);
const imageComponent = ref(null);
const statuses = [];

const Fixture = defineComponent({
  setup() {
    return () =>
      h(
        Avatar,
        { ref: avatarComponent },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Broken profile",
              onLoadingStatusChange: (status) => statuses.push(status),
              ref: imageComponent,
              src: "data:image/png;base64,invalid",
            }),
            h(AvatarFallback, { ref: fallbackComponent }, { default: () => "BP" }),
          ],
        },
      );
  },
});

try {
  const warnings = [];
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();

  const root = document.querySelector("[data-sw-avatar]");
  const image = document.querySelector("[data-sw-avatar-image]");
  const fallback = document.querySelector("[data-sw-avatar-fallback]");
  if (!(root instanceof HTMLSpanElement)) throw new Error("Styled Avatar did not hydrate.");
  if (!(image instanceof HTMLImageElement)) throw new Error("Styled AvatarImage did not hydrate.");
  if (!(fallback instanceof HTMLSpanElement)) throw new Error("Styled AvatarFallback did not hydrate.");

  await new Promise((resolve, reject) => {
    const deadline = performance.now() + 5_000;
    const check = () => {
      if (root.dataset.imageLoadingStatus === "error") return resolve(undefined);
      if (performance.now() > deadline) return reject(new Error("Avatar did not reach error state."));
      requestAnimationFrame(check);
    };
    check();
  });
  await nextTick();

  const refsSame =
    avatarComponent.value?.element === root &&
    imageComponent.value?.element === image &&
    fallbackComponent.value?.element === fallback;
  const visibilityStable = image.hidden && !fallback.hidden && fallback.textContent === "BP";

  app.unmount();
  await nextTick();
  document.documentElement.dataset.starwindAvatarHydrationResult = JSON.stringify({
    refsCleared:
      avatarComponent.value === null &&
      imageComponent.value === null &&
      fallbackComponent.value === null,
    refsSame,
    rootCountAfterUnmount: document.querySelectorAll("#app [data-sw-avatar]").length,
    statuses,
    visibilityStable,
    warnings,
  });
} catch (error) {
  document.documentElement.dataset.starwindAvatarHydrationResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

const PROGRESS_HYDRATION_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { Progress } from "./styled/progress/index.ts";

const progressComponent = ref(null);
const value = ref(25);
let observeCount = 0;
let disconnectCount = 0;
const NativeMutationObserver = window.MutationObserver;
window.MutationObserver = class extends NativeMutationObserver {
  observe(...args) {
    observeCount += 1;
    return super.observe(...args);
  }
  disconnect() {
    disconnectCount += 1;
    return super.disconnect();
  }
};

const Fixture = defineComponent({
  setup() {
    return () =>
      h(Progress, {
        "data-review": "hydrated-progress",
        label: "Hydrated progress",
        ref: progressComponent,
        value: value.value,
        variant: "success",
      });
  },
});

try {
  const warnings = [];
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();

  const root = document.querySelector("[data-sw-progress]");
  const indicator = document.querySelector("[data-sw-progress-indicator]");
  if (!(root instanceof HTMLDivElement)) throw new Error("Styled Progress did not hydrate.");
  if (!(indicator instanceof HTMLDivElement)) throw new Error("Styled Progress indicator did not hydrate.");
  const refsSame = progressComponent.value?.element === root;
  const initialState = {
    ariaValueNow: root.getAttribute("aria-valuenow"),
    style: indicator.getAttribute("style"),
  };

  value.value = 75;
  await nextTick();
  await Promise.resolve();
  const updatedState = {
    ariaValueNow: root.getAttribute("aria-valuenow"),
    style: indicator.getAttribute("style"),
  };

  app.unmount();
  await nextTick();
  document.documentElement.dataset.starwindProgressHydrationResult = JSON.stringify({
    disconnectCount,
    initialState,
    observeCount,
    refsCleared: progressComponent.value === null,
    refsSame,
    rootCountAfterUnmount: document.querySelectorAll("#app [data-sw-progress]").length,
    updatedState,
    warnings,
  });
} catch (error) {
  document.documentElement.dataset.starwindProgressHydrationResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

const CHECKBOX_HYDRATION_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { Button } from "./styled/button/index.ts";
import { Checkbox } from "./styled/checkbox/index.ts";

const buttonComponent = ref(null);
const controlledFalse = ref(false);
const controlledTrue = ref(true);
const events = [];
let buttonClicks = 0;
let cleanupCount = 0;
let uncontrolledClicks = 0;
const originalAbort = AbortController.prototype.abort;
AbortController.prototype.abort = function (...args) {
  cleanupCount += 1;
  return originalAbort.apply(this, args);
};

const Fixture = defineComponent({
  setup() {
    return () =>
      h("div", null, [
        h(
          Button,
          {
            "aria-label": "Save changes",
            class: "consumer-button",
            "data-testid": "styled-button",
            onClick: () => {
              buttonClicks += 1;
            },
            ref: buttonComponent,
            style: { color: "rgb(1, 2, 3)" },
          },
          { default: () => "Save" },
        ),
        h(Checkbox, {
          "aria-label": "Uncontrolled checkbox",
          class: "consumer-checkbox",
          "data-testid": "styled-checkbox",
          id: "uncontrolled",
          defaultChecked: false,
          label: "Uncontrolled",
          onClick: () => {
            uncontrolledClicks += 1;
          },
          style: { color: "rgb(4, 5, 6)" },
        }),
        h(Checkbox, {
          id: "controlled-false",
          checked: controlledFalse.value,
          label: "Controlled false",
          onCheckedChange: (checked, detail) => events.push(
            "false:detail:" + checked + ":" + detail.isCanceled,
          ),
          "onUpdate:checked": (checked) => events.push("false:update:" + checked),
        }),
        h(Checkbox, {
          id: "controlled-true",
          checked: controlledTrue.value,
          label: "Controlled true",
          onCheckedChange: (checked, detail) => {
            events.push("true:detail:" + checked + ":" + detail.isCanceled);
            detail.cancel();
          },
          "onUpdate:checked": (checked) => events.push("true:update:" + checked),
        }),
      ]);
  },
});

function waitForPaint() {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve)),
  );
}

try {
  const warnings = [];
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();
  await waitForPaint();

  const roots = [...document.querySelectorAll("[data-sw-checkbox]")];
  if (roots.length !== 3) throw new Error("Expected 3 checkbox roots, received " + roots.length + ".");
  if (document.querySelectorAll("[data-sw-checkbox-input]").length !== 3) {
    throw new Error("Hydration duplicated or omitted Checkbox inputs.");
  }

  const button = document.querySelector('[data-testid="styled-button"]');
  if (!(button instanceof HTMLButtonElement)) throw new Error("Styled Button did not hydrate.");
  const exposedButton = buttonComponent.value;
  const buttonRefSame =
    exposedButton?.element === button || exposedButton?.element?.value === button;
  button.click();
  await nextTick();

  const uncontrolledWrapper = roots[0].closest('[data-slot="checkbox-wrapper"]');
  if (!(uncontrolledWrapper instanceof HTMLDivElement)) {
    throw new Error("Styled Checkbox wrapper did not hydrate.");
  }

  roots[0].click();
  await nextTick();
  const uncontrolledAfterClick = roots[0].getAttribute("aria-checked");

  roots[1].click();
  await nextTick();
  const controlledFalseAfterProposal = roots[1].getAttribute("aria-checked");
  controlledFalse.value = true;
  await nextTick();
  const controlledFalseAfterParent = roots[1].getAttribute("aria-checked");

  roots[2].click();
  await nextTick();
  const controlledTrueAfterCanceledProposal = roots[2].getAttribute("aria-checked");
  const buttonTestIdCount = document.querySelectorAll('[data-testid="styled-button"]').length;
  const uncontrolledTestIdCount = document.querySelectorAll(
    '[data-testid="styled-checkbox"]',
  ).length;

  app.unmount();
  await nextTick();
  AbortController.prototype.abort = originalAbort;

  document.documentElement.dataset.starwindCheckboxHydrationResult = JSON.stringify({
    cleanupCount,
    buttonAriaLabel: button.getAttribute("aria-label"),
    buttonClass: button.classList.contains("consumer-button"),
    buttonClicks,
    buttonRefCleared: buttonComponent.value === null,
    buttonRefSame,
    buttonStyle: button.style.color,
    buttonTestIdCount,
    controlledFalseAfterParent,
    controlledFalseAfterProposal,
    controlledTrueAfterCanceledProposal,
    events,
    inputCountAfterUnmount: document.querySelectorAll("[data-sw-checkbox-input]").length,
    ok: true,
    uncontrolledAfterClick,
    uncontrolledAriaLabel: roots[0].getAttribute("aria-label"),
    uncontrolledClass: roots[0].classList.contains("consumer-checkbox"),
    uncontrolledClicks,
    uncontrolledStyle: roots[0].style.color,
    uncontrolledTestIdCount,
    warnings,
    wrapperAriaLabel: uncontrolledWrapper.getAttribute("aria-label"),
    wrapperClass: uncontrolledWrapper.classList.contains("consumer-checkbox"),
    wrapperClickHandlerLeaked: uncontrolledClicks !== 1,
    wrapperStyle: uncontrolledWrapper.getAttribute("style"),
    wrapperTestId: uncontrolledWrapper.getAttribute("data-testid"),
  });
} catch (error) {
  AbortController.prototype.abort = originalAbort;
  document.documentElement.dataset.starwindCheckboxHydrationResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
    ok: false,
  });
}
`;

const SCROLL_AREA_HYDRATION_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { ScrollArea, ScrollAreaThumb, ScrollBar } from "./styled/scroll-area/index.ts";

const defaultRoot = ref(null);
const customRoot = ref(null);
let mutationRootObserves = 0;
let mutationDisconnected = 0;
let resizeCreated = 0;
let resizeDisconnected = 0;
const NativeMutationObserver = window.MutationObserver;
const NativeResizeObserver = window.ResizeObserver;
window.MutationObserver = class extends NativeMutationObserver {
  constructor(callback) {
    super(callback);
  }
  observe(target, options) {
    if (target instanceof Element && target.matches("[data-sw-scroll-area]")) {
      mutationRootObserves += 1;
    }
    return super.observe(target, options);
  }
  disconnect() {
    mutationDisconnected += 1;
    return super.disconnect();
  }
};
window.ResizeObserver = class extends NativeResizeObserver {
  constructor(callback) {
    super(callback);
    resizeCreated += 1;
  }
  disconnect() {
    resizeDisconnected += 1;
    return super.disconnect();
  }
};

const Fixture = defineComponent({
  setup() {
    return () =>
      h("div", null, [
        h(
          ScrollArea,
          {
            class: "hydrated-scroll-area",
            "data-testid": "hydrated-default",
            ref: defaultRoot,
            viewportClass: "hydrated-viewport",
          },
          { default: () => h("div", { class: "hydrated-scroll-content" }, "Default content") },
        ),
        h(
          ScrollArea,
          {
            class: "hydrated-scroll-area",
            "data-testid": "hydrated-custom",
            ref: customRoot,
          },
          {
            default: () => h("div", { class: "hydrated-scroll-content" }, "Custom content"),
            scrollbar: () =>
              h(
                ScrollBar,
                { "data-testid": "hydrated-horizontal", keepMounted: true, orientation: "horizontal" },
                { default: () => h(ScrollAreaThumb) },
              ),
          },
        ),
      ]);
  },
});

function dimensions(element) {
  const rect = element.getBoundingClientRect();
  return { height: rect.height, width: rect.width };
}

function stable(before, after) {
  return Math.abs(before.height - after.height) <= 0.5 && Math.abs(before.width - after.width) <= 0.5;
}

try {
  const warnings = [];
  const serverRoot = document.querySelector('[data-testid="hydrated-default"]');
  const serverViewport = serverRoot?.querySelector("[data-sw-scroll-area-viewport]");
  if (!(serverRoot instanceof HTMLElement) || !(serverViewport instanceof HTMLElement)) {
    throw new Error("Styled Scroll Area server anatomy was missing before hydration.");
  }
  const before = { root: dimensions(serverRoot), viewport: dimensions(serverViewport) };
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const roots = [...document.querySelectorAll("[data-sw-scroll-area]")];
  const viewports = [...document.querySelectorAll("[data-sw-scroll-area-viewport]")];
  const after = { root: dimensions(roots[0]), viewport: dimensions(viewports[0]) };
  const horizontal = document.querySelector('[data-testid="hydrated-horizontal"]');
  if (!(horizontal instanceof HTMLElement)) throw new Error("Custom horizontal scrollbar was missing.");
  viewports[1].scrollLeft = 64;
  viewports[1].dispatchEvent(new Event("scroll"));
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  const proof = {
    anatomy: {
      corners: document.querySelectorAll("[data-sw-scroll-area-corner]").length,
      roots: roots.length,
      scrollbars: document.querySelectorAll("[data-sw-scroll-area-scrollbar]").length,
      thumbs: document.querySelectorAll("[data-sw-scroll-area-thumb]").length,
      viewports: viewports.length,
    },
    geometryStable: stable(before.root, after.root) && stable(before.viewport, after.viewport),
    horizontalOrientation: horizontal.getAttribute("data-orientation"),
    refsSame: defaultRoot.value?.element === roots[0] && customRoot.value?.element === roots[1],
    scrolled: roots[1].hasAttribute("data-overflow-x-start"),
  };

  app.unmount();
  await nextTick();
  window.MutationObserver = NativeMutationObserver;
  window.ResizeObserver = NativeResizeObserver;
  document.documentElement.dataset.starwindScrollAreaHydrationResult = JSON.stringify({
    ...proof,
    mutationDisconnected,
    mutationRootObserves,
    refsCleared: defaultRoot.value === null && customRoot.value === null,
    resizeCreated,
    resizeDisconnected,
    rootCountAfterUnmount: document.querySelectorAll("#app [data-sw-scroll-area]").length,
    warnings,
  });
} catch (error) {
  window.MutationObserver = NativeMutationObserver;
  window.ResizeObserver = NativeResizeObserver;
  document.documentElement.dataset.starwindScrollAreaHydrationResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

const THEME_TOGGLE_HYDRATION_PROOF_SOURCE = String.raw`
import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { initThemeController } from "@starwind-ui/vue/theme";
import ThemeToggle from "./styled/theme-toggle/ThemeToggle.vue";

const exposed = ref(null);
const Fixture = defineComponent({
  render: () => h("div", null, [
    h(ThemeToggle, { id: "theme-one", ref: exposed }),
    h(ThemeToggle, { id: "theme-two" }),
  ]),
});

try {
  localStorage.setItem("colorTheme", "light");
  const warnings = [];
  const app = createSSRApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();

  const toggles = [...document.querySelectorAll("[data-sw-theme-toggle]")];
  if (toggles.length !== 2) throw new Error("Theme Toggle hydration changed root count.");
  if (exposed.value?.element !== toggles[0]) throw new Error("Theme Toggle exposed the wrong element.");
  if (document.querySelectorAll("[data-theme-icon][data-ready]").length !== 4) {
    throw new Error("Theme Toggle icons were not synchronized after hydration.");
  }

  toggles[0].click();
  await nextTick();
  const synchronized =
    document.documentElement.classList.contains("dark") &&
    localStorage.getItem("colorTheme") === "dark" &&
    toggles.every((toggle) =>
      toggle.getAttribute("data-state") === "on" && toggle.getAttribute("aria-pressed") === "true"
    );

  app.unmount();
  await nextTick();
  const nativeToggle = document.createElement("button");
  nativeToggle.setAttribute("data-sw-theme-toggle", "");
  nativeToggle.setAttribute("data-theme-on", "dark");
  nativeToggle.setAttribute("data-theme-off", "light");
  document.body.append(nativeToggle);
  initThemeController().syncControls();
  const controllerSurvivedUnmount = nativeToggle.getAttribute("data-state") === "on";

  document.documentElement.dataset.starwindThemeHydrationResult = JSON.stringify({
    controllerSurvivedUnmount,
    exposedCleared: exposed.value === null,
    rootCountAfterUnmount: document.querySelectorAll("#app [data-sw-theme-toggle]").length,
    synchronized,
    warnings,
  });
} catch (error) {
  document.documentElement.dataset.starwindThemeHydrationResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

describe("generated Vue Styled wrappers", () => {
  const temporaryRoots: string[] = [];
  const servers: Array<{ close(): Promise<void> }> = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) => server.close()));
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("emits the exact deterministic styled checkpoint inventory", async () => {
    const firstRoot = await createProductionContextOutputRoot();
    const secondRoot = await createOutputRoot();

    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: firstRoot });
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: secondRoot });

    const firstOutput = path.join(firstRoot, "styled");
    const secondOutput = path.join(secondRoot, "styled");
    expect((await readdir(firstOutput)).sort()).toEqual(Object.keys(EXPECTED_INVENTORY));

    for (const [component, expectedFiles] of Object.entries(EXPECTED_INVENTORY)) {
      expect((await readdir(path.join(firstOutput, component))).sort()).toEqual(expectedFiles);
    }

    const firstTree = await readTree(firstOutput);
    expect(firstTree).toEqual(await readTree(secondOutput));

    for (const [relativePath, source] of Object.entries(firstTree)) {
      if (relativePath.endsWith(".vue")) {
        expect(() => assertVueSfcCompiles(source, relativePath)).not.toThrow();
        if (source.includes("useAttrs")) {
          expect(source, relativePath).toContain("defineOptions({ inheritAttrs: false });");
        }
      }
    }
    expect(firstTree["button/Button.vue"]).toContain('from "@starwind-ui/vue/button"');
    expect(firstTree["button/Button.vue"]).toContain(
      'import * as ButtonPrimitive from "@starwind-ui/vue/button";',
    );
    expect(firstTree["checkbox/Checkbox.vue"]).toContain('from "@starwind-ui/vue/checkbox"');
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(
      'import * as CheckboxPrimitive from "@starwind-ui/vue/checkbox";',
    );
    expect(firstTree["select/Select.vue"]).toContain('from "@starwind-ui/vue/select"');
    expect(firstTree["select/Select.vue"]).toContain(
      'import * as SelectPrimitive from "@starwind-ui/vue/select";',
    );
    expect(firstTree["scroll-area/ScrollArea.vue"]).toContain(
      'import * as ScrollAreaPrimitive from "@starwind-ui/vue/scroll-area";',
    );

    expect(firstTree["button/Button.vue"]).toContain('dataSlot = "button"');
    expect(firstTree["button/Button.vue"]).toContain(`:data-slot="dataSlot || 'button'"`);
    expect(firstTree["button/Button.vue"]).toContain("defineExpose({ element });");
    expect(firstTree["button/Button.vue"].match(/:ref="setElement"/g)).toHaveLength(2);
    expect(firstTree["checkbox/Checkbox.vue"]).toContain('data-slot="checkbox"');
    expect(firstTree["checkbox/Checkbox.vue"]).toContain("data-sw-checkbox-check-icon");
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(
      'const ariaLabel = computed(() => attrs["aria-label"] ?? label);',
    );
    expect(firstTree["checkbox/Checkbox.vue"]).toContain("checked = undefined,");
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(
      `v-bind="{ ...attrs, 'aria-label': ariaLabel }"`,
    );
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(':checked="checked"');
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(
      `@update:checked="emit(&quot;update:checked&quot;, $event)"`,
    );
    expect(firstTree["checkbox/Checkbox.vue"]).toContain('@checked-change="handleCheckedChange"');
    expect(firstTree["checkbox/Checkbox.vue"]).toContain(':for="id"');
    expect(firstTree["checkbox/Checkbox.vue"]).toContain("{{ label }}");
    expect(firstTree["select/SelectTrigger.vue"]).toContain('data-slot="select-trigger"');
    expect(firstTree["select/SelectTrigger.vue"]).toContain("cloneVNode");
    expect(firstTree["select/SelectTrigger.vue"]).toContain("mergeProps");
    expect(firstTree["select/SelectTrigger.vue"]).toContain("isVNode");
    expect(firstTree["select/SelectTrigger.vue"]).toContain("children.length !== 1");
    expect(firstTree["select/SelectTrigger.vue"]).toContain('typeof child.type !== "string"');
    expect(firstTree["select/SelectTrigger.vue"]).toContain(
      "SelectTrigger asChild requires exactly one native element VNode.",
    );
    expect(firstTree["select/SelectTrigger.vue"]).toMatch(
      /cloneVNode\([\s\S]*mergeProps\([\s\S]*\),\s*true\)/,
    );
    expect(firstTree["select/SelectTrigger.vue"]).toContain(
      "const consumerProps = mergeProps(attrs, { class: triggerClass.value });",
    );
    expect(firstTree["select/SelectTrigger.vue"]).toContain("defineExpose({ element });");
    expect(firstTree["select/SelectTrigger.vue"]).toContain("ref: setElement");
    expect(firstTree["select/SelectTrigger.vue"]).toContain(
      'child.type === "button" && child.props?.type === undefined ? { type: "button" } : {}',
    );
    expect(firstTree["select/SelectValue.vue"]).toContain('v-if="$slots.default"');
    expect(firstTree["select/SelectValue.vue"]).toContain('<template #default="slotProps">');
    expect(firstTree["select/SelectValue.vue"]).toContain('<slot v-bind="slotProps" />');
    expect(firstTree["select/SelectValue.vue"]).toContain("v-else");
    expect(firstTree["select/SelectValue.vue"]).toContain(
      "default?: (props: { label: string | null; value: string | null }) => unknown;",
    );
    const themeToggle = firstTree["theme-toggle/ThemeToggle.vue"];
    expect(themeToggle).toContain('from "@starwind-ui/vue/theme"');
    expect(themeToggle).toContain("onMounted(() => {");
    expect(themeToggle).toContain("initThemeController();");
    expect(themeToggle).toContain('ref="element"');
    expect(themeToggle).toContain("defineExpose({ element });");
    expect(themeToggle).toContain('type="button"');
    expect(themeToggle).toMatch(/v-bind="attrs"\n\s+type="button"/);
    expect(themeToggle).toContain("data-sw-theme-toggle");
    expect(themeToggle).toContain(`:data-slot="dataSlot || 'theme-toggle'"`);
    expect(themeToggle).toContain('<slot name="light-icon">');
    expect(themeToggle).toContain('<slot name="dark-icon">');
    expect(themeToggle.match(/data-theme-icon/g)).toHaveLength(3);
    expect(themeToggle).not.toContain("onUnmounted");

    const checkedInRoot = path.join(process.cwd(), "apps/vue-demo/src/components/starwind-runtime");
    await formatGeneratedOutput([firstOutput], process.cwd());
    await expectVueTypecheck(firstRoot, firstOutput);
    const formattedTree = await readTree(firstOutput);
    const checkedInTree = await readTree(checkedInRoot);
    for (const relativePath of Object.keys(formattedTree)) {
      expect(formattedTree[relativePath], relativePath).toBe(checkedInTree[relativePath]);
    }
  }, 120_000);

  it("keeps automatic fallthrough enabled when a generated component does not forward attrs", () => {
    const group = projectStyledOutputComponentGroup({
      component: "button",
      publicExports: ["NoAttrs"],
      defaultExport: { NoAttrs: "NoAttrs" },
      defaultExportMode: "component",
      components: [
        {
          exportName: "NoAttrs",
          variables: [
            {
              name: "consumerId",
              value: { type: "raw", code: 'rest["id"]' },
              frameworks: ["vue"],
            },
          ],
          render: [
            {
              type: "element",
              tag: "div",
              attrs: [
                { name: "data-slot", value: { type: "literal", value: "no-attrs" } },
                { name: "data-consumer-id", value: { type: "variable", name: "consumerId" } },
              ],
              children: [],
            },
          ],
        },
      ],
    });
    const source = renderVueComponent(group, group.components[0]!, {
      directory: "generated/button",
      outputRoot: "generated",
      primitiveOutputRoot: "primitives",
    });

    expect(source).not.toContain("defineOptions({ inheritAttrs: false });");
    expect(source).toContain("useAttrs");
    expect(source).toContain('const consumerId = computed(() => attrs["id"]);');
  });

  it("fails clearly when a registered target has no Styled capability", async () => {
    const root = await createOutputRoot();

    await expect(
      Reflect.apply(generateFrameworkStyledWrappers, undefined, [
        "solid",
        {
          contracts: [],
          generatedBy: "styled.test.ts",
          outputRoot: path.join(root, "styled"),
          primitiveOutputRoot: path.join(root, "primitives"),
        },
      ]),
    ).rejects.toThrowError("Unsupported primitive Framework Adapter target: solid");
  });

  it("server-renders the generated visual contracts through real Vue primitives", async () => {
    const root = await createOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const server = await createVueSsrLoader();
    servers.push(server);

    const Button = await loadGeneratedComponent(server, outputRoot, "button/Button.vue");
    const buttonHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(
            Button,
            { class: "consumer-button", "data-review": "button", size: "sm", variant: "primary" },
            { default: () => "Save" },
          ),
      }),
    );
    expect(buttonHtml).toContain("consumer-button");
    expect(buttonHtml).toContain("bg-primary");
    expect(buttonHtml).toContain('data-slot="button"');
    expect(buttonHtml).toContain('data-review="button"');
    expect(buttonHtml).toContain("Save");
    const anchorHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(
            Button,
            { as: "a", disabled: true, href: "/docs", tabindex: 2 },
            { default: () => "Documentation" },
          ),
      }),
    );
    expect(anchorHtml).toContain("<a");
    expect(anchorHtml).toContain('aria-disabled="true"');
    expect(anchorHtml).toContain('tabindex="-1"');
    expect(anchorHtml).not.toContain('href="/docs"');
    expect(anchorHtml).toContain('data-slot="button"');

    const Checkbox = await loadGeneratedComponent(server, outputRoot, "checkbox/Checkbox.vue");
    const checkboxHtml = await renderToString(
      createSSRApp({
        render: () => h(Checkbox, { id: "terms", label: "Accept terms", variant: "success" }),
      }),
    );
    expect(checkboxHtml).toContain('data-slot="checkbox-wrapper"');
    expect(checkboxHtml).toContain('data-slot="checkbox"');
    expect(checkboxHtml).toContain('data-slot="checkbox-indicator"');
    expect(checkboxHtml).toContain("data-sw-checkbox-check-icon");
    expect(checkboxHtml).toContain('for="terms"');
    expect(checkboxHtml).toContain("Accept terms");
    expect(checkboxHtml).toContain("data-checked:bg-success");

    const Select = await loadGeneratedComponent(server, outputRoot, "select/Select.vue");
    const SelectTrigger = await loadGeneratedComponent(
      server,
      outputRoot,
      "select/SelectTrigger.vue",
    );
    const SelectValue = await loadGeneratedComponent(server, outputRoot, "select/SelectValue.vue");
    const selectHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(Select, null, {
            default: () => h(SelectTrigger, { "data-review": "select", size: "lg" }),
          }),
      }),
    );
    expect(selectHtml).toContain('data-slot="select"');
    expect(selectHtml).toContain('data-slot="select-trigger"');
    expect(selectHtml).toContain('data-slot="select-value"');
    expect(selectHtml).toContain('data-slot="select-icon"');
    expect(selectHtml).toContain('data-review="select"');
    expect(selectHtml).toContain("M6 9l6 6l6 -6");

    const valueHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(Select, null, {
            default: () => h(SelectValue, { placeholder: "Choose a value" }),
          }),
      }),
    );
    expect(valueHtml).toContain("Choose a value");

    const scopedValueHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(Select, null, {
            default: () =>
              h(SelectValue, null, {
                default: ({ label, value }: { label: string | null; value: string | null }) =>
                  `${label ?? "none"}:${value ?? "none"}`,
              }),
          }),
      }),
    );
    expect(scopedValueHtml).toContain("none:none");

    const ThemeToggle = await loadGeneratedComponent(
      server,
      outputRoot,
      "theme-toggle/ThemeToggle.vue",
    );
    const themeToggleHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(
            ThemeToggle,
            {
              "aria-label": "Use dark appearance",
              class: "consumer-theme-toggle",
              "data-review": "theme-toggle",
              pressed: true,
              style: { color: "red" },
            },
            {},
          ),
      }),
    );
    expect(themeToggleHtml).toContain("<button");
    expect(themeToggleHtml).toContain('type="button"');
    expect(themeToggleHtml).toContain('aria-label="Use dark appearance"');
    expect(themeToggleHtml).toContain('aria-pressed="true"');
    expect(themeToggleHtml).toContain('data-state="on"');
    expect(themeToggleHtml).toContain('data-slot="theme-toggle"');
    expect(themeToggleHtml).toContain('data-review="theme-toggle"');
    expect(themeToggleHtml).toContain("consumer-theme-toggle");
    expect(themeToggleHtml).toContain("color:red");
    expect(themeToggleHtml.match(/data-theme-icon/g)).toHaveLength(3);

    const asChildHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(Select, null, {
            default: () =>
              h(
                SelectTrigger,
                {
                  asChild: true,
                  class: "consumer-trigger",
                  "data-review": "as-child",
                  style: { color: "red" },
                },
                {
                  default: () =>
                    h(
                      "button",
                      { class: "child-trigger", style: { backgroundColor: "blue" } },
                      "Choose",
                    ),
                },
              ),
          }),
      }),
    );
    expect(asChildHtml).toContain("consumer-trigger");
    expect(asChildHtml).toContain("child-trigger");
    expect(asChildHtml).toContain('data-review="as-child"');
    expect(asChildHtml).toContain("color:red");
    expect(asChildHtml).toContain("background-color:blue");
    expect(asChildHtml).toContain("data-sw-select-trigger");
    expect(asChildHtml).toContain('type="button"');

    const submitAsChildHtml = await renderToString(
      createSSRApp({
        render: () =>
          h(Select, null, {
            default: () =>
              h(
                SelectTrigger,
                { asChild: true },
                { default: () => h("button", { type: "submit" }, "Submit choice") },
              ),
          }),
      }),
    );
    expect(submitAsChildHtml).toContain('type="submit"');
    expect(submitAsChildHtml).not.toContain('type="button"');

    await expect(
      renderToString(
        createSSRApp({
          render: () =>
            h(Select, null, {
              default: () => h(SelectTrigger, { asChild: true }),
            }),
        }),
      ),
    ).rejects.toThrow("SelectTrigger asChild requires exactly one native element VNode.");

    await expect(
      renderToString(
        createSSRApp({
          render: () =>
            h(Select, null, {
              default: () =>
                h(
                  SelectTrigger,
                  { asChild: true },
                  { default: () => [h("button", "One"), h("a", { href: "/two" }, "Two")] },
                ),
            }),
        }),
      ),
    ).rejects.toThrow("SelectTrigger asChild requires exactly one native element VNode.");

    const UnsupportedChild = defineComponent({ render: () => h("button", "Unsupported") });
    await expect(
      renderToString(
        createSSRApp({
          render: () =>
            h(Select, null, {
              default: () =>
                h(SelectTrigger, { asChild: true }, { default: () => h(UnsupportedChild) }),
            }),
        }),
      ),
    ).rejects.toThrow("SelectTrigger asChild requires exactly one native element VNode.");
  }, 120_000);

  it("mounts generated Select models and its asChild trigger through the real Runtime controller", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const Select = await loadGeneratedComponent(ssrServer, outputRoot, "select/Select.vue");
    const SelectContent = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "select/SelectContent.vue",
    );
    const SelectItem = await loadGeneratedComponent(ssrServer, outputRoot, "select/SelectItem.vue");
    const SelectTrigger = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "select/SelectTrigger.vue",
    );
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(
            Select,
            { modal: false, modelValue: null, open: false },
            {
              default: () => [
                h(
                  SelectTrigger,
                  { asChild: true },
                  { default: () => h("button", null, "Choose fruit") },
                ),
                h(
                  SelectContent,
                  { alignItemWithTrigger: false },
                  {
                    default: () => h(SelectItem, { value: "apple" }, { default: () => "Apple" }),
                  },
                ),
              ],
            },
          ),
      }),
    );
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app">${html}</div><script type="module" src="/main.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(path.join(root, "main.js"), BROWSER_PROOF_SOURCE, "utf8");

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("Vue Styled browser test server did not expose a local URL.");

    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      page.on("requestfailed", (request) => {
        browserErrors.push(
          `request failed: ${request.url()} (${request.failure()?.errorText ?? "unknown error"})`,
        );
      });
      page.on("response", (response) => {
        if (response.status() >= 400) {
          browserErrors.push(`HTTP ${response.status()}: ${response.url()}`);
        }
      });

      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindStyledResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      const serialized = await page.evaluate(
        () => document.documentElement.dataset.starwindStyledResult,
      );
      if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
      expect(parseBrowserProof(serialized)).toEqual({
        childClicks: 2,
        canceledOpenProposal: true,
        canceledValueProposal: true,
        controllerDiscovered: true,
        controlledOpenOwnership: true,
        controlledValueOwnership: true,
        externalModelsSynchronized: true,
        externalOpenSynchronized: true,
        modelEvents: [
          "open:detail:true:cancel",
          "open:detail:true:allow",
          "open:update:true",
          "value:detail:apple:cancel",
          "value:detail:apple:allow",
          "value:update:apple",
          "open:detail:false:allow",
          "open:update:false",
        ],
        ok: true,
        refsCleared: true,
        refsSame: true,
        wrapperClicks: 2,
        warnings: [],
      });
    } finally {
      await browser.close();
    }
  });

  it("hydrates Styled Avatar without warnings or fallback visibility drift", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const Avatar = await loadGeneratedComponent(ssrServer, outputRoot, "avatar/Avatar.vue");
    const AvatarImage = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "avatar/AvatarImage.vue",
    );
    const AvatarFallback = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "avatar/AvatarFallback.vue",
    );
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h(Avatar, null, {
            default: () => [
              h(AvatarImage, {
                alt: "Broken profile",
                src: "data:image/png;base64,invalid",
              }),
              h(AvatarFallback, null, { default: () => "BP" }),
            ],
          }),
      }),
    );
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app">${html}</div><script type="module" src="/avatar-hydration.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(path.join(root, "avatar-hydration.js"), AVATAR_HYDRATION_PROOF_SOURCE, "utf8");

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("Vue Styled browser test server did not expose a local URL.");
    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindAvatarHydrationResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      if (browserErrors.length) throw new Error(browserErrors.join("\n"));
      const result = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.starwindAvatarHydrationResult ?? "{}"),
      );
      expect(result).toEqual({
        refsCleared: true,
        refsSame: true,
        rootCountAfterUnmount: 0,
        statuses: ["loading", "error"],
        visibilityStable: true,
        warnings: [],
      });
    } finally {
      await browser.close();
    }
  });

  it("hydrates Styled Progress once and keeps reactive presentation aligned with Runtime", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const Progress = await loadGeneratedComponent(ssrServer, outputRoot, "progress/Progress.vue");
    const html = await renderToString(
      createSSRApp({
        render: () => h(Progress, { label: "Hydrated progress", value: 25, variant: "success" }),
      }),
    );
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app">${html}</div><script type="module" src="/progress-hydration.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(
      path.join(root, "progress-hydration.js"),
      PROGRESS_HYDRATION_PROOF_SOURCE,
      "utf8",
    );

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url)
      throw new Error("Vue Styled Progress browser test server did not expose a local URL.");
    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindProgressHydrationResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      if (browserErrors.length) throw new Error(browserErrors.join("\n"));
      const result = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.starwindProgressHydrationResult ?? "{}"),
      );
      expect(result).toEqual({
        disconnectCount: 1,
        initialState: { ariaValueNow: "25", style: "transform:translateX(-75%);" },
        observeCount: 1,
        refsCleared: true,
        refsSame: true,
        rootCountAfterUnmount: 0,
        updatedState: { ariaValueNow: "75", style: "transform: translateX(-25%);" },
        warnings: [],
      });
    } finally {
      await browser.close();
    }
  });

  it("hydrates default and custom Styled Scroll Areas once without geometry drift", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const ScrollArea = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "scroll-area/ScrollArea.vue",
    );
    const ScrollAreaThumb = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "scroll-area/ScrollAreaThumb.vue",
    );
    const ScrollBar = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "scroll-area/ScrollBar.vue",
    );
    const fixture = () =>
      h("div", null, [
        h(
          ScrollArea,
          {
            class: "hydrated-scroll-area",
            "data-testid": "hydrated-default",
            viewportClass: "hydrated-viewport",
          },
          {
            default: () => h("div", { class: "hydrated-scroll-content" }, "Default content"),
          },
        ),
        h(
          ScrollArea,
          { class: "hydrated-scroll-area", "data-testid": "hydrated-custom" },
          {
            default: () => h("div", { class: "hydrated-scroll-content" }, "Custom content"),
            scrollbar: () =>
              h(
                ScrollBar,
                {
                  "data-testid": "hydrated-horizontal",
                  keepMounted: true,
                  orientation: "horizontal",
                },
                { default: () => h(ScrollAreaThumb) },
              ),
          },
        ),
      ]);
    const html = await renderToString(createSSRApp({ render: fixture }));
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><head><style>
        .hydrated-scroll-area { height: 100px; width: 160px; }
        .hydrated-scroll-area [data-sw-scroll-area-viewport] { height: 100%; width: 100%; }
        .hydrated-scroll-content { height: 320px; width: 360px; }
      </style></head><body><div id="app">${html}</div><script type="module" src="/scroll-area-hydration.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(
      path.join(root, "scroll-area-hydration.js"),
      SCROLL_AREA_HYDRATION_PROOF_SOURCE,
      "utf8",
    );

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url)
      throw new Error("Vue Styled Scroll Area browser test server did not expose a local URL.");
    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindScrollAreaHydrationResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      if (browserErrors.length) throw new Error(browserErrors.join("\n"));
      const result = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.starwindScrollAreaHydrationResult ?? "{}"),
      );
      expect(result).toEqual({
        anatomy: { corners: 2, roots: 2, scrollbars: 2, thumbs: 2, viewports: 2 },
        geometryStable: true,
        horizontalOrientation: "horizontal",
        mutationDisconnected: 2,
        mutationRootObserves: 2,
        refsCleared: true,
        refsSame: true,
        resizeCreated: 2,
        resizeDisconnected: 2,
        rootCountAfterUnmount: 0,
        scrolled: true,
        warnings: [],
      });
    } finally {
      await browser.close();
    }
  });

  it("hydrates Theme Toggles once and preserves the app-owned controller on unmount", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });
    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const ThemeToggle = await loadGeneratedComponent(
      ssrServer,
      outputRoot,
      "theme-toggle/ThemeToggle.vue",
    );
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h("div", null, [
            h(ThemeToggle, { id: "theme-one" }),
            h(ThemeToggle, { id: "theme-two" }),
          ]),
      }),
    );
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app">${html}</div><script type="module" src="/theme-hydration.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(
      path.join(root, "theme-hydration.js"),
      THEME_TOGGLE_HYDRATION_PROOF_SOURCE,
      "utf8",
    );

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("Vue Styled browser test server did not expose a local URL.");
    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindThemeHydrationResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      if (browserErrors.length) throw new Error(browserErrors.join("\n"));
      const result = await page.evaluate(() =>
        JSON.parse(document.documentElement.dataset.starwindThemeHydrationResult ?? "{}"),
      );
      expect(result).toEqual({
        controllerSurvivedUnmount: true,
        exposedCleared: true,
        rootCountAfterUnmount: 0,
        synchronized: true,
        warnings: [],
      });
    } finally {
      await browser.close();
    }
  });

  it("hydrates uncontrolled and controlled Styled Checkboxes without losing model ownership", async () => {
    const root = await createProductionContextOutputRoot();
    const outputRoot = path.join(root, "styled");
    await generateStarwindVueWrappers({ outputDir: "styled", repoRoot: root });

    const ssrServer = await createVueSsrLoader();
    servers.push(ssrServer);
    const Button = await loadGeneratedComponent(ssrServer, outputRoot, "button/Button.vue");
    const Checkbox = await loadGeneratedComponent(ssrServer, outputRoot, "checkbox/Checkbox.vue");
    const html = await renderToString(
      createSSRApp({
        render: () =>
          h("div", null, [
            h(
              Button,
              {
                "aria-label": "Save changes",
                class: "consumer-button",
                "data-testid": "styled-button",
                style: { color: "rgb(1, 2, 3)" },
              },
              { default: () => "Save" },
            ),
            h(Checkbox, {
              "aria-label": "Uncontrolled checkbox",
              class: "consumer-checkbox",
              "data-testid": "styled-checkbox",
              defaultChecked: false,
              id: "uncontrolled",
              label: "Uncontrolled",
              style: { color: "rgb(4, 5, 6)" },
            }),
            h(Checkbox, { checked: false, id: "controlled-false", label: "Controlled false" }),
            h(Checkbox, { checked: true, id: "controlled-true", label: "Controlled true" }),
          ]),
      }),
    );
    await writeFile(
      path.join(root, "index.html"),
      `<!doctype html><html><body><div id="app">${html}</div><script type="module" src="/checkbox-hydration.js"></script></body></html>`,
      "utf8",
    );
    await writeFile(
      path.join(root, "checkbox-hydration.js"),
      CHECKBOX_HYDRATION_PROOF_SOURCE,
      "utf8",
    );

    const server = await createVueBrowserServer(root);
    servers.push(server);
    await server.listen();
    const url = server.resolvedUrls?.local[0];
    if (!url) throw new Error("Vue Styled browser test server did not expose a local URL.");

    const workspaceRequire = createRequire(
      path.join(process.cwd(), "apps/react-demo/package.json"),
    );
    const playwright: unknown = workspaceRequire("playwright");
    if (!isPlaywrightModule(playwright)) {
      throw new TypeError("The workspace Playwright module does not expose Chromium.");
    }

    const browser = await playwright.chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(describeUnknownError(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(`console.error: ${message.text()}`);
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.starwindCheckboxHydrationResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      const serialized = await page.evaluate(
        () => document.documentElement.dataset.starwindCheckboxHydrationResult,
      );
      if (browserErrors.length > 0) throw new Error(browserErrors.join("\n"));
      const proof: unknown = JSON.parse(serialized ?? "null");
      if (!isRecord(proof) || proof.ok !== true) {
        throw new Error(
          isRecord(proof) && typeof proof.error === "string"
            ? proof.error
            : "The Styled Checkbox hydration proof failed.",
        );
      }
      expect(proof).toEqual({
        buttonAriaLabel: "Save changes",
        buttonClass: true,
        buttonClicks: 1,
        buttonRefCleared: true,
        buttonRefSame: true,
        buttonStyle: "rgb(1, 2, 3)",
        buttonTestIdCount: 1,
        cleanupCount: 3,
        controlledFalseAfterParent: "true",
        controlledFalseAfterProposal: "false",
        controlledTrueAfterCanceledProposal: "true",
        events: ["false:detail:true:false", "false:update:true", "true:detail:false:false"],
        inputCountAfterUnmount: 0,
        ok: true,
        uncontrolledAfterClick: "true",
        uncontrolledAriaLabel: "Uncontrolled checkbox",
        uncontrolledClass: true,
        uncontrolledClicks: 1,
        uncontrolledStyle: "rgb(4, 5, 6)",
        uncontrolledTestIdCount: 1,
        warnings: [],
        wrapperAriaLabel: null,
        wrapperClass: false,
        wrapperClickHandlerLeaked: false,
        wrapperStyle: null,
        wrapperTestId: null,
      });
    } finally {
      await browser.close();
    }
  });

  async function createOutputRoot(): Promise<string> {
    const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-"));
    temporaryRoots.push(root);
    return root;
  }

  async function createProductionContextOutputRoot(): Promise<string> {
    const root = await mkdtemp(
      path.join(process.cwd(), "apps/vue-demo/src/components/.starwind-vue-styled-"),
    );
    temporaryRoots.push(root);
    return root;
  }
});

type VueViteServer = {
  close(): Promise<void>;
  listen(): Promise<void>;
  resolvedUrls: { local: string[] } | null;
  ssrLoadModule(url: string): Promise<Record<string, unknown>>;
};

type TransformWithEsbuild = (
  source: string,
  filename: string,
  options: Record<string, unknown>,
) => Promise<{ code: string; map: unknown }>;

type VueViteTools = {
  createServer(options: Record<string, unknown>): Promise<VueViteServer>;
  transformWithEsbuild: TransformWithEsbuild;
};

async function loadVueViteTools(): Promise<VueViteTools> {
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const viteEntry = workspaceRequire.resolve("vite");
  return (await import(pathToFileURL(viteEntry).href)) as VueViteTools;
}

function createVueViteOptions(
  root: string,
  transformWithEsbuild: TransformWithEsbuild,
): Record<string, unknown> {
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const rootRequire = createRequire(path.join(process.cwd(), "package.json"));
  const tailwindVariants = path.join(
    path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
    "dist/index.js",
  );
  const vue = rootRequire.resolve("vue/dist/vue.runtime.esm-bundler.js");

  return {
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "starwind-vue-styled-test-sfc",
        async transform(source: string, id: string) {
          if (!id.split("?")[0]?.endsWith(".vue")) return undefined;
          const { descriptor, errors } = parse(source, { filename: id });
          if (errors.length) throw errors[0];
          const compiled = compileScript(descriptor, {
            id: `styled-${Buffer.from(id).toString("hex").slice(-12)}`,
            inlineTemplate: true,
          }).content;
          const transformed = await transformWithEsbuild(compiled, id, {
            format: "esm",
            loader: "ts",
            target: "esnext",
          });
          return {
            code: transformed.code,
            map: transformed.map,
          };
        },
      },
    ],
    resolve: {
      alias: [
        { find: "vue", replacement: vue },
        {
          find: "@starwind-ui/runtime/theme",
          replacement: path.resolve(process.cwd(), "packages/runtime/src/theme/theme.ts"),
        },
        {
          find: new RegExp(`^@starwind-ui/vue/(${vuePrimitiveSubpathPattern})$`),
          replacement: path.resolve(process.cwd(), "packages/vue/src/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.resolve(process.cwd(), "packages/runtime/src/components/$1/index.ts"),
        },
        {
          find: "@starwind-ui/runtime",
          replacement: path.resolve(process.cwd(), "packages/runtime/src/index.ts"),
        },
        { find: "tailwind-variants", replacement: tailwindVariants },
      ],
    },
    root,
  };
}

async function createVueSsrLoader(): Promise<VueViteServer> {
  const { createServer, transformWithEsbuild } = await loadVueViteTools();
  return createServer({
    ...createVueViteOptions(process.cwd(), transformWithEsbuild),
    appType: "custom",
    server: { middlewareMode: true },
  });
}

async function createVueBrowserServer(root: string): Promise<VueViteServer> {
  const { createServer, transformWithEsbuild } = await loadVueViteTools();
  return createServer({
    ...createVueViteOptions(root, transformWithEsbuild),
    appType: "spa",
    server: {
      fs: { allow: [process.cwd(), root] },
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
    },
  });
}

async function loadGeneratedComponent(
  server: VueViteServer,
  outputRoot: string,
  relativePath: string,
): Promise<ReturnType<typeof defineComponent>> {
  const file = path.join(outputRoot, relativePath).split(path.sep).join("/");
  const module = await server.ssrLoadModule(`/@fs/${file}`);
  return module.default as ReturnType<typeof defineComponent>;
}

async function readTree(
  directory: string,
  root: string = directory,
): Promise<Record<string, string>> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry): Promise<Array<[string, string]>> => {
      const entryPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return Object.entries(await readTree(entryPath, root));
      }
      return [
        [
          path.relative(root, entryPath).split(path.sep).join("/"),
          await readFile(entryPath, "utf8"),
        ],
      ];
    }),
  );

  return Object.fromEntries(files.flat().sort(([left], [right]) => left.localeCompare(right)));
}

async function expectVueTypecheck(fixtureRoot: string, outputRoot: string): Promise<void> {
  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path.join(
    path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
    "dist/index.d.ts",
  );
  const tsconfigPath = path.join(fixtureRoot, "tsconfig.styled.json");
  await writeFile(
    tsconfigPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: workspaceRoot,
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: {
            "@starwind-ui/runtime": ["packages/runtime/src/index.ts"],
            "@starwind-ui/runtime/theme": ["packages/runtime/src/theme/theme.ts"],
            "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
            "@starwind-ui/vue": ["packages/vue/src/index.ts"],
            "@starwind-ui/vue/*": ["packages/vue/src/*/index.ts"],
            "tailwind-variants": [tailwindVariants.split(path.sep).join("/")],
            vue: ["node_modules/vue/dist/vue.d.mts"],
          },
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: [
          `${outputRoot.split(path.sep).join("/")}/**/*.ts`,
          `${outputRoot.split(path.sep).join("/")}/**/*.vue`,
        ],
        vueCompilerOptions: {
          dataAttributes: ["data-*"],
          strictTemplates: true,
        },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vueTsc = path.join(process.cwd(), "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", tsconfigPath], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
  const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  expect(result.error, diagnostics).toBeUndefined();
  expect(result.status, diagnostics).toBe(0);
}

type BrowserProof = {
  childClicks: number;
  canceledOpenProposal: boolean;
  canceledValueProposal: boolean;
  controllerDiscovered: boolean;
  controlledOpenOwnership: boolean;
  controlledValueOwnership: boolean;
  externalModelsSynchronized: boolean;
  externalOpenSynchronized: boolean;
  modelEvents: string[];
  ok: true;
  refsCleared: boolean;
  refsSame: boolean;
  wrapperClicks: number;
  warnings: string[];
};

type BrowserConsoleMessage = {
  text(): string;
  type(): string;
};

type BrowserRequest = {
  failure(): { errorText: string } | null;
  url(): string;
};

type BrowserResponse = {
  status(): number;
  url(): string;
};

interface BrowserPage {
  evaluate<T>(pageFunction: () => T): Promise<T>;
  goto(url: string): Promise<unknown>;
  on(event: "console", handler: (message: BrowserConsoleMessage) => void): this;
  on(event: "pageerror", handler: (error: unknown) => void): this;
  on(event: "requestfailed", handler: (request: BrowserRequest) => void): this;
  on(event: "response", handler: (response: BrowserResponse) => void): this;
  waitForFunction(
    pageFunction: () => unknown,
    argument: unknown,
    options: { timeout: number },
  ): Promise<unknown>;
}

type Browser = {
  close(): Promise<void>;
  newPage(): Promise<BrowserPage>;
};

type PlaywrightModule = {
  chromium: {
    launch(options: { headless: boolean }): Promise<Browser>;
  };
};

function isPlaywrightModule(value: unknown): value is PlaywrightModule {
  if (!isRecord(value)) return false;
  const chromium = value.chromium;
  return isRecord(chromium) && typeof chromium.launch === "function";
}

function parseBrowserProof(serialized: string | undefined): BrowserProof {
  if (!serialized) throw new Error("The Vue Styled browser fixture did not publish a result.");
  const value: unknown = JSON.parse(serialized);
  if (!isRecord(value)) throw new TypeError("The Vue Styled browser result was not an object.");
  if (value.ok !== true) {
    throw new Error(
      typeof value.error === "string" ? value.error : "The Vue Styled browser fixture failed.",
    );
  }
  if (
    typeof value.childClicks !== "number" ||
    typeof value.canceledOpenProposal !== "boolean" ||
    typeof value.canceledValueProposal !== "boolean" ||
    typeof value.controllerDiscovered !== "boolean" ||
    typeof value.controlledOpenOwnership !== "boolean" ||
    typeof value.controlledValueOwnership !== "boolean" ||
    typeof value.externalModelsSynchronized !== "boolean" ||
    typeof value.externalOpenSynchronized !== "boolean" ||
    !Array.isArray(value.modelEvents) ||
    !value.modelEvents.every((event) => typeof event === "string") ||
    typeof value.refsCleared !== "boolean" ||
    typeof value.refsSame !== "boolean" ||
    typeof value.wrapperClicks !== "number" ||
    !Array.isArray(value.warnings)
  ) {
    throw new TypeError("The Vue Styled browser result omitted required proof fields.");
  }
  return {
    childClicks: value.childClicks,
    canceledOpenProposal: value.canceledOpenProposal,
    canceledValueProposal: value.canceledValueProposal,
    controllerDiscovered: value.controllerDiscovered,
    controlledOpenOwnership: value.controlledOpenOwnership,
    controlledValueOwnership: value.controlledValueOwnership,
    externalModelsSynchronized: value.externalModelsSynchronized,
    externalOpenSynchronized: value.externalOpenSynchronized,
    modelEvents: value.modelEvents,
    ok: true,
    refsCleared: value.refsCleared,
    refsSame: value.refsSame,
    wrapperClicks: value.wrapperClicks,
    warnings: value.warnings as string[],
  };
}

function describeUnknownError(value: unknown): string {
  if (value instanceof Error) return value.stack ?? value.message;
  if (isRecord(value)) {
    if (typeof value.stack === "string") return value.stack;
    if (typeof value.message === "string") return value.message;
  }
  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
