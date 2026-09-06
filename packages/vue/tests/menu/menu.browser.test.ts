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

import type {
  MenuCheckedChangeDetails,
  MenuOpenChangeDetails,
  MenuValueChangeDetails,
} from "@starwind-ui/runtime/menu";
import {
  MenuCheckboxItem,
  MenuCheckboxItemIndicator,
  MenuGroup,
  MenuItem,
  MenuLabel,
  MenuLinkItem,
  MenuPopup,
  MenuPortal,
  MenuPositioner,
  MenuRadioGroup,
  MenuRadioItem,
  MenuRadioItemIndicator,
  MenuRoot,
  MenuSubmenuRoot,
  MenuSubmenuTrigger,
  MenuTrigger,
} from "@starwind-ui/vue/menu";

describe("Vue Menu", () => {
  const cleanups: Array<() => void> = [];
  afterEach(() => {
    cleanups
      .splice(0)
      .reverse()
      .forEach((cleanup) => cleanup());
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("composes a component trigger through its public native root", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const primitiveRef = ref<ComponentPublicInstance & { element: HTMLElement | null }>();
    const childRef = ref<ComponentPublicInstance>();
    const state = reactive({ as: "button" as "a" | "button" });
    const calls: string[] = [];
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderMenu({
          portalDisabled: true,
          triggerChild: h(
            PublicRootButton,
            {
              as: state.as,
              class: "child",
              href: state.as === "a" ? "#actions" : undefined,
              onClick: () => calls.push("child"),
              ref: childRef,
            },
            { default: () => "Actions" },
          ),
          triggerProps: {
            asChild: true,
            class: "wrapper",
            onClick: () => calls.push("wrapper"),
            ref: primitiveRef,
          },
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    const button = host.querySelector<HTMLElement>("[data-sw-menu-trigger]")!;
    expect(button.className).toContain("child");
    expect(button.className).toContain("wrapper");
    expect(primitiveRef.value?.element).toBe(button);
    expect(childRef.value?.$el).toBe(button);
    button.click();
    await frame();
    expect(calls).toEqual(["child", "wrapper"]);
    expect(button.getAttribute("aria-expanded")).toBe("true");
    button.click();
    await frame();
    expect(button.getAttribute("aria-expanded")).toBe("false");

    const detachedButton = button;
    state.as = "a";
    await frame();
    const replacement = host.querySelector<HTMLElement>("[data-sw-menu-trigger]")!;
    expect(replacement.tagName).toBe("A");
    expect(replacement).not.toBe(detachedButton);
    expect(primitiveRef.value?.element).toBe(replacement);
    expect(childRef.value?.$el).toBe(replacement);
    expect(abort).toHaveBeenCalledTimes(2);

    detachedButton.click();
    await frame();
    expect(replacement.getAttribute("aria-expanded")).toBe("false");
    replacement.click();
    await frame();
    expect(replacement.getAttribute("aria-expanded")).toBe("true");

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(4);
    expect(primitiveRef.value).toBeNull();
    expect(childRef.value).toBeNull();
  });

  it("delegates pointer, keyboard, typeahead, dynamic collection, and focus restoration to Runtime", async () => {
    const items = ref(["Edit", "Archive"]);
    const host = appendHost();
    const app = createApp({
      render: () => renderMenu({ items: items.value, portalDisabled: true }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!;

    trigger.click();
    await frame();
    const popup = host.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    expect(popup.hidden).toBe(false);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");

    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    await frame();
    expect(document.activeElement?.textContent).toContain("Archive");

    items.value.push("Zulu");
    await frame();
    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await frame();
    trigger.click();
    await frame();
    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "z" }));
    await frame();
    expect(document.activeElement?.textContent).toContain("Zulu");

    popup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }));
    await frame();
    expect(popup.hidden).toBe(true);
    expect(document.activeElement).toBe(trigger);
  });

  it("runs detailed events before accepted checkbox, radio, and open model updates", async () => {
    const events: string[] = [];
    const state = reactive({ cancelChecked: true, cancelOpen: true, cancelValue: true });
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderMenu({
          onCheckedChange: (_checked: boolean, detail: MenuCheckedChangeDetails) => {
            events.push("checked-detail");
            if (state.cancelChecked) detail.cancel();
          },
          onCheckedUpdate: () => events.push("checked-update"),
          onOpenChange: (_open: boolean, detail: MenuOpenChangeDetails) => {
            events.push("open-detail");
            if (state.cancelOpen) detail.cancel();
          },
          onOpenUpdate: () => events.push("open-update"),
          onValueChange: (_value: string, detail: MenuValueChangeDetails) => {
            events.push("value-detail");
            if (state.cancelValue) detail.cancel();
          },
          onValueUpdate: () => events.push("value-update"),
          portalDisabled: true,
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!;

    trigger.click();
    await frame();
    expect(events).toEqual(["open-detail"]);
    expect(trigger.getAttribute("aria-expanded")).toBe("false");

    state.cancelOpen = false;
    trigger.click();
    await frame();
    expect(events.slice(-2)).toEqual(["open-detail", "open-update"]);
    const checkbox = host.querySelector<HTMLElement>("[data-sw-menu-checkbox-item]")!;
    checkbox.click();
    await frame();
    expect(events.at(-1)).toBe("checked-detail");
    expect(checkbox.getAttribute("aria-checked")).toBe("false");

    state.cancelChecked = false;
    checkbox.click();
    await frame();
    expect(events.slice(-2)).toEqual(["checked-detail", "checked-update"]);
    expect(checkbox.getAttribute("aria-checked")).toBe("true");

    const radio = host.querySelector<HTMLElement>('[data-sw-menu-radio-item][data-value="grid"]')!;
    radio.click();
    await frame();
    expect(events.at(-1)).toBe("value-detail");
    expect(radio.getAttribute("aria-checked")).toBe("false");

    state.cancelValue = false;
    radio.click();
    await frame();
    expect(events.slice(-2)).toEqual(["value-detail", "value-update"]);
    expect(radio.getAttribute("aria-checked")).toBe("true");
  });

  it("teleports nested submenu portals beside the root portal and cleans exact Runtime resources", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const overlays = document.createElement("div");
    overlays.id = "menu-overlays";
    document.body.append(overlays);
    const host = appendHost();
    const app = createApp({ render: () => renderMenu({ container: overlays, modal: true }) });
    app.mount(host);
    await frame();

    expect(overlays.querySelectorAll(":scope > [data-sw-menu-portal]")).toHaveLength(2);
    expect(overlays.querySelectorAll("[data-sw-menu-portal]")).toHaveLength(2);
    const submenuRoot = overlays.querySelector<HTMLElement>("[data-sw-menu-submenu-root]")!;
    const rootPortal = submenuRoot.closest<HTMLElement>("[data-sw-menu-portal]")!;
    const submenuPortal = [...overlays.querySelectorAll<HTMLElement>("[data-sw-menu-portal]")].find(
      (portal) => portal !== rootPortal,
    )!;
    expect(rootPortal.dataset.placement).toBe("ready");
    expect(submenuPortal.dataset.placement).toBe("ready");
    expect(rootPortal.contains(submenuPortal)).toBe(false);
    expect(submenuPortal.parentElement).toBe(overlays);
    const trigger = host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!;
    trigger.click();
    await frame();
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);
    const submenuTrigger = overlays.querySelector<HTMLElement>("[data-sw-menu-submenu-trigger]")!;
    submenuTrigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await frame();
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(overlays.querySelectorAll("[data-sw-menu-popup]:not([hidden])")).toHaveLength(2);
    const submenuPopup = submenuPortal.querySelector<HTMLElement>("[data-sw-menu-popup]")!;
    expect(document.activeElement?.textContent).toContain("Duplicate");
    submenuPopup.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" }));
    await frame();
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(submenuTrigger);
    submenuTrigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await frame();
    const submenuPositioner = submenuPortal.querySelector<HTMLElement>(
      "[data-sw-menu-positioner]",
    )!;
    expect(submenuPortal.dataset.placement).toBe("ready");
    expect(submenuPositioner.style.left).not.toBe("");
    expect(submenuPositioner.style.top).not.toBe("");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Escape" }),
    );
    await frame();
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("false");
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
    submenuTrigger.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );
    await frame();
    expect(submenuTrigger.getAttribute("aria-expanded")).toBe("true");
    expect(submenuPortal.dataset.placement).toBe("ready");

    app.unmount();
    expect(abort).toHaveBeenCalledTimes(2);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(overlays.children).toHaveLength(0);
    expect(host.children).toHaveLength(0);

    const remountedApp = createApp({
      render: () => renderMenu({ container: overlays, modal: true }),
    });
    remountedApp.mount(host);
    await frame();
    expect(overlays.querySelectorAll(":scope > [data-sw-menu-portal]")).toHaveLength(2);
    remountedApp.unmount();
    expect(abort).toHaveBeenCalledTimes(4);
    expect(overlays.children).toHaveLength(0);
  });

  it("restores controlled checkbox and radio item plus indicator state after accepted requests", async () => {
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderMenu({
          checked: false,
          portalDisabled: true,
          radioValue: "list",
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!.click();
    await frame();

    const checkbox = host.querySelector<HTMLElement>("[data-sw-menu-checkbox-item]")!;
    checkbox.click();
    await frame();
    expect(checkbox.getAttribute("aria-checked")).toBe("false");
    expect(
      checkbox.querySelector("[data-sw-menu-checkbox-item-indicator]")?.hasAttribute("data-hidden"),
    ).toBe(true);

    const grid = host.querySelector<HTMLElement>('[data-sw-menu-radio-item][data-value="grid"]')!;
    grid.click();
    await frame();
    expect(grid.getAttribute("aria-checked")).toBe("false");
    expect(
      grid.querySelector("[data-sw-menu-radio-item-indicator]")?.hasAttribute("data-hidden"),
    ).toBe(true);
    expect(
      host
        .querySelector('[data-sw-menu-radio-item][data-value="list"]')
        ?.getAttribute("aria-checked"),
    ).toBe("true");
  });

  it("keeps the radio group model authoritative over a conflicting item checked prop", async () => {
    const items = ref(["Edit"]);
    const gridChecked = ref(true);
    const host = appendHost();
    const app = createApp({
      render: () =>
        renderMenu({
          items: items.value,
          portalDisabled: true,
          radioValue: "list",
          gridChecked: gridChecked.value,
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!.click();
    await frame();

    assertRadioState(host, "list", true);
    assertRadioState(host, "grid", false);

    gridChecked.value = false;
    items.value.push("Archive");
    await frame();
    gridChecked.value = true;
    await frame();

    assertRadioState(host, "list", true);
    assertRadioState(host, "grid", false);
  });

  it("keeps the group name synchronized with a reactive heading", async () => {
    const heading = ref("Actions");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(MenuRoot, null, {
          default: () => [
            h(MenuTrigger, null, { default: () => "Open" }),
            h(
              MenuPortal,
              { disabled: true },
              {
                default: () =>
                  h(MenuPositioner, null, {
                    default: () =>
                      h(MenuPopup, null, {
                        default: () =>
                          h(MenuGroup, null, {
                            default: () => [
                              h(MenuLabel, null, { default: () => heading.value }),
                              h(MenuItem, null, { default: () => "Edit" }),
                            ],
                          }),
                      }),
                  }),
              },
            ),
          ],
        }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    host.querySelector<HTMLButtonElement>("[data-sw-menu-trigger]")!.click();
    await frame();
    const group = host.querySelector<HTMLElement>("[data-sw-menu-group]")!;

    expect(group).toHaveAccessibleName("Actions");
    heading.value = "Project actions";
    await frame();
    expect(group).toHaveAccessibleName("Project actions");
  });
});

type RenderMenuOptions = {
  checked?: boolean;
  container?: string | HTMLElement;
  gridChecked?: boolean;
  items?: string[];
  modal?: boolean;
  onCheckedChange?: (checked: boolean, detail: MenuCheckedChangeDetails) => void;
  onCheckedUpdate?: (checked: boolean) => void;
  onOpenChange?: (open: boolean, detail: MenuOpenChangeDetails) => void;
  onOpenUpdate?: (open: boolean) => void;
  onValueChange?: (value: string, detail: MenuValueChangeDetails) => void;
  onValueUpdate?: (value: string) => void;
  portalDisabled?: boolean;
  radioValue?: string;
  triggerChild?: VNode;
  triggerProps?: Record<string, unknown>;
};

function renderMenu(options: RenderMenuOptions = {}) {
  return h(
    MenuRoot,
    {
      modal: options.modal,
      onOpenChange: options.onOpenChange,
      "onUpdate:open": options.onOpenUpdate,
    },
    {
      default: () => [
        h(MenuTrigger, options.triggerProps, {
          default: () => options.triggerChild ?? "Actions",
        }),
        h(
          MenuPortal,
          { container: options.container, disabled: options.portalDisabled },
          {
            default: () =>
              h(MenuPositioner, null, {
                default: () =>
                  h(MenuPopup, null, {
                    default: () => [
                      ...(options.items ?? ["Edit"]).map((item) =>
                        h(MenuItem, { key: item }, { default: () => item }),
                      ),
                      h(MenuLinkItem, { href: "/docs" }, { default: () => "Docs" }),
                      h(
                        MenuCheckboxItem,
                        {
                          checked: options.checked,
                          onCheckedChange: options.onCheckedChange,
                          "onUpdate:checked": options.onCheckedUpdate,
                        },
                        {
                          default: () => [
                            "Pinned",
                            h(MenuCheckboxItemIndicator, null, { default: () => "yes" }),
                          ],
                        },
                      ),
                      h(
                        MenuRadioGroup,
                        {
                          defaultValue: "list",
                          modelValue: options.radioValue,
                          onValueChange: options.onValueChange,
                          "onUpdate:modelValue": options.onValueUpdate,
                        },
                        {
                          default: () => [
                            h(
                              MenuRadioItem,
                              { value: "list" },
                              { default: () => ["List", h(MenuRadioItemIndicator)] },
                            ),
                            h(
                              MenuRadioItem,
                              { value: "grid", checked: options.gridChecked },
                              { default: () => ["Grid", h(MenuRadioItemIndicator)] },
                            ),
                          ],
                        },
                      ),
                      h(MenuSubmenuRoot, null, {
                        default: () => [
                          h(MenuSubmenuTrigger, null, { default: () => "More" }),
                          h(
                            MenuPortal,
                            { container: options.container },
                            {
                              default: () =>
                                h(
                                  MenuPositioner,
                                  { side: "right" },
                                  {
                                    default: () =>
                                      h(MenuPopup, null, {
                                        default: () =>
                                          h(MenuItem, null, { default: () => "Duplicate" }),
                                      }),
                                  },
                                ),
                            },
                          ),
                        ],
                      }),
                    ],
                  }),
              }),
          },
        ),
      ],
    },
  );
}

const PublicRootButton = defineComponent({
  inheritAttrs: false,
  props: { as: { default: "button", type: String } },
  setup(props, { attrs, slots }) {
    return () => h(props.as, attrs, slots.default?.());
  },
});

function assertRadioState(host: HTMLElement, value: string, checked: boolean): void {
  const item = host.querySelector<HTMLElement>(`[data-sw-menu-radio-item][data-value="${value}"]`)!;
  const indicator = item.querySelector<HTMLElement>("[data-sw-menu-radio-item-indicator]")!;
  expect(item.getAttribute("aria-checked")).toBe(String(checked));
  expect(item.hasAttribute(checked ? "data-checked" : "data-unchecked")).toBe(true);
  expect(indicator.getAttribute("data-state")).toBe(checked ? "checked" : "unchecked");
  expect(indicator.hasAttribute(checked ? "data-visible" : "data-hidden")).toBe(true);
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function frame(): Promise<void> {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await nextTick();
}
