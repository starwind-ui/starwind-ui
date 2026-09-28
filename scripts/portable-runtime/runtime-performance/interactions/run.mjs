import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { prepareBuild, repoRoot, serve, sourceInventory, command } from "./build.mjs";
import { installObserver } from "./browser-observer.mjs";
import { collectObservations } from "./collector.mjs";
import {
  boundary,
  inputAction,
  domCounts,
  validatePointerDelivery,
  insist,
  linearPath,
  pacePointer,
  preflightSelectScroll,
  runComboboxFlow,
  runMenuFlow,
  runSelectFlow,
  setFlowIdentity,
  verifyDisabledMenuItem,
} from "./driver.mjs";
import { writeEvidenceManifest, writeSessionEvidence, writeSessionIndex } from "./evidence.mjs";
import { runSelectPageFlow } from "./pages.mjs";
import { createRunPlan } from "./plan.mjs";
import { writeCaptureReport } from "./report.mjs";
import { runSubmenuFlow } from "./submenus.mjs";
import { visualContract } from "./registry.mjs";

const save = (directory, name, value) =>
  writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + "\n");
const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

// Keep the final read and eligibility decision in one failure-tested boundary.
export async function finalizeCell({ cell, page, pageErrors = [], calibration, mode }) {
  try {
    cell.raw = await page.evaluate(async () => {
      await window.__bench.drain();
      return window.__bench.data;
    });
    if (cell.raw == null)
      throw new Error("Browser collector data is absent after the final drain.");
  } catch (error) {
    cell.raw = null;
    cell.collected = null;
    cell.complete = false;
    cell.failures.push({
      category: "incomplete-capture",
      reason: "final-observation-read-failed",
      message: error instanceof Error ? (error.stack ?? error.message) : String(error),
    });
  }
  cell.pageErrors = pageErrors;
  if (cell.raw) {
    const lostFocus = cell.raw.lifecycle.some(({ reason, visible, focused }) =>
      reason !== "blur" ? !visible || !focused : true,
    );
    if (lostFocus)
      cell.failures.push({
        category: "driver-failure",
        message: "Visibility or focus loss invalidated this cell.",
      });
    cell.collected = collectObservations(cell.raw, {
      calibrationPassed: calibration.observerCalibrationPassed,
      cellFailure: cell.failures[0]?.category,
      excluded: mode === "trace",
    });
    for (const flow of cell.flows) {
      const moves = cell.raw.events.filter(
        ({ name, actionUid }) =>
          name === "pointermove" &&
          actionUid === (flow.pointerActionUid ?? `${flow.flowId ?? flow.flowPhase}/sweep/0`),
      );
      flow.pointerDelivery = {
        receivedCount: moves.length,
        finalCoordinates: moves.at(-1) ? { x: moves.at(-1).x, y: moves.at(-1).y } : null,
        trusted: moves.every(({ trusted }) => trusted),
        receivedEvents: moves,
      };
      if (flow.pointer && validatePointerDelivery(moves, flow.pointer.deliveries).length)
        cell.failures.push({
          category: "driver-failure",
          message: `Pointer delivery failed in ${flow.flowPhase}.`,
        });
    }
    if (
      cell.collected.observations.some(({ state }) => state === "failed") &&
      cell.failures.length === 0
    )
      cell.failures.push({
        category: "driver-failure",
        message: "Discrete input sequence failed validation.",
      });
  }
  if (cell.raw && cell.failures.length)
    cell.collected = collectObservations(cell.raw, {
      calibrationPassed: calibration.observerCalibrationPassed,
      cellFailure: cell.failures[0].category,
      excluded: mode === "trace",
    });
  cell.eligible =
    Boolean(cell.raw) &&
    cell.complete &&
    cell.failures.length === 0 &&
    calibration.passed &&
    mode !== "trace" &&
    cell.passRole !== "warmup";
  return cell;
}

async function newPage(browser, cpu) {
  const context = await browser.newContext({
    viewport: visualContract.viewport,
    deviceScaleFactor: visualContract.deviceScaleFactor,
  });
  await context.addInitScript(installObserver);
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
  await page.bringToFront();
  return { context, page, cdp };
}

