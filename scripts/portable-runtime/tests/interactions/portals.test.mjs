import { chromium } from "playwright";
import { describe, expect, it } from "vitest";
import { installObserver } from "../../runtime-performance/interactions/browser-observer.mjs";
import { validatePageInventory } from "../../runtime-performance/interactions/portals.mjs";

const closedInventory = {
  controls: Array.from({ length: 20 }, (_, index) => ({
    control: index + 1,
    expanded: "false",
    id: `trigger-${index + 1}`,
  })),
  popupShells: 20,
  renderedItems: 0,
  portalsInsideFixture: 0,
  popups: Array.from({ length: 20 }, (_, index) => ({
    control: index + 1,
    id: `popup-${index + 1}`,
    role: "listbox",
    visible: false,
    inBodyPortal: true,
  })),
};
describe("page phase inventories", () => {
  it("distinguishes the ordinary closed and open policies", () => {
    const options = { provider: "starwind", controls: 20, phase: "beforeOpen" };
    expect(validatePageInventory(closedInventory, options)).toEqual([]);
    expect(
      validatePageInventory(closedInventory, { ...options, phase: "reopen" }).length,
    ).toBeGreaterThan(0);
    expect(
      validatePageInventory(
        { ...closedInventory, renderedItems: 400 },
        { ...options, provider: "ark-ui" },
      ),
    ).toEqual([]);
    expect(
      validatePageInventory(
        { ...closedInventory, popupShells: 0, popups: [] },
        { ...options, provider: "base-ui" },
      ),
    ).toEqual([]);
  });
  it("rejects stale portals and duplicate endpoints even when counts match", () => {
    const options = { provider: "starwind", controls: 20, phase: "afterClose" };
    const stale = structuredClone(closedInventory);
    stale.popups[19] = { ...stale.popups[0] };
    expect(validatePageInventory(stale, options)).toContain("duplicate or stale popup endpoint");
    expect(
      validatePageInventory({ ...closedInventory, portalsInsideFixture: 1 }, options),
    ).toContain("unsettled or invalid popup portal");
    expect(validatePageInventory({ ...closedInventory, renderedItems: 20 }, options)).toContain(
      "unexpected popup or item count for presence policy",
    );
  });
  it("accepts a retained hidden Base popup after submit without using focus as a presence proxy", () => {
    const options = { provider: "base-ui", controls: 20, phase: "afterClose" };
    const retained = {
      ...closedInventory,
      popupShells: 1,
      renderedItems: 20,
      focusedControl: null,
      popups: [
        {
          control: 10,
          id: "popup-10",
          role: "listbox",
          items: 20,
          visible: false,
          inBodyPortal: true,
        },
      ],
    };
    expect(validatePageInventory(retained, options)).toEqual([]);
    const single = {
      ...retained,
      controls: [retained.controls[0]],
      popups: [{ ...retained.popups[0], control: 1 }],
    };
    expect(validatePageInventory(single, { ...options, controls: 1 })).toEqual([]);
    expect(
      validatePageInventory(
        { ...retained, popups: [{ ...retained.popups[0], visible: true }] },
        options,
      ),
    ).toContain("unexpected visible popup count");
    expect(validatePageInventory({ ...retained, orphanPopupShells: 1 }, options)).toContain(
      "unsettled or invalid popup portal",
    );
    expect(
      validatePageInventory(
        { ...retained, popups: [{ ...retained.popups[0], items: 19 }] },
        options,
      ),
    ).toContain("unexpected popup or item count for presence policy");
    expect(
      validatePageInventory(
        { ...retained, popups: [{ ...retained.popups[0], control: 9 }] },
        options,
      ),
    ).toContain("stale popup control identity");
    expect(
      validatePageInventory(
        {
          ...retained,
          controls: retained.controls.map((node) => ({
            ...node,
            expanded: node.control === 9 ? "true" : "false",
          })),
        },
        options,
      ),
    ).toContain("unexpected expanded controls");
    expect(validatePageInventory({ ...retained, renderedItems: 19 }, options)).toContain(
      "unexpected popup or item count for presence policy",
    );
    expect(validatePageInventory({ ...retained, popupShells: 2 }, options)).toContain(
      "unexpected popup or item count for presence policy",
    );
  });
  it("observes initialized body placement once per context and rejects stale submenu opening", async () => {
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.setContent('<div id="root"></div>');
      await page.evaluate(installObserver);
      await page.evaluate(() => {
        window.__bench.renderStarted();
        window.__fixture = { scenario: "select-page-1", provider: "starwind", controlCount: 1 };
        document.getElementById("root").innerHTML =
          '<form data-bench="form"><button id="target" data-bench="trigger" aria-expanded="false" aria-haspopup="listbox">Option 1</button><div data-sw-portal-placement="framework" data-placement="pending"><div data-bench-portal="select"></div></div></form>';
        window.__bench.ready();
      });
      expect(await page.evaluate(() => window.__bench.data.mount.durationMs)).toBeUndefined();
      await page.evaluate(() => {
        const portal = document.querySelector("[data-sw-portal-placement]");
        document.body.append(portal);
        portal.setAttribute("data-placement", "ready");
      });
      await page.waitForFunction(() => window.__bench.data.mount.durationMs != null);
      const mount = await page.evaluate(() => window.__bench.data.mount);
      expect(mount).toMatchObject({
        metric: "render-to-ready-DOM",
        flowPhase: null,
        presentedPixels: false,
        lastCheck: { ready: true, portalsSettled: true },
      });
      await page.evaluate(() => {
        window.__bench.ready();
        window.__bench.arm({ uid: "repeated/reopen/0", flowPhase: "repeated", actionId: "reopen" });
      });
      expect(await page.evaluate(() => window.__bench.data.mount.completedAt)).toBe(
        mount.completedAt,
      );
      await expect(page.evaluate(() => window.__bench.renderStarted())).rejects.toThrow("once");
      await page.evaluate(() => {
        document
          .getElementById("root")
          .insertAdjacentHTML(
            "beforeend",
            '<div id="sub-trigger" data-bench="submenu-trigger" aria-expanded="true" aria-controls="old-menu"></div><div id="new-menu" data-bench="child-popup" role="menu"></div>',
          );
        window.__bench.arm({
          uid: "first/hover-open/0",
          kind: "pointer",
          endpoint: "submenu-open",
        });
        document
          .getElementById("sub-trigger")
          .dispatchEvent(new PointerEvent("pointermove", { bubbles: true }));
      });
      expect(
        await page.evaluate(() => window.__bench.data.actions.at(-1).domCompletion),
      ).toBeNull();
      await page.evaluate(() =>
        document.getElementById("sub-trigger").setAttribute("aria-controls", "new-menu"),
      );
      await page.waitForFunction(() => window.__bench.data.actions.at(-1).domCompletion != null);
      expect(
        await page.evaluate(() => window.__bench.data.actions.at(-1).domCompletion.condition),
      ).toBe("submenu-open");
    } finally {
      await browser.close();
    }
  }, 15000);
});
