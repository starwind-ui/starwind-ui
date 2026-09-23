import { mount, unmount, flushSync, tick } from "svelte";
import App from "./App.svelte";
import Services from "./Services.svelte";
import VendoredSelect from "./VendoredSelect.svelte";
const assert = (value, message) => {
  if (!value) throw new Error(message);
};
try {
  const part = (name) => document.querySelector('[data-test="' + name + '"]');
  const cycles = [];
  const styles = [];
  for (let cycle = 0; cycle < 3; cycle++) {
    document.documentElement.classList.remove("dark");
    localStorage.clear();
    const target = document.querySelector("#app");
    const app = mount(App, { target });
    const settle = async () => {
      flushSync();
      await tick();
      flushSync();
    };
    const finish = async () => {
      for (let index = 0; index < 8; index++) {
        await new Promise(requestAnimationFrame);
        await settle();
      }
    };
    await settle();
    const computed = getComputedStyle(part("button"));
    styles.push({ display: computed.display, radius: computed.borderRadius });
    assert(
      computed.display === "inline-flex" && parseFloat(computed.borderRadius) > 0,
      "Command-installed Button CSS is absent",
    );
    const before = ["button", "checkbox", "theme", "trigger", "dialog", "select"].map(part);
    part("checkbox").click();
    await settle();
    assert(
      app.snapshot().checked === true && app.snapshot().callbacks.checked === 0,
      "Checkbox cancellation changed accepted output",
    );
    app.acceptCheckbox();
    assert(
      app.snapshot().checked === true &&
        app.snapshot().open === undefined &&
        app.snapshot().value === "alpha" &&
        app.snapshot().selectOpen === false,
      "Styled initial undefined bindings",
    );
    assert(
      Object.values(app.snapshot().callbacks).every((count) => count === 0),
      "Styled initialization called proposal callbacks",
    );
    part("button").click();
    part("checkbox").click();
    await settle();
    part("theme").click();
    await settle();
    const themed = document.documentElement.classList.contains("dark");
    const trigger = part("trigger");
    app.replaceRef();
    await settle();
    assert(trigger === part("trigger"), "Styled ref replacement changed owner");
    trigger.focus();
    trigger.click();
    await finish();
    assert(part("dialog").matches(":modal"), "Styled Dialog native ownership");
    part("select").click();
    await finish();
    document.querySelector('[data-sw-select-item][data-value="beta"]').click();
    await finish();
    assert(
      app.snapshot().value === "beta" && app.snapshot().selectOpen === false,
      "Styled Select accepted value",
    );
    part("close").click();
    // Canonical CSS keeps the native dialog open until its close animation completes.
    const closeDeadline = performance.now() + 5_000;
    while (part("dialog").open && performance.now() < closeDeadline) {
      await new Promise(requestAnimationFrame);
      await settle();
    }
    assert(app.snapshot().open === false && !part("dialog").open, "Styled Dialog accepted close");
    // This witness is Vite-only; App.svelte remains shared with SvelteKit and Astro.
    const services = mount(Services, { target });
    await finish();
    assert(
      services.snapshot().color === "#123456" &&
        services.snapshot().format === "hex" &&
        services.snapshot().open === true,
      "Packed service subpath initial models",
    );
    assert(services.snapshot().changes === 0, "Packed service initialization notified changes");
    const swatch = part("services-swatch"),
      sidebarToggle = part("services-toggle");
    swatch.click();
    sidebarToggle.click();
    await finish();
    const serviceResult = services.snapshot();
    assert(
      serviceResult.color === "#336699" &&
        serviceResult.immutableColor &&
        serviceResult.open === false &&
        serviceResult.changes === 2,
      "Packed Color Picker and Sidebar accepted interactions",
    );
    assert(
      new FormData(part("services-form")).get("accent") === "#336699",
      "Packed Color Picker submitted value",
    );
    const link = part("services-link");
    assert(
      link.tagName === "A" && link.getAttribute("href") === "#services-destination",
      "Packed Sidebar native child forwarding",
    );
    link.click();
    assert(location.hash === "#services-destination", "Packed Sidebar native navigation");
    await unmount(services);
    await finish();
    swatch.click();
    sidebarToggle.click();
    await settle();
    assert(
      services.snapshot().changes === serviceResult.changes,
      "Detached packed service controls stayed active",
    );
    assert(
      !document.querySelector("[data-sw-color-picker], [data-sw-sidebar-provider]"),
      "Packed service owners remained after unmount",
    );
    const vendored = mount(VendoredSelect, { target });
    await finish();
    assert(vendored.snapshot() === "alpha", "Vendored Select default value");
    part("vendored-trigger").click();
    await finish();
    const vendoredItem = part("vendored-beta");
    vendoredItem.click();
    await finish();
    assert(vendored.snapshot() === "beta", "Vendored Select accepted value");
    await unmount(vendored);
    await finish();
    assert(!part("vendored-trigger") && !part("vendored-beta"), "Vendored Select cleanup");
    const snapshot = app.snapshot();
    await unmount(app);
    await finish();
    before[0].click();
    before[1].click();
    trigger.click();
    await settle();
    const final = app.snapshot(),
      stale =
        final.clicks -
        snapshot.clicks +
        Object.keys(final.callbacks).reduce(
          (sum, key) => sum + final.callbacks[key] - snapshot.callbacks[key],
          0,
        );
    cycles.push({
      ...final,
      mounted: true,
      themed,
      remaining: document.querySelectorAll(
        "[data-sw-dialog], [data-sw-select-portal], [data-test], :modal",
      ).length,
      stale,
    });
  }
  document.documentElement.dataset.hostResult = JSON.stringify({
    cycles,
    styles,
    vendoredSelect: true,
  });
} catch (error) {
  document.documentElement.dataset.hostResult = JSON.stringify({ error: String(error) });
}