async function validateSelectScroll(browser, url, cpu, planned) {
  const validation = await newPage(browser, cpu);
  try {
    await validation.page.goto(`${url}/${planned.provider}.html?scenario=${planned.scenario}`);
    await validation.page.waitForFunction(
      () => window.__fixture?.ready && window.__bench.data.mount?.durationMs != null,
      undefined,
      { timeout: visualContract.endpointTimeoutMs },
    );
    return await preflightSelectScroll(validation.page);
  } finally {
    await validation.context.close();
  }
}

async function calibrate(browser, url, cpu) {
  const { context, page } = await newPage(browser, cpu);
  const result = {
    excludedFromComparativeSamples: true,
    cpu,
    passed: false,
    commands: [],
    deviceScaleFactor: null,
  };
  try {
    await page.goto(`${url}/control.html`);
    result.deviceScaleFactor = await page.evaluate(() => devicePixelRatio);
    await boundary(page, "calibration:start");
    const box = await page.locator("#empty").boundingBox();
    result.commands.push(
      await inputAction(page, "validation", "empty-click", "click", {
        x: box.x + 30,
        y: box.y + 20,
      }),
    );
    insist(
      (await page.evaluate(() => window.control.empty)) === 1,
      "Empty input delivery failed.",
      "driver-failure",
    );
    await page.evaluate(() =>
      window.__bench.arm({
        uid: "validation/pointer/0",
        flowPhase: "validation",
        actionId: "pointer",
        kind: "pointer",
      }),
    );
    result.pointer = await pacePointer({
      points: linearPath({ x: 600, y: 100 }, { x: 600, y: 324 }, 60),
      durationMs: 1000,
      move: ({ x, y }) => page.mouse.move(x, y),
    });
    await page.locator("#empty").focus();
    result.commands.push(await inputAction(page, "validation", "enter", "key", { key: "Enter" }));
    await page.locator("#typing").focus();
    result.commands.push(
      await inputAction(page, "validation", "type-character", "key", { key: "a" }),
    );
    const slow = await page.locator("#slow").boundingBox();
    result.commands.push(
      await inputAction(page, "validation", "slow-click", "click", {
        x: slow.x + 30,
        y: slow.y + 20,
      }),
    );
    await page.evaluate(() => window.__bench.drain());
    result.raw = await page.evaluate(() => window.__bench.data);
    result.collected = collectObservations(result.raw, { excluded: true });
    const slowObservation = result.collected.observations.find(
      ({ actionId }) => actionId === "slow-click",
    );
    const delivered = result.collected.observations.every(({ delivery }) => delivery.valid);
    const pointers = result.raw.events.filter(
      ({ name, actionUid }) => name === "pointermove" && actionUid === "validation/pointer/0",
    );
    const last = pointers.at(-1);
    const typing = await page.inputValue("#typing");
    result.passed =
      delivered &&
      result.raw.support.event &&
      slowObservation?.state === "measured" &&
      slowObservation.durationMs >= 80 &&
      pointers.every(({ trusted }) => trusted) &&
      last?.x === 600 &&
      last?.y === 324 &&
      typing === "a" &&
      (await page.evaluate(() => window.control.empty === 2 && window.control.slow === 1));
    result.pointerDelivery = {
      receivedCount: pointers.length,
      finalCoordinates: last ? { x: last.x, y: last.y } : null,
    };
    result.observerCalibrationPassed =
      slowObservation?.state === "measured" && slowObservation.durationMs >= 80;
    await boundary(page, "calibration:end");
  } catch (error) {
    result.error = String(error);
    result.raw = await page.evaluate(() => window.__bench?.data).catch(() => null);
  } finally {
    await context.close();
  }
  return result;
}

