import { createApp, h, nextTick, ref } from "vue";
import { afterEach, describe, expect, it } from "vitest";

import {
  SidebarComponent,
  SidebarMenuButton,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@starwind-ui/vue/sidebar";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  localStorage.clear();
});

describe("Vue Sidebar public behavior", () => {
  it("runs uncontrolled desktop and mobile requests through Runtime", async () => {
    const desktop = mountSidebar({ defaultOpen: true, mobileQuery: "(max-width: 0px)" });
    await settle();
    desktop.querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!.click();
    await settle();
    expect(provider(desktop).dataset.state).toBe("collapsed");

    const mobile = mountSidebar({ defaultMobileOpen: false, mobileQuery: "(min-width: 0px)" });
    await settle();
    mobile.querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!.click();
    await settle();
    expect(provider(mobile).dataset.mobileOpen).toBe("true");
  });

  it("keeps controlled models accepted by the owner", async () => {
    const open = ref(false);
    const mobileOpen = ref(false);
    const host = mountSidebar(() => ({
      mobileOpen: mobileOpen.value,
      mobileQuery: "(max-width: 0px)",
      onMobileOpenChange: (value: boolean) => (mobileOpen.value = value),
      onOpenChange: (value: boolean) => (open.value = value),
      open: open.value,
    }));
    await settle();
    host.querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!.click();
    await settle();
    expect(open.value).toBe(true);
    expect(provider(host).dataset.state).toBe("expanded");
  });

  it("supports asChild controls and cleans up across remounts", async () => {
    const mounted = mountSidebarApp({ mobileQuery: "(max-width: 0px)" }, true);
    await settle();
    const link = mounted.host.querySelector<HTMLAnchorElement>("a")!;
    expect(link.hasAttribute("data-sw-sidebar-trigger")).toBe(true);
    link.click();
    await settle();
    expect(provider(mounted.host).dataset.state).toBe("collapsed");
    mounted.app.unmount();
    cleanups.pop();

    const remounted = mountSidebar({ defaultOpen: false, mobileQuery: "(max-width: 0px)" });
    await settle();
    remounted.querySelector<HTMLButtonElement>("[data-sw-sidebar-rail]")!.click();
    await settle();
    expect(provider(remounted).dataset.state).toBe("expanded");
  });

  it("tracks responsive transitions and Runtime request operations", async () => {
    const mobileQuery = ref("(max-width: 0px)");
    const host = mountSidebar(() => ({
      defaultMobileOpen: false,
      defaultOpen: true,
      mobileQuery: mobileQuery.value,
    }));
    await settle();
    expect(
      host.querySelector<HTMLElement>("[data-sw-sidebar-trigger]")!.getAttribute("aria-expanded"),
    ).toBe("true");

    mobileQuery.value = "(min-width: 0px)";
    await settle();
    expect(
      host.querySelector<HTMLElement>("[data-sw-sidebar-trigger]")!.getAttribute("aria-expanded"),
    ).toBe("false");

    mobileQuery.value = "(max-width: 0px)";
    await settle();
    provider(host).dispatchEvent(new CustomEvent("sidebar:toggle"));
    await settle();
    expect(provider(host).dataset.state).toBe("collapsed");

    document.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, ctrlKey: true, key: "b" }),
    );
    await settle();
    expect(provider(host).dataset.state).toBe("expanded");
  });

  it("keeps persistence opt-in and isolates focused instances", async () => {
    const persistenceKey = "starwind-vue-sidebar-test";
    const persisted = mountSidebarApp({
      defaultOpen: true,
      mobileQuery: "(max-width: 0px)",
      persistOpen: true,
      persistenceKey,
      persistenceStorage: "localStorage",
    });
    await settle();
    persisted.host.querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!.click();
    await settle();
    persisted.app.unmount();
    cleanups.pop();

    const first = mountSidebar({
      defaultOpen: true,
      mobileQuery: "(max-width: 0px)",
      persistOpen: true,
      persistenceKey,
      persistenceStorage: "localStorage",
    });
    const second = mountSidebar({ defaultOpen: false, mobileQuery: "(max-width: 0px)" });
    await settle();
    expect(provider(first).dataset.state).toBe("collapsed");

    const trigger = first.querySelector<HTMLButtonElement>("[data-sw-sidebar-trigger]")!;
    trigger.focus();
    trigger.click();
    await settle();
    expect(document.activeElement).toBe(trigger);
    expect(provider(first).dataset.state).toBe("expanded");
    expect(provider(second).dataset.state).toBe("collapsed");
  });

  it("keeps nested providers isolated", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () =>
        h(SidebarProvider, { defaultOpen: true, mobileQuery: "(max-width: 0px)" }, () => [
          h(SidebarTrigger, null, () => "Outer"),
          h(SidebarProvider, { defaultOpen: false, mobileQuery: "(max-width: 0px)" }, () =>
            h(SidebarTrigger, null, () => "Inner"),
          ),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    await settle();

    const providers = host.querySelectorAll<HTMLElement>("[data-sw-sidebar-provider]");
    const triggers = host.querySelectorAll<HTMLButtonElement>("[data-sw-sidebar-trigger]");
    triggers[1]!.click();
    await settle();
    expect(providers[0]!.dataset.state).toBe("expanded");
    expect(providers[1]!.dataset.state).toBe("expanded");
  });
});

function mountSidebar(props: Record<string, unknown> | (() => Record<string, unknown>)) {
  return mountSidebarApp(props).host;
}

function mountSidebarApp(
  props: Record<string, unknown> | (() => Record<string, unknown>),
  asChild = false,
) {
  const host = document.createElement("div");
  document.body.append(host);
  const app = createApp({
    render: () => {
      const values = typeof props === "function" ? props() : props;
      return h(SidebarProvider, values, () => [
        h(SidebarComponent, { collapsible: "icon" }, () => "Sidebar"),
        h(SidebarTrigger, { asChild }, () =>
          asChild ? h("a", { href: "#sidebar" }, "Toggle") : "Toggle",
        ),
        h(SidebarRail),
        h(SidebarMenuButton, null, () => "Menu"),
      ]);
    },
  });
  app.mount(host);
  cleanups.push(() => app.unmount());
  return { app, host };
}

function provider(host: HTMLElement): HTMLElement {
  return host.querySelector<HTMLElement>("[data-sw-sidebar-provider]")!;
}

async function settle(): Promise<void> {
  await nextTick();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await nextTick();
}
