import type {
  PrimitivePropContract,
  PrimitiveRuntimeOptionLifecycle,
  PrimitiveSetterContract,
  RuntimeAdapterContract,
} from "../../contracts/primitive/types.js";
import type {
  AdapterComponentFile,
  AdapterFileDropControlFacts,
  AdapterFileDropControlPartName,
  AdapterOutputModel,
} from "../framework-adapters/index.js";
import {
  buildBaseSpecializedAdapterSpec,
  validateSpecializedAdapterSpec,
} from "./base-specialized-adapter-spec.js";
import type { SpecializedAdapterSpec } from "./types.js";

export type DropzoneSpecializedAdapterSpec = SpecializedAdapterSpec & {
  sourcePrimitiveContract: RuntimeAdapterContract;
  dropzone: {
    adapterKind: "file-drop-control";
    anatomy: DropzoneAnatomyRecipe[];
    disabledControl: DropzoneDisabledControlRecipe;
    fileInput: DropzoneFileInputRecipe;
    fileList: DropzoneFileListRecipe;
    filesChange: DropzoneFilesChangeRecipe;
    formBridge: DropzoneFormBridgeRecipe;
    namespace: DropzoneNamespaceRecipe;
    runtimeBoundary: string[];
    uploadState: DropzoneUploadStateRecipe;
  };
};

type DropzoneAnatomyRecipe = {
  defaultElement: string;
  discoveryAttribute: string;
  initialAttributes: string[];
  part: string;
  publicRef: boolean;
  role?: string;
};

type DropzoneDisabledControlRecipe = {
  attribute: "data-disabled";
  defaultValue: string;
  lifecycle: "setter-backed";
  prop: "disabled";
  setter: string;
  targetParts: ["root", "input"];
  type: "boolean";
};

type DropzoneFileInputRecipe = {
  acceptMultiple: DropzoneFileInputConstraintRecipe[];
  disabledProjection: {
    attribute: "data-disabled";
    forwardedAttribute: "disabled";
    prop: "disabled";
  };
  formProps: string[];
  hiddenClass: {
    attribute: "class";
    value: "sr-only";
  };
  part: "input";
  refs: {
    inputPublicRef: boolean;
    rootPublicRef: boolean;
  };
  runtimeBoundary: string;
  tabIndex: {
    attribute: "tabindex";
    value: "-1";
  };
  type: {
    attribute: "type";
    value: "file";
  };
};

type DropzoneFileInputConstraintRecipe = {
  forwardedAttribute: "accept" | "multiple";
  prop: "accept" | "multiple";
  targetPart: "input";
  type: "boolean" | "string";
};

type DropzoneFileListRecipe = {
  emptyInitialState: "false";
  part: "filesList";
  renderingBoundary: "runtime-owned-dom-replacement";
  runtimeBoundary: string;
  stateAttribute: "data-has-files";
};

type DropzoneFilesChangeRecipe = {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  lifecycle: "constructor-callback-ref";
  reasons: ["drop", "imperative-action", "input-change"];
  subscriberEvent: "filesChange";
  valueProperty: string;
  valueType: string;
};

type DropzoneFormBridgeRecipe = {
  fileInput: {
    part: "input";
    type: "file";
  };
  props: string[];
  runtimeBoundary: string;
};

type DropzoneNamespaceRecipe = {
  defaultExport: "Dropzone";
  defaultNamespace: boolean;
  memberParts: string[];
  namedExports: string[];
  namespace: "Dropzone";
  objectEntries: DropzoneNamespaceObjectEntry[];
};

type DropzoneNamespaceObjectEntry = {
  exportName: string;
  part: string;
  property: string;
};

type DropzoneRequiredEvent = SpecializedAdapterSpec["events"][number] & {
  callbackProp: string;
  detailsType: string;
  domEvent: string;
  emitsFrom: string;
  valueProperty: string;
  valueType: string;
};

type DropzoneRequiredState = SpecializedAdapterSpec["stateModels"][number] & {
  controlledStateSync: "custom-event";
  controlledProp: string;
  initialAttribute: string;
  runtimeGetter: string;
  runtimeSetter: string;
  valueType: string;
};

type DropzoneUploadStateRecipe = {
  indicators: DropzoneUploadIndicatorRecipe[];
  runtimeBoundary: string;
  setterSync: {
    method: string;
    prop: "isUploading";
  };
  state: {
    controlledStateSync: "custom-event";
    controlledProp: "isUploading";
    defaultValue: string;
    getter: string;
    initialAttribute: "data-is-uploading";
    name: "uploading";
    setter: string;
    valueType: "boolean";
  };
};

type DropzoneUploadIndicatorRecipe = {
  hiddenAttribute: "hidden";
  hiddenWhen: "not-uploading" | "uploading";
  part: "loadingIndicator" | "uploadIndicator";
  stateAttribute: "data-is-uploading";
};

const DROPZONE_ANATOMY_PARTS = [
  "root",
  "input",
  "uploadIndicator",
  "loadingIndicator",
  "filesList",
] as const;
const DROPZONE_NAMESPACE_NAMED_EXPORT_PART_ORDER = [
  "filesList",
  "input",
  "loadingIndicator",
  "root",
  "uploadIndicator",
] as const;
const DROPZONE_PROJECTED_PROP_NAMES = [
  "disabled",
  "isUploading",
  "onFilesChange",
  "accept",
  "multiple",
  "name",
  "required",
] as const;
const DROPZONE_FORM_PROPS = ["accept", "multiple", "name", "required"] as const;
const DROPZONE_FILES_CHANGE_REASONS = ["drop", "imperative-action", "input-change"] as const;
const DROPZONE_RUNTIME_BOUNDARY = [
  "file input setup and label association",
  "keyboard activation and click forwarding",
  "drag/drop workflow and drag-active state",
  "DataTransfer assignment and selected-file tracking",
  "accept/multiple filtering for dropped files",
  "upload state coordination and indicator mutation",
  "file-list rendering and DOM replacement",
  "native input files reflection and form reset",
] as const;
const DROPZONE_FILE_INPUT_RUNTIME_BOUNDARY =
  "Runtime owns file input id/htmlFor setup, click/keyboard activation, DataTransfer assignment, accepted-file filtering, selected-file tracking, and form reset.";
