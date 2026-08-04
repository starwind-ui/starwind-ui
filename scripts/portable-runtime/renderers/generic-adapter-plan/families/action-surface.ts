import type {
  AdapterActionSurfaceFacts,
  AdapterComponentFile,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan } from "../types.js";
import {
  getAdapterFamilyProp,
  getPart,
  getPartExportName,
  getPlanProp,
  getRuntimeOptionProps,
  getSetterForProp,
  getStaticAttributeName,
  pluralizeDisplayName,
} from "./toolkit.js";

export const actionSurfaceAdapterFamilyPlan = {
  buildOutputModel: buildActionSurfaceOutputModel,
  id: "action-surface",
  matches: isActionSurfaceOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildActionSurfaceOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getActionSurfaceFacts(plan);

  return {
    files: [
      createActionSurfaceComponentFile(plan, facts),
      {
        exports: {
          kind: "namespace",
          members: [{ from: `./${facts.exports.root}`, name: facts.exports.root }],
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "action-surface" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createActionSurfaceComponentFile(
  plan: GenericAdapterPlan,
  facts: AdapterActionSurfaceFacts,
): AdapterComponentFile {
  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.Root`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${facts.exports.root}`, name: facts.exports.root }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "action-surface", part: "root" },
      imports: [],
      lifecycle: undefined,
      name: facts.exports.root,
      portals: [],
      props: [
        { kind: "boolean", name: facts.props.disabled.name, type: facts.props.disabled.type },
        {
          kind: "boolean",
          name: facts.props.focusableWhenDisabled.name,
          type: facts.props.focusableWhenDisabled.type,
        },
        { kind: "string", name: facts.props.type.name, type: facts.props.type.type },
      ],
      refs: [{ id: "rootRef", part: "root", public: true }],
      render: {
        attrs: [{ name: facts.parts.root.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: facts.parts.root.defaultElement,
        events: [],
        kind: "element",
        part: facts.parts.root.name,
        refs: [{ id: "rootRef", part: facts.parts.root.name, public: true }],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${facts.exports.root}`,
  };
}

export function isActionSurfaceOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === "root");
  const partFiles = plan.files.filter((file) => file.kind === "part");
  const indexFiles = plan.files.filter((file) => file.kind === "index");
  const requiredAttributes = [
    "type",
    "data-focusable-when-disabled",
    "data-disabled",
    "aria-disabled",
  ];
  const hasExactInitialAttributes =
    plan.staticAttributes.length === requiredAttributes.length &&
    requiredAttributes.every((name) =>
      plan.staticAttributes.some(
        (attribute) =>
          attribute.part === "root" &&
          attribute.name === name &&
          attribute.source === "prop" &&
          attribute.value === undefined,
      ),
    );
  const hasExactProps =
    hasExactNames(plan.props, ["disabled", "focusableWhenDisabled", "type"]) &&
    plan.props.every((prop) => {
      if (prop.name === "type") {
        return (
          prop.kind === "attribute" &&
          prop.type === "button | submit | reset" &&
          prop.targets?.length === 1 &&
          prop.targets[0] === "root" &&
          prop.defaultValue === undefined &&
          prop.required === undefined &&
          prop.unsupportedTargets === undefined
        );
      }
      return (
        prop.kind === "option" &&
        prop.type === "boolean" &&
        prop.defaultValue === "false" &&
        prop.required === undefined &&
        prop.targets === undefined &&
        prop.unsupportedTargets === undefined
      );
    });
  const hasExactRuntimeBridge =
    plan.runtime.destroys === true &&
    plan.runtime.rootPart === "root" &&
    typeof plan.runtime.factory === "string" &&
    typeof plan.runtime.importSource === "string" &&
    hasExactNames(
      (plan.runtime.optionProps ?? []).map((name) => ({ name })),
      ["disabled"],
    );
  const hasExactSetter =
    plan.setters.length === 1 &&
    plan.setters[0]?.method === "setDisabled" &&
    plan.setters[0]?.prop === "disabled" &&
    plan.setters[0]?.options === undefined &&
    plan.setters[0]?.props === undefined &&
    plan.setters[0]?.stateModel === undefined &&
    plan.setters[0]?.suppressesEmit === undefined;
  const hasExactRef =
    plan.refs.length === 1 && plan.refs[0]?.part === "root" && plan.refs[0]?.public === true;
  const hasExactFilesAndExports =
    plan.files.length === 2 &&
    partFiles.length === 1 &&
    partFiles[0]?.part === "root" &&
    indexFiles.length === 1 &&
    plan.exports.defaultNamespace === true &&
    plan.exports.members.length === 1 &&
    plan.exports.members[0]?.part === "root" &&
    plan.exports.members[0]?.name === partFiles[0]?.exportName;
  const hasNoUnsupportedFacts =
    plan.events.length === 0 &&
    plan.stateModels.length === 0 &&
    plan.escapeDeclarations.length === 0 &&
    plan.asChild === undefined &&
    plan.context === undefined &&
    plan.form === undefined &&
    plan.floating === undefined &&
    plan.presence === undefined;

  return (
    plan.category === "static-semantic" &&
    plan.parts.length === 1 &&
    rootPart !== undefined &&
    rootPart.ownsRuntime === true &&
    rootPart.forwardsRef === true &&
    rootPart.role === undefined &&
    rootPart.initExclusionAttributes === undefined &&
    hasExactProps &&
    hasExactRuntimeBridge &&
    hasExactSetter &&
    hasExactRef &&
    hasExactFilesAndExports &&
    hasExactInitialAttributes &&
    hasNoUnsupportedFacts
  );
}

function hasExactNames(
  values: readonly { name: string }[],
  expectedNames: readonly string[],
): boolean {
  return (
    values.length === expectedNames.length &&
    expectedNames.every((name) => values.some((value) => value.name === name))
  );
}

export function getActionSurfaceFacts(plan: GenericAdapterPlan): AdapterActionSurfaceFacts {
  if (!isActionSurfaceOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not an action-surface plan.`);
  }

  const rootPart = getPart(plan, "root");
  const rootExportName = getPartExportName(plan, "root");
  const publicRootRef = plan.refs.some((ref) => ref.part === rootPart.name && ref.public);
  if (!rootPart.forwardsRef || !publicRootRef) {
    throw new Error(
      `${plan.displayName} generic adapter plan ${rootPart.name} part must declare a public forwarded ref.`,
    );
  }

  const runtimeOptionProps = getRuntimeOptionProps(plan, ["disabled"]);
  const disabledSetter = getSetterForProp(plan, "disabled");

  return {
    attrs: {
      ariaDisabled: getStaticAttributeName(plan, rootPart, "aria-disabled"),
      disabled: "disabled",
      focusableWhenDisabled: getStaticAttributeName(plan, rootPart, "data-focusable-when-disabled"),
      root: rootPart.discoveryAttribute,
      stateDisabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
      type: getStaticAttributeName(plan, rootPart, "type"),
    },
    displayName: plan.displayName,
    exports: {
      namespace: plan.exports.namespace,
      root: rootExportName,
    },
    index: {
      importMembers: [{ from: `./${rootExportName}`, name: rootExportName }],
      namespaceMembers: [{ key: "Root", name: rootExportName }],
    },
    parts: {
      root: {
        defaultElement: rootPart.defaultElement,
        discoveryAttribute: rootPart.discoveryAttribute,
        discoveryAttributeOwnership: "protected",
        name: rootPart.name,
        namespaceKey: "Root",
      },
    },
    props: {
      disabled: getAdapterFamilyProp(getPlanProp(plan, "disabled")),
      focusableWhenDisabled: getAdapterFamilyProp(getPlanProp(plan, "focusableWhenDisabled")),
      type: getAdapterFamilyProp(getPlanProp(plan, "type")),
    },
    runtime: {
      conditionalInit: {
        attribute: getStaticAttributeName(plan, rootPart, "data-focusable-when-disabled"),
        prop: "focusableWhenDisabled",
        truthyValue: "true",
      },
      disabledSetter: {
        method: disabledSetter.method,
        prop: "disabled",
      },
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      optionProps: runtimeOptionProps,
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
    },
  };
}
