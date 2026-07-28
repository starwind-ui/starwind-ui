import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Input OTP", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("generates deterministic hidden-input-visual-slot Primitive output", async () => {
    const first = await generateInputOtp();
    const second = await generateInputOtp();

    expect(first).toEqual(second);
    for (const [name, source] of Object.entries(first)) {
      if (name === "index") continue;
      expect(() => assertVueSfcCompiles(source, `${name}.vue`)).not.toThrow();
    }
    expect(first.root).toContain("defineModel<string>()");
    expect(first.root).toMatch(
      /emit\("valueChange", detail\.value, detail\);[\s\S]*detail\.isCanceled[\s\S]*modelValue\.value = detail\.value/,
    );
    expect(first.root.match(/data-sw-input-otp-input/g)).toHaveLength(1);
    expect(first.root).toContain("v-once");
    expect(first.root).toContain('autocomplete="one-time-code"');
    expect(first.root).toMatch(
      /await nextTick\(\);[\s\S]*instance\.refresh\(\);[\s\S]*instance\.setValue\(value, \{ emit: false \}\)/,
    );
    expect(first.slot).toContain('<slot name="caret">');
    expect(first.slot).not.toContain("cloneVNode");
    expect(first.index).toContain("InputOtpValueChangeDetails");
  });

  it("generates Styled Input OTP with model, event, caret, variants, and canonical slots", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-input-otp-"));
    temporaryRoots.push(repoRoot);
    await generateSelectedVueStyledGroups({ groups: ["input-otp"], outputDir: "styled", repoRoot });

    const inputOtp = await readFile(path.join(repoRoot, "styled/input-otp/InputOtp.vue"), "utf8");
    const slot = await readFile(path.join(repoRoot, "styled/input-otp/InputOtpSlot.vue"), "utf8");
    const separator = await readFile(
      path.join(repoRoot, "styled/input-otp/InputOtpSeparator.vue"),
      "utf8",
    );
    expect(inputOtp).toContain(':model-value="modelValue"');
    expect(inputOtp).toContain('@update:model-value="emit(&quot;update:modelValue&quot;, $event)"');
    expect(inputOtp).toContain('@value-change="handleValueChange"');
    expect(inputOtp).toContain('data-slot="input-otp"');
    expect(slot).toContain('data-slot="input-otp-slot"');
    expect(slot).toContain(':ref="setElement"');
    expect(separator).toContain('data-slot="input-otp-separator"');
    expect(separator).toContain('<path d="M5 12h14" />');
    expect(() => assertVueSfcCompiles(inputOtp, "InputOtp.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(slot, "InputOtpSlot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(separator, "InputOtpSeparator.vue")).not.toThrow();
  });

  async function generateInputOtp(): Promise<Record<string, string>> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-input-otp-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find(
      (candidate) => candidate.component === "input-otp",
    );
    if (!entry) throw new Error("Input OTP Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    const directory = path.join(outputRoot, "input-otp");
    return {
      group: await readFile(path.join(directory, "InputOtpGroup.vue"), "utf8"),
      index: await readFile(path.join(directory, "index.ts"), "utf8"),
      root: await readFile(path.join(directory, "InputOtpRoot.vue"), "utf8"),
      separator: await readFile(path.join(directory, "InputOtpSeparator.vue"), "utf8"),
      slot: await readFile(path.join(directory, "InputOtpSlot.vue"), "utf8"),
    };
  }
});
