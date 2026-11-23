import assert from "node:assert/strict";
import type { Locator, Page } from "playwright";
import type { DirectionExpectation } from "../../inventory.js";
import { waitHidden } from "../../waits.js";
import { checks, type Group, rows } from "./fixtures.js";

const slot = (page: Page, name: string) => page.locator(`[data-slot="${name}"]`);
async function bounds(el: Locator) {
  const r = await el.boundingBox();
  assert(r, `missing geometry for ${el}`);
  return { ...r, right: r.x + r.width, bottom: r.y + r.height };
}
function near(actual: number, expected: number, tolerance = 1) {
  assert(Math.abs(actual - expected) <= tolerance, `${actual} vs ${expected} (±${tolerance})`);
}
async function settle(el: Locator) {
  await el.waitFor({ state: "visible" });
  await el.evaluate(async (n) => {
    // Native dialog visibility precedes release of its starting style.
    while (n.hasAttribute("data-starting-style")) await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
    await Promise.all(
      n
        .getAnimations()
        .filter((a) => a.effect?.getTiming().iterations !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    );
  });
}
async function flip(page: Page, dir: "ltr" | "rtl") {
  await page.locator("[data-direction-scope]").evaluate(async (n, d) => {
    n.setAttribute("dir", d);
    n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    await new Promise(requestAnimationFrame);
  }, dir);
}
async function close(page: Page, el: Locator) {
  await page.keyboard.press("Escape");
  await waitHidden(el);
}
async function alignment(el: Locator) {
  return el.evaluate((n) => ({
    dir: getComputedStyle(n).direction,
    text: getComputedStyle(n).textAlign,
  }));
}
async function modal(page: Page) {
  const samples = [];
  for (const name of ["dialog", "alert-dialog"]) {
    const trigger = slot(page, `${name}-trigger`),
      content = slot(page, `${name}-content`);
    await trigger.focus();
    await trigger.press("Enter");
    await settle(content);
    for (const dir of ["rtl", "ltr"] as const) {
      await flip(page, dir);
      const box = await bounds(content),
        header = await alignment(slot(page, `${name}-header`));
      assert.equal(header.dir, dir);
      assert(["start", dir === "rtl" ? "right" : "left"].includes(header.text));
      near(box.x + box.width / 2, 640);
      near(box.y + box.height / 2, 450);
      if (name === "dialog") {
        const x = await bounds(slot(page, "dialog-close").first());
        near(dir === "rtl" ? x.x - box.x : box.right - x.right, 22, 2);
      }
      samples.push({ name, dir, box, header });
    }
    if (name === "alert-dialog") {
      await slot(page, "alert-dialog-cancel").click();
      await waitHidden(content);
    } else await close(page, content);
    assert(
      await trigger.evaluate(
        (n) => n === document.activeElement || n.contains(document.activeElement),
      ),
    );
  }
  return samples;
}

async function nativeModal(page: Page, name: "dialog" | "alert-dialog") {
  const samples = [];
  // Let the generated modals inherit direction from the document for the viewport checks.
  await page.locator("[data-direction-scope]").evaluate((scope) => {
    for (let owner: Element | null = scope; owner; owner = owner.parentElement)
      owner.removeAttribute("dir");
    scope.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
  });
  const originalViewport = page.viewportSize()!;
  try {
    for (const viewport of [{ width: 390, height: 844 }, originalViewport]) {
      await page.setViewportSize(viewport);
      for (const dir of ["ltr", "rtl"] as const) {
        await page.evaluate((dir) => {
          document.documentElement.dir = dir;
          document.dispatchEvent(new Event("starwind:direction-change"));
        }, dir);
        const content = slot(page, `${name}-content`);
        await slot(page, `${name}-trigger`).press("Enter");
        await settle(content);
        const box = await bounds(content);
        const metrics = await content.evaluate((panel) => ({
          native: panel instanceof HTMLDialogElement && panel.open,
          dir: getComputedStyle(panel).direction,
          scrollWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          scrollX: window.scrollX,
        }));
        const sample = { name, dir, viewport, box, metrics };
        samples.push(sample);
        assert(metrics.native && metrics.dir === dir, JSON.stringify(sample));
        assert(box.x >= -1 && box.right <= metrics.viewportWidth + 1, JSON.stringify(sample));
        assert(box.y >= -1 && box.bottom <= viewport.height + 1, JSON.stringify(sample));
        near(box.x + box.width / 2, metrics.viewportWidth / 2);
        if (name === "dialog" && viewport.width === 390) near(box.y, 64);
        else near(box.y + box.height / 2, viewport.height / 2);
        assert.equal(metrics.scrollWidth, metrics.viewportWidth);
        near(metrics.scrollX, 0);
        if (name === "alert-dialog") {
          await slot(page, "alert-dialog-cancel").click();
          await waitHidden(content);
        } else await close(page, content);
      }
    }
  } finally {
    await page.setViewportSize(originalViewport);
  }
  return samples;
}
async function sheets(page: Page) {
  const samples = [];
  for (const side of ["left", "right", "top", "bottom"]) {
    await page.locator(`[data-sheet="${side}"] [data-slot=sheet-trigger]`).click();
    const content = page.locator("[data-slot=sheet-content]:visible").first();
    await settle(content);
    for (const dir of ["rtl", "ltr"] as const) {
      await flip(page, dir);
      const r = await bounds(content);
      assert.equal(await content.getAttribute("data-side"), side);
      near(
        side === "left"
          ? r.x
          : side === "right"
            ? 1280 - r.right
            : side === "top"
              ? r.y
              : 900 - r.bottom,
        0,
      );
      const button = await bounds(content.locator("[data-slot=sheet-close]").first());
      near(dir === "rtl" ? button.x - r.x : r.right - button.right, 16, 2);
      samples.push({ side, dir, r, button });
    }
    await close(page, content);
  }
  return samples;
}
async function choices(page: Page) {
  const samples = [];
  for (const name of ["dropdown", "select", "combobox"]) {
    await slot(page, `${name}-trigger`).first().click();
    const content = slot(page, `${name}-content`).first();
    await settle(content);
    const item = slot(
      page,
      name === "dropdown" ? "dropdown-checkbox-item" : `${name}-item`,
    ).first();
    for (const dir of ["rtl", "ltr"] as const) {
      await flip(page, dir);
      const style = await item.evaluate((n) => {
        const c = getComputedStyle(n);
        return { dir: c.direction, start: c.paddingInlineStart, end: c.paddingInlineEnd };
      });
      assert.equal(style.dir, dir);
      assert.equal(style.end, "32px");
      assert.equal(style.start, name === "dropdown" ? "32px" : "8px");
      const indicator = item.locator('[data-slot$="-indicator"]').first();
      const box = await bounds(item),
        check = await bounds(indicator);
      near(dir === "rtl" ? check.x - box.x : box.right - check.right, 8, 1);
      if (name === "dropdown") {
        const icon = slot(page, "dropdown-sub-trigger").first().locator("svg");
        assert.equal(
          await icon.evaluate((n) => getComputedStyle(n).rotate),
          dir === "rtl" ? "180deg" : "none",
        );
        assert.equal(
          await page.locator("svg[data-caller]").evaluate((n) => getComputedStyle(n).rotate),
          "45deg",
        );
        const shortcut = await bounds(slot(page, "dropdown-shortcut"));
        const command = await bounds(slot(page, "dropdown-shortcut").locator(".."));
        near(dir === "rtl" ? shortcut.x - command.x : command.right - shortcut.right, 8, 1);
      }
      samples.push({ name, dir, style, box, check });
    }
    await close(page, content);
  }
  return samples;
}
async function contextEntry(page: Page) {
  const samples = [];
  for (const side of ["top", "bottom", "left", "right"]) {
    const trigger = page
      .locator(
        `[data-context="${side}"] [data-context-menu-trigger], [data-context="${side}"] [data-slot=context-menu-trigger]`,
      )
      .first();
    const edge = {
      x: side === "left" ? 1279 : side === "right" ? 1 : 640,
      y: side === "top" ? 899 : side === "bottom" ? 1 : 450,
    };
    for (const point of [edge, { x: 640, y: 450 }]) {
      await trigger.evaluate(
        (n, point) =>
          n.dispatchEvent(
            new MouseEvent("contextmenu", {
              bubbles: true,
              cancelable: true,
              button: 2,
              clientX: point.x,
              clientY: point.y,
            }),
          ),
        point,
      );
      const el = page.locator("[data-sw-context-menu-entry][data-state=open]").first();
      await el.waitFor({ state: "visible" });
      const frame = await el.evaluate((n) => {
        const box = n.getBoundingClientRect(),
          style = getComputedStyle(n);
        const probe = document.createElement("i");
        probe.style.cssText =
          "position:absolute;width:var(--sw-context-menu-entry-distance);visibility:hidden";
        n.append(probe);
        const resolvedDistance = Number.parseFloat(getComputedStyle(probe).width);
        probe.remove();
        return {
          side: n.getAttribute("data-side"),
          x: box.x,
          y: box.y,
          right: box.right,
          bottom: box.bottom,
          room: Number.parseFloat(style.getPropertyValue("--sw-context-menu-entry-room")),
          distance: resolvedDistance,
          animation: style.animationName,
        };
      });
      assert.equal(frame.side, side);
      assert(
        frame.x >= -1 && frame.right <= 1281 && frame.y >= -1 && frame.bottom <= 901,
        JSON.stringify(frame),
      );
      near(frame.distance, point === edge ? 5 : 8);
      if (point === edge) near(frame.room, 5);
      else assert(frame.room > 100);
      await settle(el);
      const settled = await bounds(el);
      samples.push({ side, point, frame, settled });
      await close(page, el);
    }
  }
  return samples;
}
async function physicalFloating(page: Page) {
  const out = [];
  for (const name of ["popover", "hover-card", "tooltip"]) {
    const trigger = slot(page, `${name}-trigger`).first(),
      popup = slot(page, `${name}-content`).first();
    if (name === "popover") await trigger.click();
    else await trigger.hover();
    await settle(popup);
    for (const dir of ["rtl", "ltr"] as const) {
      await flip(page, dir);
      const r = await bounds(popup),
        t = await bounds(trigger);
      assert.equal(await popup.getAttribute("data-side"), "left");
      assert.equal((await alignment(popup)).dir, dir);
      assert(r.right <= t.x + 1);
      out.push({ name, dir, r, t });
    }
    await page.mouse.move(4, 4);
    if (name === "popover" || name === "tooltip") await page.keyboard.press("Escape");
    await waitHidden(popup);
  }
  return out;
}

async function sidebars(page: Page) {
  const out = [];
  for (const outer of ["left", "right"]) {
    await page.locator("[data-pair]").evaluateAll(
      (pairs, side) =>
        pairs.forEach((p) => {
          (p as HTMLElement).hidden = p.getAttribute("data-pair") !== side;
        }),
      outer,
    );
    const inner = outer === "left" ? "right" : "left";
    for (const [id, physical] of [
      [`outer-${outer}`, outer],
      [`inner-${inner}`, inner],
    ]) {
      const btn = page.locator(`[data-pair="${outer}"] [data-menu="${id}"]:visible`).first();
      const trigger = btn.locator("xpath=ancestor-or-self::*[@data-sw-tooltip-trigger][1]");
      await trigger.evaluate((t: HTMLElement) =>
        Object.assign(t.style, {
          position: "fixed",
          left: "600px",
          top: "330px",
          width: "64px",
          height: "34px",
          zIndex: "600",
        }),
      );
      const popup = page
        .locator("[data-sw-sidebar-tooltip-default]")
        .filter({ hasText: id })
        .filter({ visible: true })
        .first();
      const first = await btn.evaluate(async (n, id) => {
        n.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse", bubbles: true }));
        for (let i = 0; i < 120; i++) {
          await new Promise(requestAnimationFrame);
          const tip = Array.from(
            document.querySelectorAll<HTMLElement>("[data-sw-sidebar-tooltip-default]"),
          ).find(
            (t) =>
              t.textContent?.includes(id) &&
              t.getBoundingClientRect().width > 0 &&
              t.dataset.state === "open" &&
              getComputedStyle(t).opacity !== "0",
          );
          if (tip) return { side: tip.dataset.side, x: tip.getBoundingClientRect().x };
        }
        throw new Error("No first visible Sidebar tooltip for " + id);
      }, id!);
      assert.equal(first.side, physical === "left" ? "right" : "left");
      out.push({ id, first });
      await settle(popup);
      for (const dir of ["ltr", "rtl"] as const) {
        await flip(page, dir);
        const t = await bounds(btn),
          p = await bounds(popup);
        const side = await popup.getAttribute("data-side");
        assert.equal(side, physical === "left" ? "right" : "left");
        near(side === "right" ? p.x - t.right : t.x - p.right, 8, 2);
        out.push({ outer, id, dir, side, t, p });
      }
      if (id === "inner-right") {
        const tip = await popup.elementHandle();
        for (const current of ["left", "right"]) {
          await btn.evaluate(
            (n, s) => n.closest("[data-sw-sidebar-side]")!.setAttribute("data-sw-sidebar-side", s),
            current,
          );
          const desired = current === "left" ? "right" : "left";
          await page.waitForFunction(
            ({ tip, desired }) => tip?.getAttribute("data-side") === desired,
            { tip, desired },
          );
          const t = await bounds(btn),
            p = await bounds(popup);
          near(desired === "right" ? p.x - t.right : t.x - p.right, 8, 2);
          out.push({ retained: current, desired, t, p });
        }
      }
      await btn.dispatchEvent("pointerleave", { pointerType: "mouse", clientX: 0, clientY: 0 });
      await page.keyboard.press("Escape");
      await waitHidden(popup);
      if (id === "inner-right") {
        for (const [x, resolved] of [
          ["1px", "right"],
          ["600px", "left"],
        ] as const) {
          await trigger.evaluate((n: HTMLElement, x) => {
            n.style.left = x;
          }, x);
          await btn.dispatchEvent("pointerenter", { pointerType: "mouse", bubbles: true });
          await settle(popup);
          assert.equal(await popup.getAttribute("data-side"), resolved);
          out.push({ collision: x, resolved, p: await bounds(popup) });
          await btn.dispatchEvent("pointerleave", { pointerType: "mouse", clientX: 0, clientY: 0 });
          await page.keyboard.press("Escape");
          await waitHidden(popup);
        }
      }
    }
  }
  await page.locator('[data-pair="right"]').evaluate((n) => n.setAttribute("hidden", ""));
  await page.locator('[data-pair="left"]').evaluate((n) => n.removeAttribute("hidden"));
  const explicit = page
    .locator('[data-pair="left"] [data-slot=tooltip-trigger]')
    .filter({ hasText: "Explicit" })
    .filter({ visible: true })
    .first();
  await explicit.evaluate((n) =>
    Object.assign(n.style, { position: "fixed", left: "600px", top: "430px" }),
  );
  await explicit.hover();
  const authored = slot(page, "tooltip-content")
    .filter({ hasText: "Explicit side" })
    .filter({ visible: true })
    .first();
  await settle(authored);
  assert.equal(await authored.getAttribute("data-side"), "right");
  await explicit.evaluate((n) =>
    n.closest("[data-sw-sidebar-side]")!.setAttribute("data-sw-sidebar-side", "left"),
  );
  await flip(page, "ltr");
  assert.equal(await authored.getAttribute("data-side"), "right");
  out.push({ explicit: await bounds(authored) });
  return out;
}
async function panels(page: Page) {
  const out = [];
  await page
    .locator("[data-pair]")
    .evaluateAll((nodes) => nodes.forEach((n) => n.setAttribute("hidden", "")));
  for (const variant of ["sidebar", "floating", "inset"]) {
    for (const side of ["left", "right"]) {
      const host = page.locator(`[data-panel-case="${variant}-${side}"]`);
      await host.evaluate((n) => n.removeAttribute("hidden"));
      const panel = host.locator("[data-slot=sidebar-container]"),
        rail = panel.locator("[data-slot=sidebar-rail]");
      const inset = host.locator("[data-slot=sidebar-inset]");
      for (const dir of ["ltr", "rtl"] as const) {
        await flip(page, dir);
        const r = await bounds(panel),
          bar = await bounds(rail),
          rest = await bounds(inset);
        near(side === "left" ? r.x : 1280 - r.right, 0);
        near(bar.x + bar.width / 2, side === "left" ? r.right : r.x, 2);
        assert.equal(
          await rail.evaluate((n) => getComputedStyle(n).cursor),
          side === "left" ? "w-resize" : "e-resize",
        );
        if (side === "left")
          assert(
            rest.x >= r.right - 1,
            `left ${variant}/${dir}: inset x=${rest.x}, panel right=${r.right}`,
          );
        else
          assert(
            rest.right <= r.x + 1,
            `right ${variant}/${dir}: inset right=${rest.right}, panel x=${r.x}`,
          );
        const styles = await panel.evaluate((n) => {
          const menu = n.querySelector("[data-slot=sidebar-menu-button]")!,
            sub = n.querySelector("[data-slot=sidebar-menu-sub]")!,
            action = n.querySelector("[data-slot=sidebar-menu-action]")!,
            group = n.querySelector("[data-slot=sidebar-group-action]")!,
            badge = n.querySelector("[data-slot=sidebar-menu-badge]")!;
          return {
            text: getComputedStyle(menu).textAlign,
            padding: getComputedStyle(menu).paddingInlineEnd,
            border: getComputedStyle(sub).borderInlineStartWidth,
            translation: getComputedStyle(sub).translate,
            action: getComputedStyle(action).insetInlineEnd,
            group: getComputedStyle(group).insetInlineEnd,
            badge: getComputedStyle(badge).insetInlineEnd,
          };
        });
        assert.equal(styles.text, "start");
        assert.equal(styles.padding, "32px");
        assert.equal(styles.border, "1px");
        assert.equal(styles.action, "4px");
        assert.equal(styles.group, "12px");
        assert.equal(styles.badge, "4px");
        near(Number.parseFloat(styles.translation), dir === "rtl" ? -1 : 1);
        out.push({ variant, side, dir, r, bar, rest, styles });
        const owner = host.locator("[data-sw-sidebar]").first(),
          gap = owner.locator("[data-slot=sidebar-gap]");
        await owner.evaluate(
          (n, d) => {
            n.setAttribute("dir", d);
            n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
          },
          dir === "ltr" ? "rtl" : "ltr",
        );
        const reserved = await bounds(gap),
          fixed = await bounds(panel);
        near(
          side === "left" ? reserved.x : reserved.right,
          side === "left" ? fixed.x : fixed.right,
        );
        out.push({
          provider: dir,
          content: await owner.getAttribute("dir"),
          side,
          reserved,
          fixed,
        });
        await owner.evaluate((n) => {
          n.removeAttribute("dir");
          n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
        });
      }
      await host.locator("[data-slot=sidebar-trigger]").first().click();
      await panel.evaluate(async (n) => {
        await new Promise(requestAnimationFrame);
        await Promise.all(n.getAnimations().map((a) => a.finished));
      });
      const collapsed = await bounds(panel);
      if (variant === "floating")
        near(side === "left" ? collapsed.right : 1280 - collapsed.x, 0, 1);
      else assert(collapsed.width < (await host.evaluate((n) => n.clientWidth)) / 4);
      out.push({ variant, side, collapsed });
      await host.evaluate((n) => n.setAttribute("hidden", ""));
    }
  }
  for (const side of ["left", "right"]) {
    const host = page.locator(`[data-static-panel="${side}"]`);
    await host.evaluate((n) => n.removeAttribute("hidden"));
    const panel = host.locator("[data-sw-sidebar-side]"),
      provider = host.locator("[data-slot=sidebar-provider]");
    for (const flow of ["ltr", "rtl"] as const) {
      const local = flow === "ltr" ? "rtl" : "ltr";
      await provider.evaluate((n, dir) => {
        n.setAttribute("dir", dir);
        n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
      }, flow);
      await panel.evaluate((n, dir) => {
        n.setAttribute("dir", dir);
        n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
      }, local);
      const fixed = await bounds(panel),
        flex = await bounds(provider);
      near(side === "left" ? fixed.x : fixed.right, side === "left" ? flex.x : flex.right);
      assert.equal(await panel.evaluate((n) => getComputedStyle(n).direction), local);
      out.push({ collapsible: "none", side, flow, local, fixed, flex });
    }
    await host.evaluate((n) => n.setAttribute("hidden", ""));
  }
  for (const outerDir of ["ltr", "rtl"]) {
    const host = page.locator(`[data-nested-gap="${outerDir}"]`);
    await host.evaluate((n) => n.removeAttribute("hidden"));
    const providers = host.locator("[data-slot=sidebar-provider]");
    for (const [i, side] of [
      [0, "left"],
      [1, "right"],
    ] as const) {
      const provider = providers.nth(i),
        owner = provider.locator("[data-sw-sidebar]").first();
      const content = owner.locator("[data-slot=sidebar-container]").first();
      const gap = await bounds(owner.locator("[data-slot=sidebar-gap]").first()),
        flex = await bounds(provider);
      const flow = await provider.evaluate((n) => getComputedStyle(n).direction);
      const local = await content.evaluate((n) => getComputedStyle(n).direction);
      assert.equal(flow, i === 0 ? outerDir : outerDir === "ltr" ? "rtl" : "ltr");
      assert.notEqual(flow, local);
      near(side === "left" ? gap.x : gap.right, side === "left" ? flex.x : flex.right);
      out.push({ nested: i, side, flow, local, gap, flex });
    }
    await host.evaluate((n) => n.setAttribute("hidden", ""));
  }
  return out;
}

async function toasts(page: Page) {
  const viewport = slot(page, "toast-viewport").first();
  const scope = page.locator("[data-viewport-scope]");
  for (const variant of ["default", "success", "error"])
    await page.locator(`[data-toast-call="${variant}"]`).click();
  const out = [];
  for (const dir of ["rtl", "ltr"] as const) {
    await scope.evaluate((n, d) => {
      n.setAttribute("dir", d);
      n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    }, dir);
    for (const variant of ["default", "success", "error"]) {
      const item = viewport.locator(`[data-slot=toast][data-variant="${variant}"]`).first();
      await settle(item);
      const style = await item.evaluate((n) => {
        const c = getComputedStyle(n),
          r = n.getBoundingClientRect(),
          b = n.querySelector("[data-slot=toast-close]")!.getBoundingClientRect();
        return {
          dir: c.direction,
          attr: n.getAttribute("dir"),
          padding: c.paddingInlineEnd,
          gap: c.direction === "rtl" ? b.left - r.left : r.right - b.right,
        };
      });
      assert.equal(style.dir, variant === "default" ? dir : "ltr");
      assert.equal(
        style.attr,
        variant === "default" ? null : variant === "success" ? "auto" : "ltr",
      );
      assert.equal(style.padding, "40px");
      near(style.gap, 8, 2);
      out.push({ variant, dir, style });
    }
    for (const position of [
      "top-left",
      "top-center",
      "top-right",
      "bottom-left",
      "bottom-center",
      "bottom-right",
    ]) {
      await viewport.evaluate((n, p) => n.setAttribute("data-position", p), position);
      const r = await bounds(viewport);
      near(position.startsWith("top") ? r.y : 900 - r.bottom, 16);
      near(
        position.endsWith("left")
          ? r.x
          : position.endsWith("right")
            ? 1280 - r.right
            : r.x + r.width / 2,
        position.endsWith("center") ? 640 : 16,
      );
      out.push({ dir, position, r });
    }
  }
  for (const dir of ["rtl", "ltr"] as const) {
    await page.reload();
    await scope.evaluate((n, d) => {
      n.setAttribute("dir", d);
      n.dispatchEvent(new Event("starwind:direction-change", { bubbles: true }));
    }, dir);
    await page.locator("[data-toast-call=default]").click();
    const item = viewport.locator("[data-slot=toast][data-variant=default]").first();
    await settle(item);
    const r = await bounds(item),
      cx = r.x + r.width / 2,
      cy = r.y + r.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx - 90, cy, { steps: 6 });
    await page.mouse.up();
    assert.equal(await item.getAttribute("data-state"), "open");
    const id = await item.getAttribute("data-toast-id");
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 95, cy, { steps: 8 });
    const dx = await item.evaluate((n) =>
      Number.parseFloat(getComputedStyle(n).getPropertyValue("--toast-swipe-movement-x")),
    );
    assert(dx > 50, String(dx));
    await page.mouse.up();
    const closed = viewport.locator(`[data-toast-id="${id}"][data-swipe-direction=right]`);
    await closed.waitFor({ state: "attached" });
    out.push({ dir, swipe: dx });
  }
  return out;
}
const probes = {
  "modal-chrome": modal,
  "native-dialog-viewport": (page: Page) => nativeModal(page, "dialog"),
  "native-alert-dialog-viewport": (page: Page) => nativeModal(page, "alert-dialog"),
  "sheet-sides": sheets,
  "menu-and-choice-chrome": choices,
  "context-entry-bounds": contextEntry,
  "physical-floating-sides": physicalFloating,
  "owned-sidebar-tooltips": sidebars,
  "physical-sidebar-panels": panels,
  "viewport-template-and-swipe": toasts,
};
export const expectations: DirectionExpectation[] = (Object.keys(rows) as Group[]).map((group) => ({
  id: `chrome-${group}-styled`,
  layer: "styled",
  async run(page, _target, ctx) {
    for (const check of checks[group])
      await ctx.check(check, async () => {
        await page.reload();
        ctx.observe(check, await probes[check as keyof typeof probes](page));
      });
  },
}));
