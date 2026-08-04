import { copyFile, mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { afterEach, describe, expect, it } from "vitest";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("generated Svelte Button consumer typing", () => {
  it("accepts native attributes, callback events, snippets, and proof props", async () => {
    const root = await createTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects an invalid Runtime Button option through the same workspace mapping", async () => {
    const root = await createTypingRoot();
    await writeFile(
      path.join(root, "RuntimeNegativeControl.ts"),
      `import { createButton } from "@starwind-ui/runtime/button";

declare const root: HTMLButtonElement;
createButton(root, { inventedOption: true });
`,
      "utf8",
    );

    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("inventedOption");
    expect(result.output).not.toContain("svelte-check found 0 errors and 0 warnings");
  });
});

describe("generated Svelte Checkbox consumer typing", () => {
  it("accepts the detailed callback, checked binding, snippets, refs, and native attributes", async () => {
    const root = await createCheckboxTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects a second public binding that the frozen transition contract does not permit", async () => {
    const root = await createCheckboxTypingRoot();
    await writeFile(
      path.join(root, "InvalidConsumer.svelte"),
      `<script lang="ts">
  import { CheckboxRoot } from "./checkbox/index";
  let indeterminate = $state(false);
</script>

<CheckboxRoot bind:indeterminate />
`,
      "utf8",
    );

    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("indeterminate");
  });

  it("rejects button-only attributes when nativeButton is not selected", async () => {
    const root = await createCheckboxTypingRoot();
    await writeFile(
      path.join(root, "InvalidNonNativeConsumer.svelte"),
      `<script lang="ts">
  import { CheckboxRoot } from "./checkbox/index";
</script>

<CheckboxRoot popovertarget="not-a-span-attribute">Non-native</CheckboxRoot>
`,
      "utf8",
    );

    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("popovertarget");
  });
});

describe("generated Svelte Select consumer typing", () => {
  it("accepts dual bindings, detailed callbacks, keyed items, snippets, refs, and portal props", async () => {
    const root = await createSelectTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects a third binding outside the frozen dual-model contract", async () => {
    const root = await createSelectTypingRoot();
    await writeFile(
      path.join(root, "InvalidConsumer.svelte"),
      `<script lang="ts">
  import { SelectRoot } from "./select/index";
  let disabled = $state(false);
</script>
<SelectRoot bind:disabled />
`,
      "utf8",
    );
    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("disabled");
  });
});

describe("generated Svelte Accordion consumer typing", () => {
  it("accepts value binding, detailed callbacks, snippets, refs, and native attributes", async () => {
    const root = await createAccordionTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects binding a constructor option outside the frozen value model", async () => {
    const root = await createAccordionTypingRoot();
    await writeFile(
      path.join(root, "InvalidConsumer.svelte"),
      `<script lang="ts">
  import { AccordionRoot } from "./accordion/index";
  let collapsible = $state(true);
</script>
<AccordionRoot bind:collapsible />
`,
      "utf8",
    );
    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("collapsible");
  });
});

describe("generated Svelte Dialog consumer typing", () => {
  it("accepts open binding, detailed callbacks, snippets, refs, and native attributes", async () => {
    const root = await createDialogTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects binding a constructor option outside the frozen open model", async () => {
    const root = await createDialogTypingRoot();
    await writeFile(
      path.join(root, "InvalidConsumer.svelte"),
      `<script lang="ts">
  import { DialogRoot } from "./dialog/index";
  let modal = $state(true);
</script>
<DialogRoot bind:modal />
`,
      "utf8",
    );
    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("modal");
  });
});

describe("generated Svelte Slider consumer typing", () => {
  it("accepts scalar and array bindings, callbacks, options, snippets, refs, and native attributes", async () => {
    const root = await createSliderTypingRoot();
    const result = runSvelteCheck(root);

    expect(result.output).toContain("svelte-check found 0 errors and 0 warnings");
    expect(result.status, result.output).toBe(0);
  });

  it("rejects binding a mutable option outside the frozen value model", async () => {
    const root = await createSliderTypingRoot();
    await writeFile(
      path.join(root, "InvalidConsumer.svelte"),
      `<script lang="ts">
  import { SliderRoot } from "./slider/index";
  let max = $state(100);
</script>
<SliderRoot bind:max />
`,
      "utf8",
    );
    const result = runSvelteCheck(root);
    expect(result.status, result.output).not.toBe(0);
    expect(result.output).toContain("max");
  });
});

async function createTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-proof-types-"));
  temporaryRoots.push(root);
  await copyFile(
    path.join(process.cwd(), "packages/svelte/src/button/ButtonRoot.svelte"),
    path.join(root, "ButtonRoot.svelte"),
  );
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import ButtonRoot from "./ButtonRoot.svelte";
  let activations = $state(0);
</script>

<ButtonRoot
  id="proof-button"
  class="consumer"
  data-consumer="typed"
  aria-label="Typed proof"
  focusableWhenDisabled
  onclick={() => activations += 1}
>
  Save {activations}
</ButtonRoot>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime/button": [
            path
              .join(process.cwd(), "packages/runtime/src/components/button/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

async function createCheckboxTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-checkbox-types-"));
  temporaryRoots.push(root);
  const checkboxRoot = path.join(root, "checkbox");
  await mkdir(checkboxRoot);
  for (const file of ["CheckboxRoot.svelte", "CheckboxIndicator.svelte", "index.ts"]) {
    await copyFile(
      path.join(process.cwd(), "packages/svelte/src/checkbox", file),
      path.join(checkboxRoot, file),
    );
  }
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import { CheckboxIndicator, CheckboxRoot } from "./checkbox/index";
  let checked = $state(false);
  let rootElement: HTMLSpanElement | HTMLButtonElement | null = $state(null);
  let indicatorElement: HTMLSpanElement | null = $state(null);
</script>

<CheckboxRoot
  bind:checked
  nativeButton
  popovertarget="typed-popover"
  popovertargetaction="show"
  id="typed-checkbox"
  class="consumer"
  data-consumer="typed"
  aria-label="Typed checkbox proof"
  name="terms"
  value="accepted"
  onCheckedChange={(next, detail) => {
    if (next && detail.previousChecked) detail.cancel();
  }}
  ref={(element) => rootElement = element}
>
  <CheckboxIndicator keepMounted ref={(element) => indicatorElement = element}>
    Checked
  </CheckboxIndicator>
</CheckboxRoot>

<div id="typed-popover" popover>Popover target</div>

<output>{String(checked)}:{rootElement?.id}:{indicatorElement?.tagName}</output>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime": [
            path.join(process.cwd(), "packages/runtime/src/index.ts").replaceAll("\\", "/"),
          ],
          "@starwind-ui/runtime/checkbox": [
            path
              .join(process.cwd(), "packages/runtime/src/components/checkbox/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

async function createSelectTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-select-types-"));
  temporaryRoots.push(root);
  const selectRoot = path.join(root, "select");
  await mkdir(selectRoot);
  const sourceRoot = path.join(process.cwd(), "packages/svelte/src/select");
  for (const file of await readdir(sourceRoot)) {
    await copyFile(path.join(sourceRoot, file), path.join(selectRoot, file));
  }
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import {
    SelectItem, SelectItemIndicator, SelectItemText, SelectList, SelectPopup,
    SelectPortal, SelectPositioner, SelectRoot, SelectTrigger, SelectValue,
  } from "./select/index";
  let open = $state(false);
  let value = $state<string | null>(null);
  let rootElement: HTMLDivElement | null = $state(null);
  let popupElement: HTMLDivElement | null = $state(null);
  const items = [{ id: "alpha-id", value: "alpha", label: "Alpha" }];
</script>

<SelectRoot
  bind:open
  bind:value
  name="typed-select"
  onOpenChange={(next, detail) => { if (next && detail.previousOpen) detail.cancel(); }}
  onValueChange={(next, detail) => { if (next === detail.previousValue) detail.cancel(); }}
  ref={(element) => rootElement = element}
>
  <SelectTrigger aria-label="Typed select"><SelectValue placeholder="Choose" /></SelectTrigger>
  <SelectPortal container="body">
    <SelectPositioner side="bottom" align="start">
      <SelectPopup ref={(element) => popupElement = element}>
        <SelectList>
          {#each items as item (item.id)}
            <SelectItem value={item.value}>
              <SelectItemText>{item.label}</SelectItemText>
              <SelectItemIndicator>Selected</SelectItemIndicator>
            </SelectItem>
          {/each}
        </SelectList>
      </SelectPopup>
    </SelectPositioner>
  </SelectPortal>
</SelectRoot>

<output>{String(open)}:{value}:{rootElement?.tagName}:{popupElement?.role}</output>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime": [
            path.join(process.cwd(), "packages/runtime/src/index.ts").replaceAll("\\", "/"),
          ],
          "@starwind-ui/runtime/select": [
            path
              .join(process.cwd(), "packages/runtime/src/components/select/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

async function createAccordionTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-accordion-types-"));
  temporaryRoots.push(root);
  const accordionRoot = path.join(root, "accordion");
  await mkdir(accordionRoot);
  const sourceRoot = path.join(process.cwd(), "packages/svelte/src/accordion");
  for (const file of await readdir(sourceRoot)) {
    await copyFile(path.join(sourceRoot, file), path.join(accordionRoot, file));
  }
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import { AccordionHeader, AccordionItem, AccordionPanel, AccordionRoot, AccordionTrigger } from "./accordion/index";
  let value = $state<string | string[] | null>("alpha");
  let rootElement: HTMLDivElement | null = $state(null);
  const items = [{ id: "alpha-id", value: "alpha", label: "Alpha" }];
</script>

<AccordionRoot
  bind:value
  type="multiple"
  collapsible
  data-consumer="typed"
  onValueChange={(next, detail) => { if (next === detail.previousValue) detail.cancel(); }}
  ref={(element) => rootElement = element}
>
  {#snippet children(current)}
    <output>{String(current)}:{rootElement?.tagName}</output>
    {#each items as item (item.id)}
      <AccordionItem value={item.value}>
        <AccordionHeader><AccordionTrigger aria-label={item.label}>{item.label}</AccordionTrigger></AccordionHeader>
        <AccordionPanel>{item.label} content</AccordionPanel>
      </AccordionItem>
    {/each}
  {/snippet}
</AccordionRoot>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime": [
            path.join(process.cwd(), "packages/runtime/src/index.ts").replaceAll("\\", "/"),
          ],
          "@starwind-ui/runtime/accordion": [
            path
              .join(process.cwd(), "packages/runtime/src/components/accordion/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

async function createDialogTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-dialog-types-"));
  temporaryRoots.push(root);
  const dialogRoot = path.join(root, "dialog");
  await mkdir(dialogRoot);
  const sourceRoot = path.join(process.cwd(), "packages/svelte/src/dialog");
  for (const file of await readdir(sourceRoot)) {
    await copyFile(path.join(sourceRoot, file), path.join(dialogRoot, file));
  }
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import { DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogRoot, DialogTitle, DialogTrigger } from "./dialog/index";
  let open = $state(false);
  let rootElement: HTMLDivElement | null = $state(null);
  let popupElement: HTMLDialogElement | null = $state(null);
</script>

<DialogRoot bind:open onOpenChange={(next, detail) => { if (next === detail.previousOpen) detail.cancel(); }} onCloseComplete={(detail) => detail.open satisfies false} ref={(element) => rootElement = element} data-consumer="typed">
  {#snippet children(currentOpen)}
    <DialogTrigger targetId="typed-dialog" aria-label="Open typed dialog">Open</DialogTrigger>
    <DialogBackdrop class="backdrop" />
    <DialogPopup id="typed-dialog" ref={(element) => popupElement = element}>
      <DialogTitle>Typed dialog</DialogTitle>
      <DialogDescription>Typed description</DialogDescription>
      <DialogClose>Close</DialogClose>
    </DialogPopup>
    <output>{String(currentOpen)}:{rootElement?.tagName}:{popupElement?.tagName}</output>
  {/snippet}
</DialogRoot>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime": [
            path.join(process.cwd(), "packages/runtime/src/index.ts").replaceAll("\\", "/"),
          ],
          "@starwind-ui/runtime/dialog": [
            path
              .join(process.cwd(), "packages/runtime/src/components/dialog/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

async function createSliderTypingRoot(): Promise<string> {
  const root = await mkdtemp(path.join(process.cwd(), ".svelte-slider-types-"));
  temporaryRoots.push(root);
  const sliderRoot = path.join(root, "slider");
  await mkdir(sliderRoot);
  const sourceRoot = path.join(process.cwd(), "packages/svelte/src/slider");
  for (const file of await readdir(sourceRoot)) {
    await copyFile(path.join(sourceRoot, file), path.join(sliderRoot, file));
  }
  await writeFile(
    path.join(root, "Consumer.svelte"),
    `<script lang="ts">
  import { SliderControl, SliderIndicator, SliderLabel, SliderRoot, SliderThumb, SliderTrack } from "./slider/index";
  let value = $state<number | number[]>([20, 80]);
  let rootElement: HTMLDivElement | null = $state(null);
  let thumbElement: HTMLDivElement | null = $state(null);
  let inputElement: HTMLInputElement | null = $state(null);
</script>

<SliderRoot bind:value min={0} max={100} step={5} largeStep={10} minStepsBetweenValues={1} orientation="horizontal" name="price" form="typed-form" onValueChange={(next, detail) => { if (next === detail.previousValue) detail.cancel(); }} onValueCommitted={(next, detail) => next satisfies typeof detail.value} ref={(element) => rootElement = element} aria-label="Typed slider">
  {#snippet children(currentValue)}
    <SliderLabel>Price</SliderLabel>
    <SliderControl data-control="typed">
      <SliderTrack><SliderIndicator /></SliderTrack>
      {#each (Array.isArray(currentValue) ? currentValue : [currentValue]) as _, index (index)}
        <SliderThumb {index} aria-label={index === 0 ? "Minimum" : "Maximum"} ref={(element) => thumbElement = element} inputRef={(element) => inputElement = element} />
      {/each}
    </SliderControl>
    <output>{String(currentValue)}:{rootElement?.tagName}:{thumbElement?.tagName}:{inputElement?.type}</output>
  {/snippet}
</SliderRoot>
<form id="typed-form"></form>
`,
    "utf8",
  );
  await writeFile(
    path.join(root, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        allowJs: true,
        baseUrl: ".",
        checkJs: true,
        module: "ESNext",
        moduleResolution: "Bundler",
        paths: {
          "@starwind-ui/runtime": [
            path.join(process.cwd(), "packages/runtime/src/index.ts").replaceAll("\\", "/"),
          ],
          "@starwind-ui/runtime/slider": [
            path
              .join(process.cwd(), "packages/runtime/src/components/slider/index.ts")
              .replaceAll("\\", "/"),
          ],
        },
        strict: true,
        target: "ES2022",
        types: ["svelte"],
      },
      include: ["./**/*"],
    }),
    "utf8",
  );
  return root;
}

function runSvelteCheck(root: string): { output: string; status: number | null } {
  const command = `${path.join(process.cwd(), "node_modules/.bin/svelte-check.CMD")} --tsconfig tsconfig.json`;
  const result = spawnSync("cmd.exe", ["/d", "/s", "/c", command], {
    cwd: root,
    encoding: "utf8",
  });

  return { output: `${result.stdout}\n${result.stderr}`, status: result.status };
}