const DROPZONE_UPLOAD_STATE_RUNTIME_BOUNDARY =
  "Runtime owns upload state coordination, root/indicator attributes, indicator hidden/class mutation, and attribute-observer sync.";
const DROPZONE_FILE_LIST_RUNTIME_BOUNDARY =
  "Runtime owns file-list child replacement, file item markup, visibility classes, and data-has-files sync.";
const DROPZONE_FORM_BRIDGE_RUNTIME_BOUNDARY =
  "Runtime owns native file input file reflection, accepted-file filtering, submitted files, and form reset clearing.";

export function buildDropzoneSpecializedAdapterSpec(
  contract: RuntimeAdapterContract,
): DropzoneSpecializedAdapterSpec {
  const spec = buildBaseSpecializedAdapterSpec(contract);
  if (spec.component !== "dropzone") {
    throw new Error(
      `${spec.displayName} cannot be rendered as the Dropzone specialized adapter spec.`,
    );
  }

  for (const part of DROPZONE_ANATOMY_PARTS) {
    assertPart(spec, part);
  }

  return {
    ...spec,
    files: buildShippingFileRecipes(spec),
    sourcePrimitiveContract: contract,
    dropzone: {
      adapterKind: "file-drop-control",
      anatomy: buildAnatomyRecipes(spec),
      disabledControl: buildDisabledControlRecipe(spec, contract),
      fileInput: buildFileInputRecipe(spec),
      fileList: buildFileListRecipe(spec),
      filesChange: buildFilesChangeRecipe(spec),
      formBridge: buildFormBridgeRecipe(spec),
      namespace: buildNamespaceRecipe(spec),
      runtimeBoundary: [...DROPZONE_RUNTIME_BOUNDARY],
      uploadState: buildUploadStateRecipe(spec),
    },
  };
}

export function validateDropzoneSpecializedAdapterSpec(
  spec: DropzoneSpecializedAdapterSpec,
): string[] {
  const errors = validateSpecializedAdapterSpec(spec);
  if (!isRecord(spec) || spec.component !== "dropzone") {
    errors.push("Dropzone specialized adapter spec must target the dropzone primitive.");
    return errors;
  }

  const dropzone = isRecord(spec.dropzone) ? spec.dropzone : undefined;
  if (!dropzone) {
    errors.push("Dropzone specialized adapter spec is missing dropzone metadata.");
    return errors;
  }

  if (dropzone.adapterKind !== "file-drop-control") {
    errors.push('Dropzone specialized adapter spec adapterKind must be "file-drop-control".');
  }

  const expectedFields = new Set([
    "adapterKind",
    "anatomy",
    "disabledControl",
    "fileInput",
    "fileList",
    "filesChange",
    "formBridge",
    "namespace",
    "runtimeBoundary",
    "uploadState",
  ]);
  const behaviorFields = new Set([
    "acceptedFileFiltering",
    "dataTransferAssignment",
    "dragDropWorkflow",
    "fileAssignment",
    "fileInputSetup",
    "fileListRendering",
    "fileTracking",
    "formReset",
    "keyboardActivation",
    "selectedFileTracking",
    "uploadStateCoordination",
  ]);
  collectDropzoneBehaviorFieldErrors(dropzone, ["dropzone"], behaviorFields, errors);

  for (const field of Object.keys(dropzone)) {
    if (behaviorFields.has(field)) {
      continue;
    }

    if (!expectedFields.has(field)) {
      errors.push(
        `Dropzone specialized adapter spec must not declare unexpected field "${field}".`,
      );
    }
  }

  for (const part of DROPZONE_ANATOMY_PARTS) {
    if (!hasPart(spec, part)) {
      errors.push(`Dropzone specialized adapter spec requires ${part} part.`);
    }
  }

  errors.push(...validateAnatomy(spec, dropzone.anatomy));
  errors.push(...validateProjectedProps(spec));
  errors.push(...validateDisabledControl(spec, dropzone.disabledControl));
  errors.push(...validateFileInput(spec, dropzone.fileInput));
  errors.push(...validateUploadState(spec, dropzone.uploadState));
  errors.push(...validateFilesChange(spec, dropzone.filesChange));
  errors.push(...validateFileList(spec, dropzone.fileList));
  errors.push(...validateFormBridge(spec, dropzone.formBridge));
  errors.push(...validateNamespace(spec, dropzone.namespace));
  errors.push(...validateShippingFiles(spec));


  if (!arraysEqual(asArray(dropzone.runtimeBoundary), DROPZONE_RUNTIME_BOUNDARY)) {
    errors.push(
      "Dropzone specialized adapter spec runtimeBoundary must match Runtime-owned file drop behavior.",
    );
  }

  return errors;
}

export function buildDropzoneAdapterOutputModel(
  spec: DropzoneSpecializedAdapterSpec,
): AdapterOutputModel {
  assertValidDropzoneAdapterOutputModelSpec(spec);

  const facts = getDropzoneFileDropControlFacts(spec);
  const files: AdapterOutputModel["files"] = [
    createDropzoneComponentFile(spec, "root", facts),
    createDropzoneComponentFile(spec, "input", facts),
    createDropzoneComponentFile(spec, "uploadIndicator", facts),
    createDropzoneComponentFile(spec, "loadingIndicator", facts),
    createDropzoneComponentFile(spec, "filesList", facts),
    {
      exports: {
        kind: "namespace",
        members: facts.index.importMembers,
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "file-drop-control" },
      imports: [],
      kind: "index",
      path: `${spec.component}/index.ts`,
      typeFacades: [],
    },
  ];

  return { files };
}

