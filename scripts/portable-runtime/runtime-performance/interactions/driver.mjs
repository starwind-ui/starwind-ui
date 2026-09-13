import { performance } from "node:perf_hooks";
import { readPortalInventory } from "./portals.mjs";
import { visualContract } from "./registry.mjs";

const flowIdentities = new WeakMap();

export function setFlowIdentity(page, flowId) {
  flowIdentities.set(page, flowId);
}

export function flowActionUid(page, flowPhase, actionId, ordinal = 0) {
  return `${flowIdentities.get(page) ?? flowPhase}/${actionId}/${ordinal}`;
}

export async function pacePointer({
  points,
  durationMs,
  move,
  now = () => performance.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}) {
  if (!points.length || durationMs <= 0)
    throw new Error("A pointer path needs points and a positive duration.");
  const startedAt = now();
  const period = durationMs / points.length;
  const deliveries = [];
  for (let index = 0; index < points.length; index++) {
    const plannedAt = startedAt + (index + 1) * period;
    // A late command shifts later sends. It never triggers a catch-up burst.
    const deadline = Math.max(plannedAt, (deliveries.at(-1)?.sentAt ?? startedAt) + period);
    while (true) {
      const remainingMs = deadline - now();
      if (remainingMs <= 0) break;
      await sleep(remainingMs);
    }
    const sentAt = now();
    await move(points[index]);
    deliveries.push({
      index,
      plannedAt,
      sentAt,
      completedAt: now(),
      lagMs: sentAt - plannedAt,
      ...points[index],
    });
  }
  return {
    clock: "runner performance.now()",
    startedAt,
    completedAt: now(),
    plannedDurationMs: durationMs,
    commandCount: points.length,
    deliveries,
    finalCoordinates: points.at(-1),
  };
}

export function validatePointerDelivery(events, points) {
  const failures = [];
  if (!events.length || events.some((event) => !event.trusted))
    failures.push("missing or untrusted pointer delivery");
  let previous = 0;
  for (const event of events) {
    const index = points.findIndex(
      (point, index) =>
        index >= previous && Math.abs(event.x - point.x) <= 1 && Math.abs(event.y - point.y) <= 1,
    );
    if (index < 0) failures.push("uncommanded or out-of-order pointer movement");
    else previous = index;
  }
  const final = events.at(-1);
  const expected = points.at(-1);
  if (!final || Math.abs(final.x - expected.x) > 1 || Math.abs(final.y - expected.y) > 1)
    failures.push("wrong final pointer position");
  return [...new Set(failures)];
}

export const linearPath = (start, end, count) =>
  Array.from({ length: count }, (_, index) => ({
    x: start.x + ((end.x - start.x) * index) / (count - 1),
    y: start.y + ((end.y - start.y) * index) / (count - 1),
  }));

export class BenchmarkFailure extends Error {
  constructor(category, message) {
    super(message);
    this.category = category;
  }
}
export function insist(condition, message, category = "correctness-failure") {
  if (!condition) throw new BenchmarkFailure(category, message);
}

export async function boundary(page, reason) {
  const state = await page.evaluate((value) => window.__bench.boundary(value), reason);
  insist(
    state.visible && state.focused,
    `Page lost visibility or focus at ${reason}.`,
    "driver-failure",
  );
  return state;
}

