import {
  boundary,
  domCounts,
  inputAction,
  insist,
  runSelectFlow,
  waitEndpoint,
} from "./driver.mjs";
import { validatePageInventory } from "./portals.mjs";

export async function runSelectPageFlow(page, flowPhase, { record = {} } = {}) {
  await boundary(page, `${flowPhase}:page-start`);
  const fixture = await page.evaluate(() => ({
    provider: window.__fixture.provider,
    controls: window.__fixture.controlCount,
  }));
  const flow = Object.assign(record, {
    flowPhase,
    commands: [],
    counts: { beforeOpen: await domCounts(page) },
  });
  const check = (phase) =>
    insist(
      validatePageInventory(flow.counts[phase], { ...fixture, phase }).length === 0,
      `Select page ${phase} inventory failed: ${validatePageInventory(flow.counts[phase], { ...fixture, phase }).join("; ")}`,
      "driver-failure",
    );
  check("beforeOpen");
  flow.page = await page.evaluate(() => ({
    controlCount: window.__fixture.controlCount,
    targetControl: window.__fixture.targetControl,
    initialValues: [...document.querySelectorAll("form")].map((form) =>
      new FormData(form).get("choice"),
    ),
    mountReference: "cell.raw.mount",
  }));
  insist(
    flow.page.initialValues.length === fixture.controls &&
      flow.page.initialValues.every((value) => value === "option-1"),
    "Page initial selections differ.",
    "driver-failure",
  );
  const box = await page.locator('[data-bench="trigger"]').boundingBox();
  insist(
    box && box.x >= 0 && box.y >= 0 && box.x + 320 <= 1280 && box.y + box.height + 8 + 258 <= 900,
    "Page target and popup must fit the viewport.",
    "driver-failure",
  );
  flow.page.targetGeometry = box;
  const open = await inputAction(page, flowPhase, "open", "click", {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    endpoint: "form-open",
  });
  flow.commands.push(open);
  await waitEndpoint(page, open.uid);
  await page.evaluate(() => window.__bench.drain());
  flow.counts.open = await domCounts(page);
  check("open");
  const close = await inputAction(page, flowPhase, "escape", "key", {
    key: "Escape",
    endpoint: "escape",
  });
  flow.commands.push(close);
  await waitEndpoint(page, close.uid);
  await page.evaluate(() => window.__bench.drain());
  flow.counts.afterEscape = await domCounts(page);
  check("afterEscape");
  // Reuse the bounded Select task and its native form checks.
  try {
    await runSelectFlow(page, flowPhase, { record: flow, continuation: true });
  } finally {
    if (flow.counts.reopen) check("reopen");
    if (flow.counts.afterClose) check("afterClose");
  }
  flow.page.finalValues = await page.evaluate(() =>
    [...document.querySelectorAll("form")].map((form) => new FormData(form).get("choice")),
  );
  insist(
    flow.page.finalValues.every(
      (value, index) => value === (index + 1 === flow.page.targetControl ? "option-4" : "option-1"),
    ),
    "Another page control changed or target selection failed.",
  );
  return flow;
}
