import { reactSelectionRootProjection } from "../../framework-adapters/react/recipe-selection-root.js";
import { svelteSelectionRootProjection } from "../../framework-adapters/svelte/recipe-selection-root.js";
import { vueSelectionRootProjection } from "../../framework-adapters/vue/recipe-selection-root.js";
import { emitConnectionType, emitLifecycle, modelHelpers } from "./emit.js";
import { type FrameworkOperations, modelOperations, type Target } from "./operations.js";
import type { ConnectionRecipe } from "./plan.js";

export type RootFrame = {
  component: string;
  factory: string;
  importSource: string;
  element: "div";
  props: readonly { name: string; type: string; defaultValue?: string }[];
  modelAliases: Record<Target, string>;
  /** Targets whose public Root render consumes accepted state. */
  modelRendering: readonly Target[];
  attributes: readonly (
    | { name: string; source: "marker" }
    | { name: string; source: "constant"; value: string }
    | { name: string; source: "initial-model" }
    | { name: string; source: "input"; prop: string; stringify: boolean }
  )[];
};
const upper = (value: string) => value[0]!.toUpperCase() + value.slice(1);

export interface SelectionRootFrameInput {
  frame: RootFrame;
  plan: ConnectionRecipe;
  fw: FrameworkOperations;
  name: string;
  publicName: string;
  code: string;
  controller: string;
  accepted: string;
  renderedName: string;
  callbackType: string;
  fields: string;
  destructure: string;
  attributes: string;
  callback: string;
  defaults: string;
  imports: string;
  initialBody: string;
  serializeDefault: string;
  helpers: string;
  before: string;
}
export interface SelectionRootProjection {
  readProp(name: string): string;
  callbackType(plan: ConnectionRecipe): string;
  destructureProp(name: string, defaultValue: string | undefined, model: boolean): string;
  marker(name: string): string;
  attribute(name: string, value: string): string;
  print(input: SelectionRootFrameInput): string;
}
const projections: Record<Target, SelectionRootProjection> = {
  react: reactSelectionRootProjection,
  vue: vueSelectionRootProjection,
  svelte: svelteSelectionRootProjection,
};

/** Shared selection model/attribute policy; target projections own component syntax and scheduling. */
export function printRootFrame(target: Target, frame: RootFrame, plan: ConnectionRecipe): string {
  if (plan.model.codec !== "selection")
    throw new TypeError("The plain Root frame proof supports selection models.");
  const projection = projections[target];
  const name = plan.model.name;
  const publicName = frame.modelAliases[target];
  const alias = (prop: string) => (prop === name ? publicName : prop);
  const model = modelOperations(target, name, publicName);
  const fw: FrameworkOperations = frame.modelRendering.includes(target)
    ? model
    : { ...model, acceptedCell: () => "", renderAccepted: () => "" };
  const code = emitLifecycle(plan, fw);
  const controller = fw.controllerCell(emitConnectionType(plan), "copyModel(initialValue)");
  const accepted = fw.acceptedCell(name, plan.model.type, "copyModel(initialValue)");
  const renderedName = `rendered${upper(name)}`;
  const callbackType = projection.callbackType(plan);
  const fields = frame.props.map((prop) => `${alias(prop.name)}?: ${prop.type};`).join("\n");
  const destructure = frame.props
    .map((prop) =>
      projection.destructureProp(alias(prop.name), prop.defaultValue, prop.name === name),
    )
    .join(", ");
  const attributes = frame.attributes
    .map((attr) => {
      if (attr.source === "marker") return projection.marker(attr.name);
      if (attr.source === "constant") return `${attr.name}=${JSON.stringify(attr.value)}`;
      let value =
        attr.source === "initial-model"
          ? "defaultValueAttribute"
          : projection.readProp(alias(attr.prop));
      if (attr.source === "input" && attr.stringify) value = `String(${value})`;
      return projection.attribute(attr.name, value);
    })
    .join("\n");
  const callback = plan.proposal.callback;
  const defaults = frame.props
    .map((prop) => `${alias(prop.name)}: ${prop.defaultValue ?? "undefined"}`)
    .join(", ");
  const imports = `import { ${frame.factory}, type ${plan.model.type}, type ${plan.proposal.details} } from "${frame.importSource}";`;
  const initialRead = (prop: string) => projection.readProp(alias(prop));
  const initialBody = `const initialModel = copyModel(${initialRead(name)});
const initialDefault = copyModel(${initialRead(plan.model.default)});
const initialValue = initialModel !== undefined ? initialModel : initialDefault !== undefined ? initialDefault : ${JSON.stringify(plan.model.fallback)};`;
  const serializeDefault = `const defaultValueAttribute = Array.isArray(initialValue) ? JSON.stringify(initialValue) : initialValue;`;
  const helpers = modelHelpers(plan);
  const before = ``;

  return projection.print({
    frame,
    plan,
    fw,
    name,
    publicName,
    code,
    controller,
    accepted,
    renderedName,
    callbackType,
    fields,
    destructure,
    attributes,
    callback,
    defaults,
    imports,
    initialBody,
    serializeDefault,
    helpers,
    before,
  });
}