function createDropzoneComponentFile(
  spec: DropzoneSpecializedAdapterSpec,
  partName: AdapterFileDropControlPartName,
  facts: AdapterFileDropControlFacts,
): AdapterComponentFile {
  const part = facts.parts[partName];
  const exportName = facts.exports[partName];

  return {
    component: {
      context: [],
      defaults: [],
      displayName: `${facts.displayName}.${part.namespaceKey}`,
      events:
        partName === "root"
          ? [
              {
                detailType: facts.event.detailsType,
                handlerProp: facts.event.callbackProp,
                runtimeEvent: facts.event.name,
                targetPart: "root",
              },
            ]
          : [],
      exports: {
        kind: "named",
        members: [{ from: `./${exportName}`, name: exportName }],
        namespace: facts.exports.namespace,
      },
      family: { facts, kind: "file-drop-control", part: partName },
      imports: [],
      lifecycle:
        partName === "root"
          ? {
              cleanup: { code: "instance.destroy();" },
              factory: facts.runtime.factory,
              factoryImport: {
                id: "runtime",
                kind: "value",
                members: [{ imported: facts.runtime.factory }],
                source: facts.runtime.importSource,
              },
              mount: { code: `${facts.runtime.factory}(root)` },
              options: [
                facts.props.disabled,
                facts.props.isUploading,
                { ...getProp(spec, facts.event.callbackProp), name: facts.event.callbackProp },
              ].map((prop) => ({ name: prop.name, source: "prop" })),
              rootRef: "rootRef",
            }
          : undefined,
      name: exportName,
      portals: [],
      props: getDropzoneComponentProps(partName, facts),
      refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      render: {
        attrs: [{ name: part.discoveryAttribute }],
        children: partName === "input" ? [] : [{ kind: "slot" }],
        defaultElement: part.defaultElement,
        events: [],
        kind: "element",
        part: part.name,
        refs: [{ id: `${part.name}Ref`, part: part.name, public: true }],
      },
      stateSync:
        partName === "root"
          ? [
              {
                setter: facts.setters.disabled,
                state: facts.props.disabled.name,
                valueProp: facts.props.disabled.name,
              },
              {
                setter: facts.setters.uploading,
                state: facts.uploadState.name,
                valueProp: facts.props.isUploading.name,
              },
            ]
          : [],
      typeFacades: [],
    },
    kind: "component",
    path: `${spec.component}/${exportName}`,
  };
}

function getDropzoneComponentProps(
  partName: AdapterFileDropControlPartName,
  facts: AdapterFileDropControlFacts,
) {
  if (partName === "root") {
    return [facts.props.disabled, facts.props.isUploading].map((prop) => ({
      kind: "unknown" as const,
      name: prop.name,
      type: prop.type,
    }));
  }

  if (partName === "input") {
    return [
      facts.props.disabled,
      facts.props.accept,
      facts.props.multiple,
      facts.props.name,
      facts.props.required,
    ].map((prop) => ({ kind: "unknown" as const, name: prop.name, type: prop.type }));
  }

  if (partName === "uploadIndicator" || partName === "loadingIndicator") {
    return [
      {
        kind: "unknown" as const,
        name: facts.props.isUploading.name,
        type: facts.props.isUploading.type,
      },
    ];
  }

  return [];
}

