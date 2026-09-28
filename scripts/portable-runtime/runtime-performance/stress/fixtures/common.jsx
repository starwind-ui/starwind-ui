import React from "react";
import { createRoot } from "react-dom/client";
import { radioEndpointReady } from "./radio-endpoint.mjs";

export const thousand = Array.from({ length: 1000 }, (_, index) => ({
  value: `item-${index + 1}`,
  label: `Item ${String(index + 1).padStart(4, "0")}`,
}));
export const links = Array.from({ length: 500 }, (_, index) => `Link ${index + 1}`);
export const workload = new URL(location.href).searchParams.get("workload");
export const visible = (node) => {
  if (!node?.isConnected || !node.getClientRects().length) return false;
  for (let parent = node; parent instanceof Element; parent = parent.parentElement) {
    if (parent.hidden || parent.inert) return false;
    const style = getComputedStyle(parent);
    if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0")
      return false;
  }
  return true;
};
const selected = (node) =>
  Boolean(
    node &&
    (node.getAttribute("aria-selected") === "true" ||
      node.getAttribute("aria-checked") === "true" ||
      node.getAttribute("aria-expanded") === "true" ||
      ["open", "checked", "active"].includes(node.getAttribute("data-state")) ||
      node.querySelector(
        '[aria-checked="true"], [aria-expanded="true"], [data-state="checked"], [data-state="open"]',
      ) ||
      node.querySelector('input[type="radio"]')?.checked),
  );

export function LinkList({ group }) {
  return (
    <ul>
      {links.map((text, index) => (
        <li key={index}>
          <a href={`#${group}-${index}`}>{text}</a>
        </li>
      ))}
    </ul>
  );
}

export function snapshot() {
  const all = (selector) => [...document.querySelectorAll(selector)];
  const target = document.querySelector('[data-stress-target="true"]');
  const primary = document.querySelector('[data-stress-primary="true"]');
  const targetPanel = document.querySelector('[data-stress-panel="target"]');
  const primaryPanel = document.querySelector('[data-stress-panel="primary"]');
  const form = document.querySelector("[data-stress-form]");
  return {
    outsideCount: all("[data-stress-outside]").length,
    triggerCount: all("[data-stress-trigger]").length,
    panelCount: all("[data-stress-panel]").length,
    itemCount: all("[data-stress-item]").length,
    primaryLinks: primaryPanel?.querySelectorAll("a").length ?? 0,
    targetLinks: targetPanel?.querySelectorAll("a").length ?? 0,
    targetVisible: visible(targetPanel),
    primaryVisible: visible(primaryPanel),
    targetSelected: selected(target),
    primarySelected: selected(primary),
    selectedCount: all("[data-stress-item]").filter(selected).length,
    selectedTabCount: all('[data-stress-trigger][aria-selected="true"]').length,
    checkedInputCount: all('[data-stress-form] input[type="radio"]:checked').length,
    checkedValue: form?.querySelector('input[type="radio"]:checked')?.value ?? null,
    submittedValue: form ? new FormData(form).get("choice") : null,
    contentVisible: visible(document.querySelector('[data-stress-dialog="true"]')),
    focusInside: Boolean(
      document.querySelector('[data-stress-dialog="true"]')?.contains(document.activeElement),
    ),
  };
}

function quickEndpoint(name) {
  const target = document.querySelector('[data-stress-target="true"]');
  const primary = document.querySelector('[data-stress-primary="true"]');
  const targetPanel = document.querySelector('[data-stress-panel="target"]');
  const primaryPanel = document.querySelector('[data-stress-panel="primary"]');
  const targetSelected = selected(target);
  if (name === "dialog") {
    const content = document.querySelector('[data-stress-dialog="true"]');
    return visible(content) && content.contains(document.activeElement);
  }
  if (name === "navigation-menu")
    return (
      targetSelected &&
      visible(targetPanel) &&
      !visible(primaryPanel) &&
      targetPanel.querySelectorAll("a").length === 500
    );
  if (name === "tabs")
    return targetSelected && !selected(primary) && visible(targetPanel) && !visible(primaryPanel);
  if (name === "accordion") return targetSelected && visible(targetPanel);
  if (name === "radio-group") {
    const form = document.querySelector("[data-stress-form]");
    return radioEndpointReady({
      targetSelected,
      primarySelected: selected(primary),
      selectedCount: [...document.querySelectorAll("[data-stress-item]")].filter(selected).length,
      checkedInputCount: form.querySelectorAll('input[type="radio"]:checked').length,
      submittedValue: new FormData(form).get("choice"),
    });
  }
  return false;
}

