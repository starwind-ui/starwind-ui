import { createApp, createSSRApp, h, nextTick, reactive, ref } from "vue";

import { CheckboxIndicator, CheckboxRoot } from "/vue/checkbox/index.js";

export async function runCheckboxBrowserChecks(serverMarkup) {
  await checkModelsAndPublicProjection();
  await checkFormsPresenceAndOwnership();
  await checkHydration(serverMarkup);
}

async function checkModelsAndPublicProjection() {
  const defaultChecked = ref(false);
  const exposed = ref(null);
  const events = [];
  let cancelNext = false;
  const host = appendHost();
  const app = createApp({
    render: () =>
      h(
        CheckboxRoot,
        {
          "aria-label": "Accept",
          class: "terms",
          defaultChecked: defaultChecked.value,
          onCheckedChange: (_checked, detail) => {
            events.push("detail");
            if (cancelNext) detail.cancel();
          },
          "onUpdate:checked": () => events.push("update"),
          ref: exposed,
          style: { color: "rgb(255, 0, 0)" },
        },
        {
          default: () => [h(CheckboxIndicator, null, { default: () => "✓" }), "Accept"],
        },
      ),
  });
  app.mount(host);
  try {
    const root = host.querySelector("[data-sw-checkbox]");
    const indicator = host.querySelector("[data-sw-checkbox-indicator]");
    assert(root instanceof HTMLElement, "semantic Checkbox root was not mounted");
    assert(root.className === "terms", "class did not reach the semantic element");
    assert(root.style.color === "rgb(255, 0, 0)", "style did not reach the semantic element");
    assert(root.getAttribute("aria-label") === "Accept", "ARIA attrs were not forwarded");
    assert(root.textContent.includes("Accept"), "default slot did not render");
    assert(exposed.value?.element === root, "public ref did not expose the semantic element");
    assert(!Object.hasOwn(exposed.value, "instance"), "public ref leaked the Runtime instance");

    defaultChecked.value = true;
    await nextTick();
    assert(root.getAttribute("aria-checked") === "false", "defaultChecked reseeded after mount");

    root.click();
    await nextTick();
    assertSequence(events, ["detail", "update"], "accepted uncontrolled change");
    assert(
      root.getAttribute("aria-checked") === "true",
      "uncontrolled accepted state did not commit",
    );
    assert(indicator.hidden === false, "indicator presence did not show for checked state");

    cancelNext = true;
    root.click();
    await nextTick();
    assertSequence(events, ["detail", "update", "detail"], "canceled change");
    assert(root.getAttribute("aria-checked") === "true", "canceled state committed");
  } finally {
    app.unmount();
    host.remove();
  }

  const controlled = reactive({ checked: false });
  const controlledEvents = [];
  const controlledHost = appendHost();
  const controlledApp = createApp({
    render: () =>
      h(CheckboxRoot, {
        checked: controlled.checked,
        onCheckedChange: () => controlledEvents.push("detail"),
        "onUpdate:checked": () => controlledEvents.push("update"),
      }),
  });
  controlledApp.mount(controlledHost);
  try {
    const root = controlledHost.querySelector("[data-sw-checkbox]");
    root.click();
    await nextTick();
    assertSequence(controlledEvents, ["detail", "update"], "controlled proposal");
    assert(root.getAttribute("aria-checked") === "false", "controlled proposal mutated state");

    controlled.checked = true;
    await nextTick();
    assert(root.getAttribute("aria-checked") === "true", "parent state did not synchronize");
    assertSequence(controlledEvents, ["detail", "update"], "non-emitting controlled sync");
  } finally {
    controlledApp.unmount();
    controlledHost.remove();
  }
}

