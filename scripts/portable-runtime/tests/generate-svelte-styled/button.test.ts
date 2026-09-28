import { rm } from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { createStyledButtonConsumer } from "../../../../packages/svelte/tests/styled-button-consumer.js";
import { verifyStyledButtonBrowser } from "../../../../packages/svelte/tests/styled-button-browser.js";
import type { DistConsumer } from "../../../../packages/svelte/tests/dist-consumer.js";

const roots: string[] = [];
const consumers: DistConsumer[] = [];
afterEach(async () => {
  await Promise.all(consumers.splice(0).map((consumer) => consumer.dispose()));
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});
async function consumer() {
  const result = await createStyledButtonConsumer(process.cwd());
  consumers.push(result);
  return result;
}

describe("generated Styled Button", () => {
  it("hydrates Button native branches and forwards Select/Dialog child attachments with balanced cleanup", async () => {
    await verifyStyledButtonBrowser(await consumer());
  }, 60_000);

  it("resolves the exact Button exports and server-renders both native branches from built Primitives", async () => {
    const fixture = await consumer();
    await fixture.write({
      "SSR.svelte": `<script lang="ts">import { Button } from "./button/index.js";</script><Button id="native-button">Save</Button><Button as="a" href="/disabled" disabled id="native-anchor">Disabled</Button><Button href="/docs">Inferred link</Button><Button as="button" href="/other">Href branch</Button>`,
      "ssr.mjs": `import assert from "node:assert/strict";
import { render } from "svelte/server";
import App from "./SSR.svelte";
import Parts, * as exports from "./button/index.js";
assert.equal(globalThis.document, undefined);
assert.deepEqual(Object.keys(exports).sort(), ["Button", "ButtonVariants", "default"]);
assert.equal(Parts.Root, exports.Button);
console.log(JSON.stringify({ body: render(App).body, primitive: import.meta.resolve("@starwind-ui/svelte/button") }));`,
    });
    const { body, primitive } = JSON.parse(await fixture.run("ssr.mjs", { loader: true }));
    expect(primitive).toContain(
      `${fixture.root}/node_modules/@starwind-ui/svelte/dist/button/index.js`,
    );
    expect(body.match(/<button\b/g)).toHaveLength(1);
    expect(body.match(/<a\b/g)).toHaveLength(3);
    expect(body).toContain('data-slot="button"');
    expect(body).toContain('aria-disabled="true"');
    expect(body).toContain('tabindex="-1"');
    expect(body).not.toContain('href="/disabled"');
    expect(body).toContain('href="/docs"');
    expect(body).toContain('href="/other"');
  });
});
