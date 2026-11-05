import { afterEach, describe, expect, it, vi } from "vitest";

const CONTROL_MARKUP = `
  <div data-sw-field data-name="theme">
    <div data-sw-select data-default-value="dark">
      <button data-sw-select-trigger type="button"><span data-sw-select-value></span></button>
      <input data-sw-select-input type="hidden" />
      <div data-sw-select-positioner><div data-sw-select-popup hidden><div data-sw-select-list>
        <div data-sw-select-item data-value="dark"><span data-sw-select-item-text>Dark</span></div>
      </div></div></div>
    </div>
  </div>
`;
// Vitest routes each dynamic import in a browser test through this global.
const VITEST_DYNAMIC_IMPORT_SCRIPT = `
  <script>window.__vitest_browser_runner__ = parent.__vitest_browser_runner__;</script>
`;
const FIELD_SCRIPT = `
  <script type="module">
    import { createField } from "${location.origin}/src/components/field/index.ts";
    document.querySelectorAll("[data-sw-field]").forEach((field) => createField(field));
  </script>
`;
const SELECT_SCRIPT = `
  <script type="module">
    import { createSelect } from "${location.origin}/src/components/select/index.ts";
    document.querySelectorAll("[data-sw-select]").forEach((root) => createSelect(root));
  </script>
`;

async function loadPage(scripts: string): Promise<HTMLIFrameElement> {
  const frame = document.createElement("iframe");
  // A blob document is a real navigation. WebKit gives a srcdoc document no navigation timing.
  frame.src = URL.createObjectURL(
    new Blob(
      [
        `<!doctype html><html><body>${CONTROL_MARKUP}${VITEST_DYNAMIC_IMPORT_SCRIPT}${scripts}</body></html>`,
      ],
      { type: "text/html" },
    ),
  );
  const loaded = new Promise((resolve) => frame.addEventListener("load", resolve, { once: true }));
  document.body.append(frame);
  await loaded;
  return frame;
}

function loadedSiblingModule(frame: HTMLIFrameElement): boolean {
  return frame
    .contentWindow!.performance.getEntriesByType("resource")
    .some((entry) => entry.name.includes("field-sibling-controls"));
}

async function expectSelectName(frame: HTMLIFrameElement): Promise<void> {
  await vi.waitFor(
    () => {
      const input =
        frame.contentDocument!.querySelector<HTMLInputElement>("[data-sw-select-input]")!;
      expect(input.name).toBe("theme");
    },
    { timeout: 10_000 },
  );
}

describe("Field and module script order", () => {
  afterEach(() => {
    document.querySelectorAll("iframe").forEach((frame) => frame.remove());
  });

  it("uses a Select from a later module script without the sibling module", async () => {
    const frame = await loadPage(FIELD_SCRIPT + SELECT_SCRIPT);

    await expectSelectName(frame);

    expect(loadedSiblingModule(frame)).toBe(false);
  });

  it("loads the sibling module when no script on the page imports the Select", async () => {
    const frame = await loadPage(FIELD_SCRIPT);

    await expectSelectName(frame);

    expect(loadedSiblingModule(frame)).toBe(true);
  });
});
