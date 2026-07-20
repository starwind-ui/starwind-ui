import { createSSRApp, defineComponent, h, nextTick, ref } from "vue";
import { initThemeController } from "@starwind-ui/vue/theme";

import { Avatar, AvatarFallback, AvatarImage } from "../src/components/starwind-runtime/avatar";
import { Button } from "../src/components/starwind-runtime/button";
import { Checkbox } from "../src/components/starwind-runtime/checkbox";
import { Progress } from "../src/components/starwind-runtime/progress";
import { ScrollArea } from "../src/components/starwind-runtime/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "../src/components/starwind-runtime/select";
import { ThemeToggle } from "../src/components/starwind-runtime/theme-toggle";

export function renderStyledFixture(onButtonClick = () => undefined) {
  return h("main", null, [
    h(
      Button,
      {
        focusableWhenDisabled: true,
        id: "hydrated-styled-button",
        onClick: onButtonClick,
        variant: "secondary",
      },
      { default: () => "Save" },
    ),
    h(Checkbox, {
      defaultChecked: false,
      id: "hydrated-styled-checkbox",
      label: "Accept terms",
      variant: "outline",
    }),
    h(StyledCohortFixture),
    h(
      Select,
      { defaultValue: "apple", modal: false },
      {
        default: () => [
          h(
            SelectTrigger,
            { asChild: true },
            {
              default: () => h("button", { id: "hydrated-styled-select" }, "Choose fruit"),
            },
          ),
          h(
            SelectContent,
            { alignItemWithTrigger: false },
            {
              default: () => [
                h(SelectItem, { value: "apple" }, { default: () => "Apple" }),
                h(SelectItem, { value: "banana" }, { default: () => "Banana" }),
              ],
            },
          ),
        ],
      },
    ),
  ]);
}

export async function runStyledHydrationChecks() {
  const host = document.querySelector<HTMLElement>("#styled-hydration-host");
  assert(host, "Styled hydration host is missing");
  assert(host.querySelectorAll("[data-sw-button]").length === 1, "Styled SSR duplicated Button");
  assert(
    host.querySelectorAll("[data-sw-checkbox]").length === 1,
    "Styled SSR duplicated Checkbox",
  );
  assert(host.querySelectorAll("[data-sw-select]").length === 1, "Styled SSR duplicated Select");
  assert(host.querySelectorAll("[data-sw-avatar]").length === 1, "Styled SSR duplicated Avatar");
  assert(
    host.querySelectorAll("[data-sw-progress]").length === 1,
    "Styled SSR duplicated Progress",
  );
  assert(
    host.querySelectorAll("[data-sw-scroll-area]").length === 1,
    "Styled SSR duplicated Scroll Area",
  );
  assert(
    host.querySelectorAll("[data-sw-theme-toggle]").length === 1,
    "Styled SSR duplicated Theme Toggle",
  );
  assert(
    host.querySelectorAll("[data-sw-select-portal]").length === 1,
    "Styled SSR portal content was not deterministic and inline",
  );

  const resources = trackFixtureResources(
    (target) =>
      target === host ||
      host.contains(target) ||
      (target instanceof Element && target.closest("[data-sw-select-portal]") !== null),
  );
  let buttonClicks = 0;
  const warnings: string[] = [];
  localStorage.setItem("colorTheme", "light");
  document.documentElement.classList.remove("dark");
  const themeController = initThemeController(document);
  const app = createSSRApp({
    render: () => renderStyledFixture(() => (buttonClicks += 1)),
  });
  app.config.warnHandler = (message) => warnings.push(message);

  try {
    app.mount(host);
    await frame();
    assert(warnings.length === 0, `Styled hydration warned: ${warnings.join(" | ")}`);
    assert(
      host.querySelectorAll("#hydrated-styled-button").length === 1,
      "Styled hydration duplicated Button",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-checkbox").length === 1,
      "Styled hydration duplicated Checkbox",
    );
    assert(
      host.querySelectorAll("#hydrated-styled-select").length === 1,
      "Styled hydration duplicated Select",
    );
    for (const selector of [
      "#hydrated-styled-avatar",
      "#hydrated-styled-progress",
      "#hydrated-styled-scroll-area",
      "#hydrated-styled-theme-toggle",
    ]) {
      assert(
        host.querySelectorAll(selector).length === 1,
        `Styled hydration duplicated ${selector}`,
      );
    }
    assert(
      host.querySelectorAll("[data-sw-select-portal]").length === 0,
      "Styled hydration left Select portal content under its source owner",
    );
    assert(
      document.body.querySelectorAll(":scope > [data-sw-select-portal]").length === 1,
      "Styled hydration did not move Select portal content to body",
    );

    host.querySelector<HTMLButtonElement>("#hydrated-styled-button")?.click();
    assert(buttonClicks === 1, `Styled Button listener fired ${buttonClicks} times`);

    const checkbox = host.querySelector<HTMLElement>("[data-sw-checkbox]");
    assert(checkbox, "Styled Checkbox root is missing");
    checkbox.click();
    await frame();
    assert(checkbox.getAttribute("aria-checked") === "true", "Styled Checkbox did not update");

    const select = host.querySelector<HTMLElement>("[data-sw-select]");
    const trigger = host.querySelector<HTMLButtonElement>("#hydrated-styled-select");
    assert(select, "Styled Select root is missing");
    assert(trigger, "Styled Select trigger is missing");
    assert(trigger.type === "button", "Styled Select asChild lost its default button type");
    trigger.click();
    await frame();
    assert(trigger.getAttribute("aria-expanded") === "true", "Styled Select did not open");
    document.body.querySelector<HTMLElement>('[data-sw-select-item][data-value="banana"]')?.click();
    await frame();
    assert(select.getAttribute("data-value") === "banana", "Styled Select did not update");

    await waitFor(
      () =>
        host.querySelector("[data-sw-avatar]")?.getAttribute("data-image-loading-status") ===
        "loaded",
      "Styled Avatar did not load",
    );
    host.querySelector<HTMLButtonElement>("#hydrated-styled-progress-update")?.click();
    await frame();
    assert(
      host.querySelector("#hydrated-styled-progress")?.getAttribute("aria-valuenow") === "75",
      "Styled Progress did not update",
    );
    const viewport = host.querySelector<HTMLElement>("[data-sw-scroll-area-viewport]");
    assert(viewport, "Styled Scroll Area viewport is missing");
    viewport.scrollTop = 80;
    viewport.dispatchEvent(new Event("scroll"));
    await frame();
    assert(viewport.scrollTop === 80, "Styled Scroll Area did not retain scrolling");

    const themeToggle = host.querySelector<HTMLButtonElement>("#hydrated-styled-theme-toggle");
    assert(themeToggle, "Styled Theme Toggle is missing");
    themeToggle.click();
    await frame();
    assert(
      document.documentElement.classList.contains("dark"),
      "Styled Theme Toggle did not apply dark mode",
    );
    assert(
      themeToggle.getAttribute("aria-pressed") === "true",
      "Styled Theme Toggle did not synchronize state",
    );
  } finally {
    try {
      app.unmount();
      themeController.destroy();
      await nextTick();
      resources.assertDisposed();
    } finally {
      resources.restore();
    }
  }

  assert(host.children.length === 0, "Styled markup leaked after unmount");
  assert(
    document.body.querySelectorAll(":scope > [data-sw-select-portal]").length === 0,
    "Styled Select portal leaked after unmount",
  );
}

