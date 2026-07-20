import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";

import { AvatarFallback, AvatarImage, AvatarRoot } from "/vue/avatar/index.js";
import { ButtonRoot } from "/vue/button/index.js";
import { CheckboxIndicator, CheckboxRoot } from "/vue/checkbox/index.js";
import {
  ProgressIndicator,
  ProgressLabel,
  ProgressRoot,
  ProgressTrack,
  ProgressValue,
} from "/vue/progress/index.js";
import {
  ScrollAreaContent,
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
} from "/vue/scroll-area/index.js";
import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "/vue/select/index.js";

export async function runHydrationChecks() {
  const host = document.querySelector("#hydration-host");
  const overlays = document.querySelector("#hydration-overlays");
  assert(host, "hydration host is missing");
  assert(overlays, "hydration overlay owner is missing");
  assert(host.querySelectorAll("[data-sw-button]").length === 1, "SSR duplicated Button");
  assert(host.querySelectorAll("[data-sw-checkbox]").length === 1, "SSR duplicated Checkbox");
  assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "SSR duplicated Avatar");
  assert(host.querySelectorAll("[data-sw-progress]").length === 1, "SSR duplicated Progress");
  assert(host.querySelectorAll("[data-sw-scroll-area]").length === 1, "SSR duplicated Scroll Area");
  assert(host.querySelectorAll("[data-sw-select]").length === 1, "SSR duplicated Select");
  assert(
    host.querySelectorAll("[data-sw-select-portal]").length === 1,
    "SSR portal content was not deterministic and inline",
  );
  assert(overlays.children.length === 0, "SSR moved portal content before hydration");

  const resources = trackFixtureResources(
    (target) =>
      target === host || target === overlays || host.contains(target) || overlays.contains(target),
  );

  let buttonClicks = 0;
  const warnings = [];
  const app = createSSRApp({
    render: () => renderFixture(() => (buttonClicks += 1)),
  });
  app.config.warnHandler = (message) => warnings.push(message);

  try {
    app.mount(host);
    await frame();

    assert(warnings.length === 0, `hydration warned: ${warnings.join(" | ")}`);
    assert(host.querySelectorAll("[data-sw-button]").length === 1, "hydration duplicated Button");
    assert(
      host.querySelectorAll("[data-sw-checkbox]").length === 1,
      "hydration duplicated Checkbox",
    );
    assert(host.querySelectorAll("[data-sw-select]").length === 1, "hydration duplicated Select");
    assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "hydration duplicated Avatar");
    assert(
      host.querySelectorAll("[data-sw-progress]").length === 1,
      "hydration duplicated Progress",
    );
    assert(
      host.querySelectorAll("[data-sw-scroll-area]").length === 1,
      "hydration duplicated Scroll Area",
    );
    assert(
      host.querySelectorAll("[data-sw-select-portal]").length === 0,
      "hydration left Select portal content under its source owner",
    );
    assert(
      overlays.querySelectorAll(":scope > [data-sw-select-portal]").length === 1,
      "hydration did not move Select portal content to its declared owner",
    );

    host.querySelector("#hydrated-button").click();
    assert(buttonClicks === 1, `Button listener fired ${buttonClicks} times after hydration`);

    const checkbox = host.querySelector("[data-sw-checkbox]");
    checkbox.click();
    await frame();
    assert(checkbox.getAttribute("aria-checked") === "true", "Checkbox did not update");

    const select = host.querySelector("[data-sw-select]");
    const trigger = host.querySelector("#hydrated-select-trigger");
    trigger.click();
    await frame();
    assert(trigger.getAttribute("aria-expanded") === "true", "Select did not open");
    overlays.querySelector('[data-sw-select-item][data-value="banana"]').click();
    await frame();
    assert(select.getAttribute("data-value") === "banana", "Select did not update its value");

    await waitFor(
      () =>
        host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status") ===
        "loaded",
      "Avatar did not reach loaded state",
    );
    assert(!host.querySelector("[data-sw-avatar-image]").hidden, "Avatar image stayed hidden");
    assert(
      host.querySelector("[data-sw-avatar-fallback]").hidden,
      "Avatar fallback stayed visible",
    );

    host.querySelector("#hydrated-progress-update").click();
    await frame();
    const progress = host.querySelector("[data-sw-progress]");
    assert(
      progress.getAttribute("aria-valuenow") === "75",
      "Progress did not react to prop update",
    );
    assert(
      host.querySelector("[data-sw-progress-indicator]").style.transform === "translateX(-25%)",
      "Progress indicator did not react to prop update",
    );

    const viewport = host.querySelector("[data-sw-scroll-area-viewport]");
    const thumb = host.querySelector("[data-sw-scroll-area-thumb]");
    assert(viewport instanceof HTMLElement, "Scroll Area viewport is missing");
    assert(thumb instanceof HTMLElement, "Scroll Area thumb is missing");
    await waitFor(
      () => Number.parseFloat(getComputedStyle(thumb).height) > 0,
      "Scroll Area thumb was not measured",
    );
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await frame();
    assert(viewport.scrollTop === 80, "Scroll Area did not retain scrolling");
  } finally {
    app.unmount();
    await nextTick();
    try {
      resources.assertDisposed();
    } finally {
      resources.restore();
    }
  }

  assert(host.children.length === 0, "hydrated component markup leaked after unmount");
  assert(overlays.children.length === 0, "hydrated Select portal leaked after unmount");
}