function getDropzoneFileDropControlFacts(
  spec: DropzoneSpecializedAdapterSpec,
): AdapterFileDropControlFacts {
  const anatomy = {
    filesList: getDropzoneAnatomyPart(spec, "filesList"),
    input: getDropzoneAnatomyPart(spec, "input"),
    loadingIndicator: getDropzoneAnatomyPart(spec, "loadingIndicator"),
    root: getDropzoneAnatomyPart(spec, "root"),
    uploadIndicator: getDropzoneAnatomyPart(spec, "uploadIndicator"),
  };
  for (const partName of spec.dropzone.namespace.memberParts) {
    getDropzoneSpecFileBasename(spec, partName);
  }
  if (spec.dropzone.formBridge.fileInput.part !== spec.dropzone.fileInput.part) {
    throw new Error(
      "Dropzone specialized adapter spec output model requires file input form bridge metadata.",
    );
  }
  if (spec.dropzone.filesChange.lifecycle !== "constructor-callback-ref") {
    throw new Error(
      "Dropzone specialized adapter spec output model requires constructor callback ref filesChange metadata.",
    );
  }
  if (spec.dropzone.uploadState.setterSync.method !== spec.dropzone.uploadState.state.setter) {
    throw new Error(
      "Dropzone specialized adapter spec output model requires upload state setter sync metadata.",
    );
  }

  const entriesByPart = new Map(
    spec.dropzone.namespace.objectEntries.map((entry) => [entry.part, entry]),
  );
  const exportsByPart = Object.fromEntries(
    spec.dropzone.namespace.objectEntries.map((entry) => [entry.part, entry.exportName]),
  ) as Record<AdapterFileDropControlPartName, string>;

  return {
    attrs: {
      ariaDisabled: getDropzoneAttribute(spec, anatomy.root.part, "aria-disabled"),
      disabled: spec.dropzone.disabledControl.attribute,
      dragActive: getDropzoneAttribute(spec, anatomy.root.part, "data-drag-active"),
      filesList: anatomy.filesList.discoveryAttribute,
      hasFiles: spec.dropzone.fileList.stateAttribute,
      input: anatomy.input.discoveryAttribute,
      inputClass: spec.dropzone.fileInput.hiddenClass.attribute,
      inputDisabled: spec.dropzone.fileInput.disabledProjection.forwardedAttribute,
      inputTabIndex: spec.dropzone.fileInput.tabIndex.attribute,
      inputType: spec.dropzone.fileInput.type.attribute,
      isUploading: spec.dropzone.uploadState.state.initialAttribute,
      loadingIndicator: anatomy.loadingIndicator.discoveryAttribute,
      role: getDropzoneAttribute(spec, anatomy.root.part, "role"),
      root: anatomy.root.discoveryAttribute,
      uploadIndicator: anatomy.uploadIndicator.discoveryAttribute,
    },
    displayName: spec.displayName,
    event: {
      callbackProp: spec.dropzone.filesChange.callbackProp,
      detailsType: spec.dropzone.filesChange.detailsType,
      name: spec.dropzone.filesChange.subscriberEvent,
      valueProperty: spec.dropzone.filesChange.valueProperty,
      valueType: spec.dropzone.filesChange.valueType,
    },
    exports: {
      filesList: exportsByPart.filesList,
      input: exportsByPart.input,
      loadingIndicator: exportsByPart.loadingIndicator,
      namespace: spec.dropzone.namespace.namespace,
      root: exportsByPart.root,
      uploadIndicator: exportsByPart.uploadIndicator,
    },
    fileInput: {
      acceptsProps: spec.dropzone.fileInput.acceptMultiple.map((constraint) => constraint.prop),
      disabledForwardedAttribute: spec.dropzone.fileInput.disabledProjection.forwardedAttribute,
      formProps: [...spec.dropzone.fileInput.formProps],
      hiddenClassValue: spec.dropzone.fileInput.hiddenClass.value,
      tabIndexValue: spec.dropzone.fileInput.tabIndex.value,
      typeValue: spec.dropzone.fileInput.type.value,
    },
    fileList: {
      emptyInitialState: spec.dropzone.fileList.emptyInitialState,
      renderingBoundary: spec.dropzone.fileList.renderingBoundary,
      stateAttribute: spec.dropzone.fileList.stateAttribute,
    },
    index: {
      importMembers: spec.dropzone.namespace.namedExports
        .filter((exportName) => exportName !== spec.dropzone.namespace.namespace)
        .map((exportName) => {
          const entry = spec.dropzone.namespace.objectEntries.find(
            (candidate) => candidate.exportName === exportName,
          );
          if (!entry) {
            throw new Error(
              `Dropzone specialized adapter spec output model cannot resolve export "${exportName}".`,
            );
          }

          return { from: `./${exportName}`, name: exportName };
        }),
      namespaceMembers: spec.dropzone.namespace.objectEntries.map((entry) => ({
        key: entry.property,
        name: entry.exportName,
      })),
      typeExports: [spec.dropzone.filesChange.detailsType],
    },
    parts: {
      filesList: getDropzoneFileDropControlPart(anatomy.filesList, entriesByPart),
      input: getDropzoneFileDropControlPart(anatomy.input, entriesByPart),
      loadingIndicator: getDropzoneFileDropControlPart(anatomy.loadingIndicator, entriesByPart),
      root: {
        ...getDropzoneFileDropControlPart(anatomy.root, entriesByPart),
        role: getRequiredValue(anatomy.root.role, "root role"),
      },
      uploadIndicator: getDropzoneFileDropControlPart(anatomy.uploadIndicator, entriesByPart),
    },
    props: {
      accept: getAdapterFamilyProp(getTargetProp(spec, "accept", "input")),
      disabled: getAdapterFamilyProp(getProp(spec, "disabled")),
      isUploading: getAdapterFamilyProp(getProp(spec, "isUploading")),
      multiple: getAdapterFamilyProp(getTargetProp(spec, "multiple", "input")),
      name: getAdapterFamilyProp(getTargetProp(spec, "name", "input")),
      required: getAdapterFamilyProp(getTargetProp(spec, "required", "input")),
    },
    runtime: {
      factory: spec.root.runtimeFactory,
      importSource: spec.root.runtimeImportSource,
      setupFunction: `setup${pluralizeDisplayName(spec.displayName)}`,
      typeImportSource: spec.root.runtimeImportSource.replace(/\/[^/]+$/, ""),
    },
    setters: {
      disabled: spec.dropzone.disabledControl.setter,
      uploading: spec.dropzone.uploadState.setterSync.method,
    },
    uploadState: {
      getter: spec.dropzone.uploadState.state.getter,
      hiddenWhenNotUploadingPart: "loadingIndicator",
      hiddenWhenUploadingPart: "uploadIndicator",
      name: spec.dropzone.uploadState.state.name,
      setter: spec.dropzone.uploadState.state.setter,
      type: spec.dropzone.uploadState.state.valueType,
    },
  };
}

function collectDropzoneBehaviorFieldErrors(
  value: unknown,
  path: string[],
  behaviorFields: ReadonlySet<string>,
  errors: string[],
): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => {
      collectDropzoneBehaviorFieldErrors(item, [...path, String(index)], behaviorFields, errors);
    });
    return;
  }

  if (!isRecord(value)) return;

  for (const [key, child] of Object.entries(value)) {
    const nextPath = [...path, key];
    if (behaviorFields.has(key)) {
      errors.push(
        `Dropzone specialized adapter spec must not declare ${nextPath.join(".")}; keep Runtime-owned behavior in Runtime controllers.`,
      );
    }

    collectDropzoneBehaviorFieldErrors(child, nextPath, behaviorFields, errors);
  }
}

function buildShippingFileRecipes(spec: SpecializedAdapterSpec): SpecializedAdapterSpec["files"] {
  return spec.files.map((file) => ({ ...file }));
}