const StyledCohortFixture = defineComponent({
  setup() {
    const progressValue = ref(40);
    return () => [
      h(
        Avatar,
        { id: "hydrated-styled-avatar" },
        {
          default: () => [
            h(AvatarImage, {
              alt: "Styled hydrated profile",
              src: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'/%3E",
            }),
            h(AvatarFallback, null, { default: () => "SH" }),
          ],
        },
      ),
      h(Progress, {
        id: "hydrated-styled-progress",
        label: "Styled hydration progress",
        value: progressValue.value,
      }),
      h(
        "button",
        {
          id: "hydrated-styled-progress-update",
          onClick: () => (progressValue.value = 75),
          type: "button",
        },
        "Update styled progress",
      ),
      h(
        ScrollArea,
        { id: "hydrated-styled-scroll-area", overflowEdgeThreshold: 8 },
        { default: () => h("div", { class: "hydrated-scroll-content" }, "Styled scroll content") },
      ),
      h(ThemeToggle, {
        "aria-label": "Toggle hydrated theme",
        id: "hydrated-styled-theme-toggle",
      }),
    ];
  },
});

async function frame() {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
}

async function waitFor(predicate: () => boolean, message: string): Promise<void> {
  const deadline = performance.now() + 5_000;
  while (!predicate()) {
    if (performance.now() > deadline) throw new Error(message);
    await frame();
  }
}

type ObserverRecord = {
  active: boolean;
  disposalCount: number;
  duplicateDisposals: number;
  relevant: boolean;
};