async function startTrace(cdp) {
  await cdp.send("Tracing.start", {
    categories: [
      "devtools.timeline",
      "blink.user_timing",
      "loading",
      "toplevel",
      "cc",
      "viz",
      "benchmark",
      "disabled-by-default-devtools.timeline",
      "disabled-by-default-devtools.timeline.frame",
      "disabled-by-default-devtools.screenshot",
    ].join(","),
    options: "record-as-much-as-possible",
    transferMode: "ReturnAsStream",
  });
}
async function stopTrace(cdp, filename) {
  const done = new Promise((resolve) => cdp.once("Tracing.tracingComplete", resolve));
  await cdp.send("Tracing.end");
  const { stream } = await done;
  const chunks = [];
  try {
    while (true) {
      const chunk = await cdp.send("IO.read", { handle: stream });
      chunks.push(Buffer.from(chunk.data, chunk.base64Encoded ? "base64" : "utf8"));
      if (chunk.eof) break;
    }
  } finally {
    await cdp.send("IO.close", { handle: stream });
  }
  writeFileSync(filename, Buffer.concat(chunks));
  const trace = JSON.parse(readFileSync(filename, "utf8"));
  return {
    file: path.basename(filename),
    events: trace.traceEvents.length,
    screenshotEvents: trace.traceEvents.filter(({ name }) => name === "Screenshot").length,
    frameEvents: trace.traceEvents.filter(({ name }) => /Frame/.test(name)).length,
    excludedFromPrimarySamples: true,
  };
}

