import * as React from "react";
import { act } from "react";
import { createRoot } from "react-dom/client";
import { createApp, h, shallowRef, nextTick } from "vue";
import { mount, unmount, tick } from "svelte";
import { describe, it, expect, vi } from "vitest";
import {
  FormRoot as ReactForm,
  FormErrorSummary as ReactSummary,
} from "../../../../packages/react/src/form";
import ReactStyled from "../../../../apps/react-demo/src/components/starwind-runtime/form/Form";
import {
  FormRoot as VueForm,
  FormErrorSummary as VueSummary,
} from "../../../../packages/vue/src/form";
import VueStyled from "../../../../apps/vue-demo/src/components/starwind-runtime/form/Form.vue";
import SvelteFixture from "./Fixture.svelte";
import {
  createForm,
  type FormOptions,
  type FormExternalErrors,
  type FormExternalErrorOptions,
} from "@starwind-ui/runtime/form";

type Props = {
  options?: FormOptions;
  errors?: FormExternalErrors;
  errorOptions?: FormExternalErrorOptions;
};
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
// Yield one event-loop turn so Runtime's queued native event and reset tasks finish.
// Observable async results are checked with waitFor below.
const flushFormTasks = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

async function renderFramework(target: string, styled: boolean, host: HTMLElement) {
  if (target === "react") {
    const root = createRoot(host);
    const Root = styled ? ReactStyled : ReactForm;
    return {
      update: async (props: Props) => {
        await act(async () =>
          root.render(
            <React.StrictMode>
              <Root {...props} onSubmit={(event) => event.preventDefault()}>
                <ReactSummary />
                <div data-sw-field="" data-name="email">
                  <label data-sw-field-label="" htmlFor="email">
                    Email
                  </label>
                  <input data-sw-field-control="" id="email" name="email" />
                  <span data-sw-field-error="" />
                </div>
                <button type="submit">Submit</button>
              </Root>
            </React.StrictMode>,
          ),
        );
      },
      destroy: () => act(() => root.unmount()),
    };
  }
  if (target === "vue") {
    const props = shallowRef<Props>({});
    const app = createApp({
      render: () =>
        h(
          styled ? VueStyled : VueForm,
          { ...props.value, onSubmit: (event: Event) => event.preventDefault() },
          {
            default: () => [
              h(VueSummary),
              h("div", { "data-sw-field": "", "data-name": "email" }, [
                h("label", { "data-sw-field-label": "", for: "email" }, "Email"),
                h("input", { "data-sw-field-control": "", id: "email", name: "email" }),
                h("span", { "data-sw-field-error": "" }),
              ]),
              h("button", { type: "submit" }, "Submit"),
            ],
          },
        ),
    });
    app.mount(host);
    return {
      update: async (next: Props) => {
        props.value = next;
        await nextTick();
      },
      destroy: () => app.unmount(),
    };
  }
  const app = mount(SvelteFixture, { target: host, props: { styled } });
  return {
    update: async (next: Props) => {
      app.update(next);
      await tick();
    },
    destroy: () => unmount(app),
  };
}

for (const framework of ["react", "vue", "svelte"])
  for (const styled of [false, true]) {
    describe(`${framework} ${styled ? "styled" : "primitive"} Form`, () => {
      it("supports validators, managed submit, server error updates, edit clearing and reset", async () => {
        const host = document.createElement("div");
        document.body.append(host);
        const adapter = await renderFramework(framework, styled, host);
        const submitted = vi.fn();
        const options: FormOptions = {
          fieldValidators: {
            email: (value) => (String(value).includes("@") ? null : "Enter an email"),
          },
          formValidators: (values) =>
            values.email === "blocked@example.com" ? { email: "Account blocked" } : null,
          asyncFieldValidators: {
            email: async (value) => (value === "taken@example.com" ? "Email taken" : null),
          },
          asyncFormValidators: async (values) =>
            values.email === "pending@example.com" ? { email: "Account pending" } : null,
          onSubmit: submitted,
        };
        const settings = { clearOnChange: true };
        let props: Props = {
          options,
          errors: { email: "Server rejected" },
          errorOptions: settings,
        };
        const update = async (next: Props) => {
          props = next;
          await adapter.update(props);
          await flushFormTasks();
        };
        try {
          await update(props);
          const form = host.querySelector("form")!;
          const controller = createForm(form);
          const input = host.querySelector("input")!;
          const summary = host.querySelector<HTMLElement>("[data-sw-form-error-summary]")!;
          const edit = async (value: string) => {
            input.value = value;
            input.dispatchEvent(new Event("input", { bubbles: true }));
            await flushFormTasks();
          };
          await vi.waitFor(() => expect(summary.textContent).toContain("Server rejected"));
          expect(summary.hidden).toBe(false);
          expect(form.hasAttribute("options")).toBe(false);
          expect(form.hasAttribute("errors")).toBe(false);
          await edit("bad");
          expect(controller.getErrors().some((error) => error.message === "Server rejected")).toBe(
            false,
          );
          for (const [value, message] of [
            ["bad", "Enter an email"],
            ["blocked@example.com", "Account blocked"],
            ["taken@example.com", "Email taken"],
            ["pending@example.com", "Account pending"],
          ]) {
            await edit(value!);
            form.requestSubmit();
            await flushFormTasks();
            await vi.waitFor(() => expect(summary.textContent).toContain(message!));
            expect(submitted).not.toHaveBeenCalled();
          }
          await edit("valid@example.com");
          form.requestSubmit();
          await flushFormTasks();
          await vi.waitFor(() => expect(submitted).toHaveBeenCalledTimes(1));
          expect(submitted.mock.calls[0]![0].values.email).toBe("valid@example.com");
          await update({ ...props, errors: { email: "New server error" } });
          await vi.waitFor(() => expect(summary.textContent).toContain("New server error"));
          expect(createForm(form)).toBe(controller);
          await update({ ...props, errors: undefined });
          await vi.waitFor(() => expect(summary.hidden).toBe(true));
          // Removed options must remove old validators and the managed submit callback.
          await update({ options: undefined });
          await edit("bad");
          expect((await controller.validate()).valid).toBe(true);
          const nativeSubmit = vi.fn((event: Event) => event.preventDefault());
          form.addEventListener("submit", nativeSubmit);
          form.requestSubmit();
          await flushFormTasks();
          expect(nativeSubmit).toHaveBeenCalledTimes(1);
          expect(submitted).toHaveBeenCalledTimes(1);
          await update({ errors: { email: "Reset clears server error" } });
          await vi.waitFor(() => expect(summary.textContent).toContain("Reset clears server error"));
          form.reset();
          await flushFormTasks();
          await vi.waitFor(() => expect(summary.hidden).toBe(true));
          await update({
            options: { externalErrorsOnReset: "preserve" },
            errors: { email: "Preserved server error" },
          });
          await vi.waitFor(() => expect(summary.textContent).toContain("Preserved server error"));
          form.reset();
          await flushFormTasks();
          expect(
            controller.getErrors().some((error) => error.message === "Preserved server error"),
          ).toBe(true);
        } finally {
          await adapter.destroy();
          host.remove();
        }
      });
    });
  }