function buildAnatomyRecipes(spec: SpecializedAdapterSpec): DropzoneAnatomyRecipe[] {
  return DROPZONE_ANATOMY_PARTS.map((partName) => {
    const part = getPart(spec, partName);

    return {
      defaultElement: part.defaultElement,
      discoveryAttribute: part.discoveryAttribute,
      initialAttributes: getInitialAttributeNames(spec, partName),
      part: part.name,
      publicRef: hasPublicRef(spec, partName),
      role: part.role,
    };
  });
}

function buildDisabledControlRecipe(
  spec: SpecializedAdapterSpec,
  contract: RuntimeAdapterContract,
): DropzoneDisabledControlRecipe {
  const prop = getSourceProp(contract, "disabled");
  const setter = getPropSetter(spec, "disabled");

  return {
    attribute: getStaticAttributeName(spec, "root", "data-disabled") as "data-disabled",
    defaultValue: getRequiredValue(prop.defaultValue, "disabled default value"),
    lifecycle: getOptionLifecycle(contract, "disabled"),
    prop: "disabled",
    setter: setter.method,
    targetParts: ["root", "input"],
    type: prop.type as "boolean",
  };
}

function buildFileInputRecipe(spec: SpecializedAdapterSpec): DropzoneFileInputRecipe {
  getTargetProp(spec, "name", "input");
  getTargetProp(spec, "required", "input");

  return {
    acceptMultiple: [
      buildFileInputConstraintRecipe(spec, "accept"),
      buildFileInputConstraintRecipe(spec, "multiple"),
    ],
    disabledProjection: {
      attribute: getStaticAttributeName(spec, "input", "data-disabled") as "data-disabled",
      forwardedAttribute: getStaticAttributeName(spec, "input", "disabled") as "disabled",
      prop: "disabled",
    },
    formProps: [...getRequiredValue(spec.renderPlan.form, "form metadata").props],
    hiddenClass: {
      attribute: getStaticAttributeName(spec, "input", "class") as "class",
      value: getStaticAttributeValue(spec, "input", "class") as "sr-only",
    },
    part: "input",
    refs: {
      inputPublicRef: hasPublicRef(spec, "input"),
      rootPublicRef: hasPublicRef(spec, "root"),
    },
    runtimeBoundary: DROPZONE_FILE_INPUT_RUNTIME_BOUNDARY,
    tabIndex: {
      attribute: getStaticAttributeName(spec, "input", "tabindex") as "tabindex",
      value: getStaticAttributeValue(spec, "input", "tabindex") as "-1",
    },
    type: {
      attribute: getStaticAttributeName(spec, "input", "type") as "type",
      value: getStaticAttributeValue(spec, "input", "type") as "file",
    },
  };
}

function buildFileInputConstraintRecipe(
  spec: SpecializedAdapterSpec,
  propName: "accept" | "multiple",
): DropzoneFileInputConstraintRecipe {
  const prop = getTargetProp(spec, propName, "input");

  return {
    forwardedAttribute: propName,
    prop: propName,
    targetPart: "input",
    type: prop.type as "boolean" | "string",
  };
}

function buildFileListRecipe(spec: SpecializedAdapterSpec): DropzoneFileListRecipe {
  getPart(spec, "filesList");

  return {
    emptyInitialState: "false",
    part: "filesList",
    renderingBoundary: "runtime-owned-dom-replacement",
    runtimeBoundary: DROPZONE_FILE_LIST_RUNTIME_BOUNDARY,
    stateAttribute: getStaticAttributeName(spec, "filesList", "data-has-files") as "data-has-files",
  };
}

function buildFilesChangeRecipe(spec: SpecializedAdapterSpec): DropzoneFilesChangeRecipe {
  const event = getRequiredEvent(spec, "filesChange");

  return {
    callbackProp: event.callbackProp,
    detailsType: event.detailsType,
    domEvent: event.domEvent,
    emitsFrom: event.emitsFrom,
    lifecycle: "constructor-callback-ref",
    reasons: [...DROPZONE_FILES_CHANGE_REASONS],
    subscriberEvent: "filesChange",
    valueProperty: event.valueProperty,
    valueType: event.valueType,
  };
}

function buildFormBridgeRecipe(spec: SpecializedAdapterSpec): DropzoneFormBridgeRecipe {
  const form = getRequiredValue(spec.renderPlan.form, "form metadata");
  const fileInput = getRequiredValue(form.hiddenInput, "file input metadata");

  return {
    fileInput: {
      part: fileInput.part as "input",
      type: fileInput.type as "file",
    },
    props: [...form.props],
    runtimeBoundary: DROPZONE_FORM_BRIDGE_RUNTIME_BOUNDARY,
  };
}

function buildNamespaceRecipe(spec: SpecializedAdapterSpec): DropzoneNamespaceRecipe {
  const membersByPart = new Map(spec.exports.members.map((member) => [member.part, member]));
  const objectEntries = DROPZONE_ANATOMY_PARTS.map((part) => {
    const member = membersByPart.get(part);
    if (!member) {
      throw new Error(`Dropzone specialized adapter spec requires ${part} namespace export.`);
    }

    return {
      exportName: member.name,
      part,
      property: toPascalCase(part),
    };
  });

  return {
    defaultExport: "Dropzone",
    defaultNamespace: spec.exports.defaultNamespace,
    memberParts: objectEntries.map((entry) => entry.part),
    namedExports: [
      "Dropzone",
      ...DROPZONE_NAMESPACE_NAMED_EXPORT_PART_ORDER.map((part) => {
        const member = membersByPart.get(part);
        if (!member) {
          throw new Error(`Dropzone specialized adapter spec requires ${part} named export.`);
        }

        return member.name;
      }),
    ],
    namespace: "Dropzone",
    objectEntries,
  };
}

