import { afterEach, describe, expect, it } from "vitest";

import { runtimeAdapterContracts } from "../../../scripts/portable-runtime/contracts/primitive/representatives.js";
// The generated metadata is plain data. The examples module reads adapter files with Node APIs, so
// it cannot load in the browser.
import { layeredDocsMetadata } from "../../../scripts/portable-runtime/docs/layered-docs/generated/layered-docs-metadata.js";
import { registerChartModule } from "../src/components/chart";
import { visitorBars } from "./components/chart/fixtures";

type RuntimeFactory = (root: HTMLElement) => { destroy?: () => void };
type RuntimeInstance = {
  destroy?: () => void;
  getChecked?: () => boolean;
  getOpen?: () => boolean;
  getValue?: () => string;
  setChecked?: (checked: boolean, options?: { emit?: boolean }) => void;
  setDisabled?: (disabled: boolean) => void;
  setOpen?: (open: boolean, options?: { emit?: boolean }) => void;
  setValue?: (value: string, options?: { emit?: boolean }) => void;
};

declare global {
  interface ImportMeta {
    glob(pattern: string, options?: { eager?: boolean }): Record<string, unknown>;
  }
}

const rawHtmlExample = (primitiveId: string) =>
  layeredDocsMetadata.primitives
    .find((primitive) => primitive.id === primitiveId)
    ?.docsReference.examples.find(
      (example) => example.id === "basic" && example.framework === "raw-html",
    );

const runtimeModules = import.meta.glob("../src/components/*/index.ts", {
  eager: true,
}) as Record<string, Record<string, unknown>>;

describe("primitive docs raw HTML examples", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  for (const contract of runtimeAdapterContracts) {
    it(`initializes the ${contract.component} raw HTML example with its documented factory`, () => {
      const example = rawHtmlExample(contract.component);
      const rootPart = contract.parts.find((part) => part.name === contract.runtime.rootPart);

      expect(example?.code).toBeTruthy();
      expect(rootPart).toBeTruthy();

      const host = document.createElement("div");
      host.innerHTML = stripScript(example?.code ?? "");
      document.body.append(host);

      const root = host.querySelector(`[${rootPart?.discoveryAttribute}]`);
      const runtimeModule = runtimeModules[`../src/components/${contract.component}/index.ts`];
      const factory = runtimeModule?.[contract.runtime.factory] as RuntimeFactory | undefined;

      expect(root).toBeInstanceOf(HTMLElement);
      expect(factory).toBeTypeOf("function");

      if (contract.component === "chart") standInForChartModuleScript(root as HTMLElement);

      const instance = factory?.(root as HTMLElement);

      expect(instance).toBeTruthy();
      instance?.destroy?.();
    });
  }

  it("preserves representative behavior in generated raw HTML examples", () => {
    const button = mountRawHtmlExample("button");
    expect(button.root).toBeInstanceOf(HTMLButtonElement);
    expect(button.root.getAttribute("type")).toBe("button");
    expect(button.root.hasAttribute("data-focusable-when-disabled")).toBe(true);
    button.root.focus();
    button.instance.setDisabled?.(true);
    expect(document.activeElement).toBe(button.root);
    expect(button.root.getAttribute("aria-disabled")).toBe("true");
    expect(button.root.hasAttribute("data-disabled")).toBe(true);
    expect((button.root as HTMLButtonElement).disabled).toBe(false);
    button.instance.setDisabled?.(false);
    expect(button.root.hasAttribute("aria-disabled")).toBe(false);
    expect(button.root.hasAttribute("data-disabled")).toBe(false);
    button.instance.destroy?.();

    const checkbox = mountRawHtmlExample("checkbox");
    checkbox.instance.setChecked?.(true, { emit: false });
    expect(checkbox.instance.getChecked?.()).toBe(true);
    expect(checkbox.root.hasAttribute("data-checked")).toBe(true);
    expect(checkbox.root.querySelector<HTMLInputElement>("[data-sw-checkbox-input]")?.checked).toBe(
      true,
    );
    checkbox.instance.destroy?.();

    const dialog = mountRawHtmlExample("dialog");
    dialog.instance.setOpen?.(true, { emit: false });
    expect(dialog.instance.getOpen?.()).toBe(true);
    expect(dialog.root.querySelector<HTMLDialogElement>("[data-sw-dialog-content]")?.open).toBe(
      true,
    );
    dialog.instance.setOpen?.(false, { emit: false });
    expect(dialog.instance.getOpen?.()).toBe(false);
    dialog.instance.destroy?.();

    const input = mountRawHtmlExample("input");
    input.instance.setValue?.("Ada", { emit: false });
    expect(input.instance.getValue?.()).toBe("Ada");
    expect((input.root as HTMLInputElement).value).toBe("Ada");
    input.instance.destroy?.();

    const inputOtp = mountRawHtmlExample("input-otp");
    inputOtp.instance.setValue?.("12", { emit: false });
    expect(inputOtp.instance.getValue?.()).toBe("12");
    expect(
      Array.from(inputOtp.root.querySelectorAll("[data-sw-input-otp-char]")).map(
        (slotChar) => slotChar.textContent ?? "",
      ),
    ).toEqual(["1", "2"]);
    expect(inputOtp.root.querySelector<HTMLInputElement>("[data-sw-input-otp-input]")?.value).toBe(
      "12",
    );
    inputOtp.instance.destroy?.();
  });
});

/**
 * The chart example's module script registers its chart module, which `stripScript` removes. Register
 * a fixture module under the root's `data-chart-module` id, as the page would after that script loads.
 */
function standInForChartModuleScript(root: HTMLElement) {
  const moduleId = root.dataset.chartModule;

  expect(moduleId).toBeTruthy();
  registerChartModule({ id: moduleId!, ariaLabel: "Visitors by month", create: visitorBars });
}

function stripScript(source: string) {
  return source.replace(/\n\n<script type="module">[\s\S]*<\/script>\s*$/, "");
}

function mountRawHtmlExample(primitiveId: string): {
  instance: RuntimeInstance;
  root: HTMLElement;
} {
  const contract = runtimeAdapterContracts.find((candidate) => candidate.component === primitiveId);
  const example = rawHtmlExample(primitiveId);
  const rootPart = contract?.parts.find((part) => part.name === contract.runtime.rootPart);
  const runtimeModule = runtimeModules[`../src/components/${primitiveId}/index.ts`];
  const factory = runtimeModule?.[contract?.runtime.factory ?? ""] as RuntimeFactory | undefined;

  if (!contract || !example?.code || !rootPart || !factory) {
    throw new Error(`${primitiveId} raw HTML docs example cannot be mounted.`);
  }

  const host = document.createElement("div");
  host.innerHTML = stripScript(example.code);
  document.body.append(host);

  const root = host.querySelector<HTMLElement>(`[${rootPart.discoveryAttribute}]`);
  if (!root) {
    throw new Error(`${primitiveId} raw HTML docs example did not render its root.`);
  }

  return {
    instance: factory(root),
    root,
  };
}
