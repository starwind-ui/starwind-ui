import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { generateSvelteStyled } from "../../generate-svelte-styled.js";
import { readSvelteStyledTree } from "../../check-svelte-styled.js";
import { inputOtpStyledContract } from "../../contracts/styled/components/input-otp.js";
import { createStyledInputOtpConsumer } from "../../../../packages/svelte/tests/styled-input-otp-consumer.js";
import { verifyInputOtp } from "../../../../packages/svelte/tests/input-otp-browser.js";

it("hydrates Styled Input OTP through its accepted string model and native form owner", async () => {
  const consumer = await createStyledInputOtpConsumer(process.cwd());
  try {
    await verifyInputOtp(consumer, true);
  } finally {
    await consumer.dispose();
  }
}, 60000);

it("regenerates all stock Input OTP exports, constants and separator icon", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-styled-otp-"));
  try {
    await generateSvelteStyled({ outputRoot, roots: ["input-otp"] });
    const first = await readSvelteStyledTree(outputRoot);
    expect([...first.keys()].filter((file) => file.endsWith(".svelte")).sort()).toEqual(
      inputOtpStyledContract.publicExports.map((name) => `input-otp/${name}.svelte`).sort(),
    );
    expect(first.get("input-otp/index.ts")).toContain("REGEXP_ONLY_DIGITS_AND_CHARS");
    expect(first.get("input-otp/InputOtpSeparator.svelte")).toContain("<svg");
    await generateSvelteStyled({ outputRoot, roots: ["input-otp"] });
    expect(await readSvelteStyledTree(outputRoot)).toEqual(first);
    const committed = await readSvelteStyledTree("apps/svelte-demo/src/lib/starwind-runtime");
    expect(new Map([...committed].filter(([file]) => first.has(file)))).toEqual(first);
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