function buildUploadStateRecipe(spec: SpecializedAdapterSpec): DropzoneUploadStateRecipe {
  const state = getRequiredState(spec, "uploading");
  const prop = getProp(spec, state.controlledProp);
  const setter = getPropSetter(spec, "isUploading");

  return {
    indicators: [
      {
        hiddenAttribute: "hidden",
        hiddenWhen: "uploading",
        part: "uploadIndicator",
        stateAttribute: getStaticAttributeName(
          spec,
          "uploadIndicator",
          "data-is-uploading",
        ) as "data-is-uploading",
      },
      {
        hiddenAttribute: getStaticAttributeName(spec, "loadingIndicator", "hidden") as "hidden",
        hiddenWhen: "not-uploading",
        part: "loadingIndicator",
        stateAttribute: getStaticAttributeName(
          spec,
          "loadingIndicator",
          "data-is-uploading",
        ) as "data-is-uploading",
      },
    ],
    runtimeBoundary: DROPZONE_UPLOAD_STATE_RUNTIME_BOUNDARY,
    setterSync: {
      method: setter.method,
      prop: "isUploading",
    },
    state: {
      controlledStateSync: state.controlledStateSync,
      controlledProp: state.controlledProp as "isUploading",
      defaultValue: getRequiredValue(prop.defaultValue, "isUploading default value"),
      getter: state.runtimeGetter,
      initialAttribute: state.initialAttribute as "data-is-uploading",
      name: "uploading",
      setter: state.runtimeSetter,
      valueType: state.valueType as "boolean",
    },
  };
}

function validateAnatomy(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!Array.isArray(value)) {
    return ["Dropzone specialized adapter spec requires anatomy metadata."];
  }

  const errors: string[] = [];
  if (
    !arraysEqual(
      value.map((part) => (isRecord(part) ? part.part : undefined)),
      DROPZONE_ANATOMY_PARTS,
    )
  ) {
    errors.push(
      "Dropzone specialized adapter spec anatomy must match root, input, uploadIndicator, loadingIndicator, filesList.",
    );
  }

  for (const partName of DROPZONE_ANATOMY_PARTS) {
    const recipe = value.find((part) => isRecord(part) && part.part === partName);
    if (!isRecord(recipe)) {
      errors.push(`Dropzone specialized adapter spec requires ${partName} anatomy part.`);
      continue;
    }

    const part = spec.parts.find((candidate) => candidate.name === partName);
    if (!part) {
      errors.push(`Dropzone specialized adapter spec requires ${partName} part.`);
      continue;
    }
    if (recipe.defaultElement !== part.defaultElement) {
      errors.push(
        `Dropzone specialized adapter spec ${partName} defaultElement must match contract.`,
      );
    }
    if (recipe.discoveryAttribute !== part.discoveryAttribute) {
      errors.push(
        `Dropzone specialized adapter spec ${partName} discoveryAttribute must match contract.`,
      );
    }
    if (!arraysEqual(asArray(recipe.initialAttributes), getInitialAttributeNames(spec, partName))) {
      errors.push(
        `Dropzone specialized adapter spec ${partName} initialAttributes must match contract.`,
      );
    }
    if (recipe.publicRef !== hasPublicRef(spec, partName)) {
      errors.push(`Dropzone specialized adapter spec ${partName} publicRef must match contract.`);
    }
    if (recipe.role !== part.role) {
      errors.push(`Dropzone specialized adapter spec ${partName} role must match contract.`);
    }
  }

  return errors;
}

function validateDisabledControl(spec: DropzoneSpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires disabledControl metadata."];
  }

  return recipeEquals(() => buildDisabledControlRecipe(spec, spec.sourcePrimitiveContract), value)
    ? []
    : [
        "Dropzone specialized adapter spec disabledControl metadata must match disabled prop, setter, default, and root/input attributes.",
      ];
}

function validateFileInput(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires fileInput metadata."];
  }

  const errors: string[] = [];
  for (const propName of DROPZONE_FORM_PROPS) {
    if (!findTargetProp(spec, propName, "input")) {
      errors.push(`Dropzone specialized adapter spec requires ${propName} input prop metadata.`);
    }
  }

  if (errors.length === 0 && !recipeEquals(() => buildFileInputRecipe(spec), value)) {
    errors.push(
      "Dropzone specialized adapter spec fileInput metadata must match native file input, refs, constraints, disabled projection, and form facts.",
    );
  }

  return errors;
}

function validateFileList(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires fileList metadata."];
  }

  return recipeEquals(() => buildFileListRecipe(spec), value)
    ? []
    : [
        "Dropzone specialized adapter spec fileList metadata must match filesList state and Runtime rendering boundary.",
      ];
}

function validateFilesChange(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires filesChange metadata."];
  }

  return recipeEquals(() => buildFilesChangeRecipe(spec), value)
    ? []
    : [
        "Dropzone specialized adapter spec filesChange metadata must match callback, event, reasons, and subscriber facts.",
      ];
}

function validateFormBridge(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires formBridge metadata."];
  }

  return recipeEquals(() => buildFormBridgeRecipe(spec), value)
    ? []
    : [
        "Dropzone specialized adapter spec formBridge metadata must match native file input and form props.",
      ];
}