async function checkFormsPresenceAndOwnership() {
  let aborts = 0;
  const originalAbort = AbortController.prototype.abort;
  AbortController.prototype.abort = function (...args) {
    aborts += 1;
    return originalAbort.apply(this, args);
  };
  const form = document.createElement("form");
  form.id = "settings";
  document.body.append(form);
  const host = appendHost();
  const renderCheckboxes = () =>
    h("div", null, [
      h(
        CheckboxRoot,
        {
          defaultChecked: true,
          form: "settings",
          name: "alpha",
          nativeButton: true,
          uncheckedValue: "no",
          value: "yes",
        },
        { default: () => h(CheckboxIndicator) },
      ),
      h(
        CheckboxRoot,
        {
          defaultChecked: false,
          form: "settings",
          name: "beta",
          nativeButton: true,
          uncheckedValue: "no",
          value: "yes",
        },
        { default: () => h(CheckboxIndicator, { keepMounted: true }) },
      ),
    ]);
  const app = createApp({ render: renderCheckboxes });
  try {
    app.mount(host);
    const roots = host.querySelectorAll("[data-sw-checkbox]");
    assert(roots.length === 2, "multiple Checkbox instances did not mount independently");
    assert(
      host.querySelector("[data-keep-mounted]")?.hidden === false,
      "keepMounted indicator was not present while unchecked",
    );
    assertFormData(form, { alpha: "yes", beta: "no" });

    roots[0].click();
    roots[1].click();
    await nextTick();
    assertFormData(form, { alpha: "no", beta: "yes" });

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    const resetInputs = host.querySelectorAll("[data-sw-checkbox-input]");
    assert(
      roots[0].getAttribute("aria-checked") === "true" &&
        resetInputs[0].checked === true &&
        resetInputs[0].defaultChecked === true,
      `alpha reset state was aria=${roots[0].getAttribute("aria-checked")} checked=${resetInputs[0].checked} default=${resetInputs[0].defaultChecked}`,
    );
    assertFormData(form, { alpha: "yes", beta: "no" });

    app.unmount();
    assert(aborts === 2, "unmount did not destroy each exact Runtime instance");
    assert(
      host.querySelectorAll("[data-sw-checkbox-unchecked-input]").length === 0,
      "native Runtime unchecked input leaked after unmount",
    );
    assert(host.children.length === 0, "native Checkbox fragment leaked after unmount");

    const remount = createApp({ render: renderCheckboxes });
    remount.mount(host);
    assert(host.querySelectorAll("[data-sw-checkbox]").length === 2, "remount failed");
    remount.unmount();
    assert(aborts === 4, "remounted Runtime instances were not destroyed exactly once");
    assert(
      host.querySelectorAll("[data-sw-checkbox-unchecked-input]").length === 0,
      "remount cleanup leaked unchecked inputs",
    );
  } finally {
    if (host.firstChild) app.unmount();
    host.remove();
    form.remove();
    AbortController.prototype.abort = originalAbort;
  }
}

async function checkHydration(serverMarkup) {
  let aborts = 0;
  const originalAbort = AbortController.prototype.abort;
  AbortController.prototype.abort = function (...args) {
    aborts += 1;
    return originalAbort.apply(this, args);
  };
  const props = {
    "aria-label": "Hydrated checkbox",
    defaultChecked: false,
    id: "hydrated-checkbox",
    name: "hydrated",
    nativeButton: true,
    uncheckedValue: "no",
    value: "yes",
  };
  const root = () =>
    h(CheckboxRoot, props, { default: () => h(CheckboxIndicator, null, { default: () => "✓" }) });
  const host = appendHost();
  host.innerHTML = serverMarkup;
  const warnings = [];
  const app = createSSRApp({ render: root });
  app.config.warnHandler = (message) => warnings.push(message);
  try {
    app.mount(host);
    await nextTick();
    assert(warnings.length === 0, `hydration warned: ${warnings.join(" | ")}`);
    assert(host.querySelectorAll("#hydrated-checkbox").length === 1, "hydration duplicated input");
    assert(host.querySelectorAll("[data-sw-checkbox]").length === 1, "hydration duplicated root");
    assert(
      host.querySelectorAll("[data-sw-checkbox-unchecked-input]").length === 1,
      "hydrated Runtime did not initialize exactly one unchecked input",
    );

    app.unmount();
    assert(aborts === 1, "hydrated Runtime instance was not destroyed exactly once");
    assert(
      host.querySelectorAll("[data-sw-checkbox-unchecked-input]").length === 0,
      "hydrated native unchecked input leaked",
    );
  } finally {
    if (host.firstChild) app.unmount();
    host.remove();
    AbortController.prototype.abort = originalAbort;
  }
}

function appendHost() {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

function assertFormData(form, expected) {
  const actual = Object.fromEntries(new FormData(form));
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `unexpected form data: ${JSON.stringify(actual)}`,
  );
}

function assertSequence(actual, expected, label) {
  assert(
    JSON.stringify(actual) === JSON.stringify(expected),
    `${label} event order was ${actual.join(",")}`,
  );
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