export async function runBenchmark(config) {
  const runId = `${new Date().toISOString().replaceAll(":", "-")}-${config.mode}-${randomUUID().slice(0, 8)}`;
  const directory = path.join(repoRoot, ".scratch/realistic-react-performance/runs", runId);
  mkdirSync(directory, { recursive: true });
  const source = {
    revision: git("rev-parse", "HEAD"),
    dirty: Boolean(git("status", "--porcelain", "--untracked-files=all")),
    status: git("status", "--porcelain", "--untracked-files=all"),
    inventory: sourceInventory(),
  };
  const plan = createRunPlan(config, runId);
  save(directory, "plan.json", plan);
  save(directory, "source.json", source);
  const results = {
    schemaVersion: 2,
    runId,
    mode: config.mode,
    cpu: config.cpu,
    complete: false,
    eligible: false,
    calibrationPassed: false,
    plannedContexts: plan.expectedContexts,
    actualOrder: [],
    cells: [],
    preflights: {},
    failures: [],
  };
  const sessionEntries = [];
  const reportSessions = [];
  let build;
  let server;
  let browser;
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  process.once("SIGINT", interrupt);
  try {
    console.log(`Preparing ${config.mode}: ${directory}`);
    build = await prepareBuild(directory);
    save(directory, "build.json", build);
    server = await serve(build.distRoot);
    browser = await chromium.launch({
      headless: false,
      args: ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
    });
    const environment = {
      recordedAt: new Date().toISOString(),
      browser: browser.version(),
      node: process.version,
      pnpm: command(["--version"]).trim(),
      os: { platform: os.platform(), release: os.release(), arch: os.arch() },
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      viewport: visualContract.viewport,
      deviceScaleFactor: 1,
      cpuThrottleRate: config.cpu,
      cpuLabel: config.cpu === 4 ? "simulated slowdown" : "native",
      headed: true,
      activePages: 1,
      powerState: "unknown",
      displayRefreshRateHz: "unknown",
      operatorNotes:
        "Record power source and display refresh rate from host settings before publication. Unrelated host load is not controlled.",
      versions: build.dependencies,
    };
    const calibration = await calibrate(browser, server.url, config.cpu);
    results.calibrationPassed = calibration.passed;
    save(directory, "calibration.json", calibration);
    environment.actualDeviceScaleFactor = calibration.deviceScaleFactor;
    save(directory, "environment.json", environment);
    for (const planned of plan.cells) {
      if (interrupted) throw new Error("Capture interrupted after the last saved session.");
      console.log(
        `Running ${planned.provider} ${planned.scenario} session ${planned.sessionIndex} (CPU ${config.cpu})`,
      );
      const preflightKey = `${planned.provider}/${planned.scenario}`;
      if (planned.scenario === "select-100" && !(preflightKey in results.preflights)) {
        try {
          results.preflights[preflightKey] = await validateSelectScroll(
            browser,
            server.url,
            config.cpu,
            planned,
          );
        } catch (error) {
          results.preflights[preflightKey] = {
            complete: false,
            category: error.category ?? "driver-failure",
            message: error.stack ?? String(error),
          };
        }
      }
      const cell = {
        ...planned,
        runId,
        excludedFromPrimarySamples: config.mode === "trace" || planned.passRole === "warmup",
        complete: false,
        eligible: false,
        scrollPreflight: results.preflights[preflightKey] ?? null,
        flows: [],
        failures: [],
      };
      if (cell.scrollPreflight?.complete === false) {
        cell.providerFailure = true;
        cell.failures.push({ ...cell.scrollPreflight });
      }
      const { context, page, cdp } = await newPage(browser, config.cpu);
      const pageErrors = [];
      page.on("pageerror", (error) => pageErrors.push(String(error)));
      let tracing = false;
      try {
        await page.goto(`${server.url}/${planned.provider}.html?scenario=${planned.scenario}`);
        await page.waitForFunction(
          () => window.__fixture?.ready && window.__bench.data.mount?.durationMs != null,
          undefined,
          { timeout: 5000 },
        );
        insist(
          (await page.evaluate(() => window.__fixture.provider)) === planned.provider,
          "Fixture provider identity mismatch.",
          "driver-failure",
        );
        await page.evaluate(() => window.__bench.drain());
        cell.mountReadyCheck = await page.evaluate(() => window.__bench.readyState());
        insist(
          cell.mountReadyCheck.ready,
          "Mount endpoint became stale before validation.",
          "driver-failure",
        );
        cell.mountInventory = await domCounts(page);
        await page.mouse.move(60, 60);
        if (planned.scenario === "combobox-500")
          await page.locator('[data-bench="submit"]').focus();
        else await page.locator('[data-bench="trigger"]').focus();
        if (config.mode === "trace") {
          await startTrace(cdp);
          tracing = true;
        }
        for (const plannedFlow of [planned.flow]) {
          const flow = { ...plannedFlow };
          cell.flows.push(flow);
          setFlowIdentity(page, flow.flowId);
          try {
            if (planned.scenario === "submenu-8x8")
              await runSubmenuFlow(page, flow.flowPhase, { record: flow });
            if (planned.scenario.startsWith("select-page-"))
              await runSelectPageFlow(page, flow.flowPhase, { record: flow });
            if (planned.scenario === "menu-20")
              await runMenuFlow(page, flow.flowPhase, { record: flow });
            if (planned.scenario === "select-100")
              await runSelectFlow(page, flow.flowPhase, { record: flow });
            if (planned.scenario === "combobox-500")
              await runComboboxFlow(page, flow.flowPhase, { record: flow });
          } catch (error) {
            if (error.category !== "correctness-failure") throw error;
            flow.failure = { category: error.category, message: error.stack ?? String(error) };
            cell.failures.push({ ...flow.failure, flowPhase: flow.flowPhase, flowId: flow.flowId });
            cell.providerFailure = true;
            await page.evaluate(() => window.__bench.drain());
          }
        }
        cell.complete = true;
        if (planned.scenario === "menu-20") {
          cell.disabledCheck = await verifyDisabledMenuItem(page);
          insist(
            cell.disabledCheck.invoked === "[]" &&
              cell.disabledCheck.expanded === "true" &&
              cell.disabledCheck.disabled === "true",
            `Disabled action accepted input: ${JSON.stringify(cell.disabledCheck)}`,
          );
        }
        insist(pageErrors.length === 0, `Browser errors: ${pageErrors.join("; ")}`);
        cell.complete = true;
      } catch (error) {
        cell.failures.push({
          category: error.category ?? "driver-failure",
          message: error.stack ?? String(error),
        });
        if (error.category === "correctness-failure") {
          cell.complete = true;
          cell.providerFailure = true;
        }
        await page.evaluate(() => window.__bench.clear()).catch(() => {});
        if (config.mode === "smoke")
          await page
            .screenshot({
              path: path.join(
                directory,
                `${String(planned.orderIndex).padStart(3, "0")}-${planned.provider}-${planned.scenario}-failure.png`,
              ),
            })
            .catch(() => {});
      } finally {
        if (tracing) {
          try {
            cell.trace = await stopTrace(
              cdp,
              path.join(
                directory,
                `${String(planned.orderIndex).padStart(3, "0")}-${planned.provider}-${planned.scenario}.trace.json`,
              ),
            );
          } catch (error) {
            cell.failures.push({
              category: "incomplete-capture",
              message: `Trace finalization failed: ${error}`,
            });
          }
        }
        await finalizeCell({ cell, page, pageErrors, calibration, mode: config.mode });
        await context.close();
        const entry = writeSessionEvidence(directory, cell);
        sessionEntries.push(entry);
        results.cells.push(entry);
        results.actualOrder.push(cell.sessionId);
        reportSessions.push({
          ...planned,
          runId,
          complete: cell.complete,
          eligible: cell.eligible,
          failures: cell.failures,
          raw: { mount: cell.raw?.mount ?? null },
          collected: {
            observations: (cell.collected?.observations ?? []).map((observation) => ({
              actionUid: observation.actionUid,
              actionId: observation.actionId,
              ordinal: observation.ordinal,
              flowId: observation.flowId,
              flowPhase: observation.flowPhase,
              excluded: observation.excluded,
              state: observation.state,
              reason: observation.reason,
              durationMs: observation.durationMs,
              reportedDurationBound: observation.reportedDurationBound,
              domCompletion: observation.domCompletion,
              delivery: observation.delivery,
            })),
          },
        });
        writeSessionIndex(directory, sessionEntries);
        save(directory, "observations.json", results);
      }
    }
    results.complete =
      sessionEntries.length === plan.cells.length &&
      sessionEntries.every(({ complete }) => complete);
    results.eligible =
      config.mode !== "trace" &&
      results.complete &&
      sessionEntries.every(({ passRole, eligible }) => passRole === "warmup" || eligible);
    if (!calibration.passed)
      results.failures.push({
        category: "driver-failure",
        message: "Input/observer validation control failed. See calibration.json.",
      });
  } catch (error) {
    results.failures.push({
      category: "incomplete-capture",
      message: error.stack ?? String(error),
    });
  } finally {
    process.removeListener("SIGINT", interrupt);
    await browser?.close();
    await server?.close();
    if (build) rmSync(build.temporaryRoot, { recursive: true, force: true });
    const finalSource = sourceInventory();
    results.sourceUnchanged = finalSource.sha256 === source.inventory.sha256;
    save(directory, "source-final.json", finalSource);
    if (!results.sourceUnchanged) {
      results.complete = false;
      results.eligible = false;
      results.failures.push({
        category: "incomplete-capture",
        message: "Source fingerprint changed during the run.",
      });
    }
    results.failures.push(
      ...reportSessions.flatMap((session) =>
        session.failures.map((failure) => ({
          provider: session.provider,
          scenario: session.scenario,
          sessionId: session.sessionId,
          ...failure,
        })),
      ),
    );
    writeSessionIndex(directory, sessionEntries);
    save(directory, "observations.json", results);
    save(directory, "failures.json", results.failures);
    if (config.mode === "capture") writeCaptureReport(directory, plan, results, reportSessions);
    else {
      const rows = sessionEntries
        .map(
          (cell) =>
            `| ${cell.provider} | ${cell.scenario} | ${cell.complete ? "complete" : "incomplete"} | ${cell.eligible ? "yes" : "no"} | ${cell.failureCount} |`,
        )
        .join("\n");
      writeFileSync(
        path.join(directory, "README.md"),
        `# ${config.mode} evidence\n\nRun: ${runId}. CPU: ${config.cpu}. ${plan.modeLabel}.\n\n| Provider | Scenario | Task | Eligible | Failures |\n| --- | --- | --- | --- | --- |\n${rows}\n\nRaw actions are stored once per context under sessions/. The index records each file hash and actual execution order. Missing Event Timing entries remain unavailable without explicit zero-loss proof. DOM completion includes observer and validation overhead and does not establish presented pixels. Pointer movement has no Event Timing latency metric. Trace files include Chrome frames and automatic filmstrip screenshots; trace observations are excluded from primary latency data.\n`,
      );
    }
    writeEvidenceManifest(directory);
    console.log(`Saved ${directory}`);
  }
  assertCompleteRun(results, directory);
  return { directory, results };
}

export function assertCompleteRun(results, directory) {
  const harnessFailures = results.failures.filter(
    ({ category }) => category !== "correctness-failure",
  );
  if (harnessFailures.length || !results.complete)
    throw new Error(`Benchmark has failed or incomplete cells. Inspect ${directory}`);
}