function validateNamespace(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires namespace metadata."];
  }

  let expected: DropzoneNamespaceRecipe;
  try {
    expected = buildNamespaceRecipe(spec);
  } catch {
    return ["Dropzone specialized adapter spec namespace metadata is incomplete."];
  }

  const errors: string[] = [];
  if (value.defaultExport !== expected.defaultExport || value.namespace !== expected.namespace) {
    errors.push("Dropzone specialized adapter spec namespace default export must be Dropzone.");
  }
  if (value.defaultNamespace !== true) {
    errors.push("Dropzone specialized adapter spec namespace must keep defaultNamespace enabled.");
  }
  if (!arraysEqual(asArray(value.memberParts), expected.memberParts)) {
    errors.push(
      "Dropzone specialized adapter spec namespace memberParts must match generated export order.",
    );
  }
  if (!arraysEqual(asArray(value.namedExports), expected.namedExports)) {
    errors.push(
      "Dropzone specialized adapter spec namespace namedExports must match generated export order.",
    );
  }
  if (!recordsArrayEqual(asArray(value.objectEntries), expected.objectEntries)) {
    errors.push(
      "Dropzone specialized adapter spec namespace objectEntries must match generated export order.",
    );
  }

  return errors;
}

function validateProjectedProps(spec: DropzoneSpecializedAdapterSpec): string[] {
  const propsByName = new Map(spec.props.map((prop) => [prop.name, prop]));

  for (const propName of DROPZONE_PROJECTED_PROP_NAMES) {
    const actual = propsByName.get(propName);
    const expected = spec.sourcePrimitiveContract.props.find((prop) => prop.name === propName);
    if (
      !actual ||
      !expected ||
      !recordsEqual(toProjectedPropRecipe(actual), toProjectedPropRecipe(expected))
    ) {
      return [
        "Dropzone specialized adapter spec props must match source contract facts for disabled, upload, callback, and file input props.",
      ];
    }
  }

  return [];
}

function validateShippingFiles(spec: DropzoneSpecializedAdapterSpec): string[] {
  const expected = buildShippingFileRecipes({
    ...spec,
    files: spec.renderPlan.files,
  });

  return recordsArrayEqual(spec.files, expected)
    ? []
    : ["Dropzone specialized adapter spec files must match exported Dropzone parts plus index."];
}

function validateUploadState(spec: SpecializedAdapterSpec, value: unknown): string[] {
  if (!isRecord(value)) {
    return ["Dropzone specialized adapter spec requires uploadState metadata."];
  }

  const errors: string[] = [];
  if (!spec.stateModels.some((state) => state.name === "uploading")) {
    errors.push("Dropzone specialized adapter spec requires uploading state metadata.");
  }
  if (!findProp(spec, "isUploading")) {
    errors.push("Dropzone specialized adapter spec requires isUploading prop metadata.");
  }
  if (!spec.setterSync.some((setter) => "prop" in setter && setter.prop === "isUploading")) {
    errors.push("Dropzone specialized adapter spec requires isUploading setter metadata.");
  }

  if (errors.length === 0 && !recipeEquals(() => buildUploadStateRecipe(spec), value)) {
    errors.push(
      "Dropzone specialized adapter spec uploadState metadata must match uploading state, setter, and indicator facts.",
    );
  }

  return errors;
}

