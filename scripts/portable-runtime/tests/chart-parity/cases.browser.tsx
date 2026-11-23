// Cross-framework cases beyond the prototype modes: tooltip bodies and registration order,
// generated ids, legend cancellation and sync, one-way visibility, live tooltip content, keyboard
// keys and pointer parity (SPEC-AC-06, SPEC-AC-08, SPEC-AC-10, SPEC-AC-11, SPEC-AC-13,
// SPEC-AC-24).
import { getChartController } from "@starwind-ui/runtime/chart";
import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { orderLog } from "./fixtures/modules";
import {
  barCount,
  blur,
  chartRoot,
  cleanup,
  FRAMEWORKS,
  type Framework,
  legendItem,
  legends,
  parseServer,
  press,
  serverHtml,
  settle,
  slotShape,
  start,
  status,
  tooltipContent,
  waitForContent,
} from "./harness";

afterEach(cleanup);

/** Starts a case and asserts that it logged no hydration or framework warning. */
async function startClean(framework: Framework, mode: ParityCase) {
  const mounted = await start(framework, mode);
  expect(mounted.warnings).toEqual([]);
  return mounted;
}

function visibleEvents(root: HTMLElement): string[][] {
  const events: string[][] = [];
  root.addEventListener("starwind-chart:visible-change", (event) =>
    events.push((event as CustomEvent<{ visible: string[] }>).detail.visible),
  );
  return events;
}

