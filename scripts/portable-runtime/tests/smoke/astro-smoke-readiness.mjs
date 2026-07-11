const DEFAULT_STARTUP_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_DELAY_MS = 250;
const DEFAULT_HTTP_TIMEOUT_MS = 5000;
const DEFAULT_DEV_NAVIGATION_TIMEOUT_MS = 30000;
const DEFAULT_PREVIEW_NAVIGATION_TIMEOUT_MS = 15000;

export async function waitForAstroSmokePage(page, url, options = {}) {
  const {
    fetchImpl = globalThis.fetch,
    getServerExitCode = () => null,
    getServerOutput = () => "",
    httpTimeoutMs = DEFAULT_HTTP_TIMEOUT_MS,
    navigationTimeoutMs = getDefaultNavigationTimeoutMs(options.serverMode),
    now = Date.now,
    retryDelayMs = DEFAULT_RETRY_DELAY_MS,
    serverCommand,
    serverMode,
    sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration)),
    startupTimeoutMs = DEFAULT_STARTUP_TIMEOUT_MS,
  } = options;
  const startedAt = now();
  let lastError;

  while (now() - startedAt < startupTimeoutMs) {
    const exitCode = getServerExitCode();
    if (exitCode !== null) {
      throw new Error(
        `Astro ${serverCommand} exited before smoke test connected.\n${getServerOutput().trim()}`,
      );
    }

    try {
      const ready = await isHttpReady(url, { fetchImpl, timeoutMs: httpTimeoutMs });
      if (!ready) {
        await sleep(retryDelayMs);
        continue;
      }
    } catch (error) {
      lastError = error;
      await sleep(retryDelayMs);
      continue;
    }

    await page.goto(url, {
      timeout: navigationTimeoutMs,
      waitUntil: getNavigationWaitUntil(serverMode),
    });
    return;
  }

  throw new Error(
    `Timed out waiting for Astro ${serverMode} at ${url}.\n${getServerOutput().trim()}\n${String(lastError)}`,
  );
}

function getNavigationWaitUntil(serverMode) {
  return serverMode === "dev" ? "domcontentloaded" : "networkidle";
}

function getDefaultNavigationTimeoutMs(serverMode) {
  return serverMode === "dev"
    ? DEFAULT_DEV_NAVIGATION_TIMEOUT_MS
    : DEFAULT_PREVIEW_NAVIGATION_TIMEOUT_MS;
}

async function isHttpReady(url, { fetchImpl, timeoutMs }) {
  if (typeof fetchImpl !== "function") {
    throw new Error("Astro smoke readiness requires a fetch implementation.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(url, {
      cache: "no-store",
      redirect: "manual",
      signal: controller.signal,
    });

    return response.status >= 200 && response.status < 500;
  } finally {
    clearTimeout(timeout);
  }
}