export async function inputAction(page, flowPhase, actionId, kind, details = {}) {
  const flowId = flowIdentities.get(page) ?? flowPhase;
  const uid = flowActionUid(page, flowPhase, actionId, details.ordinal ?? 0);
  const armedAt = await page.evaluate((action) => window.__bench.arm(action), {
    uid,
    flowId,
    flowPhase,
    actionId,
    kind,
    ...details,
  });
  const sentAt = performance.now();
  if (kind === "click") await page.mouse.click(details.x, details.y);
  if (kind === "key") {
    if (details.typeText) await page.keyboard.type(details.text);
    else await page.keyboard.press(details.key);
  }
  const completedAt = performance.now();
  return {
    uid,
    actionId,
    flowPhase,
    flowId,
    kind,
    armedAt,
    sentAt,
    completedAt,
    runnerClock: "performance.now()",
    browserClock: "performance.now()/event.timeStamp",
    ...details,
  };
}
export async function waitEndpoint(page, uid) {
  try {
    await page.waitForFunction(
      (id) =>
        window.__bench.data.actions.find((action) => action.uid === id)?.domCompletion != null,
      uid,
      { timeout: visualContract.endpointTimeoutMs },
    );
  } catch {
    throw new BenchmarkFailure(
      "correctness-failure",
      `Endpoint did not complete within five seconds: ${uid}`,
    );
  }
}
export async function domCounts(page) {
  return page.evaluate(readPortalInventory);
}
export async function resetMenu(page) {
  await page.evaluate(() => window.__bench.clear());
  if ((await page.locator('[data-bench="trigger"]').getAttribute("aria-expanded")) === "true")
    await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.__fixture.reset();
    for (const popup of document.querySelectorAll('[data-bench="popup"]')) popup.scrollTop = 0;
  });
  await page.waitForFunction(
    () => document.querySelector("output")?.getAttribute("data-invoked") === "[]",
  );
  await page.locator('[data-bench="trigger"]').focus();
  await page.mouse.move(60, 60);
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const observationBarrier = (page) => page.evaluate(() => window.__bench.drain());

function submitTargetState() {
  const button = document.querySelector('[data-bench="submit"]');
  const popup = document.querySelector('[data-bench="popup"]');
  const box = button?.getBoundingClientRect();
  const hit = box
    ? document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
    : null;
  return {
    ready: Boolean(button && hit && (hit === button || button.contains(hit))),
    popupConnected: Boolean(popup?.isConnected),
    popupHidden: popup ? popup.hidden || getComputedStyle(popup).display === "none" : true,
    hitTarget: hit
      ? {
          bench: hit.closest?.("[data-bench]")?.getAttribute("data-bench") ?? null,
          item: hit.closest?.("[data-item]")?.getAttribute("data-item") ?? null,
          tag: hit.tagName,
        }
      : null,
  };
}

export async function waitForSubmitReadiness(
  page,
  { timeoutMs = visualContract.endpointTimeoutMs } = {},
) {
  await observationBarrier(page);
  const startedAt = performance.now();
  try {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-bench="submit"]');
        const box = button?.getBoundingClientRect();
        const hit = box
          ? document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
          : null;
        return Boolean(button && hit && (hit === button || button.contains(hit)));
      },
      undefined,
      { timeout: timeoutMs },
    );
  } catch {
    const state = await page.evaluate(submitTargetState);
    throw new BenchmarkFailure(
      "driver-failure",
      `Submit target remained intercepted: ${JSON.stringify(state)}`,
    );
  }
  return {
    ...(await page.evaluate(submitTargetState)),
    waitedMs: performance.now() - startedAt,
    timeoutMs,
    boundary: "after choose observer drain and before submit action arm",
    excludedFromActionTiming: true,
  };
}

export function validateFormOutcome(snapshot, expected) {
  const failures = [];
  if (snapshot.selectedValue !== expected.chosen)
    failures.push(`host selected ${snapshot.selectedValue || "empty"}`);
  if (snapshot.submittedValue !== expected.chosen)
    failures.push(`submitted ${snapshot.submittedValue || "empty"}`);
  if (snapshot.formValue !== expected.chosen)
    failures.push(`FormData contained ${snapshot.formValue || "empty"}`);
  if (snapshot.expanded !== "false") failures.push(`expanded was ${snapshot.expanded}`);
  if (!snapshot.focusAfterChoose) failures.push("focus did not return to the control");
  return failures;
}

export function validateFilteredResults(snapshot, expected) {
  const failures = validateFormOutcome(snapshot, expected);
  if (snapshot.inputValue !== expected.chosenLabel)
    failures.push(`input ended as ${snapshot.inputValue || "empty"}`);
  if (snapshot.filteredItems.length !== expected.matches)
    failures.push(`filtered count was ${snapshot.filteredItems.length}`);
  const expectedItems = Array.from(
    { length: expected.matches },
    (_, index) => `item-${String(40 + index).padStart(3, "0")}`,
  );
  if (snapshot.filteredItems.join(",") !== expectedItems.join(","))
    failures.push(`filtered values were ${snapshot.filteredItems.join(",")}`);
  return failures;
}

