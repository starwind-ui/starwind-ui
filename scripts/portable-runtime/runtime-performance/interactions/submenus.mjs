import { performance } from "node:perf_hooks";
import {
  boundary,
  domCounts,
  flowActionUid,
  inputAction,
  insist,
  linearPath,
  pacePointer,
  waitEndpoint,
  validatePointerDelivery,
} from "./driver.mjs";
import { visualContract } from "./registry.mjs";

export function validateSubmenuGeometry(geometry) {
  const failures = [];
  for (const popup of [geometry.parent, geometry.child]) {
    if (popup.width !== 320 || popup.height !== 258)
      failures.push("popup must expose eight 32-pixel rows");
    if (popup.x < 0 || popup.y < 0 || popup.x + popup.width > 1280 || popup.y + popup.height > 900)
      failures.push("popup leaves the viewport");
  }
  if (
    geometry.parents.length !== 8 ||
    geometry.children.length !== 8 ||
    [...geometry.parents, ...geometry.children].some(
      (row) => row.height !== 32 || row.role !== "menuitem",
    )
  )
    failures.push("wrong submenu rows or roles");
  if (Math.abs(geometry.child.x - geometry.trigger.x - geometry.trigger.width - 8) > 1)
    failures.push("submenu API gap differs from eight pixels");
  if (geometry.children[3]?.item !== "child-4") failures.push("child action 4 is missing");
  return failures;
}
export function validateSubmenuInventory(snapshot, provider, phase) {
  const failures = [];
  const open = phase === "open" || phase === "childOpen";
  const childOpen = phase === "childOpen";
  const expectedShells = provider === "base-ui" ? (childOpen ? 2 : Number(open)) : 2;
  const expectedItems = provider === "base-ui" ? expectedShells * 8 : 16;
  if (snapshot.popupShells !== expectedShells || snapshot.renderedItems !== expectedItems)
    failures.push("unexpected submenu presence count");
  if (
    snapshot.popups.some((popup) => popup.role !== "menu" || !popup.inBodyPortal) ||
    snapshot.portalsInsideFixture ||
    snapshot.orphanPopupShells
  )
    failures.push("unsettled submenu portal");
  if (new Set(snapshot.popups.map((popup) => popup.bench)).size !== expectedShells)
    failures.push("duplicate submenu endpoint");
  if (snapshot.popups.filter((popup) => popup.visible).length !== (childOpen ? 2 : Number(open)))
    failures.push("unexpected visible submenu count");
  return failures;
}

export function validateSubmenuDwell(state) {
  const failures = [];
  if (!state.childOpen || !state.parentOpen) failures.push("submenu closed during traversal");
  if (!state.accessibleActive || state.targetAtPointer !== "child-4")
    failures.push("child action 4 is not the accessible pointer target");
  if (state.invoked !== "[]") failures.push("hover invoked an action");
  return failures;
}

