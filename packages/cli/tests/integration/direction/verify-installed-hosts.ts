import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import path from "node:path";
import { chromium } from "playwright";

type HostRecord = {
  framework: string;
  mode: "fresh" | "retained";
  host: string;
  stylesheetHash: string;
};
const hash = (value: string) => createHash("sha256").update(value).digest("hex");

async function port(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  assert(address && typeof address !== "string");
  await new Promise<void>((resolve) => server.close(() => resolve()));
  return address.port;
}

async function preview<T>(host: string, run: (url: string) => Promise<T>): Promise<T> {
  const number = await port();
  const url = `http://127.0.0.1:${number}/`;
  const output: string[] = [];
  const child = spawn("pnpm", ["preview", "--host", "127.0.0.1", "--port", String(number)], {
    cwd: host,
    env: { ...process.env, CI: "1", ASTRO_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (part) => output.push(String(part)));
  child.stderr.on("data", (part) => output.push(String(part)));
  try {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (child.exitCode !== null) throw new Error(`Preview exited early: ${output.join("")}`);
      let response: Response | undefined;
      try {
        response = await fetch(url);
      } catch {
        // The preview has not bound its port yet.
      }
      if (response?.ok) return await run(url);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`Preview did not start: ${output.join("")}`);
  } finally {
    child.kill("SIGTERM");
  }
}

export async function verifyInstalledHosts(root: string) {
  const installation = JSON.parse(
    await readFile(path.join(root, "installed-hosts.json"), "utf8"),
  ) as {
    sourceSha: string;
    archiveHashes: Record<string, string>;
    results: HostRecord[];
  };
  assert.equal(installation.results.length, 8);
  const browser = await chromium.launch({ channel: "chrome" });
  console.log("[candidate-browser] Chromium ready");
  const results: Record<string, unknown>[] = [];
  try {
    for (const host of installation.results) {
      console.log(`[candidate-browser] ${host.framework} ${host.mode} preview`);
      await preview(host.host, async (url) => {
        console.log(`[candidate-browser] ${host.framework} ${host.mode} at ${url}`);
        const page = await browser.newPage({ viewport: { width: 1100, height: 780 } });
        const errors: string[] = [];
        page.on("pageerror", (error) => errors.push(error.message));
        await page.goto(url, { waitUntil: "networkidle" });
        console.log(`[candidate-browser] ${host.framework} ${host.mode} loaded`);
        await page
          .locator("#styled-switch")
          .waitFor({ timeout: 5000 })
          .catch(async () => {
            throw new Error(
              `${host.framework} ${host.mode} missing styled switch: ${JSON.stringify(errors)} ${String(await page.locator("body").innerHTML()).slice(0, 500)}`,
            );
          });
        const style = await page.evaluate(() => {
          const result: Record<
            string,
            {
              rotate: string;
              marginLeft: string;
              marginRight: string;
              direction: string;
              x: number;
            }
          > = {};
          for (const name of ["ordinary", "rtl", "nested"]) {
            const probe = document.querySelector(
              `#${name === "rtl" ? "page-rtl" : name} > [data-probe]`,
            );
            if (!(probe instanceof HTMLElement)) throw new Error(`Missing ${name} probe`);
            const computed = getComputedStyle(probe);
            result[name] = {
              rotate: computed.rotate,
              marginLeft: computed.marginLeft,
              marginRight: computed.marginRight,
              direction: computed.direction,
              x: probe.getBoundingClientRect().x,
            };
          }
          return result;
        });
        assert.equal(style.ordinary?.rotate, "0deg", `${host.framework} ${host.mode} ordinary LTR`);
        assert.equal(style.rtl?.rotate, "180deg", `${host.framework} ${host.mode} root RTL`);
        assert.equal(
          style.nested?.rotate,
          host.mode === "fresh" ? "0deg" : "180deg",
          `${host.framework} ${host.mode} nested island`,
        );
        assert.equal(
          style.ordinary?.marginLeft,
          "8px",
          `${host.framework} ${host.mode} physical left margin`,
        );
        assert.equal(
          style.rtl?.marginRight,
          "24px",
          `${host.framework} ${host.mode} RTL physical right margin`,
        );
        const merge = await page.locator("#merge-probe").evaluate((element) => ({
          left: getComputedStyle(element).marginLeft,
          right: getComputedStyle(element).marginRight,
        }));
        assert.deepEqual(
          merge,
          { left: "8px", right: "24px" },
          `${host.framework} ${host.mode} physical and logical caller utilities`,
        );
        const customBackground = await page
          .locator("#custom-probe")
          .evaluate((element) => getComputedStyle(element).backgroundColor);
        assert.equal(
          customBackground,
          "rgb(7, 11, 13)",
          `${host.framework} ${host.mode} app-authored variant`,
        );
        const sliderGeometry = await page.evaluate(() => {
          const result: Record<
            string,
            { rootWidth: number; trackWidth: number; fraction: number }
          > = {};
          for (const id of ["ltr-slider", "rtl-slider"]) {
            const root = document.getElementById(id);
            const track = root?.querySelector('[data-slot="slider-track"]');
            const thumb = root?.querySelector('[data-slot="slider-thumb"]');
            if (
              !(root instanceof HTMLElement) ||
              !(track instanceof HTMLElement) ||
              !(thumb instanceof HTMLElement)
            )
              throw new Error(`Missing ${id} Slider parts`);
            const trackRect = track.getBoundingClientRect();
            const thumbRect = thumb.getBoundingClientRect();
            result[id] = {
              rootWidth: root.getBoundingClientRect().width,
              trackWidth: trackRect.width,
              fraction: (thumbRect.x + thumbRect.width / 2 - trackRect.x) / trackRect.width,
            };
          }
          return { ltr: result["ltr-slider"]!, rtl: result["rtl-slider"]! };
        });
        assert(
          Math.abs(sliderGeometry.ltr.rootWidth - 256) <= 1,
          `${host.framework} ${host.mode} caller width class override`,
        );
        assert(
          Math.abs(sliderGeometry.rtl.rootWidth - 256) <= 1,
          `${host.framework} ${host.mode} RTL caller width class override`,
        );
        assert(
          Math.abs(sliderGeometry.ltr.fraction - 0.25) <= 0.015,
          `${host.framework} ${host.mode} LTR Slider center`,
        );
        assert(
          Math.abs(sliderGeometry.rtl.fraction - 0.75) <= 0.015,
          `${host.framework} ${host.mode} RTL Slider center`,
        );
        const tabPositions = await page
          .locator("#rtl-tabs [role=tab]")
          .evaluateAll((tabs) => tabs.map((tab) => tab.getBoundingClientRect().x));
        assert.equal(tabPositions.length, 2, `${host.framework} ${host.mode} installed Tabs`);
        assert(
          tabPositions[0]! > tabPositions[1]!,
          `${host.framework} ${host.mode} RTL Tabs physical order`,
        );
        await page.locator("#rtl-tabs [role=tab]").first().focus();
        await page.locator("#rtl-tabs [role=tab]").first().press("ArrowLeft");
        assert.equal(
          await page
            .locator("#rtl-tabs [role=tab]")
            .last()
            .evaluate((tab) => tab === document.activeElement),
          true,
          `${host.framework} ${host.mode} RTL Tabs ArrowLeft`,
        );
        await page.locator("#rtl-tabs [role=tab]").last().press("ArrowRight");
        assert.equal(
          await page
            .locator("#rtl-tabs [role=tab]")
            .first()
            .evaluate((tab) => tab === document.activeElement),
          true,
          `${host.framework} ${host.mode} RTL Tabs ArrowRight`,
        );
        const controls = await page.evaluate(() => {
          const ids = ["package-switch", "vendored-switch", "styled-switch"];
          const form = document.querySelector("#candidate-form") as HTMLFormElement;
          if (!form) throw new Error("Missing candidate form");
          return {
            present: ids.map((id) => Boolean(document.getElementById(id))),
            form: Object.fromEntries(new FormData(form).entries()),
            checked: ids.map((id) => document.getElementById(id)?.getAttribute("aria-checked")),
          };
        });
        assert.deepEqual(
          controls.present,
          [true, true, true],
          `${host.framework} ${host.mode} installed output`,
        );
        assert.deepEqual(
          controls.form,
          { package: "on", vendored: "on", styled: "on" },
          `${host.framework} ${host.mode} initial form values`,
        );
        const geometry = async () =>
          page.locator("#styled-switch").evaluate((root) => {
            const thumb = root.querySelector("[data-sw-switch-thumb]");
            if (!(thumb instanceof HTMLElement)) throw new Error("Styled Switch thumb is absent");
            const outer = root.getBoundingClientRect();
            const inner = thumb.getBoundingClientRect();
            return {
              outerX: outer.x,
              outerWidth: outer.width,
              thumbX: inner.x,
              thumbWidth: inner.width,
              relativeCenter: inner.x + inner.width / 2 - (outer.x + outer.width / 2),
              transform: getComputedStyle(thumb).transform,
            };
          });
        const ltrGeometry = await geometry();
        await page
          .locator("#styled-switch")
          .evaluate((element) => element.setAttribute("dir", "rtl"));
        await page.evaluate(
          () =>
            new Promise<void>((resolve) =>
              requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
            ),
        );
        const rtlGeometry = await geometry();
        assert(
          ltrGeometry.outerWidth > 0 && rtlGeometry.outerWidth > 0,
          `${host.framework} ${host.mode} Styled Switch must have a measurable track`,
        );
        assert(
          ltrGeometry.relativeCenter > 0 && rtlGeometry.relativeCenter < 0,
          `${host.framework} ${host.mode} Styled Switch physical thumb placement`,
        );
        for (const name of ["package", "vendored", "styled"]) {
          await page
            .locator(`[data-sw-switch][data-name="${name}"]`)
            .evaluate((element) => (element as HTMLElement).click());
          const value = await page
            .locator("#candidate-form")
            .evaluate((form) =>
              Object.fromEntries(new FormData(form as HTMLFormElement).entries()),
            );
          assert.equal(
            value[name],
            undefined,
            `${host.framework} ${host.mode} ${name} unchecked form value`,
          );
          await page
            .locator(`[data-sw-switch][data-name="${name}"]`)
            .evaluate((element) => (element as HTMLElement).click());
          const restored = await page
            .locator("#candidate-form")
            .evaluate((form) =>
              Object.fromEntries(new FormData(form as HTMLFormElement).entries()),
            );
          assert.equal(
            restored[name],
            "on",
            `${host.framework} ${host.mode} ${name} restored form value`,
          );
        }
        assert.deepEqual(errors, [], `${host.framework} ${host.mode} browser errors`);
        results.push({
          framework: host.framework,
          mode: host.mode,
          style,
          merge,
          customBackground,
          sliderGeometry,
          tabPositions,
          controls,
          geometry: { ltr: ltrGeometry, rtl: rtlGeometry },
          errors,
          url,
        });
        await page.close();
      });
      if (host.mode === "retained") {
        const cssPath = path.join(host.host, "src/styles/starwind.css");
        const before = await readFile(cssPath, "utf8");
        assert.equal(
          hash(before),
          host.stylesheetHash,
          `${host.framework} retained stylesheet changed before repair`,
        );
        const twoLines =
          '@custom-variant rtl (&:where([dir="rtl"], [dir="rtl"] *:not([dir="rtl"] [dir="ltr"], [dir="rtl"] [dir="ltr"] *)));\n' +
          '@custom-variant ltr (&:where(:not([dir="rtl"], [dir="rtl"] *:not([dir="rtl"] [dir="ltr"], [dir="rtl"] [dir="ltr"] *))));\n';
        const after = before.replace(/(@custom-variant dark [^\n]+\n)/, `$1${twoLines}`);
        assert.equal(
          after.length - before.length,
          twoLines.length,
          `${host.framework} repair must add exactly two definitions`,
        );
        await writeFile(cssPath, after);
        await new Promise<void>((resolve, reject) => {
          const output: string[] = [];
          const child = spawn("pnpm", ["build"], {
            cwd: host.host,
            env: { ...process.env, CI: "1", ASTRO_TELEMETRY_DISABLED: "1" },
            stdio: ["ignore", "pipe", "pipe"],
          });
          child.stdout.on("data", (part) => output.push(String(part)));
          child.stderr.on("data", (part) => output.push(String(part)));
          child.once("error", reject);
          child.once("close", (code) =>
            code === 0
              ? resolve()
              : reject(
                  new Error(`${host.framework} repaired build: ${output.join("").slice(-4000)}`),
                ),
          );
        });
        await preview(host.host, async (url) => {
          const page = await browser.newPage();
          await page.goto(url, { waitUntil: "networkidle" });
          const nested = await page
            .locator("#nested > [data-probe]")
            .evaluate((element) => getComputedStyle(element).rotate);
          assert.equal(nested, "0deg", `${host.framework} two-line repair`);
          results.push({
            framework: host.framework,
            mode: "repaired",
            nestedRotate: nested,
            stylesheetHash: hash(after),
            url,
          });
          await page.close();
        });
      }
      await writeFile(
        path.join(root, "installed-browser.json"),
        `${JSON.stringify({ sourceSha: installation.sourceSha, archiveHashes: installation.archiveHashes, results }, null, 2)}\n`,
      );
    }
  } finally {
    await browser.close();
  }
  return results;
}
