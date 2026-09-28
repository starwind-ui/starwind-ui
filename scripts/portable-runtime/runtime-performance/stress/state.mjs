const count = (value, expected) => value === expected;

export function initialStateErrors(workload, initial) {
  if (!initial) return ["initial DOM state is missing"];
  if (workload === "dialog")
    return initial.outsideCount === 10000 &&
      initial.triggerCount === 1 &&
      !initial.contentVisible &&
      !initial.focusInside
      ? []
      : ["dialog initial closed state is wrong"];
  if (workload === "navigation-menu")
    return initial.triggerCount === 2 &&
      initial.primaryLinks === 500 &&
      initial.primaryVisible &&
      !initial.targetVisible &&
      initial.primarySelected
      ? []
      : ["navigation first panel is not initially active"];
  if (workload === "tabs")
    return initial.triggerCount === 1000 &&
      initial.panelCount === 1000 &&
      initial.primarySelected &&
      !initial.targetSelected &&
      initial.selectedTabCount === 1 &&
      initial.primaryVisible &&
      !initial.targetVisible
      ? []
      : ["first tab initial state or retained panel count is wrong"];
  if (workload === "accordion")
    return initial.itemCount === 1000 &&
      initial.panelCount === 1000 &&
      !initial.targetSelected &&
      !initial.targetVisible &&
      initial.selectedCount === 0
      ? []
      : ["accordion initial closed state or retained panel count is wrong"];
  if (workload === "radio-group")
    return initial.itemCount === 1000 &&
      initial.triggerCount === 1000 &&
      initial.primarySelected &&
      !initial.targetSelected &&
      initial.selectedCount === 1 &&
      initial.checkedInputCount === 1 &&
      initial.submittedValue === "item-1"
      ? []
      : ["first radio initial form state or item count is wrong"];
  return [`unknown stress workload: ${workload}`];
}

export function stateErrors(workload, initial, final) {
  const errors = initialStateErrors(workload, initial);
  if (!initial || !final) return ["initial or final DOM state is missing"];
  if (workload === "dialog") {
    if (!count(initial.outsideCount, 10000) || !count(final.outsideCount, 10000))
      errors.push("dialog outside-node count changed");
    if (!final.contentVisible || !final.focusInside)
      errors.push("dialog open content or focus is missing");
  } else if (workload === "navigation-menu") {
    if (final.triggerCount !== 2)
      errors.push("navigation trigger or first-panel link count is wrong");
    if (
      !final.targetVisible ||
      final.primaryVisible ||
      !final.targetSelected ||
      final.primarySelected ||
      final.targetLinks !== 500
    )
      errors.push("navigation second panel did not replace the first");
  } else if (workload === "tabs") {
    if (final.triggerCount !== 1000 || final.panelCount !== 1000)
      errors.push("tabs or retained panels are missing");
    if (
      !final.targetSelected ||
      final.primarySelected ||
      final.selectedTabCount !== 1 ||
      !final.targetVisible ||
      final.primaryVisible
    )
      errors.push("last tab did not replace the first");
  } else if (workload === "accordion") {
    if (final.itemCount !== 1000 || final.panelCount !== 1000)
      errors.push("accordion items or retained panels are missing");
    if (!final.targetSelected || !final.targetVisible)
      errors.push("last accordion item did not expand");
  } else if (workload === "radio-group") {
    if (final.itemCount !== 1000 || final.triggerCount !== 1000)
      errors.push("radio items are missing");
    if (
      !final.targetSelected ||
      final.primarySelected ||
      final.selectedCount !== 1 ||
      final.checkedInputCount !== 1 ||
      final.checkedValue !== "item-1000" ||
      final.submittedValue !== "item-1000"
    )
      errors.push("last radio or native form result is wrong");
  } else errors.push(`unknown stress workload: ${workload}`);
  return errors;
}

export function sessionErrors(session) {
  const errors = stateErrors(session.workload, session.initial, session.final);
  if (!Number.isFinite(session.mount?.durationMs) || session.mount.durationMs < 0)
    errors.push("mount duration is missing");
  if (!session.mount?.state) errors.push("mount ready-DOM state is missing");
  else errors.push(...initialStateErrors(session.workload, session.mount.state));
  if (!Number.isFinite(session.action?.durationMs) || session.action.durationMs < 0)
    errors.push("input-to-DOM duration is missing");
  const input =
    session.action?.input ?? (session.workload === "dialog" ? session.action?.click : null);
  const inputType =
    input?.type ?? (session.workload === "dialog" && session.action?.click ? "click" : null);
  const expectedType = session.workload === "navigation-menu" ? "pointerover" : "click";
  if (inputType !== expectedType || input?.trusted !== true || input?.target !== "true")
    errors.push("trusted target input is missing");
  if (session.workload === "navigation-menu" && input?.enteredFromOutside !== true)
    errors.push("navigation pointer did not enter the target from outside");
  if (
    session.workload !== "dialog" &&
    (input?.preInputTargetSelected ?? input?.preClickTargetSelected) !== false
  )
    errors.push("target was already active before input");
  if (!session.action?.state) errors.push("timed endpoint state is missing");
  else if (stateErrors(session.workload, session.initial, session.action.state).length)
    errors.push("timed endpoint state differs from the checked task result");
  if (session.pageErrors?.length) errors.push("browser page error");
  return errors;
}