export function validateFormReset(snapshot, expected) {
  const failures = [];
  if (snapshot.instanceId !== snapshot.fixtureInstanceId)
    failures.push("component instance changed");
  if (snapshot.selectedValue !== (expected.initial ?? ""))
    failures.push("selected value was not reset");
  if (snapshot.inputValue !== "") failures.push("input value was not reset");
  if (snapshot.submittedValue !== "") failures.push("submitted value was not reset");
  if (snapshot.expanded !== "false") failures.push("control remained open");
  return failures;
}

export function validateNavigationChange(before, after, expectedValue) {
  const failures = [];
  if (!after) failures.push("navigation produced no active option");
  if (before?.value === after?.value) failures.push("navigation kept the previous active option");
  if (after && expectedValue && after.value !== expectedValue)
    failures.push(`navigation reached ${after.value ?? "none"} instead of ${expectedValue}`);
  return failures;
}

export async function navigateSelectToValue({ initial, target, press, gap = () => wait(100) }) {
  const activePath = [initial];
  let current = initial;
  let keyCount = 0;
  while (current?.value !== target && keyCount < 10) {
    const before = current;
    current = await press(++keyCount, before);
    activePath.push(current);
    const failures = validateNavigationChange(before, current);
    insist(failures.length === 0, `Select navigation failed: ${failures.join("; ")}`);
    if (current?.value !== target) await gap();
  }
  insist(
    keyCount > 0 && current?.value === target,
    "Select option 4 was not reachable within ten keys.",
  );
  return { activePath, actualKeyCount: keyCount };
}

export async function activeOption(page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    const activeDescendant = active?.getAttribute("aria-activedescendant");
    const candidate =
      active?.getAttribute("role") === "option"
        ? active
        : activeDescendant
          ? document.getElementById(activeDescendant)
          : null;
    const option = candidate?.getAttribute("role") === "option" ? candidate : null;
    return option
      ? {
          value: option.getAttribute("data-item"),
          label: option.textContent.trim(),
          id: option.id,
          via: option === active ? "focus" : "aria-activedescendant",
        }
      : null;
  });
}

export async function formState(page, extra = {}) {
  return page.evaluate((details) => {
    const trigger = document.querySelector('[data-bench="trigger"]');
    const output = document.querySelector("output");
    const popup = document.querySelector('[data-bench="popup"]');
    const visibleItems = [...(popup?.querySelectorAll("[data-item]") ?? [])].filter((item) => {
      const style = getComputedStyle(item);
      return (
        style.display !== "none" && style.visibility !== "hidden" && item.getClientRects().length
      );
    });
    return {
      selectedValue: output?.getAttribute("data-selected-value") ?? "",
      inputValue: output?.getAttribute("data-input-value") ?? "",
      submittedValue: output?.getAttribute("data-submitted-value") ?? "",
      formValue: new FormData(document.querySelector('[data-bench="form"]')).get("choice"),
      expanded: trigger?.getAttribute("aria-expanded"),
      selectedItems: [...document.querySelectorAll('[role="option"][aria-selected="true"]')].map(
        (item) => item.getAttribute("data-item"),
      ),
      filteredItems: visibleItems.map((item) => item.getAttribute("data-item")),
      instanceId: output?.getAttribute("data-instance-id"),
      fixtureInstanceId: window.__fixture.instanceId,
      ...details,
    };
  }, extra);
}

export async function resetForm(page) {
  await page.evaluate(() => window.__bench.clear());
  const trigger = page.locator('[data-bench="trigger"]');
  if ((await trigger.getAttribute("aria-expanded")) === "true") await page.keyboard.press("Escape");
  await page.evaluate(() => {
    window.__fixture.reset();
    for (const popup of document.querySelectorAll('[data-bench="popup"]')) popup.scrollTop = 0;
  });
  await page.waitForFunction(() => {
    const output = document.querySelector("output");
    const expected = window.__fixture.expected;
    return (
      output?.getAttribute("data-selected-value") === (expected.initial ?? "") &&
      output?.getAttribute("data-input-value") === "" &&
      output?.getAttribute("data-submitted-value") === "" &&
      document.querySelector('[data-bench="trigger"]')?.getAttribute("aria-expanded") === "false"
    );
  });
  if ((await page.evaluate(() => window.__fixture.scenario)) === "combobox-500")
    await page.locator('[data-bench="submit"]').focus();
  else await trigger.focus();
  await page.mouse.move(60, 60);
  const snapshot = await formState(page);
  insist(
    validateFormReset(snapshot, await page.evaluate(() => window.__fixture.expected)).length === 0,
    `Form reset failed: ${JSON.stringify(snapshot)}`,
    "driver-failure",
  );
  return snapshot;
}