function trackFixtureResources(isFixtureTarget: (target: Node) => boolean) {
  const NativeAbortController = window.AbortController;
  const NativeMutationObserver = window.MutationObserver;
  const NativeResizeObserver = window.ResizeObserver;
  const nativeAddEventListener = EventTarget.prototype.addEventListener;
  const abortRecords = new Map<AbortController, { abortCalls: number }>();
  const signalOwners = new WeakMap<AbortSignal, AbortController>();
  const signalListenerRecords: Array<{
    owner: AbortController;
    target: EventTarget;
    type: string;
  }> = [];
  const mutationRecords = new Map<MutationObserver, ObserverRecord>();
  const resizeRecords = new Map<ResizeObserver, ObserverRecord>();

  class TrackedAbortController extends NativeAbortController {
    constructor() {
      super();
      abortRecords.set(this, { abortCalls: 0 });
      signalOwners.set(this.signal, this);
    }
    override abort(reason?: unknown): void {
      const record = abortRecords.get(this);
      assert(record, "Tracked AbortController record is missing");
      record.abortCalls += 1;
      super.abort(reason);
    }
  }

  class TrackedMutationObserver extends NativeMutationObserver {
    constructor(callback: MutationCallback) {
      super(callback);
      mutationRecords.set(this, {
        active: false,
        disposalCount: 0,
        duplicateDisposals: 0,
        relevant: false,
      });
    }
    override observe(target: Node, options: MutationObserverInit): void {
      const record = mutationRecords.get(this);
      assert(record, "Tracked MutationObserver record is missing");
      record.active = true;
      record.relevant ||= isFixtureTarget(target);
      super.observe(target, options);
    }
    override disconnect(): void {
      updateObserverDisposal("MutationObserver", mutationRecords.get(this));
      super.disconnect();
    }
  }

  class TrackedResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super(callback);
      resizeRecords.set(this, {
        active: false,
        disposalCount: 0,
        duplicateDisposals: 0,
        relevant: false,
      });
    }
    override observe(target: Element, options?: ResizeObserverOptions): void {
      const record = resizeRecords.get(this);
      assert(record, "Tracked ResizeObserver record is missing");
      record.active = true;
      record.relevant ||= isFixtureTarget(target);
      super.observe(target, options);
    }
    override disconnect(): void {
      updateObserverDisposal("ResizeObserver", resizeRecords.get(this));
      super.disconnect();
    }
  }

  window.AbortController = TrackedAbortController;
  window.MutationObserver = TrackedMutationObserver;
  window.ResizeObserver = TrackedResizeObserver;
  EventTarget.prototype.addEventListener = function addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions,
  ): void {
    const owner =
      options && typeof options === "object" && options.signal
        ? signalOwners.get(options.signal)
        : undefined;
    if (owner) signalListenerRecords.push({ owner, target: this, type });
    nativeAddEventListener.call(this, type, listener, options);
  };

  return {
    assertDisposed(): void {
      const listenerOwners = new Set(signalListenerRecords.map((listener) => listener.owner));
      assert(listenerOwners.size > 0, "expected fixture-owned listener controllers");
      for (const controller of listenerOwners) {
        const record = abortRecords.get(controller);
        assert(record, "Tracked listener controller record is missing");
        assert(record.abortCalls === 1, `AbortController disposed ${record.abortCalls} times`);
        assert(controller.signal.aborted, "AbortController signal remained active");
      }
      for (const listener of signalListenerRecords) {
        assert(listener.owner.signal.aborted, `listener ${listener.type} remained active`);
        assert(
          abortRecords.get(listener.owner)?.abortCalls === 1,
          `listener ${listener.type} owner disposed more than once`,
        );
      }
      assertObserverRecords("MutationObserver", mutationRecords);
      assertObserverRecords("ResizeObserver", resizeRecords);
    },
    restore(): void {
      EventTarget.prototype.addEventListener = nativeAddEventListener;
      window.AbortController = NativeAbortController;
      window.MutationObserver = NativeMutationObserver;
      window.ResizeObserver = NativeResizeObserver;
    },
  };
}

function updateObserverDisposal(name: string, record: ObserverRecord | undefined): void {
  assert(record, `Tracked ${name} record is missing`);
  if (record.active) {
    record.active = false;
    record.disposalCount += 1;
  } else {
    record.duplicateDisposals += 1;
  }
}

function assertObserverRecords(
  name: string,
  records: ReadonlyMap<MutationObserver | ResizeObserver, ObserverRecord>,
): void {
  const fixtureRecords = [...records.values()].filter((record) => record.relevant);
  assert(fixtureRecords.length > 0, `expected fixture-owned ${name} resources`);
  for (const record of fixtureRecords) {
    assert(!record.active, `${name} remained active after unmount`);
    assert(record.disposalCount > 0, `${name} was never disposed`);
    assert(record.duplicateDisposals === 0, `${name} was disposed twice without being observed`);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
