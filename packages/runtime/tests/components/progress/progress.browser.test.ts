import { afterEach, describe, expect, it } from "vitest";

import { createProgress } from "../../../src/components/progress/progress";

describe("createProgress", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("renders determinate progress state and indicator position", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="40" data-max="200">
        <span data-sw-progress-label>Export data</span>
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    createProgress(root);

    expect(root).toHaveAttribute("role", "progressbar");
    expect(root).toHaveAttribute("aria-valuemin", "0");
    expect(root).toHaveAttribute("aria-valuemax", "200");
    expect(root).toHaveAttribute("aria-valuenow", "40");
    expect(root).toHaveAttribute("aria-valuetext", "40%");
    expect(root).toHaveAttribute("aria-labelledby", expect.stringMatching(/^sw-progress-label-/));
    expect(root).toHaveAttribute("data-progressing", "");
    expect(root).not.toHaveAttribute("data-complete");
    expect(root).not.toHaveAttribute("data-indeterminate");
    expect(document.querySelector<HTMLElement>("[data-sw-progress-label]")).toHaveAttribute(
      "role",
      "presentation",
    );
    expect(indicator).toHaveAttribute("data-progressing", "");
    expect(indicator.style.transform).toBe("translateX(-80%)");
    expect(value).toHaveAttribute("aria-hidden", "true");
    expect(value.textContent).toBe("40%");
  });

  it("formats raw values while preserving range-based indicator fill", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="30" data-max="200">
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    createProgress(root, {
      format: { currency: "USD", style: "currency" },
      locale: "en-US",
    });

    expect(root).toHaveAttribute("aria-valuenow", "30");
    expect(root).toHaveAttribute("aria-valuetext", "$30.00");
    expect(indicator.style.transform).toBe("translateX(-85%)");
    expect(value.textContent).toBe("$30.00");
  });

  it("renders indeterminate progress with default value text", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-indeterminate>
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    createProgress(root);

    expect(root).toHaveAttribute("data-indeterminate", "");
    expect(root).not.toHaveAttribute("aria-valuenow");
    expect(root).toHaveAttribute("aria-valuetext", "indeterminate progress");
    expect(indicator.style.transform).toBe("");
    expect(value.textContent).toBe("");
  });

  it("updates from data attributes", async () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="25">
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    createProgress(root);

    root.setAttribute("data-value", "75");
    await waitForMutationObserver();

    expect(root).toHaveAttribute("aria-valuenow", "75");
    expect(root).toHaveAttribute("aria-valuetext", "75%");
    expect(indicator.style.transform).toBe("translateX(-25%)");
    expect(value.textContent).toBe("75%");
  });

  it("updates formatting options without recreating the controller", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="30">
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    const progress = createProgress(root, {
      format: { currency: "USD", style: "currency" },
      locale: "en-US",
    });

    expect(root).toHaveAttribute("aria-valuetext", "$30.00");
    expect(value.textContent).toBe("$30.00");

    progress.setFormatOptions({
      ariaValueText: "Thirty files",
      format: { maximumFractionDigits: 0 },
      getAriaValueText: (formattedValue, rawValue) => `${formattedValue}:${rawValue}`,
      locale: "en-US",
    });

    expect(root).toHaveAttribute("aria-valuetext", "Thirty files");
    expect(value.textContent).toBe("30");

    progress.setFormatOptions({
      ariaValueText: undefined,
      format: { maximumFractionDigits: 0 },
      getAriaValueText: (formattedValue, rawValue) => `${formattedValue}:${rawValue}`,
      locale: "en-US",
    });

    expect(root).toHaveAttribute("aria-valuetext", "30:30");
    expect(value.textContent).toBe("30");

    progress.setFormatOptions({
      ariaValueText: undefined,
      format: undefined,
      getAriaValueText: undefined,
      locale: undefined,
    });
    progress.setValue(null);

    expect(root).toHaveAttribute("aria-valuetext", "indeterminate progress");
    expect(value.textContent).toBe("");
  });

  it("supports imperative value, min, and max updates", () => {
    document.body.innerHTML = `
      <div data-sw-progress>
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const progress = createProgress(root, { min: 50, max: 150, value: 100 });

    expect(progress.getPercent()).toBe(50);
    expect(indicator.style.transform).toBe("translateX(-50%)");

    progress.setValue(150);

    expect(progress.getStatus()).toBe("complete");
    expect(root).toHaveAttribute("data-complete", "");
    expect(indicator.style.transform).toBe("translateX(0%)");

    progress.setValue(null);

    expect(progress.getStatus()).toBe("indeterminate");
    expect(root).toHaveAttribute("data-indeterminate", "");
    expect(root).not.toHaveAttribute("aria-valuenow");
    expect(root).toHaveAttribute("aria-valuetext", "indeterminate progress");
  });

  it("projects status to track, indicator, value, and label parts", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="0">
        <span data-sw-progress-label>Upload</span>
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
        <span data-sw-progress-value></span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const parts = [
      document.querySelector<HTMLElement>("[data-sw-progress-track]")!,
      document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!,
      document.querySelector<HTMLElement>("[data-sw-progress-value]")!,
      document.querySelector<HTMLElement>("[data-sw-progress-label]")!,
    ];
    const progress = createProgress(root);

    expect(root).toHaveAttribute("data-status", "progressing");
    expect(root).toHaveAttribute("data-progressing", "");
    expect(
      document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!.style.transform,
    ).toBe("translateX(-100%)");
    parts.forEach((part) => {
      expect(part).toHaveAttribute("data-status", "progressing");
      expect(part).toHaveAttribute("data-progressing", "");
    });

    progress.setValue(100);

    expect(root).toHaveAttribute("data-status", "complete");
    expect(root).toHaveAttribute("data-complete", "");
    parts.forEach((part) => {
      expect(part).toHaveAttribute("data-status", "complete");
      expect(part).toHaveAttribute("data-complete", "");
      expect(part).not.toHaveAttribute("data-progressing");
    });

    progress.setValue(null);

    expect(root).toHaveAttribute("data-status", "indeterminate");
    expect(root).toHaveAttribute("data-indeterminate", "");
    parts.forEach((part) => {
      expect(part).toHaveAttribute("data-status", "indeterminate");
      expect(part).toHaveAttribute("data-indeterminate", "");
      expect(part).not.toHaveAttribute("data-complete");
    });
  });

  it("updates public min and max setters without recreating the controller", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="50">
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const indicator = document.querySelector<HTMLElement>("[data-sw-progress-indicator]")!;
    const progress = createProgress(root);

    progress.setMin(25);
    progress.setMax(75);

    expect(root).toHaveAttribute("data-min", "25");
    expect(root).toHaveAttribute("data-max", "75");
    expect(root).toHaveAttribute("aria-valuemin", "25");
    expect(root).toHaveAttribute("aria-valuemax", "75");
    expect(progress.getPercent()).toBe(50);
    expect(indicator.style.transform).toBe("translateX(-50%)");

    progress.setMax(50);

    expect(progress.getStatus()).toBe("complete");
    expect(root).toHaveAttribute("data-status", "complete");
    expect(root).toHaveAttribute("data-complete", "");
    expect(indicator.style.transform).toBe("translateX(0%)");
  });

  it("preserves explicit aria value text", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="4" data-max="8" aria-valuetext="Half done">
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    createProgress(root);

    expect(root).toHaveAttribute("aria-valuetext", "Half done");
  });

  it("preserves explicit value text while hiding it from assistive technology", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="60">
        <span data-sw-progress-value data-preserve-text>Almost there</span>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const value = document.querySelector<HTMLElement>("[data-sw-progress-value]")!;
    createProgress(root);

    expect(value).toHaveAttribute("aria-hidden", "true");
    expect(value.textContent).toBe("Almost there");
  });

  it("preserves an explicit accessible name on the progressbar root", () => {
    document.body.innerHTML = `
      <div data-sw-progress data-value="30" aria-label="File upload progress">
        <div data-sw-progress-track>
          <div data-sw-progress-indicator></div>
        </div>
      </div>
    `;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    createProgress(root);

    expect(root).toHaveAttribute("role", "progressbar");
    expect(root).toHaveAttribute("aria-label", "File upload progress");
    expect(root).toHaveAttribute("aria-valuenow", "30");
  });

  it("is idempotent", () => {
    document.body.innerHTML = `<div data-sw-progress data-value="20"></div>`;

    const root = document.querySelector<HTMLElement>("[data-sw-progress]")!;
    const first = createProgress(root);
    const second = createProgress(root);

    expect(second).toBe(first);
  });
});

async function waitForMutationObserver(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
