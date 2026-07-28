import { createApp, createSSRApp, h, nextTick, ref } from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FormErrorSummary, FormRoot } from "@starwind-ui/vue/form";
import { InputRoot } from "@starwind-ui/vue/input";

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Form public behavior", () => {
  it("coordinates native validation, summary focus, valid submit, and reset", async () => {
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const host = appendHost();
    const app = createApp({
      render: () =>
        h(
          FormRoot,
          { onSubmit: submit },
          {
            default: () => [
              h(FormErrorSummary),
              field("email", "Email", "", true),
              h("button", { type: "submit" }, "Submit"),
              h("button", { type: "reset" }, "Reset"),
            ],
          },
        ),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());
    const form = host.querySelector("form")!;
    const input = host.querySelector("input")!;
    const fieldRoot = host.querySelector<HTMLElement>("[data-sw-field]")!;
    const error = host.querySelector<HTMLElement>("[data-sw-field-error]")!;
    const summary = host.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;

    form.requestSubmit();
    await macrotask();
    expect(submit).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(input);
    expect(fieldRoot).toHaveAttribute("data-invalid");
    expect(error.hidden).toBe(false);
    expect(summary.hidden).toBe(false);
    expect(summary.textContent).toContain("Email");

    input.value = "reader@example.com";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    await macrotask();
    form.requestSubmit();
    await macrotask();
    expect(submit).toHaveBeenCalledTimes(1);
    expect(new FormData(form).get("email")).toBe("reader@example.com");

    form.reset();
    await macrotask();
    expect(input.value).toBe("");
    expect(fieldRoot).not.toHaveAttribute("data-invalid");
    expect(summary.hidden).toBe(true);
  });

  it("discovers dynamic real Inputs, isolates forms, and tears down observers", async () => {
    const showSecond = ref(false);
    const disconnect = vi.spyOn(MutationObserver.prototype, "disconnect");
    const host = appendHost();
    const app = createApp({
      render: () =>
        h("div", null, [
          h(
            FormRoot,
            { id: "first-form" },
            {
              default: () => [
                field("first", "First", "one"),
                showSecond.value ? field("second", "Second", "two") : null,
              ],
            },
          ),
          h(FormRoot, { id: "other-form" }, { default: () => field("other", "Other", "other") }),
        ]),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    showSecond.value = true;
    await nextTick();
    await macrotask();
    const first = host.querySelector<HTMLFormElement>("#first-form")!;
    const other = host.querySelector<HTMLFormElement>("#other-form")!;
    expect(Object.fromEntries(new FormData(first))).toEqual({ first: "one", second: "two" });
    expect(Object.fromEntries(new FormData(other))).toEqual({ other: "other" });

    app.unmount();
    cleanups.pop();
    expect(disconnect.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it("hydrates once with timing precedence and overridable summary defaults", async () => {
    const root = () =>
      h(
        FormRoot,
        {
          "data-validation-timing": "blur",
          id: "hydrated-form",
          validationTiming: "change",
        },
        {
          default: () =>
            h(FormErrorSummary, {
              "aria-live": "assertive",
              hidden: false,
              role: "alert",
            }),
        },
      );
    const host = appendHost();
    host.innerHTML = await renderToString(createSSRApp({ render: root }));
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-form")).toHaveLength(1);
    expect(host.querySelector("form")).toHaveAttribute("data-validation-timing", "blur");
    expect(host.querySelector("[data-sw-form-error-summary]")).toHaveAttribute(
      "aria-live",
      "assertive",
    );
    expect(host.querySelector("[data-sw-form-error-summary]")).toHaveAttribute("role", "alert");
    expect(host.querySelector("[data-sw-form-error-summary]")).toHaveAttribute("hidden");
  });
});

function field(name: string, label: string, value: string, required = false) {
  return h("div", { "data-name": name, "data-sw-field": "" }, [
    h("label", { "data-sw-field-label": "" }, label),
    h(InputRoot, {
      "data-sw-field-control": "",
      defaultValue: value,
      name,
      required,
    }),
    h("div", { "data-match": "valueMissing", "data-sw-field-error": "" }, `${label} is required.`),
  ]);
}

function appendHost(): HTMLDivElement {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function macrotask(): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, 0));
}
