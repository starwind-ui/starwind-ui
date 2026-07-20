import {
  createApp,
  createSSRApp,
  defineComponent,
  h,
  nextTick,
  reactive,
  ref,
  type ComponentPublicInstance,
} from "vue";
import { renderToString } from "vue/server-renderer";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ButtonRoot } from "@starwind-ui/vue/button";

type ButtonExposed = ComponentPublicInstance & {
  element: HTMLButtonElement | null;
};

const cleanups: Array<() => void> = [];

afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("Vue Button public behavior", () => {
  it("forwards attrs, native listeners, class, style, slot content, and the semantic ref once", async () => {
    const label = ref("Save");
    const buttonType = ref<"submit" | undefined>(undefined);
    const buttonRef = ref<ButtonExposed | null>(null);
    const onClick = vi.fn();
    let slotCalls = 0;
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(
              ButtonRoot,
              {
                "aria-label": "Save changes",
                class: "primary-action",
                id: "save-button",
                onClick,
                ref: buttonRef,
                style: { color: "rgb(255, 0, 0)" },
                type: buttonType.value,
              },
              {
                default: () => {
                  slotCalls += 1;
                  return label.value;
                },
              },
            );
        },
      }),
    );

    expect(slotCalls).toBe(0);
    app.mount(host);
    cleanups.push(() => app.unmount());

    const button = host.querySelector("button");
    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(host.children).toHaveLength(1);
    expect(button).toMatchObject({ id: "save-button", type: "button" });
    expect(button?.className).toBe("primary-action");
    expect(button?.style.color).toBe("rgb(255, 0, 0)");
    expect(button?.getAttribute("aria-label")).toBe("Save changes");
    expect(button?.textContent).toBe("Save");
    expect(slotCalls).toBeGreaterThan(0);
    expect(buttonRef.value?.element).toBe(button);
    expect(buttonRef.value).not.toHaveProperty("instance");

    button?.click();
    expect(onClick).toHaveBeenCalledTimes(1);

    buttonType.value = "submit";
    await nextTick();
    expect(button?.type).toBe("submit");

    label.value = "Saved";
    await nextTick();
    expect(button?.textContent).toBe("Saved");
  });

  it("owns one conditional Runtime controller and destroys each exact instance", async () => {
    const props = reactive({ disabled: true, focusableWhenDisabled: true });
    const captureRegistrations: string[] = [];
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean,
    ) {
      if (this instanceof HTMLButtonElement && typeof options === "object" && options.capture) {
        captureRegistrations.push(type);
      }
      return originalAddEventListener.call(this, type, listener, options);
    });
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const host = document.createElement("div");
    document.body.append(host);
    const app = createApp({
      render: () => h(ButtonRoot, props, { default: () => "Save" }),
    });
    app.mount(host);
    cleanups.push(() => app.unmount());

    expect(captureRegistrations.sort()).toEqual([
      "click",
      "keydown",
      "keyup",
      "mousedown",
      "pointerdown",
    ]);
    const button = host.querySelector("button")!;
    expect(button.disabled).toBe(false);
    expect(button.getAttribute("aria-disabled")).toBe("true");

    props.disabled = false;
    await nextTick();
    expect(captureRegistrations).toHaveLength(5);
    expect(button.getAttribute("aria-disabled")).toBeNull();

    props.focusableWhenDisabled = false;
    await nextTick();
    expect(abort).toHaveBeenCalledTimes(1);

    props.focusableWhenDisabled = true;
    await nextTick();
    expect(captureRegistrations).toHaveLength(10);

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(2);
  });

  it("hydrates the server tree without warnings or duplicate Runtime initialization", async () => {
    const abort = vi.spyOn(AbortController.prototype, "abort");
    const captureRegistrations: string[] = [];
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    vi.spyOn(EventTarget.prototype, "addEventListener").mockImplementation(function (
      this: EventTarget,
      type: string,
      listener: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions | boolean,
    ) {
      if (this instanceof HTMLButtonElement && typeof options === "object" && options.capture) {
        captureRegistrations.push(type);
      }
      return originalAddEventListener.call(this, type, listener, options);
    });
    const props = {
      "aria-label": "Hydrated save",
      disabled: true,
      focusableWhenDisabled: true,
      id: "hydrated-button",
    };
    const root = () => h(ButtonRoot, props, { default: () => "Save" });
    const html = await renderToString(createSSRApp({ render: root }));
    const host = document.createElement("div");
    host.innerHTML = html;
    document.body.append(host);
    const warnings: string[] = [];
    const app = createSSRApp({ render: root });
    app.config.warnHandler = (message) => warnings.push(message);
    app.mount(host);
    cleanups.push(() => app.unmount());
    await nextTick();

    expect(warnings).toEqual([]);
    expect(host.querySelectorAll("#hydrated-button")).toHaveLength(1);
    expect(captureRegistrations.sort()).toEqual([
      "click",
      "keydown",
      "keyup",
      "mousedown",
      "pointerdown",
    ]);

    app.unmount();
    cleanups.pop();
    expect(abort).toHaveBeenCalledTimes(1);
  });
});