export function boot(provider, App) {
  const data = { provider, workload, mount: null, action: null, ready: false };
  const node = document.getElementById("root");
  const mountStart = performance.now();
  const mountObserver = new MutationObserver(() => {
    const state = snapshot();
    const ready =
      (workload === "dialog" &&
        state.triggerCount === 1 &&
        state.outsideCount === 10000 &&
        !state.contentVisible) ||
      (workload === "navigation-menu" &&
        state.triggerCount === 2 &&
        state.primaryLinks === 500 &&
        state.primaryVisible &&
        !state.targetVisible) ||
      (workload === "tabs" &&
        state.triggerCount === 1000 &&
        state.panelCount === 1000 &&
        state.primarySelected &&
        state.selectedTabCount === 1) ||
      (workload === "accordion" &&
        state.itemCount === 1000 &&
        state.panelCount === 1000 &&
        state.selectedCount === 0) ||
      (workload === "radio-group" &&
        state.itemCount === 1000 &&
        state.triggerCount === 1000 &&
        state.checkedInputCount === 1 &&
        state.submittedValue === "item-1");
    if (!ready || data.ready) return;
    data.ready = true;
    data.mount = { durationMs: performance.now() - mountStart, state };
    mountObserver.disconnect();
  });
  mountObserver.observe(document, { subtree: true, childList: true, attributes: true });
  createRoot(node).render(<App />);
  let pending = null;
  window.__stress = {
    data,
    snapshot,
    arm() {
      if (!data.ready || pending) throw new Error("Stress action cannot arm before ready DOM.");
      if (quickEndpoint(workload))
        throw new Error("Stress action endpoint was ready before input.");
      const inputType = workload === "navigation-menu" ? "pointerover" : "click";
      let resolve;
      const result = new Promise((done) => {
        resolve = done;
      });
      let start = null;
      let input = null;
      let observer;
      let timer;
      const finish = (value) => {
        document.removeEventListener(inputType, onInput, true);
        observer?.disconnect();
        clearTimeout(timer);
        data.action = value;
        pending = null;
        resolve(value);
      };
      const check = () => {
        if (start === null) return;
        if (quickEndpoint(workload)) {
          const durationMs = performance.now() - start;
          finish({
            durationMs,
            input,
            ...(inputType === "click" ? { click: input } : {}),
            state: snapshot(),
          });
        } else {
          clearTimeout(timer);
          timer = setTimeout(check, 1);
        }
      };
      const onInput = (event) => {
        const target = event.target.closest('[data-stress-target="true"]');
        if (start !== null || !target) return;
        const enteredFromOutside =
          inputType !== "pointerover" ||
          !(event.relatedTarget instanceof Node && target.contains(event.relatedTarget));
        if (!enteredFromOutside) return;
        start = performance.now();
        input = {
          type: inputType,
          trusted: event.isTrusted,
          target: target.getAttribute("data-stress-target"),
          preInputTargetSelected: selected(target),
          enteredFromOutside,
        };
        observer = new MutationObserver(check);
        observer.observe(document, {
          subtree: true,
          childList: true,
          attributes: true,
          characterData: true,
        });
        queueMicrotask(check);
      };
      document.addEventListener(inputType, onInput, true);
      pending = { result, cancel: () => finish({ error: "action timeout", input }) };
      return true;
    },
    async result() {
      if (!pending) return data.action;
      return Promise.race([
        pending.result,
        new Promise((resolve) =>
          setTimeout(() => {
            pending?.cancel();
            resolve(data.action);
          }, 5000),
        ),
      ]);
    },
  };
}
