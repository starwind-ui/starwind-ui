import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
  type VNode,
} from "vue";

import { createDialog } from "@starwind-ui/runtime/dialog";
import type { NavigationMenuValueChangeDetails } from "@starwind-ui/runtime/navigation-menu";
import {
  NavigationMenuContent,
  NavigationMenuIcon,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuPopup,
  NavigationMenuPortal,
  NavigationMenuPositioner,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
  useNavigationMenuRootContext,
} from "@starwind-ui/vue/navigation-menu";

const cleanups: Array<() => void> = [];

describe("Vue Navigation Menu", () => {
  afterEach(() => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("composes a component-rooted trigger and preserves protected disclosure state", async () => {
    const primitiveRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const childRef = ref<ComponentPublicInstance>();
    const triggerAs = ref<"a" | "button">("button");
    const calls: string[] = [];
    const state = reactive({
      cancel: false,
      orientation: "horizontal" as const,
      showCompany: false,
    });
    const { host } = mountMenu(state, {
      triggerChild: () =>
        h(
          PublicRootButton,
          {
            as: triggerAs.value,
            class: "child",
            href: triggerAs.value === "a" ? "#products" : undefined,
            onClick: () => calls.push("child"),
            ref: childRef,
          },
          { default: () => ["Products", h(NavigationMenuIcon)] },
        ),
      triggerProps: {
        asChild: true,
        class: "wrapper",
        "data-state": "consumer-state",
        onClick: () => calls.push("wrapper"),
        ref: primitiveRef,
      },
    });

    const button = trigger(host, "products");
    expect(button.className).toContain("child");
    expect(button.className).toContain("wrapper");
    expect(button.getAttribute("data-state")).toBe("closed");
    expect(primitiveRef.value?.element).toBe(button);
    expect(childRef.value?.$el).toBe(button);
    button.click();
    await frame();
    expect(calls).toEqual(["child", "wrapper"]);
    expect(button.getAttribute("data-state")).toBe("open");
    button.click();
    await frame();
    expect(button.getAttribute("data-state")).toBe("closed");

    const detachedButton = button;
    triggerAs.value = "a";
    await frame();
    const replacement = trigger(host, "products");
    expect(replacement.tagName).toBe("A");
    expect(replacement).not.toBe(detachedButton);
    expect(primitiveRef.value?.element).toBe(replacement);
    expect(childRef.value?.$el).toBe(replacement);

    detachedButton.click();
    await frame();
    expect(replacement.getAttribute("data-state")).toBe("closed");
    replacement.click();
    await frame();
    expect(replacement.getAttribute("data-state")).toBe("open");
  });

  it("projects accepted model events and reactive list orientation", async () => {
    const events: string[] = [];
    const state = reactive({
      cancel: true,
      orientation: "horizontal" as MenuState["orientation"],
      showCompany: false,
    });
    const { host } = mountMenu(state, {
      onValueChange: (_value, detail) => {
        events.push("detail");
        if (state.cancel) detail.cancel();
      },
      onValueUpdate: () => events.push("update"),
    });
    await frame();
    expect(host.querySelector("nav")?.getAttribute("data-orientation")).toBe("horizontal");
    expect(host.querySelector("[data-sw-nav-menu-list]")?.getAttribute("data-orientation")).toBe(
      "horizontal",
    );
    clickTrigger(host, "products");
    await frame();
    expect(events).toEqual(["detail"]);
    expect(trigger(host, "products").getAttribute("aria-expanded")).toBe("false");

    state.cancel = false;
    host.querySelector("nav")!.addEventListener(
      "starwind:value-change",
      (event) => {
        events.push("native");
        event.preventDefault();
      },
      { once: true },
    );
    clickTrigger(host, "products");
    await frame();
    expect(events).toEqual(["detail", "detail", "native"]);
    expect(trigger(host, "products").getAttribute("aria-expanded")).toBe("false");

    clickTrigger(host, "products");
    await frame();
    expect(events.slice(-2)).toEqual(["detail", "update"]);
    expect(trigger(host, "products").getAttribute("aria-expanded")).toBe("true");
    expect(
      trigger(host, "products")
        .querySelector("[data-sw-nav-menu-icon]")
        ?.getAttribute("data-state"),
    ).toBe("open");
    expect(
      document.querySelector("[data-sw-nav-menu-viewport]")?.contains(content("products")),
    ).toBe(true);

    state.orientation = "vertical";
    await frame();
    expect(host.querySelector("[data-sw-nav-menu-list]")?.getAttribute("data-orientation")).toBe(
      "vertical",
    );

    state.showCompany = true;
    await nextTick();
    await frame();
    expect(trigger(host, "company")).toBeTruthy();
    trigger(host, "products").focus();
    trigger(host, "products").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }),
    );
    await frame();
    expect(document.activeElement).toBe(trigger(host, "company"));

    state.showCompany = false;
    await frame();
    expect(host.querySelector('[data-test="company"]')).toBeNull();
    trigger(host, "products").focus();
    trigger(host, "products").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowDown" }),
    );
    expect(document.activeElement).toBe(trigger(host, "products"));
  });

  it("keeps string and element portal targets through lifecycle changes", async () => {
    const first = document.createElement("div");
    first.id = "first-portal";
    const second = document.createElement("div");
    document.body.append(first, second);
    const state = reactive({
      cancel: false,
      openDelay: 0,
      orientation: "horizontal" as const,
      portalContainer: "#first-portal" as string | HTMLElement,
      showCompany: false,
    });
    const { app, host } = mountMenu(state, { container: () => state.portalContainer });
    await frame();
    expect(first.querySelector("[data-sw-nav-menu-portal][data-floating-root]")).toBeTruthy();

    clickTrigger(host, "products");
    await frame();
    expect(first.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();
    clickTrigger(host, "products");
    await frame();
    expect(first.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();

    state.openDelay = 1;
    await frame();
    expect(first.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();

    state.portalContainer = second;
    await frame();
    clickTrigger(host, "products");
    await frame();
    expect(second.querySelector("[data-sw-nav-menu-portal][data-floating-root]")).toBeTruthy();
    expect(second.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();
    clickTrigger(host, "products");
    await frame();
    expect(second.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();

    app.unmount();
    expect(document.querySelector("[data-sw-nav-menu-portal]")).toBeNull();
  });

  it("keeps an initially open menu dialog-safe after Teleport activates", async () => {
    let rootApi: NavigationMenuPublic | null = null;
    const fixture = createOpenDialogHost();
    const state = reactive({
      cancel: false,
      orientation: "horizontal" as const,
      showCompany: false,
    });
    mountMenu(state, {
      defaultValue: "products",
      hostParent: fixture.content,
      rootRef: (value) => (rootApi = value),
    });

    await frame();
    const positioner = document.querySelector<HTMLElement>("[data-sw-nav-menu-positioner]")!;
    expect(fixture.content.contains(positioner)).toBe(true);
    expect(fixture.content.querySelector("[data-sw-floating-portal]")).toBeTruthy();

    fixture.dialog.close();
    await frame();
    expect(rootApi?.getValue()).toBeNull();
    expect(fixture.content.querySelector("[data-sw-floating-portal]")).toBeNull();
  });

  it("refreshes an initially open custom portal when its Vue target changes", async () => {
    const first = document.createElement("div");
    first.id = "initial-open-portal";
    const second = document.createElement("div");
    document.body.append(first, second);
    const state = reactive({
      cancel: false,
      orientation: "horizontal" as const,
      portalContainer: "#initial-open-portal" as string | HTMLElement,
      portalDisabled: false,
      showCompany: false,
    });
    const { host } = mountMenu(state, {
      container: () => state.portalContainer,
      defaultValue: "products",
      portalDisabled: () => state.portalDisabled,
    });

    await frame();
    expect(first.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();

    state.portalContainer = second;
    await frame();
    expect(second.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();

    state.portalDisabled = true;
    await frame();
    expect(host.querySelector("[data-sw-nav-menu-portal]")?.contains(positioner())).toBe(true);

    state.portalDisabled = false;
    await frame();
    expect(second.querySelector("[data-sw-nav-menu-positioner]")).toBeTruthy();
  });

  it("reads back a silent uncontrolled close after a later Vue render", async () => {
    let rootApi: NavigationMenuPublic | null = null;
    const state = reactive({
      cancel: false,
      orientation: "horizontal" as const,
      revision: 0,
      showCompany: true,
    });
    const { host } = mountMenu(state, { rootRef: (value) => (rootApi = value) });
    await frame();
    clickTrigger(host, "company");
    await frame();
    expect(rootApi?.getValue()).toBe("company");

    state.showCompany = false;
    await frame();
    expect(rootApi?.getValue()).toBeNull();
    state.showCompany = true;
    state.revision += 1;
    await frame();

    expect(host.querySelector("[data-projected-value]")?.getAttribute("data-projected-value")).toBe(
      "",
    );
    expect(host.querySelector("nav")?.getAttribute("data-state")).toBe("closed");
    expect(trigger(host, "company").getAttribute("data-state")).toBe("closed");
    expect(trigger(host, "company").getAttribute("aria-expanded")).toBe("false");
    expect(
      trigger(host, "company").querySelector("[data-sw-nav-menu-icon]")?.getAttribute("data-state"),
    ).toBe("closed");
    expect(rootApi?.getValue()).toBeNull();
  });

  it("preserves controlled intent through initial Portal activation", async () => {
    let rootApi: NavigationMenuPublic | null = null;
    const updates: Array<string | null> = [];
    const state = reactive({
      cancel: false,
      modelValue: "company" as string | null,
      orientation: "horizontal" as const,
      showCompany: false,
    });
    const { host } = mountMenu(state, {
      modelValue: () => state.modelValue,
      onValueUpdate: (value) => updates.push(value),
      rootRef: (value) => (rootApi = value),
    });

    await frame();
    expect(rootApi?.getValue()).toBeNull();
    expect(document.querySelector<HTMLElement>("[data-sw-nav-menu-popup]")!.hidden).toBe(true);

    state.showCompany = true;
    await frame();
    expect(rootApi?.getValue()).toBe("company");
    expect(trigger(host, "company").getAttribute("aria-expanded")).toBe("true");
    expect(
      document.querySelector("[data-sw-nav-menu-viewport]")?.contains(content("company")),
    ).toBe(true);
    expect(updates).toEqual([]);
  });

  it("keeps controlled intent across dynamic removal and reinsertion", async () => {
    const updates: Array<string | null> = [];
    const state = reactive({
      cancel: false,
      modelValue: null as string | null,
      orientation: "horizontal" as const,
      showCompany: false,
    });
    const { host } = mountMenu(state, {
      modelValue: () => state.modelValue,
      onValueUpdate: (value) => {
        updates.push(value);
        state.modelValue = value;
      },
    });
    await frame();
    clickTrigger(host, "products");
    await frame();
    expect(state.modelValue).toBe("products");
    expect(trigger(host, "products").getAttribute("aria-expanded")).toBe("true");

    state.modelValue = "company";
    await frame();
    expect(document.querySelector<HTMLElement>("[data-sw-nav-menu-popup]")!.hidden).toBe(true);

    state.showCompany = true;
    await frame();
    expect(trigger(host, "company").getAttribute("aria-expanded")).toBe("true");
    expect(
      document.querySelector("[data-sw-nav-menu-viewport]")?.contains(content("company")),
    ).toBe(true);

    state.showCompany = false;
    await frame();
    expect(document.querySelector<HTMLElement>("[data-sw-nav-menu-popup]")!.hidden).toBe(true);
    state.showCompany = true;
    await frame();
    expect(trigger(host, "company").getAttribute("data-state")).toBe("open");
    expect(updates).toEqual(["products"]);
  });

  it("keeps measurement and pointer transitions in Runtime and cleans owned resources", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const { app, host } = mountMenu(
      reactive({ cancel: false, orientation: "horizontal" as const, showCompany: true }),
    );
    await frame();
    trigger(host, "products").focus();
    trigger(host, "products").dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await frame();
    expect(document.activeElement).toBe(trigger(host, "company"));
    trigger(host, "products").dispatchEvent(new PointerEvent("pointerenter", { bubbles: true }));
    await new Promise((resolve) => setTimeout(resolve, 70));
    await frame();
    expect(trigger(host, "products").getAttribute("data-state")).toBe("open");
    const viewport = document.querySelector<HTMLElement>("[data-sw-nav-menu-viewport]")!;
    expect(viewport.style.getPropertyValue("--sw-nav-menu-viewport-width")).not.toBe("");
    app.unmount();
    expect(abort).toHaveBeenCalled();
    expect(document.querySelector("[data-sw-nav-menu-portal]")).toBeNull();
  });
});

type MenuState = {
  cancel: boolean;
  openDelay?: number;
  orientation: "horizontal" | "vertical";
  portalContainer?: string | HTMLElement;
  portalDisabled?: boolean;
  revision?: number;
  showCompany: boolean;
};
type NavigationMenuPublic = { getValue(): string | null | undefined };
const NavigationMenuValueProbe = defineComponent({
  props: { revision: Number },
  setup(props) {
    const root = useNavigationMenuRootContext("NavigationMenuValueProbe");
    return () =>
      h("span", {
        "data-projected-value": root.value.value ?? "",
        "data-revision": props.revision,
      });
  },
});
const PublicRootButton = defineComponent({
  inheritAttrs: false,
  props: { as: { default: "button", type: String } },
  setup(props, { attrs, slots }) {
    return () => h(props.as, attrs, slots.default?.());
  },
});
type Options = {
  container?: () => string | HTMLElement;
  defaultValue?: string | null;
  hostParent?: HTMLElement;
  modelValue?: () => string | null;
  onValueChange?: (value: string | null, detail: NavigationMenuValueChangeDetails) => void;
  onValueUpdate?: (value: string | null) => void;
  portalDisabled?: () => boolean;
  rootRef?: (value: NavigationMenuPublic | null) => void;
  triggerChild?: () => VNode;
  triggerProps?: Record<string, unknown>;
};

function mountMenu(state: MenuState, options: Options = {}) {
  const host = document.createElement("div");
  (options.hostParent ?? document.body).append(host);
  const app = createApp({ render: () => renderMenu(state, options) });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return { app, host };
}

function renderMenu(state: MenuState, options: Options) {
  const item = (value: string, label: string) =>
    h(
      NavigationMenuItem,
      { value },
      {
        default: () => [
          h(
            NavigationMenuTrigger,
            value === "products"
              ? { ...options.triggerProps, "data-test": value }
              : { "data-test": value },
            {
              default: () =>
                value === "products" && options.triggerChild
                  ? options.triggerChild()
                  : [label, h(NavigationMenuIcon)],
            },
          ),
          h(
            NavigationMenuContent,
            { "data-content": value },
            {
              default: () =>
                h(NavigationMenuLink, { href: `/${value}` }, { default: () => `${label} link` }),
            },
          ),
        ],
      },
    );
  return h(
    NavigationMenuRoot,
    {
      ...(options.modelValue ? { modelValue: options.modelValue() } : {}),
      defaultValue: options.defaultValue,
      "data-revision": state.revision,
      orientation: state.orientation,
      openDelay: state.openDelay ?? 0,
      ref: options.rootRef,
      onValueChange: options.onValueChange,
      "onUpdate:modelValue": options.onValueUpdate,
    },
    {
      default: () => [
        ...(state.revision === undefined
          ? []
          : [h(NavigationMenuValueProbe, { revision: state.revision })]),
        h(NavigationMenuList, null, {
          default: () => [
            item("products", "Products"),
            ...(state.showCompany ? [item("company", "Company")] : []),
          ],
        }),
        h(
          NavigationMenuPortal,
          {
            ...(options.container ? { container: options.container() } : {}),
            disabled: options.portalDisabled?.(),
          },
          {
            default: () =>
              h(NavigationMenuPositioner, null, {
                default: () =>
                  h(NavigationMenuPopup, null, { default: () => h(NavigationMenuViewport) }),
              }),
          },
        ),
      ],
    },
  );
}

function trigger(host: HTMLElement, value: string): HTMLElement {
  return host.querySelector<HTMLElement>(`[data-test="${value}"]`)!;
}
function content(value: string): HTMLElement {
  return document.querySelector<HTMLElement>(`[data-content="${value}"]`)!;
}
function clickTrigger(host: HTMLElement, value: string): void {
  trigger(host, value).click();
}
function positioner(): HTMLElement {
  return document.querySelector<HTMLElement>("[data-sw-nav-menu-positioner]")!;
}
function createOpenDialogHost() {
  const root = document.createElement("div");
  root.setAttribute("data-sw-dialog", "");
  root.innerHTML = `
    <button data-sw-dialog-trigger>Open dialog</button>
    <dialog data-sw-dialog-content data-slot="dialog-content"></dialog>
  `;
  document.body.append(root);
  const content = root.querySelector<HTMLDialogElement>("dialog")!;
  const dialog = createDialog(root);
  dialog.open();
  cleanups.push(() => dialog.destroy());
  return { content, dialog };
}
async function frame(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await nextTick();
}