const center = (box) => ({ x: box.x + box.width / 2, y: box.y + box.height / 2 });
export async function runSubmenuFlow(page, flowPhase, { record = {} } = {}) {
  await boundary(page, `${flowPhase}:start`);
  const flow = Object.assign(record, {
    flowPhase,
    commands: [],
    counts: { beforeOpen: await domCounts(page) },
  });
  const provider = await page.evaluate(() => window.__fixture.provider);
  const checkInventory = (phase) => {
    const failures = validateSubmenuInventory(flow.counts[phase], provider, phase);
    insist(
      failures.length === 0,
      `Submenu ${phase} inventory failed: ${failures.join("; ")}`,
      "driver-failure",
    );
  };
  checkInventory("beforeOpen");
  const rootTrigger = await page.locator('[data-bench="trigger"]').boundingBox();
  insist(rootTrigger, "Parent trigger is missing.", "driver-failure");
  const open = await inputAction(page, flowPhase, "open", "click", {
    ...center(rootTrigger),
    endpoint: "open",
  });
  flow.commands.push(open);
  await waitEndpoint(page, open.uid);
  await page.evaluate(() => window.__bench.drain());
  flow.counts.open = await domCounts(page);
  checkInventory("open");
  const trigger = await page.locator('[data-bench="submenu-trigger"]').boundingBox();
  insist(trigger, "Submenu trigger is missing.", "driver-failure");
  const hover = await inputAction(page, flowPhase, "hover-open", "pointer", {
    x: trigger.x + trigger.width - 8,
    y: trigger.y + trigger.height / 2,
    endpoint: "submenu-open",
  });
  flow.commands.push(hover);
  const hoverSentAt = performance.now();
  await page.mouse.move(hover.x, hover.y);
  hover.completedAt = performance.now();
  try {
    await waitEndpoint(page, hover.uid);
  } finally {
    flow.hoverDelivery = await page.evaluate(
      (uid) =>
        window.__bench.data.events.filter(
          (event) => event.actionUid === uid && event.name === "pointermove",
        ),
      hover.uid,
    );
    const failures = validatePointerDelivery(flow.hoverDelivery, [hover]);
    insist(failures.length === 0, `Hover input failed: ${failures.join("; ")}`, "driver-failure");
  }
  flow.openWait = {
    runnerSentAt: hoverSentAt,
    runnerReadyAt: performance.now(),
    runnerWaitMs: performance.now() - hoverSentAt,
    observedDOM: await page.evaluate(
      (uid) => window.__bench.data.actions.find((action) => action.uid === uid).domCompletion,
      hover.uid,
    ),
    defaults: await page.evaluate(() => window.__fixture.submenuDelays),
    presentedPixels: false,
  };
  await page.evaluate(() => window.__bench.drain());
  flow.counts.childOpen = await domCounts(page);
  checkInventory("childOpen");
  flow.geometry = await page.evaluate(() => {
    const box = (node) => {
      const rect = node.getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        role: node.getAttribute("role"),
        item: node.getAttribute("data-item"),
      };
    };
    return {
      parent: box(document.querySelector('[data-bench="popup"]')),
      child: box(document.querySelector('[data-bench="child-popup"]')),
      trigger: box(document.querySelector('[data-bench="submenu-trigger"]')),
      parents: [...document.querySelectorAll('[data-item^="parent-"]')].map(box),
      children: [...document.querySelectorAll('[data-item^="child-"]')].map(box),
    };
  });
  const geometryFailures = validateSubmenuGeometry(flow.geometry);
  insist(
    geometryFailures.length === 0,
    `Submenu geometry failed: ${geometryFailures.join("; ")}`,
    "driver-failure",
  );
  flow.geometry.pathStart = { x: hover.x, y: hover.y };
  flow.geometry.pathTarget = center(flow.geometry.children[3]);
  const points = linearPath(
    { x: hover.x, y: hover.y },
    center(flow.geometry.children[3]),
    visualContract.submenuMovementCommands,
  );
  flow.pointerActionUid = flowActionUid(page, flowPhase, "traverse");
  await page.evaluate((action) => window.__bench.arm(action), {
    uid: flow.pointerActionUid,
    flowId: flow.flowId ?? flowPhase,
    flowPhase,
    actionId: "traverse",
    kind: "pointer",
  });
  flow.pointer = await pacePointer({
    points,
    durationMs: visualContract.submenuMovementDurationMs,
    move: ({ x, y }) => page.mouse.move(x, y),
  });
  const dwellStarted = performance.now();
  await new Promise((resolve) => setTimeout(resolve, visualContract.dwellMs));
  flow.dwell = { plannedMs: visualContract.dwellMs, actualMs: performance.now() - dwellStarted };
  flow.dwellState = await page.evaluate((point) => {
    const target = document.querySelector('[data-item="child-4"]');
    const active = document.activeElement;
    const activeDescendant = active?.getAttribute("aria-activedescendant");
    return {
      parentOpen:
        document.querySelector('[data-bench="trigger"]')?.getAttribute("aria-expanded") === "true",
      childOpen:
        document.querySelector('[data-bench="submenu-trigger"]')?.getAttribute("aria-expanded") ===
        "true",
      accessibleActive: target === active || Boolean(target?.id && activeDescendant === target.id),
      activeId: active?.id,
      activeDescendant,
      targetAtPointer: document
        .elementFromPoint(point.x, point.y)
        ?.closest("[data-item]")
        ?.getAttribute("data-item"),
      invoked: document.querySelector("output").getAttribute("data-invoked"),
    };
  }, flow.pointer.finalCoordinates);
  const dwellFailures = validateSubmenuDwell(flow.dwellState);
  insist(dwellFailures.length === 0, `Submenu dwell failed: ${dwellFailures.join("; ")}`);
  const choose = await inputAction(page, flowPhase, "choose", "click", {
    ...flow.pointer.finalCoordinates,
    endpoint: "submenu-choose",
  });
  flow.commands.push(choose);
  await waitEndpoint(page, choose.uid);
  await page
    .waitForFunction(
      () => document.activeElement === document.querySelector('[data-bench="trigger"]'),
      undefined,
      { timeout: 5000 },
    )
    .catch(() => {});
  await page.evaluate(() => window.__bench.drain());
  flow.counts.afterClose = await domCounts(page);
  checkInventory("afterClose");
  flow.outcome = await page.evaluate(() => ({
    invoked: JSON.parse(document.querySelector("output").getAttribute("data-invoked")),
    expanded: document.querySelector('[data-bench="trigger"]').getAttribute("aria-expanded"),
    focusReturned: document.activeElement === document.querySelector('[data-bench="trigger"]'),
    visibleMenus: [...document.querySelectorAll('[role="menu"]')].filter(
      (node) => getComputedStyle(node).display !== "none" && node.getClientRects().length,
    ).length,
  }));
  insist(
    flow.outcome.invoked.join(",") === "child-4" &&
      flow.outcome.expanded === "false" &&
      flow.outcome.focusReturned &&
      flow.outcome.visibleMenus === 0,
    "Submenu invocation, dismissal, or focus return failed.",
  );
  await boundary(page, `${flowPhase}:end`);
  return flow;
}