export async function preflightSelectScroll(page) {
  await resetForm(page);
  await page.locator('[data-bench="trigger"]').click();
  await page.locator('[data-bench="popup"]').waitFor({ state: "visible" });
  try {
    await page.waitForFunction(
      () => {
        const active = document.activeElement;
        const activeDescendant = active?.getAttribute("aria-activedescendant");
        return [...document.querySelectorAll('[role="option"]')].some(
          (item) => item === active || (item.id && item.id === activeDescendant),
        );
      },
      undefined,
      { timeout: visualContract.endpointTimeoutMs },
    );
  } catch {
    throw new BenchmarkFailure("correctness-failure", "Select did not expose an active option.");
  }
  await page.keyboard.press("End");
  try {
    await page.waitForFunction(
      () => document.querySelector('[data-bench="popup"]')?.scrollTop > 0,
      undefined,
      { timeout: visualContract.endpointTimeoutMs },
    );
  } catch {
    throw new BenchmarkFailure("correctness-failure", "End did not scroll the last Select option.");
  }
  const result = await page.evaluate(() => ({
    excludedFromComparativeSamples: true,
    context: "separate validation context",
    scrollTop: document.querySelector('[data-bench="popup"]').scrollTop,
    lastOptionInView: (() => {
      const popup = document.querySelector('[data-bench="popup"]').getBoundingClientRect();
      const item = document.querySelector('[data-item="option-100"]').getBoundingClientRect();
      return item.top >= popup.top && item.bottom <= popup.bottom;
    })(),
  }));
  insist(result.lastOptionInView, "Select option 100 did not enter the popup viewport.");
  await page.keyboard.press("Escape");
  await resetForm(page);
  return result;
}

async function submitForm(page, flowPhase, expectedValue, commands) {
  const readiness = await waitForSubmitReadiness(page);
  const button = await page.locator('[data-bench="submit"]').boundingBox();
  insist(button, "Submit button has no visible box.");
  const command = await inputAction(page, flowPhase, "submit", "click", {
    x: button.x + button.width / 2,
    y: button.y + button.height / 2,
    endpoint: "form-submit",
    expectedValue,
  });
  commands.push(command);
  const deliveryTarget = await page.evaluate((uid) => {
    const click = window.__bench.data.events.find(
      (event) => event.actionUid === uid && event.name === "click",
    );
    return click
      ? { trusted: click.trusted, target: click.target, receivedAt: click.receivedAt }
      : null;
  }, command.uid);
  insist(
    deliveryTarget?.trusted && deliveryTarget.target?.bench === "submit",
    `Commanded submit click missed its control: ${JSON.stringify(deliveryTarget)}`,
    "driver-failure",
  );
  await waitEndpoint(page, command.uid);
  await observationBarrier(page);
  return { ...readiness, deliveryTarget };
}

