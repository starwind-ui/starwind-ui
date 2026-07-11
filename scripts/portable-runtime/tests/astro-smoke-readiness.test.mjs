import { describe, expect, it, vi } from "vitest";

import { waitForAstroSmokePage } from "./smoke/astro-smoke-readiness.mjs";

describe("Astro smoke dev-server readiness", () => {
  it("uses HTTP readiness probes before one longer dev navigation", async () => {
    const page = { goto: vi.fn(async () => undefined) };
    const fetchImpl = vi
      .fn()
      .mockRejectedValueOnce(new Error("connection refused"))
      .mockResolvedValueOnce({ status: 200 });

    await waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
      fetchImpl,
      now: createIncrementingClock(),
      retryDelayMs: 1,
      serverCommand: "dev",
      serverMode: "dev",
      sleep: async () => undefined,
      startupTimeoutMs: 100,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(page.goto).toHaveBeenCalledTimes(1);
    expect(page.goto).toHaveBeenCalledWith("http://127.0.0.1:4325/runtime-prototype/", {
      timeout: 30000,
      waitUntil: "domcontentloaded",
    });
  });

  it("keeps preview mode on networkidle navigation", async () => {
    const page = { goto: vi.fn(async () => undefined) };

    await waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
      fetchImpl: vi.fn(async () => ({ status: 200 })),
      now: createIncrementingClock(),
      serverCommand: "preview",
      serverMode: "preview",
      sleep: async () => undefined,
      startupTimeoutMs: 100,
    });

    expect(page.goto).toHaveBeenCalledWith("http://127.0.0.1:4325/runtime-prototype/", {
      timeout: 15000,
      waitUntil: "networkidle",
    });
  });

  it("does not navigate while readiness probes return server errors", async () => {
    const page = { goto: vi.fn(async () => undefined) };
    const fetchImpl = vi.fn().mockResolvedValueOnce({ status: 503 }).mockResolvedValueOnce({
      status: 200,
    });

    await waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
      fetchImpl,
      now: createIncrementingClock(),
      retryDelayMs: 1,
      serverCommand: "dev",
      serverMode: "dev",
      sleep: async () => undefined,
      startupTimeoutMs: 100,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(page.goto).toHaveBeenCalledTimes(1);
  });

  it("includes server output when startup readiness times out", async () => {
    const page = { goto: vi.fn(async () => undefined) };

    await expect(
      waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
        fetchImpl: vi.fn(async () => ({ status: 503 })),
        getServerOutput: () => "Astro ready text never appeared",
        now: createIncrementingClock(),
        retryDelayMs: 1,
        serverCommand: "dev",
        serverMode: "dev",
        sleep: async () => undefined,
        startupTimeoutMs: 25,
      }),
    ).rejects.toThrow("Astro ready text never appeared");
    expect(page.goto).not.toHaveBeenCalled();
  });

  it("still fails when the first real navigation fails after readiness", async () => {
    const navigationError = new Error("component route crashed");
    const page = {
      goto: vi.fn(async () => {
        throw navigationError;
      }),
    };

    await expect(
      waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
        fetchImpl: vi.fn(async () => ({ status: 200 })),
        now: createIncrementingClock(),
        serverCommand: "dev",
        serverMode: "dev",
        sleep: async () => undefined,
        startupTimeoutMs: 100,
      }),
    ).rejects.toThrow(navigationError);
  });

  it("reports an early server exit before navigation", async () => {
    const page = { goto: vi.fn(async () => undefined) };

    await expect(
      waitForAstroSmokePage(page, "http://127.0.0.1:4325/runtime-prototype/", {
        fetchImpl: vi.fn(async () => ({ status: 200 })),
        getServerExitCode: () => 1,
        getServerOutput: () => "Astro failed to start",
        now: createIncrementingClock(),
        serverCommand: "dev",
        serverMode: "dev",
        sleep: async () => undefined,
        startupTimeoutMs: 100,
      }),
    ).rejects.toThrow("Astro dev exited before smoke test connected.\nAstro failed to start");
    expect(page.goto).not.toHaveBeenCalled();
  });
});

function createIncrementingClock() {
  let time = 0;

  return () => {
    time += 10;
    return time;
  };
}
