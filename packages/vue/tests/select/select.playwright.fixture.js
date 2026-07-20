import { createApp, createSSRApp, h, nextTick, ref } from "vue";

import {
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectList,
  SelectPopup,
  SelectPortal,
  SelectPositioner,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "/vue/select/index.js";

export async function runSelectBrowserChecks(serverMarkup) {
  await checkBuiltModelsCollectionsFormsAndPortal();
  await checkHydration(serverMarkup);
}

async function checkBuiltModelsCollectionsFormsAndPortal() {
  const overlays = document.createElement("div");
  overlays.id = "built-overlays";
  document.body.append(overlays);
  const form = document.createElement("form");
  form.id = "built-form";
  document.body.append(form);
  const host = appendHost();
  const items = ref([
    { label: "Apple", value: "apple" },
    { label: "Banana", value: "banana" },
  ]);
  const events = [];
  const app = createApp({
    render: () =>
      renderSelect(
        {
          class: "built-select",
          defaultValue: "apple",
          form: "built-form",
          name: "fruit",
          onOpenChange: () => events.push("open-detail"),
          onValueChange: () => events.push("value-detail"),
          "onUpdate:modelValue": () => events.push("value-update"),
          "onUpdate:open": () => events.push("open-update"),
        },
        items.value,
        "#built-overlays",
      ),
  });

  try {
    app.mount(host);
    await nextTick();
    const root = host.querySelector("[data-sw-select]");
    const trigger = host.querySelector("[data-sw-select-trigger]");
    assert(root?.className === "built-select", "built attrs did not reach Select.Root");
    assert(
      overlays.querySelectorAll(":scope > [data-sw-select-portal]").length === 1,
      "built Teleport did not reach the requested container",
    );

    trigger.click();
    await frame();
    assertSequence(events, ["open-detail", "open-update"], "built open model");

    items.value.push({ label: "Cherry", value: "cherry" });
    await frame();
    const cherry = overlays.querySelector('[data-sw-select-item][data-value="cherry"]');
    assert(cherry, "built dynamic collection did not add Cherry");
    cherry.click();
    await frame();
    assert(root.getAttribute("data-value") === "cherry", "built value model did not accept Cherry");
    assert(
      Object.fromEntries(new FormData(form)).fruit === "cherry",
      "built hidden form input did not synchronize",
    );

    form.reset();
    await new Promise((resolve) => window.setTimeout(resolve, 10));
    await nextTick();
    assert(root.getAttribute("data-value") === "apple", "built form reset did not restore default");
  } finally {
    app.unmount();
    assert(overlays.children.length === 0, "built Select portal leaked after unmount");
    host.remove();
    form.remove();
    overlays.remove();
  }
}

async function checkHydration(serverMarkup) {
  const overlays = document.createElement("div");
  overlays.id = "built-hydration-overlays";
  document.body.append(overlays);
  const host = appendHost();
  host.innerHTML = serverMarkup;
  const warnings = [];
  const root = () =>
    renderSelect(
      { defaultValue: "apple", name: "hydrated-fruit" },
      [{ label: "Apple", value: "apple" }],
      "#built-hydration-overlays",
    );
  const app = createSSRApp({ render: root });
  app.config.warnHandler = (message) => warnings.push(message);

  try {
    app.mount(host);
    await nextTick();
    assert(warnings.length === 0, `built hydration warned: ${warnings.join(" | ")}`);
    assert(host.querySelectorAll("[data-sw-select]").length === 1, "hydration duplicated root");
    assert(
      overlays.querySelectorAll("[data-sw-select-portal]").length === 1,
      "hydration did not activate Teleport",
    );
  } finally {
    app.unmount();
    assert(overlays.children.length === 0, "hydrated built portal leaked after unmount");
    host.remove();
    overlays.remove();
  }
}

function renderSelect(rootProps, items, container) {
  return h(SelectRoot, rootProps, {
    default: () => [
      h(SelectTrigger, null, { default: () => h(SelectValue, { placeholder: "Pick fruit" }) }),
      h(
        SelectPortal,
        { container },
        {
          default: () =>
            h(
              SelectPositioner,
              { alignItemWithTrigger: false },
              {
                default: () =>
                  h(SelectPopup, null, {
                    default: () =>
                      h(SelectList, null, {
                        default: () =>
                          items.map((item) =>
                            h(
                              SelectItem,
                              { key: item.value, value: item.value },
                              {
                                default: () => [
                                  h(SelectItemText, null, { default: () => item.label }),
                                  h(SelectItemIndicator, null, { default: () => "✓" }),
                                ],
                              },
                            ),
                          ),
                      }),
                  }),
              },
            ),
        },
      ),
    ],
  });
}

function appendHost() {
  const host = document.createElement("div");
  document.body.append(host);
  return host;
}

async function frame() {
  await nextTick();
  await new Promise((resolve) => requestAnimationFrame(resolve));
  await nextTick();
}

function assertSequence(actual, expected, label) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label}: ${actual.join(",")}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
