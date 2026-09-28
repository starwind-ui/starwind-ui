import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { verifyInputOtp } from "../../../../packages/svelte/tests/input-otp-browser.js";
import { createStyledInputOtpConsumer } from "../../../../packages/svelte/tests/styled-input-otp-consumer.js";
import { generateSveltePrimitiveWrappers } from "../../generate-svelte-wrappers.js";

it("hydrates Input OTP models, reset, fixed slots and native input ownership", async () => {
  const consumer = await createStyledInputOtpConsumer(process.cwd());
  try {
    await verifyInputOtp(consumer, false);
  } finally {
    await consumer.dispose();
  }
}, 60000);

it("generates the four public Input OTP parts and keeps input and slot internals private", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "svelte-input-otp-"));
  try {
    await generateSveltePrimitiveWrappers({ outputRoot });
    expect((await readdir(path.join(outputRoot, "input-otp"))).sort()).toEqual([
      "InputOtpGroup.svelte",
      "InputOtpRoot.svelte",
      "InputOtpSeparator.svelte",
      "InputOtpSlot.svelte",
      "index.ts",
    ]);
    const root = await readFile(path.join(outputRoot, "input-otp/InputOtpRoot.svelte"), "utf8");
    const slot = await readFile(path.join(outputRoot, "input-otp/InputOtpSlot.svelte"), "utf8");
    expect(root).toContain("data-sw-input-otp-input");
    expect(root).not.toContain("ownedParts");
    expect(root).not.toContain("nextParts");

    expect(root).not.toContain("pendingCommand");

    expect(slot).toContain("data-sw-input-otp-char");
    expect(slot).toContain("data-sw-input-otp-caret");
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});
