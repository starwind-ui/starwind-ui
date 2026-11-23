import { createReadStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { availableParallelism } from "node:os";
import path from "node:path";
import { chromium, firefox, webkit } from "playwright";
import { createAssertionReceipts } from "../assertion-receipts.js";
import { TARGETS } from "../inventory.js";

export const ENGINES = ["chromium", "firefox", "webkit"];
const RESULT_LIMIT_MS = 90_000;

const CONTENT_TYPES = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".woff2": "font/woff2",
};

async function serve(root) {
  const output = path.join(root, "dist");
  const server = createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
    const relative = pathname.startsWith("/astro/")
      ? path.join("astro", pathname.slice(7))
      : path.join("app", pathname.slice(1));
    let file = path.resolve(output, relative);
    if (!file.startsWith(output + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
      const type = CONTENT_TYPES[path.extname(file)] ?? "application/octet-stream";
      response.writeHead(200, { "content-type": type, "cache-control": "no-store" });
      createReadStream(file).pipe(response);
    } catch {
      response.writeHead(404).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return server;
}

/**
 * Chromium pages contend for CPU above half the cores. Firefox and WebKit use other resources, so
 * a run with several engines gains from two thirds of the cores.
 */
export function defaultWorkers(engines = ["chromium"]) {
  const cores = availableParallelism();
  return engines.length > 1
    ? Math.max(1, Math.min(12, Math.floor((cores * 2) / 3)))
    : Math.max(1, Math.min(8, Math.floor(cores / 2)));
}

export function planTasks(cases, engines, shouldRun) {
  const tasks = [];
  for (const engine of engines) {
    if (!ENGINES.includes(engine)) throw new Error(`Unknown browser engine ${engine}`);
    for (const item of cases)
      for (const target of TARGETS)
        if (item.fixtures[target] && (!shouldRun || shouldRun(item, target, engine)))
          tasks.push({ engine, item, target });
  }
  return tasks;
}

async function runTask(browser, root, port, task, expectations, viewport) {
  const { engine, item, target } = task;
  const started = performance.now();
  const page = await browser.newPage({ viewport });
  page.setDefaultTimeout(5000);
  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  const fixture = item.fixtures[target];
  const expectation = expectations.find((entry) => entry.id === item.id);
  const receipts = createAssertionReceipts(fixture.assertions);
  const routeId = fixture.buildAs ?? item.id;
  const url =
    target === "astro"
      ? `http://127.0.0.1:${port}/astro/${routeId}/`
      : `http://127.0.0.1:${port}/${routeId}-${target}.html`;
  const runnerErrors = [];
  // A promise that never settles inside the page would hold this worker forever. Closing the
  // page rejects it, and the result fails with this error.
  const limit = setTimeout(() => {
    runnerErrors.push(`Result exceeded ${RESULT_LIMIT_MS / 1000}s`);
    void page.close();
  }, RESULT_LIMIT_MS);
  try {
    await page.goto(url, { waitUntil: "load", timeout: 15000 });
    await expectation.run(page, target, receipts.ctx);
  } catch (error) {
    runnerErrors.push(String(error));
  } finally {
    clearTimeout(limit);
  }
  const evidence = receipts.finish();
  const errors = [...runnerErrors, ...pageErrors, ...evidence.executionErrors];
  const status = evidence.status === "passed" && errors.length === 0 ? "passed" : "failed";
  // A failure keeps one image of the final page for debugging. Passing results keep none.
  let screenshot;
  if (status === "failed" && !page.isClosed()) {
    const file = path.join(root, "failures", engine, `${item.id}-${target}.png`);
    try {
      await mkdir(path.dirname(file), { recursive: true });
      await page.screenshot({ path: file, timeout: 10000 });
      screenshot = path.relative(root, file);
    } catch (error) {
      errors.push(`Failure screenshot: ${String(error)}`);
    }
  }
  if (!page.isClosed()) await page.close();
  return {
    caseId: item.id,
    row: item.row,
    target,
    engine,
    layer: expectation.layer,
    exports: fixture.exports,
    assertions: fixture.assertions,
    checks: evidence.checks,
    observations: evidence.observations,
    failedAssertionIds: evidence.failedAssertionIds,
    passedAssertions: evidence.passedAssertions,
    checkDurations: evidence.checkDurations,
    physicalExceptions: item.physicalExceptions ?? [],
    status,
    errors,
    consoleErrors,
    consoleErrorCount: consoleErrors.length,
    screenshot,
    durationMs: Math.round(performance.now() - started),
    url,
  };
}

export function taskKey(engine, caseId, target) {
  return `${engine}/${caseId}/${target}`;
}

/**
 * Runs every planned (engine, case, target) result. Each worker owns one browser per engine, so
 * pages that run at the same time never share a browser process, focus or pointer. `estimate`
 * returns an expected duration so that the longest results start first.
 */
export async function runBrowser(root, cases, expectations, options = {}) {
  const {
    engines = ["chromium"],
    workers = defaultWorkers(engines),
    shouldRun,
    onResult,
    estimate,
    viewport = { width: 1280, height: 900 },
  } = options;
  const planned = planTasks(cases, engines, shouldRun);
  const order = new Map(
    planned.map((task, index) => [taskKey(task.engine, task.item.id, task.target), index]),
  );
  const tasks = estimate
    ? [...planned].sort((left, right) => estimate(right) - estimate(left))
    : planned;
  const server = await serve(root);
  const port = server.address().port;
  const results = [];
  let next = 0;
  const worker = async () => {
    const browsers = new Map();
    try {
      while (next < tasks.length) {
        const task = tasks[next++];
        let result;
        try {
          let browser = browsers.get(task.engine);
          if (!browser?.isConnected()) {
            const type = { chromium, firefox, webkit }[task.engine];
            browser = await type.launch(task.engine === "chromium" ? { channel: "chrome" } : {});
            browsers.set(task.engine, browser);
          }
          result = await runTask(browser, root, port, task, expectations, viewport);
        } catch (error) {
          result = {
            caseId: task.item.id,
            row: task.item.row,
            target: task.target,
            engine: task.engine,
            checks: [],
            status: "failed",
            errors: [`Runner: ${String(error)}`],
          };
        }
        results.push(result);
        await onResult?.(result, results);
      }
    } finally {
      await Promise.all([...browsers.values()].map((browser) => browser.close().catch(() => {})));
    }
  };
  try {
    await Promise.all(Array.from({ length: Math.min(workers, tasks.length) }, worker));
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
  const position = (result) => order.get(taskKey(result.engine, result.caseId, result.target));
  return results.sort((left, right) => position(left) - position(right));
}
