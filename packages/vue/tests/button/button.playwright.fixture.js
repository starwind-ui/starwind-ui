import { createApp, createSSRApp, h, nextTick, reactive, ref } from "vue";

import { ButtonRoot } from "/vue/button/index.js";

export async function runButtonBrowserChecks(serverMarkup) {
  await checkPublicProjection();
  await checkRuntimeOwnership();
  await checkHydration(serverMarkup);
}

async function checkPublicProjection() {
  const label = ref("Save");
  const buttonType = ref(undefined);
  const exposed = ref(null);
  let clicks = 0;
  let slotCalls = 0;
  const host = appendHost();
  const app = createApp({
    render: () =>
      h(
        ButtonRoot,
        {
          "aria-label": "Save changes",
          class: "primary-action",
          id: "save-button",
          onClick: () => {
            clicks += 1;
          },
          ref: exposed,
          style: { color: "rgb(255, 0, 0)" },
          type: buttonType.value,
        },
        {
          default: () => {
            slotCalls += 1;
            return label.value;
          },
        },
      ),
  });

  assert(slotCalls === 0, "default slot ran before mount");
  app.mount(host);
  try {
    const button = host.querySelector("button");
    assert(button instanceof HTMLButtonElement, "semantic button was not mounted");
    assert(host.children.length === 1, "Button rendered a wrapper element");
    assert(button.id === "save-button", "id did not reach the semantic button");
    assert(button.type === "button", "Button did not default to type=button");
    assert(button.className === "primary-action", "class did not reach the semantic button");
    assert(button.style.color === "rgb(255, 0, 0)", "style did not reach the semantic button");
    assert(button.getAttribute("aria-label") === "Save changes", "ARIA attrs were not forwarded");
    assert(button.textContent === "Save", "default slot content was not rendered");
    assert(slotCalls > 0, "default slot did not run lazily during render");
    assert(exposed.value?.element === button, "public ref did not expose the semantic button");
    assert(!Object.hasOwn(exposed.value, "instance"), "public ref leaked the Runtime instance");

    button.click();
    assert(clicks === 1, "native click listener was not forwarded exactly once");

    buttonType.value = "submit";
    await nextTick();
    assert(button.type === "submit", "reactive type prop did not reach the semantic button");

    label.value = "Saved";
    await nextTick();
    assert(button.textContent === "Saved", "reactive slot content did not update");
  } finally {
    app.unmount();
    host.remove();
  }
}

async function checkRuntimeOwnership() {
  const props = reactive({ disabled: true, focusableWhenDisabled: true });
  const captureRegistrations = [];
  let aborts = 0;
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalAbort = AbortController.prototype.abort;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (this instanceof HTMLButtonElement && typeof options === "object" && options.capture) {
      captureRegistrations.push(type);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  AbortController.prototype.abort = function (...args) {
    aborts += 1;
    return originalAbort.apply(this, args);
  };

  const host = appendHost();
  const app = createApp({
    render: () => h(ButtonRoot, props, { default: () => "Save" }),
  });
  try {
    app.mount(host);
    assertEventRegistrations(captureRegistrations, 1);
    const button = host.querySelector("button");
    assert(button.disabled === false, "focusable disabled Button used native disabled state");
    assert(
      button.getAttribute("aria-disabled") === "true",
      "Runtime disabled state was not rendered",
    );

    props.disabled = false;
    await nextTick();
    assert(captureRegistrations.length === 5, "disabled synchronization recreated the Runtime");
    assert(
      button.getAttribute("aria-disabled") === null,
      "disabled synchronization did not reach Runtime",
    );

    props.focusableWhenDisabled = false;
    await nextTick();
    assert(aborts === 1, "conditional Runtime instance was not destroyed exactly once");

    props.focusableWhenDisabled = true;
    await nextTick();
    assertEventRegistrations(captureRegistrations, 2);

    app.unmount();
    assert(aborts === 2, "unmount did not destroy the exact owned Runtime instance");
  } finally {
    if (host.firstChild) app.unmount();
    host.remove();
    EventTarget.prototype.addEventListener = originalAddEventListener;
    AbortController.prototype.abort = originalAbort;
  }
}

async function checkHydration(serverMarkup) {
  const captureRegistrations = [];
  let aborts = 0;
  const originalAddEventListener = EventTarget.prototype.addEventListener;
  const originalAbort = AbortController.prototype.abort;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (this instanceof HTMLButtonElement && typeof options === "object" && options.capture) {
      captureRegistrations.push(type);
    }
    return originalAddEventListener.call(this, type, listener, options);
  };
  AbortController.prototype.abort = function (...args) {
    aborts += 1;
    return originalAbort.apply(this, args);
  };

  const props = {
    "aria-label": "Hydrated save",
    disabled: true,
    focusableWhenDisabled: true,
    id: "hydrated-button",
  };
  const root = () => h(ButtonRoot, props, { default: () => "Save" });
  const host = appendHost();
  host.innerHTML = serverMarkup;
  const warnings = [];
  const app = createSSRApp({ render: root });
  app.config.warnHandler = (message) => warnings.push(message);
  try {
    app.mount(host);
    await nextTick();
    assert(warnings.length === 0, `hydration warned: ${warnings.join(" | ")}`);
    assert(host.querySelectorAll("#hydrated-button").length === 1, "hydration duplicated the root");
    assertEventRegistrations(captureRegistrations, 1);

    app.unmount();
    assert(aborts === 1, "hydrated Runtime instance was not destroyed exactly once");
  } finally {
    if (host.firstChild) app.unmount();
    host.remove();
    EventTarget.prototype.addEventListener = originalAddEventListener;
    AbortController.prototype.abort = originalAbort;
  }
}

function appendHost() {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function assertEventRegistrations(actual, instanceCount) {
  const expected = Array.from({ length: instanceCount }, () => [
    "click",
    "keydown",
    "keyup",
    "mousedown",
    "pointerdown",
  ]).flat();
  assert(
    JSON.stringify(actual.toSorted()) === JSON.stringify(expected.toSorted()),
    `unexpected Runtime capture listeners: ${actual.join(",")}`,
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