export function renderFixture(onButtonClick = () => undefined) {
  return h("main", null, [
    h(
      ButtonRoot,
      { focusableWhenDisabled: true, id: "hydrated-button", onClick: onButtonClick },
      { default: () => "Save" },
    ),
    h(
      CheckboxRoot,
      { defaultChecked: false, id: "hydrated-checkbox", label: "Accept terms" },
      { default: () => h(CheckboxIndicator, null, { default: () => "Selected" }) },
    ),
    h(CohortFixture),
    h(
      SelectRoot,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { id: "hydrated-select-trigger" },
            { default: () => h(SelectValue, { placeholder: "Choose fruit" }) },
          ),
          h(
            SelectPortal,
            { container: "#hydration-overlays" },
            {
              default: () =>
                h(
                  SelectPositioner,
                  { alignItemWithTrigger: false },
                  {
                    default: () =>
                      h(SelectPopup, null, {
                        default: () =>
                          h(SelectList, null, {
                            default: () => [
                              renderItem("apple", "Apple"),
                              renderItem("banana", "Banana"),
                            ],
                          }),
                      }),
                  },
                ),
            },
          ),
        ],
      },
    ),
  ]);
}

const CohortFixture = defineComponent({
  setup() {
    const progressValue = ref(40);
    return () => [
      h(
        AvatarRoot,
        { id: "hydrated-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "HP" }),
          ],
        },
      ),
      h(
        ProgressRoot,
        { max: 100, min: 0, value: progressValue.value },
        {
          default: () => [
            h(ProgressLabel, null, { default: () => "Hydration progress" }),
            h(ProgressTrack, null, { default: () => h(ProgressIndicator) }),
            h(ProgressValue),
          ],
        },
      ),
      h(
        "button",
        {
          id: "hydrated-progress-update",
          onClick: () => (progressValue.value = 75),
          type: "button",
        },
        "Update progress",
      ),
      h(
        ScrollAreaRoot,
        { id: "hydrated-scroll-area", style: "height:120px;position:relative;width:200px" },
        {
          default: () => [
            h(
              ScrollAreaViewport,
              { style: "height:120px;width:200px" },
              {
                default: () =>
                  h(
                    ScrollAreaContent,
                    { style: "height:400px;width:600px" },
                    { default: () => "Hydrated scroll content" },
                  ),
              },
            ),
            h(
              ScrollAreaScrollbar,
              { keepMounted: true, style: "height:120px;width:10px" },
              {
                default: () =>
                  h(ScrollAreaThumb, { style: "height:var(--scroll-area-thumb-height)" }),
              },
            ),
            h(ScrollAreaCorner),
          ],
        },
      ),
    ];
  },
});

