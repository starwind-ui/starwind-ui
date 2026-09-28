import { reactNativeRootProjection } from "../../framework-adapters/react/native-recipe-root.js";
import { svelteNativeRootProjection } from "../../framework-adapters/svelte/native-recipe-root.js";
import { vueNativeRootProjection } from "../../framework-adapters/vue/native-recipe-root.js";
import { emitConnectionType, emitLifecycle } from "./emit.js";
import type { NativeRecipe, nativeContracts } from "./native.js";
import type { NativeRootProjection } from "./native-frame-types.js";
import { operations, type Target } from "./operations.js";

type Contract = (typeof nativeContracts)[keyof typeof nativeContracts];
const projections: Record<Target, NativeRootProjection> = {
  react: reactNativeRootProjection,
  vue: vueNativeRootProjection,
  svelte: svelteNativeRootProjection,
};

/** Shared native policy composition. Framework source operations live with their target printers. */
export function printNativeFrame(target: Target, contract: Contract, plan: NativeRecipe): string {
  const fw = operations[target];
  const projection = projections[target];
  const component = plan.component;
  const portal = plan.surface.portal;
  const root = contract.parts.find((part) => part.name === "root")!.discoveryAttribute;
  const popup = contract.parts.find(
    (part) => part.name === plan.surface.requiredPart,
  )!.discoveryAttribute;
  const props = contract.props.filter((prop) =>
    ["defaultOpen", "open", ...plan.constructorInputs].includes(prop.name),
  );
  const fields = props.map((prop) => `${prop.name}?: ${prop.type};`).join("\n");
  const destructure = projection.destructure(props);
  const callbacks = `onOpenChange?: (open: boolean, detail: ${plan.proposal.details}) => void;\nonCloseComplete?: (detail: ${plan.completion!.details}) => void;`;
  const imports = `import { create${component}, type ${plan.proposal.details}, type ${plan.completion!.details}${projection.runtimeImports(component, portal)} } from "${contract.runtime.importSource}";`;
  const initial = `const initialDefaultOpen = ${projection.initialCell(`${projection.readProp(plan.model.default)} ?? ${JSON.stringify(plan.model.fallback)}`)};\nconst initialOpen = ${projection.initialCell(`${projection.readProp(plan.model.name)} ?? initialDefaultOpen`)};`;
  const controller = fw.controllerCell(
    emitConnectionType(plan).replace(
      "initialized: boolean;",
      "initialized: boolean; refreshPending?: boolean;",
    ),
    "initialOpen",
  );
  const accepted = fw.acceptedCell("open", "boolean", "initialOpen");
  const lifecycle = emitLifecycle(plan, fw);
  const refresh = `function refreshControls(): void {
    const owned = connection.instance;
    if (!owned || connection.refreshPending) return;
    connection.refreshPending = true;
    queueMicrotask(() => {
      connection.refreshPending = false;
      if (connection.instance === owned) owned.${plan.controlRefresh.method}();
    });
  }`;
  if (plan.controlRefresh.schedule !== "microtask")
    throw new TypeError("Unsupported control refresh schedule");
  const attributes =
    `${projection.attribute(root)}\ndata-sw-part="root"\n` +
    [
      ["data-default-open", `initialDefaultOpen ? 'true' : undefined`],
      ...plan.constructorInputs.map((name) => [
        `data-${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`,
        `String(${projection.readProp(name)})`,
      ]),
      ["data-state", `renderedOpen ? 'open' : 'closed'`],
    ]
      .map(([name, value]) => projection.attribute(name!, value))
      .join("\n");
  const surfaceConnection = plan.surface.connection
    .map((step) => projection.surfaceOperations[step])
    .filter(Boolean)
    .join("\n");
  return projection.printRoot({
    surfaceConnection,
    component,
    plan,
    portal,
    popup,
    props,
    fields,
    destructure,
    callbacks,
    imports,
    initial,
    accepted,
    controller,
    refresh,
    lifecycle,
    attributes,
    modelObserver: fw.observeModel("open", "reconnectRuntime"),
  });
}