function assertPart(spec: SpecializedAdapterSpec, partName: string): void {
  if (!hasPart(spec, partName)) {
    throw new Error(`Dropzone specialized adapter spec requires ${partName} part.`);
  }
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function arraysEqual(actual: readonly unknown[], expected: readonly unknown[]): boolean {
  return (
    actual.length === expected.length && actual.every((value, index) => value === expected[index])
  );
}

function findProp(spec: SpecializedAdapterSpec, propName: string) {
  return spec.props.find((candidate) => candidate.name === propName);
}

function findTargetProp(spec: SpecializedAdapterSpec, propName: string, targetPart: string) {
  return spec.props.find(
    (candidate) => candidate.name === propName && candidate.targets?.includes(targetPart),
  );
}

function getInitialAttributeNames(spec: SpecializedAdapterSpec, partName: string): string[] {
  return spec.renderPlan.staticAttributes
    .filter((attribute) => attribute.part === partName)
    .map((attribute) => attribute.name);
}

function getOptionLifecycle(
  contract: RuntimeAdapterContract,
  propName: string,
): Extract<PrimitiveRuntimeOptionLifecycle, "setter-backed"> {
  const lifecycle = contract.runtime.optionPropLifecycles?.[propName];
  if (lifecycle !== "setter-backed") {
    throw new Error(
      `Dropzone specialized adapter spec requires setter-backed lifecycle for ${propName}.`,
    );
  }

  return lifecycle;
}

function getPart(spec: SpecializedAdapterSpec, partName: string) {
  const part = spec.parts.find((candidate) => candidate.name === partName);
  if (!part) {
    throw new Error(`Dropzone specialized adapter spec requires ${partName} part.`);
  }

  return part;
}

function getProp(spec: SpecializedAdapterSpec, propName: string): PrimitivePropContract {
  const prop = findProp(spec, propName);
  if (!prop) {
    throw new Error(`Dropzone specialized adapter spec requires ${propName} prop metadata.`);
  }

  return prop;
}

function getPropSetter(spec: SpecializedAdapterSpec, propName: string): PrimitiveSetterContract {
  const setter = spec.setterSync.find(
    (candidate) => "prop" in candidate && candidate.prop === propName,
  );
  if (!setter) {
    throw new Error(`Dropzone specialized adapter spec requires ${propName} setter metadata.`);
  }

  return setter;
}

function getRequiredEvent(spec: SpecializedAdapterSpec, eventName: string): DropzoneRequiredEvent {
  const event = spec.events.find((candidate) => candidate.name === eventName);
  if (!event?.detailsType || !event.domEvent || !event.valueProperty || !event.valueType) {
    throw new Error(`Dropzone specialized adapter spec requires ${eventName} event metadata.`);
  }

  return event as DropzoneRequiredEvent;
}

function getRequiredState(spec: SpecializedAdapterSpec, stateName: string): DropzoneRequiredState {
  const state = spec.stateModels.find((candidate) => candidate.name === stateName);
  if (
    !state?.controlledProp ||
    !state.initialAttribute ||
    !state.runtimeGetter ||
    !state.runtimeSetter ||
    state.controlledStateSync !== "custom-event"
  ) {
    throw new Error(`Dropzone specialized adapter spec requires ${stateName} state metadata.`);
  }

  return state as DropzoneRequiredState;
}

function getDropzoneAnatomyPart(
  spec: DropzoneSpecializedAdapterSpec,
  partName: string,
) {
  const part = spec.dropzone.anatomy.find((candidate) => candidate.part === partName);
  if (!part) {
    throw new Error(
      `Dropzone specialized adapter spec output model requires ${partName} part.`,
    );
  }

  return part;
}

function getDropzoneAttribute(
  spec: DropzoneSpecializedAdapterSpec,
  partName: string,
  attribute: string,
): string {
  const part = getDropzoneAnatomyPart(spec, partName);
  if (!part.initialAttributes.includes(attribute)) {
    throw new Error(
      `Dropzone specialized adapter spec output model requires ${attribute} attribute metadata for ${partName}.`,
    );
  }

  return attribute;
}

function getDropzoneSpecFileBasename(
  spec: DropzoneSpecializedAdapterSpec,
  partName: string,
): string {
  const file = spec.files.find(
    (candidate) => candidate.kind === "part" && candidate.part === partName,
  );
  if (!file || file.kind !== "part") {
    throw new Error(
      `Dropzone specialized adapter spec output model requires ${partName} file.`,
    );
  }

  const expectedPath = `${spec.component}/${file.exportName}`;
  if (file.path !== expectedPath) {
    throw new Error(
      `Dropzone specialized adapter spec output model requires ${partName} file path ${expectedPath}.`,
    );
  }

  return file.exportName;
}

function getDropzoneFileDropControlPart(
  part: DropzoneAnatomyRecipe,
  entriesByPart: Map<string, DropzoneNamespaceObjectEntry>,
) {
  return {
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    name: part.part,
    namespaceKey: getRequiredNamespaceKey(entriesByPart, part.part),
  };
}

function getRequiredValue<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Dropzone specialized adapter spec requires ${context}.`);
  }

  return value;
}

function getAdapterFamilyProp(prop: {
  defaultValue?: string;
  name: string;
  required?: boolean;
  type: string;
}) {
  return {
    defaultValue: prop.defaultValue,
    name: prop.name,
    required: prop.required,
    type: prop.type,
  };
}

function getRequiredNamespaceKey(
  entriesByPart: Map<string, DropzoneNamespaceObjectEntry>,
  partName: string,
): string {
  const entry = entriesByPart.get(partName);
  if (!entry) {
    throw new Error(
      `Dropzone specialized adapter spec output model requires ${partName} namespace.`,
    );
  }

  return entry.property;
}

function getSourceProp(contract: RuntimeAdapterContract, propName: string): PrimitivePropContract {
  const prop = contract.props.find((candidate) => candidate.name === propName);
  if (!prop) {
    throw new Error(`Dropzone specialized adapter spec requires ${propName} source prop metadata.`);
  }

  return prop;
}

function getStaticAttributeName(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute) {
    throw new Error(`Dropzone specialized adapter spec requires ${name} metadata for ${partName}.`);
  }

  return attribute.name;
}

function getStaticAttributeValue(
  spec: SpecializedAdapterSpec,
  partName: string,
  name: string,
): string {
  const attribute = spec.renderPlan.staticAttributes.find(
    (candidate) => candidate.part === partName && candidate.name === name,
  );
  if (!attribute?.value) {
    throw new Error(
      `Dropzone specialized adapter spec requires ${name} value metadata for ${partName}.`,
    );
  }

  return attribute.value;
}

function getTargetProp(
  spec: SpecializedAdapterSpec,
  propName: string,
  targetPart: string,
): PrimitivePropContract {
  const prop = findTargetProp(spec, propName, targetPart);
  if (!prop) {
    throw new Error(
      `Dropzone specialized adapter spec requires ${propName} prop metadata for ${targetPart}.`,
    );
  }

  return prop;
}

function hasPart(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.parts.some((part) => part.name === partName);
}

function hasPublicRef(spec: SpecializedAdapterSpec, partName: string): boolean {
  return spec.refs.some((ref) => ref.part === partName && ref.public);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function recipeEquals(buildExpected: () => unknown, actual: unknown): boolean {
  try {
    return recordsEqual(actual, buildExpected());
  } catch {
    return false;
  }
}

function recordsArrayEqual(actual: unknown[], expected: unknown[]): boolean {
  return (
    actual.length === expected.length &&
    actual.every((entry, index) => recordsEqual(entry, expected[index]))
  );
}

function recordsEqual(actual: unknown, expected: unknown): boolean {
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function assertValidDropzoneAdapterOutputModelSpec(spec: DropzoneSpecializedAdapterSpec): void {
  const errors = validateDropzoneSpecializedAdapterSpec(spec);
  if (errors.length > 0) {
    throw new Error(
      `Dropzone specialized adapter spec output model cannot build invalid Dropzone spec:\n${errors.join("\n")}`,
    );
  }
}

function toProjectedPropRecipe(prop: PrimitivePropContract) {
  return {
    defaultValue: prop.defaultValue,
    kind: prop.kind,
    name: prop.name,
    required: prop.required,
    targets: prop.targets ? [...prop.targets] : undefined,
    type: prop.type,
  };
}

function toPascalCase(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((segment) => `${segment[0].toUpperCase()}${segment.slice(1)}`)
    .join("");
}

function pluralizeDisplayName(displayName: string): string {
  return `${displayName}s`;
}