function renderItem(value, label) {
  return h(
    SelectItem,
    { value },
    {
      default: () => [
        h(SelectItemText, null, { default: () => label }),
        h(SelectItemIndicator, null, { default: () => "Selected" }),
      ],
    },
  );
}

async function frame() {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
}

async function waitFor(predicate, message) {
  const deadline = performance.now() + 5_000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(message);
    await frame();
  }
}

function trackFixtureResources(isFixtureTarget) {
  const NativeAbortController = window.AbortController;
  const NativeMutationObserver = window.MutationObserver;
  const NativeResizeObserver = window.ResizeObserver;
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const abortRecords = new Map();
  const signalOwners = new WeakMap();
  const signalListenerRecords = [];
  const mutationRecords = new Map();
  const resizeRecords = new Map();

  class TrackedAbortController extends NativeAbortController {
    constructor() {
      super();
      abortRecords.set(this, { abortCalls: 0 });
      signalOwners.set(this.signal, this);
    }
    abort(reason) {
      abortRecords.get(this).abortCalls += 1;
      return super.abort(reason);
    }
  }

  function createTrackedObserver(NativeObserver, records) {
    return class TrackedObserver extends NativeObserver {
      constructor(callback) {
        super(callback);
        records.set(this, {
          active: false,
          disposalCount: 0,
          duplicateDisposals: 0,
          relevant: false,
        });
      }
      observe(...args) {
        const record = records.get(this);
        record.active = true;
        record.relevant ||= isFixtureTarget(args[0]);
        return super.observe(...args);
      }
      disconnect() {
        const record = records.get(this);
        if (record.active) {
          record.active = false;
          record.disposalCount += 1;
        } else {
          record.duplicateDisposals += 1;
        }
        return super.disconnect();
      }
    };
  }

  window.AbortController = TrackedAbortController;
  window.MutationObserver = createTrackedObserver(NativeMutationObserver, mutationRecords);
  window.ResizeObserver = createTrackedObserver(NativeResizeObserver, resizeRecords);
  EventTarget.prototype.addEventListener = function addEventListener(type, listener, options) {
    const owner =
      options && typeof options === "object" && "signal" in options
        ? signalOwners.get(options.signal)
        : undefined;
    if (owner) signalListenerRecords.push({ owner, target: this, type });
    return nativeAddEventListener.call(this, type, listener, options);
  };

  return {
    assertDisposed() {
      const listenerOwners = new Set(signalListenerRecords.map((listener) => listener.owner));
      assert(listenerOwners.size > 0, "expected fixture-owned listener controllers");
      for (const controller of listenerOwners) {
        const record = abortRecords.get(controller);
        assert(record.abortCalls === 1, `AbortController disposed ${record.abortCalls} times`);
        assert(controller.signal.aborted, "AbortController signal remained active");
      }
      for (const listener of signalListenerRecords) {
        assert(listener.owner.signal.aborted, `listener ${listener.type} remained active`);
        assert(
          abortRecords.get(listener.owner).abortCalls === 1,
          `listener ${listener.type} owner disposed more than once`,
        );
      }
      assertObserverRecords("MutationObserver", mutationRecords);
      assertObserverRecords("ResizeObserver", resizeRecords);
    },
    restore() {
      EventTarget.prototype.addEventListener = nativeAddEventListener;
      window.AbortController = NativeAbortController;
      window.MutationObserver = NativeMutationObserver;
      window.ResizeObserver = NativeResizeObserver;
    },
  };
}

function assertObserverRecords(name, records) {
  const fixtureRecords = [...records.values()].filter((record) => record.relevant);
  assert(fixtureRecords.length > 0, `expected fixture-owned ${name} resources`);
  for (const record of fixtureRecords) {
    assert(!record.active, `${name} remained active after unmount`);
    assert(record.disposalCount > 0, `${name} was never disposed`);
    assert(record.duplicateDisposals === 0, `${name} was disposed twice without being observed`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
