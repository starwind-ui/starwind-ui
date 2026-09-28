// Runs after an observation barrier. Layout and complete inventories are outside input timing.
export function readPortalInventory() {
  const root = document.getElementById("root");
  const markers = [...document.querySelectorAll("[data-bench-portal]")];
  const portalRoots = new Set();
  for (const marker of markers) {
    if (root.contains(marker)) continue;
    let node = marker;
    while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
    if (node.parentElement === document.body) portalRoots.add(node);
  }
  const fixtureElements = [...root.querySelectorAll("*")];
  const portalElements = [...portalRoots].flatMap((node) => [node, ...node.querySelectorAll("*")]);
  const elements = [...new Set([...fixtureElements, ...portalElements])];
  const popups = elements.filter((node) => node.matches('[data-bench$="popup"]'));
  return {
    scope: "Fixture root and body children containing an authored portal positioner",
    popupShells: popups.length,
    orphanPopupShells: [...document.querySelectorAll('[data-bench$="popup"]')].filter(
      (node) => !elements.includes(node),
    ).length,
    renderedItems: elements.filter((node) => node.matches("[data-item]")).length,
    formNodes: elements.filter((node) => node.matches("form,input,select,textarea,button[name]"))
      .length,
    fixtureElements: fixtureElements.length,
    portalElements: portalElements.length,
    totalFixtureAndPortalElements: elements.length,
    totalBodyElements: document.body.querySelectorAll("*").length,
    portalsInsideFixture: markers.filter((node) => root.contains(node)).length,
    focusedControl: Number(document.activeElement?.getAttribute("data-control")) || null,
    controls: elements
      .filter((node) => node.matches('[data-bench="trigger"],[data-bench="control-trigger"]'))
      .map((node) => ({
        control: Number(node.getAttribute("data-control") ?? 1),
        expanded: node.getAttribute("aria-expanded"),
        id: node.id,
      })),
    popups: popups.map((node) => ({
      id: node.id,
      accessibleId:
        (node.matches('[role="listbox"]') ? node : node.querySelector('[role="listbox"]'))?.id ??
        null,
      accessibleRole:
        (node.matches('[role="listbox"]')
          ? node
          : node.querySelector('[role="listbox"]')
        )?.getAttribute("role") ?? null,
      bench: node.getAttribute("data-bench"),
      control: Number(node.getAttribute("data-control") ?? 1),
      role: node.getAttribute("role"),
      items: node.querySelectorAll("[data-item]").length,
      visible: getComputedStyle(node).display !== "none" && node.getClientRects().length > 0,
      inBodyPortal: portalElements.includes(node),
    })),
  };
}

export function validatePageInventory(snapshot, { provider, controls, phase }) {
  const open = phase === "open" || phase === "reopen";
  const failures = [];
  const baseClosed = provider === "base-ui" && !open;
  const expectedShells = provider === "base-ui" ? 1 : controls;
  const expectedItems =
    provider === "ark-ui"
      ? controls * 20
      : provider === "base-ui"
        ? snapshot.popupShells * 20
        : open
          ? 20
          : 0;
  if (
    snapshot.controls.length !== controls ||
    new Set(snapshot.controls.map((node) => node.control)).size !== controls
  )
    failures.push("wrong or duplicate controls");
  if (snapshot.controls.some((node) => node.control < 1 || node.control > controls))
    failures.push("stale or uninitialized control");
  if (
    snapshot.controls.filter((node) => node.expanded === "true").length !== Number(open) ||
    (provider === "base-ui" &&
      snapshot.controls.some(
        (node) => node.expanded === "true" && node.control !== (controls === 20 ? 10 : 1),
      ))
  )
    failures.push("unexpected expanded controls");
  if (
    (baseClosed
      ? ![0, 1].includes(snapshot.popupShells)
      : snapshot.popupShells !== expectedShells) ||
    snapshot.renderedItems !== expectedItems ||
    (provider === "base-ui" && snapshot.popups.some((node) => node.items !== 20))
  )
    failures.push("unexpected popup or item count for presence policy");
  if (
    snapshot.portalsInsideFixture ||
    snapshot.orphanPopupShells ||
    snapshot.popups.some(
      (node) => !node.inBodyPortal || (node.accessibleRole ?? node.role) !== "listbox",
    )
  )
    failures.push("unsettled or invalid popup portal");
  if (
    new Set(snapshot.popups.map((node) => node.control)).size !== snapshot.popupShells ||
    new Set(snapshot.popups.map((node) => node.accessibleId || node.id).filter(Boolean)).size !==
      snapshot.popups.filter((node) => node.accessibleId || node.id).length
  )
    failures.push("duplicate or stale popup endpoint");
  if (
    snapshot.popups.some(
      (node) =>
        node.control < 1 ||
        node.control > controls ||
        (provider === "base-ui" && node.control !== (controls === 20 ? 10 : 1)),
    )
  )
    failures.push("stale popup control identity");
  if (snapshot.popups.filter((node) => node.visible).length !== Number(open))
    failures.push("unexpected visible popup count");
  return failures;
}
