import { beforeEach, describe, expect, it, vi } from "vitest";

import * as dialogCopyA from "../../src/components/dialog/dialog";
import { createForm } from "../../src/components/form/form";
import * as sliderCopyA from "../../src/components/slider/slider";
import * as formValueRevision from "../../src/internal/form-value-revision";
import * as scrollLockCopyA from "../../src/internal/scroll-lock";
import { shared } from "../../src/internal/shared";

type SliderModule = typeof sliderCopyA;
type DialogModule = typeof dialogCopyA;
type ScrollLockModule = typeof scrollLockCopyA;
type FormValueRevisionModule = typeof formValueRevision;

const { attachFormValueRevision } = formValueRevision;

let copyCount = 0;

// A query string makes Vite evaluate the module again. This is the same split that `astro dev`
// makes when adapter scripts load package files and project code loads the dependency cache.
async function loadSecondCopy<T>(path: string): Promise<T> {
  const url = new URL(path, import.meta.url);
  copyCount += 1;
  url.searchParams.set("second-copy", String(copyCount));
  return (await import(/* @vite-ignore */ url.href)) as T;
}

describe("shared Runtime state", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    document.body.removeAttribute("data-sw-scroll-locked");
    document.body.removeAttribute("style");
  });

  it("keeps shared values on a versioned Symbol.for key", () => {
    const value = shared("test-value");

    expect(value).toBeInstanceOf(WeakMap);
    expect(shared("test-value")).toBe(value);
    expect(
      (globalThis as unknown as Record<symbol, unknown>)[Symbol.for("starwind/1/test-value")],
    ).toBe(value);
  });

  it("runs Form validators once per RadioGroup change when the revision comes from another copy", async () => {
    const revisionCopyB = await loadSecondCopy<FormValueRevisionModule>(
      "../../src/internal/form-value-revision.ts",
    );
    expect(revisionCopyB.attachFormValueRevision).not.toBe(attachFormValueRevision);

    document.body.innerHTML = `
      <form data-sw-form data-validation-timing="change">
        <div data-sw-field data-name="plan">
          <div data-sw-field-control><span data-notification-target></span></div>
        </div>
      </form>
    `;
    const form = document.querySelector<HTMLFormElement>("[data-sw-form]")!;
    const target = document.querySelector<HTMLElement>("[data-notification-target]")!;
    const validator = vi.fn(() => null);
    const instance = createForm(form, { fieldValidators: { plan: validator } });

    // A RadioGroup from the other copy sends both notifications for one accepted change.
    const revisionOrigin = {};
    for (const type of ["starwind:checked-change", "starwind:value-change"]) {
      const detail = {};
      revisionCopyB.attachFormValueRevision(detail, revisionOrigin);
      target.dispatchEvent(new CustomEvent(type, { bubbles: true, cancelable: true, detail }));
    }
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(validator).toHaveBeenCalledTimes(1);
    instance.destroy();
  });

  it("returns one slider controller and one change event when two module copies bind a root", async () => {
    const sliderCopyB = await loadSecondCopy<SliderModule>("../../src/components/slider/slider.ts");
    expect(sliderCopyB.createSlider).not.toBe(sliderCopyA.createSlider);

    const root = renderSlider();
    const listener = vi.fn();
    root.addEventListener("starwind:value-change", listener);

    const first = sliderCopyA.createSlider(root);
    const second = sliderCopyB.createSlider(root);

    expect(second).toBe(first);

    root
      .querySelector<HTMLElement>("[data-sw-slider-thumb]")!
      .dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }));

    expect(first.getValue()).toBe(21);
    expect(listener).toHaveBeenCalledTimes(1);

    first.destroy();
    const replacement = sliderCopyB.createSlider(root);
    expect(replacement).not.toBe(first);
    replacement.destroy();
  });

  it("lets page code control an auto-initialized dialog through another module copy", async () => {
    const dialogCopyB = await loadSecondCopy<DialogModule>("../../src/components/dialog/dialog.ts");
    const root = renderDialog();
    const listener = vi.fn();
    root.addEventListener("starwind:open-change", listener);

    const autoInitialized = dialogCopyA.createDialog(root);
    const fromPageCode = dialogCopyB.createDialog(root);

    expect(fromPageCode).toBe(autoInitialized);

    fromPageCode.open();
    expect(root.querySelector("dialog")!.open).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    fromPageCode.close();
    expect(autoInitialized.getOpen()).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    await vi.waitFor(() => {
      expect(root.querySelector("dialog")!.open).toBe(false);
      expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
      expect(document.body.style.overflow).toBe("");
    });

    autoInitialized.destroy();
  });

  it("restores body scroll once when two module copies release locks in any order", async () => {
    const scrollLockCopyB = await loadSecondCopy<ScrollLockModule>(
      "../../src/internal/scroll-lock.ts",
    );
    expect(scrollLockCopyB.lockDocumentScroll).not.toBe(scrollLockCopyA.lockDocumentScroll);

    const outer = scrollLockCopyA.lockDocumentScroll(document);
    const inner = scrollLockCopyB.lockDocumentScroll(document);

    outer.release();

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(true);

    inner.release();

    expect(document.body.style.overflow).toBe("");
    expect(document.body.hasAttribute("data-sw-scroll-locked")).toBe(false);
    expect(document.body.style.getPropertyValue("--sw-scrollbar-width")).toBe("");
  });
});

function renderSlider(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-slider data-default-value="20" data-min="0" data-max="100" data-step="1">
      <div data-sw-slider-control>
        <div data-sw-slider-track><div data-sw-slider-indicator></div></div>
        <div data-sw-slider-thumb data-index="0"><input data-sw-slider-input /></div>
      </div>
    </div>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}

function renderDialog(): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.innerHTML = `
    <div data-sw-dialog>
      <button data-sw-dialog-trigger>Open dialog</button>
      <dialog data-sw-dialog-content>
        <h2 data-sw-dialog-title>Dialog title</h2>
        <button data-sw-dialog-close>Close</button>
      </dialog>
    </div>
  `;
  const root = wrapper.firstElementChild as HTMLElement;
  document.body.append(root);
  return root;
}
