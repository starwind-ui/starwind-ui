import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";
import { command, prepareBuild, repoRoot, serve, sourceInventory } from "../interactions/build.mjs";
import { acceptStressRun, stressRunsRoot, writeStressManifest } from "./evidence.mjs";
import { stressPlan } from "./plan.mjs";
import { initialStateErrors, sessionErrors } from "./state.mjs";

const save = (directory, name, value) =>
  writeFileSync(path.join(directory, name), JSON.stringify(value, null, 2) + "\n");
const git = (...args) => execFileSync("git", args, { cwd: repoRoot, encoding: "utf8" }).trim();

export function abortAfterWarmup(session) {
  return session.passRole === "warmup" && session.failures?.length > 0;
}

export async function navigationTargetHitTest(page) {
  await page.locator('[data-stress-target="true"]').scrollIntoViewIfNeeded({ timeout: 5000 });
  const result = await page.evaluate(() => {
    const target = document.querySelector('[data-stress-target="true"]');
    const rect = target.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      ready: (hit === target || target.contains(hit)) && !target.matches(":hover"),
      x,
      y,
      hovered: target.matches(":hover"),
      hitTag: hit?.tagName ?? null,
      hitText: hit?.textContent?.trim().slice(0, 48) ?? null,
    };
  });
  if (result.hovered) throw new Error("Navigation target was hovered before input was armed.");
  if (!result.ready)
    throw new Error(
      `Navigation target is covered before input at (${result.x}, ${result.y}) by ${result.hitTag}: ${result.hitText}`,
    );
  return result;
}

export async function runStress({ selected }) {
  const runId = `${new Date().toISOString().replaceAll(":", "-")}-stress-${randomUUID().slice(0, 8)}`;
  const directory = path.join(stressRunsRoot, runId);
  mkdirSync(path.join(directory, "sessions"), { recursive: true });
  const plan = stressPlan({ runId, selected });
  const beforeSource = sourceInventory();
  save(directory, "plan.json", plan);
  save(directory, "source.json", {
    revision: git("rev-parse", "HEAD"),
    status: git("status", "--porcelain", "--untracked-files=all"),
    inventory: beforeSource,
  });
  const result = {
    schemaVersion: 1,
    runId,
    recordedAt: new Date().toISOString(),
    complete: false,
    sourceUnchanged: false,
    actualOrder: [],
    failures: [],
  };
  let build;
  let server;
  let browser;
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  process.once("SIGINT", interrupt);
  process.once("SIGTERM", interrupt);
  try {
    console.log(`Preparing retained stress: ${directory}`);
    build = await prepareBuild(directory, {
      fixtureDirectory: path.join(import.meta.dirname, "fixtures"),
    });
    save(directory, "build.json", build);
    server = await serve(build.distRoot);
    browser = await chromium.launch({
      headless: false,
      args: ["--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding"],
    });
    save(directory, "environment.json", {
      recordedAt: new Date().toISOString(),
      browser: browser.version(),
      node: process.version,
      pnpm: command(["--version"]).trim(),
      os: { platform: os.platform(), release: os.release(), arch: os.arch() },
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      cpuThrottleRate: 1,
      powerState: "unknown",
      displayRefreshRateHz: "unknown",
      versions: build.dependencies,
    });
    for (const planned of plan.sessions) {
      if (interrupted) throw new Error("Retained stress interrupted after the last saved session.");
      console.log(`Stress ${planned.workload} ${planned.provider} pass ${planned.pass}/5`);
      const session = {
        ...planned,
        complete: false,
        eligible: false,
        failures: [],
        mount: null,
        action: null,
        initial: null,
        final: null,
        pageErrors: [],
      };
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        deviceScaleFactor: 1,
      });
      try {
        const page = await context.newPage();
        page.on("pageerror", (error) => session.pageErrors.push(String(error)));
        await page.bringToFront();
        if (planned.workload === "navigation-menu") await page.mouse.move(0, 0);
        await page.goto(`${server.url}/${planned.provider}.html?workload=${planned.workload}`);
        await page.waitForFunction(() => window.__stress?.data.ready, undefined, {
          timeout: 10000,
        });
        const mounted = await page.evaluate(() => window.__stress.data);
        if (mounted.provider !== planned.provider || mounted.workload !== planned.workload)
          throw new Error("Stress fixture identity differs from the planned session.");
        session.mount = mounted.mount;
        session.initial = await page.evaluate(() => window.__stress.snapshot());
        const initialErrors = initialStateErrors(planned.workload, session.initial);
        if (initialErrors.length) throw new Error(initialErrors.join("; "));
        if (
          !(await page.evaluate(
            () => document.visibilityState === "visible" && document.hasFocus(),
          ))
        )
          throw new Error("Stress fixture lost foreground visibility or focus.");
        if (planned.workload === "navigation-menu") {
          session.inputReadiness = await navigationTargetHitTest(page);
          const stateBeforeInput = await page.evaluate(() => window.__stress.snapshot());
          if (initialStateErrors(planned.workload, stateBeforeInput).length)
            throw new Error("Navigation initial state changed before pointer entry.");
        }
        await page.evaluate(() => window.__stress.arm());
        if (planned.workload === "navigation-menu")
          await page.mouse.move(session.inputReadiness.x, session.inputReadiness.y);
        else await page.locator('[data-stress-target="true"]').click({ timeout: 10000 });
        session.action = await page.evaluate(() => window.__stress.result());
        session.final = await page.evaluate(() => window.__stress.snapshot());
        session.failures.push(...sessionErrors(session));
        session.complete = true;
        session.eligible = session.failures.length === 0 && !session.excluded;
      } catch (error) {
        session.failures.push(error.stack ?? String(error));
      } finally {
        await context.close();
        result.actualOrder.push(planned.sessionId);
        save(
          path.join(directory, "sessions"),
          `${String(planned.orderIndex).padStart(3, "0")}.json`,
          session,
        );
        if (session.failures.length)
          result.failures.push({ sessionId: session.sessionId, reasons: session.failures });
      }
      if (abortAfterWarmup(session))
        throw new Error(`Failed warmup stopped retained stress at ${session.sessionId}.`);
    }
    result.complete =
      result.actualOrder.length === plan.sessions.length && result.failures.length === 0;
  } catch (error) {
    result.failures.push({ category: "harness", message: error.stack ?? String(error) });
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
    if (build?.temporaryRoot) rmSync(build.temporaryRoot, { recursive: true, force: true });
    const afterSource = sourceInventory();
    result.sourceUnchanged = JSON.stringify(afterSource) === JSON.stringify(beforeSource);
    save(directory, "source-after.json", afterSource);
    save(directory, "result.json", result);
    writeStressManifest(directory);
    process.removeListener("SIGINT", interrupt);
    process.removeListener("SIGTERM", interrupt);
  }
  let acceptanceError = null;
  if (result.sourceUnchanged) {
    try {
      acceptStressRun(directory);
    } catch (error) {
      acceptanceError = error;
    }
  }
  if (!result.complete || !result.sourceUnchanged || acceptanceError)
    throw new Error(`Retained stress failed; inspect ${directory}`, { cause: acceptanceError });
  return { directory, result };
}
