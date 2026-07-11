import type {
  AdapterComponentFile,
  AdapterNativeDisabledFacts,
  AdapterOutputModel,
} from "../../framework-adapters/types.js";
import type { AdapterOutputFamilyPlan } from "../adapter-family-plans.js";
import type { GenericAdapterPlan, GenericAdapterPlanPart } from "../types.js";
import {
  getAdapterFamilyProp,
  getPart,
  getPartExportName,
  getPlanProp,
  getRuntimeOptionProps,
  getSetterForProp,
  getStaticAttributeName,
  pluralizeDisplayName,
  toPascalCase,
} from "./toolkit.js";

export const nativeDisabledAdapterFamilyPlan = {
  buildOutputModel: buildNativeDisabledOutputModel,
  id: "native-disabled",
  matches: isNativeDisabledOutputModelPlan,
} satisfies AdapterOutputFamilyPlan<AdapterOutputModel>;

function buildNativeDisabledOutputModel(plan: GenericAdapterPlan): AdapterOutputModel {
  const facts = getNativeDisabledFacts(plan);

  return {
    files: [
      ...plan.files
        .filter((file) => file.kind === "part")
        .map((file) => createNativeDisabledComponentFile(plan, facts, file.part)),
      {
        exports: {
          kind: "namespace",
          members: facts.index.importMembers,
          namespace: facts.exports.namespace,
        },
        family: { facts, kind: "native-disabled" },
        imports: [],
        kind: "index",
        path: `${plan.outputDirectory}/index.ts`,
        typeFacades: [],
      },
    ],
  };
}

function createNativeDisabledComponentFile(
  plan: GenericAdapterPlan,
  facts: AdapterNativeDisabledFacts,
  partName: string,
): AdapterComponentFile {
  const part = getPart(plan, partName);
  const familyPart = getNativeDisabledPart(facts, partName);
  const isRoot = part.name === facts.parts.root.name;

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${familyPart.namespaceKey}`,
      events: [],
      exports: {
        kind: "named",
        members: [{ from: `./${familyPart.exportName}`, name: familyPart.exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "native-disabled", part: part.name },
      imports: [],
      lifecycle: undefined,
      name: familyPart.exportName,
      portals: [],
      props: isRoot
        ? [{ kind: "boolean", name: facts.props.disabled.name, type: facts.props.disabled.type }]
        : [],
      refs: part.forwardsRef ? [{ id: `${part.name}Ref`, part: part.name, public: true }] : [],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: part.forwardsRef ? [{ id: `${part.name}Ref`, part: part.name, public: true }] : [],
      },
      stateSync: [],
      typeFacades: [],
    },
    kind: "component",
    path: `${plan.outputDirectory}/${familyPart.exportName}`,
  };
}

export function isNativeDisabledOutputModelPlan(plan: GenericAdapterPlan): boolean {
  const rootPart = plan.parts.find((part) => part.name === plan.runtime.rootPart);
  const partFiles = plan.files.filter((file) => file.kind === "part");
  const optionProps = plan.runtime.optionProps ?? [];
  const disabledProp = plan.props.find((prop) => prop.name === "disabled");
  const hasDisabledAttribute =
    rootPart !== undefined &&
    plan.staticAttributes.some(
      (attribute) =>
        attribute.part === rootPart.name &&
        attribute.name === "data-disabled" &&
        attribute.source === "prop",
    );
  const hasDisabledSetter = plan.setters.some(
    (setter) => "prop" in setter && setter.prop === "disabled",
  );

  return (
    plan.component === "fieldset" &&
    plan.category === "field-control-coordinator" &&
    plan.parts.length === 2 &&
    partFiles.length === 2 &&
    rootPart?.defaultElement === "fieldset" &&
    rootPart.ownsRuntime === true &&
    rootPart.forwardsRef === true &&
    disabledProp?.type === "boolean" &&
    disabledProp.defaultValue !== undefined &&
    optionProps.length === 1 &&
    optionProps[0] === "disabled" &&
    hasDisabledAttribute &&
    hasDisabledSetter
  );
}

export function getNativeDisabledFacts(plan: GenericAdapterPlan): AdapterNativeDisabledFacts {
  if (!isNativeDisabledOutputModelPlan(plan)) {
    throw new Error(`${plan.displayName} generic adapter plan is not a native-disabled plan.`);
  }

  const rootPart = getPart(plan, "root");
  const publicRootRef = plan.refs.some((ref) => ref.part === rootPart.name && ref.public);
  if (!rootPart.forwardsRef || !publicRootRef) {
    throw new Error(
      `${plan.displayName} generic adapter plan ${rootPart.name} part must declare a public forwarded ref.`,
    );
  }

  const sortedMembers = [...plan.exports.members].sort((left, right) =>
    left.name.localeCompare(right.name),
  );
  const disabledSetter = getSetterForProp(plan, "disabled");

  return {
    attrs: {
      disabled: "disabled",
      root: rootPart.discoveryAttribute,
      stateDisabled: getStaticAttributeName(plan, rootPart, "data-disabled"),
    },
    displayName: plan.displayName,
    exports: {
      namespace: plan.exports.namespace,
      root: getPartExportName(plan, rootPart.name),
    },
    index: {
      importMembers: sortedMembers.map((member) => ({
        from: `./${member.name}`,
        name: member.name,
      })),
      namespaceMembers: sortedMembers.map((member) => ({
        key: toPascalCase(member.part),
        name: member.name,
      })),
    },
    parts: {
      all: plan.parts.map((part) => getNativeDisabledPartFacts(plan, part)),
      root: getNativeDisabledPartFacts(plan, rootPart),
    },
    props: {
      disabled: getAdapterFamilyProp(getPlanProp(plan, "disabled")),
    },
    runtime: {
      disabledSetter: {
        method: disabledSetter.method,
        options: disabledSetter.options,
      },
      factory: plan.runtime.factory,
      importSource: plan.runtime.importSource,
      optionProps: getRuntimeOptionProps(plan, ["disabled"]),
      setupFunction: `setup${pluralizeDisplayName(plan.displayName)}`,
    },
  };
}

function getNativeDisabledPartFacts(
  plan: GenericAdapterPlan,
  part: GenericAdapterPlanPart,
): AdapterNativeDisabledFacts["parts"]["root"] {
  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    exportName: getPartExportName(plan, part.name),
    name: part.name,
    namespaceKey: toPascalCase(part.name),
    publicRef: plan.refs.some((ref) => ref.part === part.name && ref.public),
    role: part.role,
  };
}

function getNativeDisabledPart(
  facts: AdapterNativeDisabledFacts,
  partName: string,
): AdapterNativeDisabledFacts["parts"]["root"] {
  const part = facts.parts.all.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`${facts.displayName} native-disabled facts are missing ${partName} part.`);
  }

  return part;
}