export async function runSelectFlow(page, flowPhase, { record = {}, continuation = false } = {}) {
  await boundary(page, `${flowPhase}:start`);
  const expected = await page.evaluate(() => window.__fixture.expected);
  const flow = Object.assign(record, {
    flowPhase,
    commands: continuation ? record.commands : [],
    counts: continuation ? record.counts : { beforeOpen: await domCounts(page) },
  });
  const trigger = await page.locator('[data-bench="trigger"]').boundingBox();
  insist(trigger, "Select trigger has no visible box.");
  const open = await inputAction(page, flowPhase, continuation ? "reopen" : "open", "click", {
    x: trigger.x + trigger.width / 2,
    y: trigger.y + trigger.height / 2,
    endpoint: "form-open",
  });
  flow.commands.push(open);
  await waitEndpoint(page, open.uid);
  await observationBarrier(page);
  flow.counts[continuation ? "reopen" : "open"] = await domCounts(page);
  flow.disabledState = await page
    .locator(`[data-bench="popup"] [data-item="${expected.disabled}"]`)
    .evaluate((item) => ({
      ariaDisabled: item.getAttribute("aria-disabled"),
      dataDisabled: item.hasAttribute("data-disabled"),
    }));
  insist(
    flow.disabledState.ariaDisabled === "true" || flow.disabledState.dataDisabled,
    "Select option 3 is missing its disabled state.",
    "driver-failure",
  );
  flow.initialActive = await activeOption(page);
  const navigation = await navigateSelectToValue({
    initial: flow.initialActive,
    target: expected.chosen,
    press: async (ordinal, before) => {
      const command = await inputAction(page, flowPhase, "navigate-next", "key", {
        key: "ArrowDown",
        ordinal,
        endpoint: "active-option",
        previousActiveValue: before?.value ?? null,
      });
      flow.commands.push(command);
      await waitEndpoint(page, command.uid);
      return activeOption(page);
    },
  });
  flow.activePath = navigation.activePath;
  flow.actualKeyCount = navigation.actualKeyCount;
  flow.activeBeforeChoose = await activeOption(page);
  insist(
    flow.activeBeforeChoose?.value === expected.chosen,
    "Select option 4 was not reachable within ten keys.",
  );
  const choose = await inputAction(page, flowPhase, "choose", "key", {
    key: "Enter",
    endpoint: "form-choose",
    expectedValue: expected.chosen,
  });
  flow.commands.push(choose);
  await waitEndpoint(page, choose.uid);
  await page
    .waitForFunction(
      () => document.activeElement === document.querySelector('[data-bench="trigger"]'),
      undefined,
      { timeout: visualContract.endpointTimeoutMs },
    )
    .catch(() => {});
  flow.focusAfterChoose = await page.evaluate(
    () => document.activeElement === document.querySelector('[data-bench="trigger"]'),
  );
  flow.submitReadiness = await submitForm(page, flowPhase, expected.chosen, flow.commands);
  flow.counts.afterClose = await domCounts(page);
  flow.outcome = await formState(page, { focusAfterChoose: flow.focusAfterChoose });
  const failures = validateFormOutcome(flow.outcome, expected);
  insist(failures.length === 0, `Select task failed: ${failures.join("; ")}`);
  insist(
    !flow.outcome.selectedItems.includes(expected.disabled),
    "Disabled option became selected.",
  );
  await boundary(page, `${flowPhase}:end`);
  await page.evaluate(() => window.__bench.drain());
  return flow;
}

export async function runComboboxFlow(page, flowPhase, { record = {} } = {}) {
  await boundary(page, `${flowPhase}:start`);
  const expected = await page.evaluate(() => window.__fixture.expected);
  const flow = Object.assign(record, {
    flowPhase,
    commands: [],
    counts: { beforeOpen: await domCounts(page) },
  });
  const input = page.locator('[data-bench="trigger"]');
  await input.focus();
  let prefix = "";
  for (const [index, character] of [...expected.query].entries()) {
    prefix += character;
    const command = await inputAction(page, flowPhase, `type-character-${index + 1}`, "key", {
      key: character === " " ? " " : character,
      text: character,
      typeText: true,
      ordinal: index + 1,
      endpoint: "input-value",
      expectedInput: prefix,
    });
    flow.commands.push(command);
    await waitEndpoint(page, command.uid);
    if (index < expected.query.length - 1) await wait(100);
  }
  await page.locator('[data-bench="popup"]').waitFor({ state: "visible" });
  await observationBarrier(page);
  flow.counts.open = await domCounts(page);
  flow.filteredItems = await page.evaluate(() =>
    [...document.querySelectorAll("[data-item]")]
      .filter((item) => getComputedStyle(item).display !== "none" && item.getClientRects().length)
      .map((item) => item.getAttribute("data-item")),
  );
  flow.filterDiagnostics = await page.evaluate(() => {
    const item = document.querySelector('[data-item="item-001"]');
    return item
      ? {
          hidden: item.hidden,
          filtered: item.hasAttribute("data-filtered"),
          display: getComputedStyle(item).display,
          visibility: getComputedStyle(item).visibility,
          rectCount: item.getClientRects().length,
        }
      : { rendered: false };
  });
  insist(
    flow.filteredItems.length === expected.matches,
    `Filtered count was ${flow.filteredItems.length}.`,
  );
  flow.initialActive = await activeOption(page);
  let keyCount = 0;
  let currentActive = flow.initialActive;
  while (currentActive?.value !== expected.chosen && keyCount < 10) {
    keyCount++;
    const before = currentActive;
    const command = await inputAction(page, flowPhase, "navigate-next", "key", {
      key: "ArrowDown",
      ordinal: keyCount,
      endpoint: "active-option",
      previousActiveValue: before?.value ?? null,
    });
    flow.commands.push(command);
    await waitEndpoint(page, command.uid);
    currentActive = await activeOption(page);
    const failures = validateNavigationChange(before, currentActive);
    insist(failures.length === 0, `Combobox navigation failed: ${failures.join("; ")}`);
    if (currentActive?.value !== expected.chosen) await wait(100);
  }
  flow.actualKeyCount = keyCount;
  flow.activeBeforeChoose = await activeOption(page);
  insist(
    flow.activeBeforeChoose?.value === expected.chosen,
    "Item 042 was not reachable within ten keys.",
  );
  const choose = await inputAction(page, flowPhase, "choose", "key", {
    key: "Enter",
    endpoint: "form-choose",
    expectedValue: expected.chosen,
  });
  flow.commands.push(choose);
  await waitEndpoint(page, choose.uid);
  flow.focusAfterChoose = await page.evaluate(
    () => document.activeElement === document.querySelector('[data-bench="trigger"]'),
  );
  flow.submitReadiness = await submitForm(page, flowPhase, expected.chosen, flow.commands);
  flow.counts.afterClose = await domCounts(page);
  flow.outcome = await formState(page, {
    filteredItems: flow.filteredItems,
    focusAfterChoose: flow.focusAfterChoose,
  });
  const failures = validateFilteredResults(flow.outcome, expected);
  insist(failures.length === 0, `Combobox task failed: ${failures.join("; ")}`);
  await boundary(page, `${flowPhase}:end`);
  await page.evaluate(() => window.__bench.drain());
  return flow;
}

