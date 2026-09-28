// This function is serialized into a fresh page before the fixture loads.
export function installObserver() {
  const data = {
    events: [],
    entries: [],
    actions: [],
    mutations: [],
    lifecycle: [],
    support: {},
    drains: [],
    observerErrors: [],
    droppedEntrySignals: [],
    mount: null,
  };
  const identities = new WeakMap();
  const nativeEvents = [];
  let nextIdentity = 0;
  let active = null;
  const observers = [];
  const identify = (element) => {
    if (!element) return null;
    if (!identities.has(element)) identities.set(element, ++nextIdentity);
    return identities.get(element);
  };
  const describe = (element) =>
    element instanceof Element
      ? {
          id: element.id,
          item: element.getAttribute("data-item"),
          bench: element.getAttribute("data-bench"),
          tag: element.tagName,
          role: element.getAttribute("role"),
        }
      : null;
  const accept = (entries, origin, options) => {
    if (options && "droppedEntriesCount" in options)
      data.droppedEntrySignals.push({
        origin,
        count: options.droppedEntriesCount,
        receivedAt: performance.now(),
      });
    for (const entry of entries)
      data.entries.push({
        ...entry.toJSON(),
        targetId: identify(entry.target),
        target: describe(entry.target),
        origin,
        receivedAt: performance.now(),
      });
  };
  for (const type of ["event", "first-input"]) {
    data.support[type] = PerformanceObserver.supportedEntryTypes.includes(type);
    if (!data.support[type]) continue;
    try {
      const observer = new PerformanceObserver((list, _, options) =>
        accept(list.getEntries(), type, options),
      );
      observer.observe(
        type === "event"
          ? { type, buffered: true, durationThreshold: 16 }
          : { type, buffered: true },
      );
      observers.push({ observer, type });
    } catch (error) {
      data.support[type] = false;
      data.observerErrors.push(String(error));
    }
  }
  // Callback options do not prove the count for entries below the reporting threshold.
  // Until the pinned browser exposes a reconciled, explicit zero-loss signal, missing entries stay unavailable.
  data.explicitZeroLossSignal = null;
  const matchesEndpoint = (endpoint) => {
    const trigger = document.querySelector('[data-bench="trigger"]');
    const popup = document.querySelector('[data-bench="popup"]');
    const expanded = trigger?.getAttribute("aria-expanded");
    const output = document.querySelector("output");
    const expectedValue = active?.expectedValue;
    const activeElement = document.activeElement;
    const activeDescendant = activeElement?.getAttribute("aria-activedescendant");
    const activeCandidate =
      activeElement?.getAttribute("role") === "option"
        ? activeElement
        : activeDescendant
          ? document.getElementById(activeDescendant)
          : null;
    const activeOption =
      activeCandidate?.getAttribute("role") === "option" ? activeCandidate : null;
    if (endpoint === "open")
      return (
        expanded === "true" &&
        popup?.isConnected &&
        !popup.hidden &&
        (popup.contains(document.activeElement) ||
          (window.__fixture?.openFocus === "trigger-or-popup" &&
            document.activeElement === trigger))
      );
    if (endpoint === "submenu-open") {
      const childTrigger = document.querySelector('[data-bench="submenu-trigger"]');
      const childPopup = document.querySelector('[data-bench="child-popup"]');
      return (
        childTrigger?.getAttribute("aria-expanded") === "true" &&
        childTrigger.getAttribute("aria-controls") === childPopup?.id &&
        childPopup?.isConnected &&
        !childPopup.hidden &&
        childPopup.getAttribute("role") === "menu"
      );
    }
    if (endpoint === "submenu-choose")
      return expanded === "false" && output?.getAttribute("data-invoked") === '["child-4"]';
    if (endpoint === "choose")
      return (
        expanded === "false" &&
        document.querySelector("output")?.getAttribute("data-invoked") === '["action-8"]'
      );
    if (endpoint === "escape") return expanded === "false" && document.activeElement === trigger;
    if (endpoint === "form-open")
      return expanded === "true" && popup?.isConnected && !popup.hidden && Boolean(activeOption);
    if (endpoint === "active-option") {
      const activeValue = activeOption?.getAttribute("data-item");
      return Boolean(activeValue) && activeValue !== active?.previousActiveValue;
    }
    if (endpoint === "input-value")
      return (
        trigger?.value === active?.expectedInput &&
        output?.getAttribute("data-input-value") === active?.expectedInput
      );
    if (endpoint === "form-choose")
      return expanded === "false" && output?.getAttribute("data-selected-value") === expectedValue;
    if (endpoint === "form-submit")
      return output?.getAttribute("data-submitted-value") === expectedValue;
    return false;
  };
  const readyState = () => {
    const fixture = window.__fixture;
    if (!fixture) return { ready: false, reason: "Host effect pending" };
    const triggers = [
      ...document.querySelectorAll('[data-bench="trigger"],[data-bench="control-trigger"]'),
    ];
    const isPage = fixture.scenario.startsWith("select-page-");
    const expectedPortals = fixture.scenario === "submenu-8x8" ? 2 : fixture.controlCount;
    const frameworkPortals = [
      ...document.querySelectorAll('[data-sw-portal-placement="framework"]'),
    ];
    const positioners = [...document.querySelectorAll("[data-bench-portal]")];
    const portalsSettled =
      fixture.provider === "starwind"
        ? frameworkPortals.length === expectedPortals &&
          frameworkPortals.every(
            (node) =>
              node.parentElement === document.body &&
              node.getAttribute("data-placement") === "ready",
          )
        : fixture.provider === "ark-ui"
          ? positioners.length === expectedPortals &&
            positioners.every(
              (node) => node.isConnected && !document.getElementById("root").contains(node),
            )
          : positioners.length === 0;
    const initialized =
      triggers.length === fixture.controlCount &&
      triggers.every(
        (node) =>
          node.isConnected &&
          node.getAttribute("aria-expanded") === "false" &&
          (node.getAttribute("aria-haspopup") || node.getAttribute("role") === "combobox"),
      );
    const labelsReady = !isPage || triggers.every((node) => node.textContent.trim() === "Option 1");
    const formCount = document.querySelectorAll(
      '[data-bench="form"],[data-bench="control-form"]',
    ).length;
    return {
      ready:
        initialized &&
        labelsReady &&
        portalsSettled &&
        (!isPage || formCount === fixture.controlCount),
      triggerCount: triggers.length,
      expectedTriggers: fixture.controlCount,
      initialized: Boolean(initialized),
      labelsReady,
      portalsSettled,
      frameworkPortals: frameworkPortals.length,
      positioners: positioners.length,
      expectedPortals,
      formCount,
    };
  };
  const checkMount = () => {
    if (!data.mount || data.mount.completedAt != null) return;
    const started = performance.now();
    const state = readyState();
    data.mount.checkCount++;
    data.mount.lastCheck = state;
    data.mount.checkingOverheadMs += performance.now() - started;
    if (state.ready) {
      data.mount.completedAt = performance.now();
      data.mount.durationMs = data.mount.completedAt - data.mount.startedAt;
      data.mount.condition =
        "Expected connected initialized triggers; ordinary closed presence; every framework portal ready in body (Ark positioners outside root; Base absent portals)";
    }
  };
  const checkEndpoint = () => {
    if (!active || active.domCompletion || !active.firstEventAt || !active.endpoint) return;
    const started = performance.now();
    if (matchesEndpoint(active.endpoint))
      active.domCompletion = {
        observedAt: performance.now(),
        inputToObservedDOMMs: performance.now() - active.firstEventAt,
        condition: active.endpoint,
        includesObserverAndValidationOverhead: true,
        presentedPixels: false,
      };
    active.validationOverheadMs += performance.now() - started;
  };
  for (const name of [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "click",
    "keydown",
    "keypress",
    "keyup",
    "beforeinput",
    "input",
    "pointermove",
    "mousemove",
    "focusin",
  ]) {
    document.addEventListener(
      name,
      (event) => {
        const record = {
          name,
          timeStamp: event.timeStamp,
          receivedAt: performance.now(),
          targetId: identify(event.target),
          target: describe(event.target),
          key: event.key ?? null,
          button: event.button ?? null,
          data: event.data ?? null,
          x: event.clientX ?? null,
          y: event.clientY ?? null,
          trusted: event.isTrusted,
          actionUid: active?.uid ?? null,
          defaultPrevented: null,
        };
        data.events.push(record);
        nativeEvents.push({ event, record });
        if (
          active &&
          active.firstEventAt == null &&
          (name === "pointerdown" ||
            name === "keydown" ||
            (active.kind === "pointer" && name === "pointermove"))
        )
          active.firstEventAt = event.timeStamp;
        queueMicrotask(checkEndpoint);
      },
      { capture: true, passive: true },
    );
  }
  const mutationObserver = new MutationObserver((records) => {
    const started = performance.now();
    data.mutations.push({
      observedAt: started,
      actionUid: active?.uid ?? null,
      changes: records.map((record) => ({
        type: record.type,
        attribute: record.attributeName,
        targetId: identify(record.target),
        target: describe(record.target),
        value:
          record.type === "attributes" ? record.target.getAttribute(record.attributeName) : null,
      })),
    });
    checkMount();
    checkEndpoint();
    if (active) active.observerOverheadMs += performance.now() - started;
  });
  mutationObserver.observe(document, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "data-placement",
      "aria-haspopup",
      "aria-controls",
      "role",
      "id",
      "aria-expanded",
      "aria-activedescendant",
      "aria-disabled",
      "data-highlighted",
      "data-state",
      "hidden",
      "data-invoked",
      "data-selected-value",
      "data-input-value",
      "data-submitted-value",
    ],
  });
  const boundary = (reason) => {
    const state = {
      reason,
      timeStamp: performance.now(),
      visible: document.visibilityState === "visible",
      focused: document.hasFocus(),
      actionUid: active?.uid ?? null,
    };
    data.lifecycle.push(state);
    return state;
  };
  document.addEventListener("visibilitychange", () => boundary("visibilitychange"));
  window.addEventListener("blur", () => boundary("blur"));
  window.__bench = {
    data,
    arm(action) {
      active = {
        ...action,
        endpointFocusPolicy: window.__fixture?.openFocus ?? null,
        armedAt: performance.now(),
        firstEventAt: null,
        validationOverheadMs: 0,
        observerOverheadMs: 0,
        domCompletion: null,
      };
      data.actions.push(active);
      return active.armedAt;
    },
    clear() {
      active = null;
    },
    boundary,
    readyState,
    renderStarted() {
      if (data.mount) throw new Error("Mount can only start once in a context.");
      data.mount = {
        metric: "render-to-ready-DOM",
        startedAt: performance.now(),
        checkCount: 0,
        checkingOverheadMs: 0,
        includesObserverAndCheckingOverhead: true,
        excludesModuleLoading: true,
        presentedPixels: false,
        flowPhase: null,
      };
    },
    ready: checkMount,
    async drain() {
      const startedAt = performance.now();
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await new Promise((resolve) => {
        const channel = new MessageChannel();
        channel.port1.onmessage = () => {
          channel.port1.close();
          channel.port2.close();
          resolve();
        };
        channel.port2.postMessage(null);
      });
      for (const { observer, type } of observers) accept(observer.takeRecords(), type);
      for (const { event, record } of nativeEvents)
        record.defaultPrevented = event.defaultPrevented;
      data.drains.push({
        startedAt,
        completedAt: performance.now(),
        purpose: "Observation barrier; no presented-pixel guarantee",
      });
      return data;
    },
  };
}