for (const framework of FRAMEWORKS) {
  describe(`${framework} chart parity cases`, () => {
    it("renders plain tooltip body content inside the tooltip only", async () => {
      expect(
        parseServer(await serverHtml(framework, "plain-body")).querySelector(".plain-body"),
      ).toBeNull();
      const { element } = await startClean(framework, "plain-body");
      expect(element.querySelector(".plain-body")).toBeNull();
      await press(element, "Home");
      await vi.waitFor(() =>
        expect(status()?.querySelector(".plain-body")?.textContent?.trim()).toBe("plain"),
      );
      expect(tooltipContent()).toBeNull();
      await vi.waitFor(() => expect(status()!.getAttribute("aria-label")).toMatch(/^plain\n/));
    });

    it("renders a plain heading and a ChartTooltipContent from one body", async () => {
      const { element } = await startClean(framework, "mixed-body");
      expect(element.querySelector(".mixed-heading")).toBeNull();
      await press(element, "Home");
      const content = await waitForContent();
      expect(content.className).toContain("mixed-content");
      expect(content.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(2);
      expect(document.querySelectorAll(".mixed-heading")).toHaveLength(1);
      expect(status()!.querySelector(".mixed-heading")?.textContent?.trim()).toBe("Heading");
      // The heading is in the tooltip and in its accessible label.
      await vi.waitFor(() =>
        expect(status()!.getAttribute("aria-label")).toMatch(
          /^Heading January Desktop web 186 Mobile 80\n/,
        ),
      );
    });

    it("renders a ChartTooltip inside a tooltip body in place", async () => {
      const { element } = await startClean(framework, "nested-tooltip");
      expect(element.querySelector(".inner")).toBeNull();
      await press(element, "Home");
      await vi.waitFor(() =>
        expect(status()?.querySelector(".outer .inner")?.textContent?.trim()).toBe("inner"),
      );
      expect(status()!.querySelectorAll(".inner")).toHaveLength(1);
    });

    it("lets the first registered ChartTooltip supply the body", async () => {
      const mounted = await startClean(framework, "order");
      const { element, controls } = mounted;
      await press(element, "Home");
      expect((await waitForContent()).className).toContain("first");
      expect(document.querySelector(".second")).toBeNull();
      if (framework === "astro") {
        // Astro resolves the order on the server and has no client re-render or removal.
        expect(element.querySelectorAll("template[data-sw-chart-tooltip]")).toHaveLength(1);
        return;
      }
      // A parent re-render does not change the order.
      controls.rerender!();
      await settle();
      expect(element.querySelector("[data-tick]")?.textContent).toBe("1");
      await blur(element);
      await press(element, "Home");
      expect((await waitForContent()).className).toContain("first");
      // Removing the first hands the body to the next one.
      controls.removeFirst!();
      await settle();
      await blur(element);
      await press(element, "Home");
      await vi.waitFor(() => expect(tooltipContent()?.className).toContain("second"));
      expect(document.querySelector(".first")).toBeNull();
      // Removing the last one hands the body to the default dot tooltip.
      controls.removeSecond!();
      await settle();
      await blur(element);
      await press(element, "Home");
      await vi.waitFor(() => expect(tooltipContent()?.className).not.toContain("second"));
      expect(tooltipContent()!.dataset.indicator).toBe("dot");
      expect(document.querySelector(".first, .second")).toBeNull();
    });

    it("lets a container tooltip body win over a sibling ChartTooltip", async () => {
      const { element } = await startClean(framework, "precedence");
      await press(element, "Home");
      await vi.waitFor(() =>
        expect(status()?.querySelector(".container-body")?.textContent?.trim()).toBe("container"),
      );
      expect(document.querySelector(".child-body")).toBeNull();
      expect(tooltipContent()).toBeNull();
    });

    it("shows no tooltip body with tooltip={false} and a ChartTooltip child", async () => {
      const { element } = await startClean(framework, "off-child");
      await press(element, "Home");
      await settle();
      expect(document.querySelector(".child-body")).toBeNull();
      expect(status()?.textContent ?? "").toBe("");
    });

    it("renders the label and color tooltip content options", async () => {
      const { element } = await startClean(framework, "options");
      await press(element, "Home");
      const content = await waitForContent();
      // A heading equal to a config key shows that key's config label, here the rich label.
      expect(
        content.querySelector("[data-slot=chart-tooltip-label] strong[data-rich-label]")
          ?.textContent,
      ).toMatch(/^\s*Desktop\s+web\s*$/);
      // The color option replaces each row's series color.
      for (const row of content.querySelectorAll<HTMLElement>("[data-slot=chart-tooltip-item]"))
        expect(row.querySelector<HTMLElement>("[data-slot=chart-tooltip-icon]")!.style.color).toBe(
          "rgb(255, 0, 0)",
        );
    });

    it("renders the labelKey, nameKey and valueKey tooltip content options", async () => {
      const { element } = await startClean(framework, "keys");
      await press(element, "Home");
      const content = await waitForContent();
      expect(content.querySelector("[data-slot=chart-tooltip-label]")?.textContent).toBe(
        "January-desktop",
      );
      expect(
        [...content.querySelectorAll("[data-slot=chart-tooltip-value]")].map((n) => n.textContent),
      ).toEqual(["186", "80"]);
    });

    it("generates valid, unique ids that match between server and client", async () => {
      const serverIds = [
        ...parseServer(await serverHtml(framework, "ids")).querySelectorAll<HTMLElement>(
          '[data-slot="chart"]',
        ),
      ].map((root) => root.dataset.chart);
      expect(serverIds).toHaveLength(2);
      expect(new Set(serverIds).size).toBe(2);
      for (const id of serverIds) expect(id).toMatch(/^chart-[a-zA-Z0-9_-]+$/);

      const { element } = await startClean(framework, "ids");
      const roots = [...element.querySelectorAll<HTMLElement>('[data-slot="chart"]')];
      expect(roots.map((root) => root.dataset.chart)).toEqual(serverIds);
      for (const root of roots) {
        expect(root.dataset.state).toBe("active");
        expect(root.querySelector("[data-slot=chart-style]")?.textContent).toContain(
          `[data-chart="${root.dataset.chart}"]`,
        );
        expect(getChartController(root)?.root).toBe(root);
      }
      // The two charts are independent: a toggle and a tooltip in one leave the other alone.
      const [first, second] = roots as [HTMLElement, HTMLElement];
      legendItem(first, "desktop").click();
      await settle();
      expect(legendItem(first, "desktop").getAttribute("aria-pressed")).toBe("false");
      expect(legendItem(second, "desktop").getAttribute("aria-pressed")).toBe("true");
      expect(barCount(first)).toBe(3);
      expect(barCount(second)).toBe(6);
      await press(second, "Home");
      await vi.waitFor(() =>
        expect(tooltipContent()?.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(
          2,
        ),
      );
      expect(tooltipContent()!.dataset.chart).toBe(second.dataset.chart);
      await blur(second);
      await press(first, "Home");
      await vi.waitFor(() =>
        expect(tooltipContent()?.querySelectorAll("[data-slot=chart-tooltip-item]")).toHaveLength(
          1,
        ),
      );
      expect(tooltipContent()!.dataset.chart).toBe(first.dataset.chart);
    });

    it("cancels a legend toggle from a consumer click handler", async () => {
      const { element } = await startClean(framework, "cancel");
      const desktop = legendItem(element, "desktop");
      // Astro has no component handler, so the page adds a click listener to the item.
      if (framework === "astro")
        desktop.addEventListener("click", (event) => event.preventDefault());
      const events = visibleEvents(chartRoot(element));

      desktop.click();
      await settle();
      expect(desktop.getAttribute("aria-pressed")).toBe("true");
      expect(barCount(element)).toBe(6);

      legendItem(element, "mobile").click();
      await settle();
      expect(legendItem(element, "mobile").getAttribute("aria-pressed")).toBe("false");
      expect(barCount(element)).toBe(3);
      expect(events).toEqual([["desktop"]]);
    });

    it("keeps every ChartLegend in step after a toggle", async () => {
      const { element } = await startClean(framework, "legends");
      const [wrapped, plain] = legends(element);
      expect(wrapped!.parentElement!.hasAttribute("data-wrapper")).toBe(true);
      expect(wrapped!.querySelectorAll("[data-slot=chart-legend-icon]")).toHaveLength(2);
      expect(plain!.querySelectorAll("[data-slot=chart-legend-swatch]")).toHaveLength(2);

      legendItem(plain!, "mobile").click();
      await settle();
      for (const legend of [wrapped!, plain!]) {
        expect(legendItem(legend, "mobile").getAttribute("aria-pressed")).toBe("false");
        expect(legendItem(legend, "mobile").dataset.state).toBe("off");
        expect(legendItem(legend, "desktop").getAttribute("aria-pressed")).toBe("true");
      }
      expect(barCount(element)).toBe(3);
    });

    it("holds a one-way visible model after a legend click", async () => {
      const { element } = await startClean(framework, "one-way");
      const root = chartRoot(element);
      const desktop = legendItem(element, "desktop");
      if (framework === "astro") {
        // Astro has no parent component, so `visible` is only the starting value. A page holds
        // the visible keys by canceling the cancelable visible-change event (SPEC-AC-11).
        desktop.click();
        await settle();
        expect(desktop.getAttribute("aria-pressed")).toBe("false");
        root.addEventListener("starwind-chart:visible-change", (event) => event.preventDefault());
        const mobile = legendItem(element, "mobile");
        mobile.click();
        await settle();
        expect(mobile.getAttribute("aria-pressed")).toBe("true");
        expect(barCount(element)).toBe(3);
        return;
      }
      desktop.click();
      await settle();
      expect(desktop.getAttribute("aria-pressed")).toBe("true");
      expect(barCount(element)).toBe(6);
    });

    it("dispatches the same chart events, and a canceled visible-change keeps the series", async () => {
      const { element } = await startClean(framework, "default");
      const root = chartRoot(element);
      const events: string[] = [];
      for (const name of ["focus-change", "select", "visible-change"])
        root.addEventListener(`starwind-chart:${name}`, (event) => {
          const detail = (
            event as CustomEvent<{ point?: { key: string } | null; visible?: string[] }>
          ).detail;
          events.push(
            `${name} ${detail.visible?.join(",") ?? detail.point?.key.split(":").at(-1)}`,
          );
        });
      await press(element, "Home");
      await press(element, "End");
      await press(element, "Enter");
      await blur(element);
      legendItem(element, "mobile").click();
      await settle();
      root.addEventListener("starwind-chart:visible-change", (event) => event.preventDefault());
      legendItem(element, "desktop").click();
      await settle();
      expect(events).toEqual([
        "focus-change January-desktop",
        "focus-change March-desktop",
        "select March-desktop",
        "visible-change desktop",
        // The toggle rebuilds the scene, and TanStack reports the kept focus point again.
        "focus-change March-desktop",
        "visible-change ",
      ]);
      expect(legendItem(element, "desktop").getAttribute("aria-pressed")).toBe("true");
      expect(barCount(element)).toBe(3);
    });

    it("renders the same portable tooltip icon", async () => {
      const { element } = await startClean(framework, "parts");
      await press(element, "Home");
      await waitForContent();
      const svg = status()!.querySelector("[data-slot=chart-tooltip-icon] svg")!;
      const names = [...svg.attributes].map((attribute) => attribute.name).sort();
      const full = [
        "aria-hidden",
        "fill",
        "focusable",
        "height",
        "stroke",
        "stroke-linecap",
        "stroke-linejoin",
        "stroke-width",
        "viewBox",
        "width",
      ];
      expect(names).toEqual(full);
    });

    it("follows tooltip body content that changes while the tooltip is open", async () => {
      const { element, controls } = await startClean(framework, "live-body");
      await press(element, "Home");
      await vi.waitFor(() =>
        expect(status()?.querySelector(".live-body")?.textContent?.trim()).toBe("count 0"),
      );
      // Astro renders the body once on the server and has no client state to change.
      if (framework === "astro") return;
      controls.bump!();
      await settle();
      expect(document.activeElement).toBe(element.querySelector("svg.ts-chart"));
      await vi.waitFor(() =>
        expect(status()?.querySelector(".live-body")?.textContent?.trim()).toBe("count 1"),
      );
      await vi.waitFor(() => expect(status()!.getAttribute("aria-label")).toMatch(/^count 1\n/));
    });

    it("moves the Starwind tooltip with Home, End and the arrow keys", async () => {
      const { element } = await startClean(framework, "default");
      for (const [key, month, desktop, mobile] of [
        ["Home", "January", "186", "80"],
        ["End", "March", "237", "120"],
        ["ArrowLeft", "February", "305", "200"],
        ["ArrowRight", "March", "237", "120"],
      ] as const) {
        await press(element, key);
        await vi.waitFor(() =>
          expect(
            tooltipContent()?.querySelector("[data-slot=chart-tooltip-label]")?.textContent,
          ).toBe(month),
        );
        const values = [
          ...tooltipContent()!.querySelectorAll("[data-slot=chart-tooltip-value]"),
        ].map((node) => node.textContent);
        expect(values).toEqual([desktop, mobile]);
        await vi.waitFor(() =>
          expect(status()!.getAttribute("aria-label")).toMatch(
            new RegExp(`^${month} Desktop web ${desktop} Mobile ${mobile}\\n`),
          ),
        );
      }
    });

    it("shows the same tooltip for the pointer as for the keyboard", async () => {
      const { element } = await startClean(framework, "default");
      await press(element, "Home");
      const keyboard = slotShape(await waitForContent());
      const keyboardLabel = status()!.getAttribute("aria-label");
      await blur(element);
      await vi.waitFor(() => expect(status()!.hidden).toBe(true));

      await userEvent.hover(element.querySelector('rect[data-ts-key^="visitors:"]')!);
      await vi.waitFor(() =>
        expect(
          tooltipContent()?.querySelector("[data-slot=chart-tooltip-label]")?.textContent,
        ).toBe("January"),
      );
      expect(slotShape(tooltipContent()!)).toEqual(keyboard);
      await vi.waitFor(() => expect(status()!.getAttribute("aria-label")).toBe(keyboardLabel));
    });
  });
}

describe("Astro chart slot rules", () => {
  it("uses one icon source for a key that has a config icon and an icon slot", async () => {
    const server = parseServer(await serverHtml("astro", "icon-source"));
    // The icon-mobile slot wins over the portable config icon, as a framework icon in the React,
    // Vue and Svelte config does. The server legend and the started chart show the same icon.
    expect(legendItem(server, "mobile").querySelector("[data-component-icon]")).not.toBeNull();
    const { element } = await startClean("astro", "icon-source");
    const legendIcon = legendItem(element, "mobile").querySelector(
      "[data-slot=chart-legend-icon]",
    )!;
    expect(legendIcon.querySelector("[data-component-icon]")).not.toBeNull();
    await press(element, "Home");
    await waitForContent();
    const icon = status()!.querySelector('[data-key="mobile"] [data-slot=chart-tooltip-icon]')!;
    expect(icon.querySelector("[data-component-icon]")).not.toBeNull();
  });

  it("keeps the config icon when a conditional icon slot renders nothing", async () => {
    const server = parseServer(await serverHtml("astro", "conditional-slot"));
    // A false conditional slot renders nothing, so the server legend shows the portable config
    // icon, the same as after start.
    const mobile = legendItem(server, "mobile");
    expect(mobile.querySelector("[data-slot=chart-legend-icon] svg")).not.toBeNull();
    expect(mobile.querySelector("[data-slot=chart-legend-swatch]")).toBeNull();
    const { element } = await startClean("astro", "conditional-slot");
    const started = legendItem(element, "mobile");
    expect(started.querySelector("[data-slot=chart-legend-icon] svg")).not.toBeNull();
    expect(started.querySelector("[data-slot=chart-legend-swatch]")).toBeNull();
  });
});

describe("framework chart APIs", () => {
  // Astro has no client component tree, so it has no tooltip body hook.
  for (const [framework, shape] of [
    ["react", "body"],
    ["vue", "computed"],
    ["svelte", "object"],
  ] as const) {
    it(`${framework} useChartTooltipBody returns its documented shape`, async () => {
      const { element } = await startClean(framework, "hook");
      // Outside an open body the hook returns null.
      expect(element.querySelector("[data-hook=outside]")?.getAttribute("data-shape")).toBe("null");
      await press(element, "Home");
      await vi.waitFor(() =>
        expect(status()?.querySelector("[data-hook=body]")?.getAttribute("data-shape")).toBe(shape),
      );
    });
  }

  // The public root state holds the fields that a custom legend needs, with no Runtime plumbing.
  for (const framework of ["react", "vue", "svelte"] as const) {
    it(`${framework} useChartRoot returns only the public root state`, async () => {
      const { element } = await startClean(framework, "hook");
      expect(element.querySelector("[data-hook=outside]")?.getAttribute("data-root-fields")).toBe(
        "config,id,keys,label,mode,setVisible,toggle,visible",
      );
    });
  }

  // React and Astro have no model publication. Vue emits update:visible, and Svelte writes
  // bind:visible. Astro has no component callback, so the page gives the Runtime controller one.
  for (const [framework, publishes] of [
    ["astro", false],
    ["react", false],
    ["vue", true],
    ["svelte", true],
  ] as const) {
    it(`${framework} runs the visibility callback before the cancelable event and publishes the model after it`, async () => {
      const { element } = await startClean(
        framework,
        framework === "astro" ? "default" : "callback-order",
      );
      const root = chartRoot(element);
      const log = orderLog();
      log.length = 0;
      if (framework === "astro")
        getChartController(root)!.setOptions({
          onVisibleChange: (next, details) =>
            log.push(`callback ${next.join(",")} ${details.isCanceled ? "canceled" : "open"}`),
        });
      root.addEventListener("starwind-chart:visible-change", (event) =>
        log.push(`event ${(event as CustomEvent<{ visible: string[] }>).detail.visible.join(",")}`),
      );

      legendItem(element, "desktop").click();
      await settle();
      expect(log).toEqual([
        "callback mobile open",
        "event mobile",
        ...(publishes ? ["model mobile"] : []),
      ]);

      // A canceled event keeps the keys, and the model is not published.
      log.length = 0;
      root.addEventListener("starwind-chart:visible-change", (event) => event.preventDefault());
      legendItem(element, "desktop").click();
      await settle();
      expect(log).toEqual(["callback desktop,mobile open", "event desktop,mobile"]);
      expect(legendItem(element, "desktop").getAttribute("aria-pressed")).toBe("false");
      expect(getChartController(root)!.getVisible()).toEqual(["mobile"]);
      expect(barCount(element)).toBe(3);
    });
  }

  it("svelte bind:visible publishes the normalized keys on mount without an event", async () => {
    const events: string[][] = [];
    const record = (event: Event) =>
      events.push((event as CustomEvent<{ visible: string[] }>).detail.visible);
    document.addEventListener("starwind-chart:visible-change", record, true);
    try {
      const { element } = await startClean("svelte", "normalize");
      // defaultVisible had a duplicate, an unknown key and a different order (ADR 0018).
      expect(element.querySelector("[data-bound]")?.textContent).toBe('["desktop","mobile"]');
      expect(element.querySelector("[data-callbacks]")?.textContent).toBe("0");
      expect(events).toEqual([]);
      legendItem(element, "desktop").click();
      await settle();
      expect(element.querySelector("[data-bound]")?.textContent).toBe('["mobile"]');
      expect(element.querySelector("[data-callbacks]")?.textContent).toBe("1");
      expect(events).toEqual([["mobile"]]);
    } finally {
      document.removeEventListener("starwind-chart:visible-change", record, true);
    }
  });
});