export async function runMenuFlow(page, flowPhase, { record = {} } = {}) {
  await boundary(page, `${flowPhase}:start`);
  const flow = Object.assign(record, {
    flowPhase,
    commands: [],
    geometry: null,
    counts: { beforeOpen: await domCounts(page) },
    outcome: null,
  });
  const trigger = await page.locator('[data-bench="trigger"]').boundingBox();
  insist(trigger, "Trigger has no visible box.");
  const triggerPoint = { x: trigger.x + trigger.width / 2, y: trigger.y + trigger.height / 2 };
  const open = await inputAction(page, flowPhase, "open", "click", {
    ...triggerPoint,
    endpoint: "open",
  });
  flow.commands.push(open);
  await waitEndpoint(page, open.uid);
  await page.locator('[data-bench="popup"]').waitFor({ state: "visible", timeout: 5000 });
  flow.counts.open = await domCounts(page);
  const geometry = await page.evaluate(() => {
    const box = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    };
    const popup = document.querySelector('[data-bench="popup"]');
    return {
      popup: box(popup),
      trigger: box(document.querySelector('[data-bench="trigger"]')),
      rows: [...document.querySelectorAll("[data-item]")].slice(0, 8).map((element) => ({
        ...box(element),
        item: element.getAttribute("data-item"),
        role: element.getAttribute("role"),
        disabled: element.getAttribute("aria-disabled"),
      })),
      scrollTop: popup.scrollTop,
      clientHeight: popup.clientHeight,
      deviceScaleFactor: devicePixelRatio,
    };
  });
  flow.geometry = geometry;
  insist(
    geometry.popup.width === 320 && geometry.clientHeight === 256,
    "Popup must expose eight 32-pixel rows at width 320.",
  );
  insist(
    geometry.rows.length === 8 &&
      geometry.rows.every((row) => row.height === 32 && row.role === "menuitem"),
    "Menu row geometry or role differs.",
  );
  insist(geometry.rows[2].disabled === "true", "Action 3 must be disabled.");
  insist(
    Math.abs(geometry.popup.y - (geometry.trigger.y + geometry.trigger.height) - 8) <= 1,
    "Popup offset differs from eight pixels.",
  );
  insist(
    geometry.rows[7].y + geometry.rows[7].height <= geometry.popup.y + geometry.popup.height &&
      geometry.scrollTop === 0,
    "Action 8 must be visible without scrolling.",
  );
  const center = (row) => ({ x: row.x + row.width / 2, y: row.y + row.height / 2 });
  const points = linearPath(
    center(geometry.rows[0]),
    center(geometry.rows[7]),
    visualContract.movementCommands,
  );
  const pointerUid = flowActionUid(page, flowPhase, "sweep");
  await page.evaluate(
    ({ uid, phase, flowId }) =>
      window.__bench.arm({ uid, flowId, flowPhase: phase, actionId: "sweep", kind: "pointer" }),
    { uid: pointerUid, phase: flowPhase, flowId: flowIdentities.get(page) ?? flowPhase },
  );
  flow.pointer = await pacePointer({
    points,
    durationMs: visualContract.movementDurationMs,
    move: ({ x, y }) => page.mouse.move(x, y),
  });
  const dwellStarted = performance.now();
  await new Promise((resolve) => setTimeout(resolve, visualContract.dwellMs));
  flow.dwell = { plannedMs: visualContract.dwellMs, actualMs: performance.now() - dwellStarted };
  flow.dwellState = await page.evaluate(() => {
    const target = document.querySelector('[data-item="action-8"]');
    const active = document.activeElement;
    const activeDescendant = active?.getAttribute("aria-activedescendant");
    return {
      item: target?.getAttribute("data-item"),
      highlighted: target?.hasAttribute("data-highlighted"),
      accessibleActive: active === target || Boolean(target?.id && activeDescendant === target.id),
      activeId: active?.id,
      activeDescendant,
      invoked: document.querySelector("output")?.getAttribute("data-invoked"),
      targetAtPointer: document
        .elementFromPoint(
          target.getBoundingClientRect().x + 20,
          target.getBoundingClientRect().y + 16,
        )
        ?.closest("[data-item]")
        ?.getAttribute("data-item"),
    };
  });
  insist(
    flow.dwellState.accessibleActive,
    `Action 8 has no accessible active state at dwell: ${JSON.stringify(flow.dwellState)}`,
  );
  insist(flow.dwellState.invoked === "[]", "Movement invoked an action.");
  const choose = await inputAction(page, flowPhase, "choose", "click", {
    ...center(geometry.rows[7]),
    endpoint: "choose",
  });
  flow.commands.push(choose);
  await waitEndpoint(page, choose.uid);
  await page.locator('[data-bench="popup"]').waitFor({ state: "hidden", timeout: 5000 });
  flow.counts.afterClose = await domCounts(page);
  const reopen = await inputAction(page, flowPhase, "reopen", "click", {
    ...triggerPoint,
    endpoint: "open",
  });
  flow.commands.push(reopen);
  await waitEndpoint(page, reopen.uid);
  const escape = await inputAction(page, flowPhase, "escape", "key", {
    key: "Escape",
    endpoint: "escape",
  });
  flow.commands.push(escape);
  await waitEndpoint(page, escape.uid);
  flow.outcome = await page.evaluate(() => ({
    invoked: JSON.parse(document.querySelector("output").getAttribute("data-invoked")),
    expanded: document.querySelector('[data-bench="trigger"]').getAttribute("aria-expanded"),
    focusReturned: document.activeElement === document.querySelector('[data-bench="trigger"]'),
  }));
  insist(
    flow.outcome.invoked.join(",") === "action-8" &&
      flow.outcome.expanded === "false" &&
      flow.outcome.focusReturned,
    "Menu task result or focus return failed.",
  );
  await boundary(page, `${flowPhase}:end`);
  await page.evaluate(() => window.__bench.drain());
  return flow;
}

// Full disabled-item verification runs after both comparative flows in this context.
export async function verifyDisabledMenuItem(page) {
  await resetMenu(page);
  await page.locator('[data-bench="trigger"]').click();
  await page.locator('[data-bench="popup"]').waitFor({ state: "visible" });
  const target = await page.locator('[data-item="action-3"]').boundingBox();
  await page.mouse.click(target.x + target.width / 2, target.y + target.height / 2);
  await page.evaluate(() => window.__bench.drain());
  const result = await page.evaluate(() => ({
    invoked: document.querySelector("output").getAttribute("data-invoked"),
    expanded: document.querySelector('[data-bench="trigger"]').getAttribute("aria-expanded"),
    disabled: document.querySelector('[data-item="action-3"]').getAttribute("aria-disabled"),
    rawCallbacks: window.__fixture.rawMenuCallbacks,
    excludedFromComparativeSamples: true,
  }));
  await page.keyboard.press("Escape");
  return result;
}
