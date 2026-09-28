import type { FrameworkOperations } from "./operations.js";
import type { ConnectionRecipe, ConnectOperation } from "./plan.js";

/** Topological ordering is generation-only and rejects missing/cyclic dependencies. */
export function order(plan: ConnectionRecipe): ConnectOperation[] {
  const pending = [...plan.connect];
  const result: ConnectOperation[] = [];
  while (pending.length) {
    const index = pending.findIndex((step) =>
      step.after.every((dependency) => result.includes(dependency)),
    );
    if (index < 0) throw new Error("Unsatisfied connection ordering");
    const [step] = pending.splice(index, 1);
    if (!step || result.includes(step.operation)) throw new Error("Duplicate connection operation");
    result.push(step.operation);
  }
  return result;
}
export function emitLifecycle(plan: ConnectionRecipe, fw: FrameworkOperations): string {
  const { model } = plan;
  const input = fw.readInput(model.name);
  const selection = model.codec === "selection";
  const copy = (value: string) => (selection ? `copyModel(${value})` : value);
  const seed =
    plan.construction === "closed"
      ? "false"
      : plan.construction === "accepted-seed"
        ? copy("desired")
        : "recreating ? false : desired";
  const getter = `owned.${model.getter}()`;
  const render = (value: string) => fw.renderAccepted(model.name, copy(value));
  const publish = (value: string) =>
    `${render(value)}\n${fw.publishModel(model.name, copy(value), selection)}`;
  const accepted = `if (connection.instance !== owned) return;
    connection.accepted = ${copy(`detail.${model.name}`)};${plan.retainAcceptedTrigger ? `\n    if (detail.${model.name} && detail.trigger instanceof HTMLElement) connection.trigger = detail.trigger;` : ""}
    ${fw.untracked(publish(`detail.${model.name}`))}`;
  const steps: Record<ConnectOperation, string> = {
    "retire-previous": `disconnectRuntime();\nconst desired = ${selection ? `${input} !== undefined ? ${copy(input)} : ${copy("connection.accepted")}` : `${input} ?? connection.accepted`};${plan.construction === "initial-seed-then-closed" ? "\nconst recreating = connection.initialized;" : ""}`,
    "create-controller": `const owned = create${plan.component}(root, {
      ${model.default}: ${seed},
      ...(${fw.controlled(model.name)} ? { ${model.name}: ${seed} } : {}),
      ${[...plan.constructorInputs, ...(plan.initialInputs ?? [])].map((name) => `${name}: ${fw.readInput(name)},`).join("\n")}
      ${plan.proposal.callback}: ${plan.proposal.arguments === "details" ? "detail" : "(next, detail)"} => { ${fw.untracked(fw.proposal(plan.proposal.callback, plan.proposal.arguments === "details" ? copy(`detail.${model.name}`) : "next", "detail", plan.proposal.arguments))} },${plan.completion ? `\n      ${plan.completion.callback}: detail => { ${fw.untracked(fw.completion(plan.completion.callback, "detail"))} },` : ""}
    });
    connection.instance = owned;
    connection.initialized = true;`,
    "subscribe-accepted": `connection.unsubscribe = owned.subscribe("${model.event}", detail => {
      ${plan.publication === "microtask" ? `queueMicrotask(() => { ${accepted} });` : accepted}
    });`,
    "restore-state":
      plan.restoration === "open-on-reconnect"
        ? `if (recreating && desired) owned.${model.setter}(desired, { emit: false });`
        : `if (${selection ? `!isModelEqual(${getter}, desired)` : `${getter} !== desired`}) owned.${model.setter}(${copy("desired")}, { emit: false${plan.retainAcceptedTrigger ? ", trigger: connection.trigger" : ""} });`,
    "render-accepted": `connection.accepted = ${copy(getter)};\n${render("connection.accepted")}`,
    "publish-connected-model":
      fw.modelAuthority === "runtime-binding"
        ? fw.untracked(fw.publishModel(model.name, copy("connection.accepted"), selection))
        : "",
  };
  const cleanup = {
    "retain-state": `connection.accepted = ${copy(getter)};`,
    unsubscribe: "connection.unsubscribe?.();\nconnection.unsubscribe = undefined;",
    "clear-owner": "connection.instance = undefined;",
    destroy: "owned.destroy();",
  };
  return `
  function disconnectRuntime(): void {
    const owned = connection.instance;
    if (!owned) return;
    ${plan.cleanup.map((step) => cleanup[step]).join("\n")}
  }
  function connectRuntime(root: HTMLDivElement): void {
    ${order(plan)
      .map((step) => steps[step])
      .filter(Boolean)
      .join("\n")}
  }
  function applyParentCommand(): void {
    const next = ${input};
    const owned = connection.instance;
    if (next === undefined || !owned) return;
    if (${selection ? `!isModelEqual(${getter}, next)` : `${getter} !== next`}) owned.${model.setter}(${copy("next")}, { emit: false });
    connection.accepted = ${copy(getter)};
    ${render("connection.accepted")}
    ${fw.modelAuthority === "runtime-binding" ? fw.untracked(fw.publishModel(model.name, copy("connection.accepted"), selection)) : ""}
  }
  `;
}
export const connectionType = `{
  instance?: ReturnType<typeof createPopover>;
  unsubscribe?: () => void;
  accepted: boolean;
  initialized: boolean;
}`;

export function modelHelpers(plan: ConnectionRecipe): string {
  if (plan.model.codec === "boolean") return "";
  return `function copyModel(value: ${plan.model.type}): ${plan.model.type};
function copyModel(value: ${plan.model.type} | undefined): ${plan.model.type} | undefined;
function copyModel(value: ${plan.model.type} | undefined): ${plan.model.type} | undefined { return Array.isArray(value) ? [...value] : value; }
function isModelEqual(left: ${plan.model.type} | undefined, right: ${plan.model.type} | undefined): boolean {
  return Array.isArray(left) && Array.isArray(right)
    ? left.length === right.length && left.every((entry, index) => entry === right[index])
    : left === right;
}`;
}
export function emitConnectionType(plan: ConnectionRecipe): string {
  return `{ instance?: ReturnType<typeof create${plan.component}>; unsubscribe?: () => void; accepted: ${plan.model.type}; initialized: boolean;${plan.retainAcceptedTrigger ? " trigger?: HTMLElement;" : ""} }`;
}
