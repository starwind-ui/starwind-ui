import type {
  AdapterCompositeMenuOverlayFacts,
  AdapterControlledValuePresenceFacts,
  AdapterEditableCollectionOverlayFacts,
  AdapterHelperFile,
  AdapterIndexFile,
  AdapterOptionCollectionOverlayFacts,
  AdapterOutputModel,
  AdapterSidebarFacts,
} from "../types.js";

export function projectSpecializedAdapterOutputModel(
  model: AdapterOutputModel,
): AdapterOutputModel {
  let projectedFiles = projectColorPickerFamily(model.files);
  projectedFiles = addProjectedHelperFile(projectedFiles, {
    createHelper: createOptionCollectionOverlayContextHelperFile,
    findIndex: isOptionCollectionOverlayIndexFile,
    placement: "prepend",
  });
  projectedFiles = addProjectedHelperFile(projectedFiles, {
    createHelper: createEditableCollectionOverlayContextHelperFile,
    findIndex: isEditableCollectionOverlayIndexFile,
    placement: "prepend",
  });
  projectedFiles = addProjectedHelperFile(projectedFiles, {
    createHelper: createControlledValuePresenceContextHelperFile,
    findIndex: isControlledValuePresenceIndexFile,
    placement: "before-index",
  });
  projectedFiles = addProjectedHelperFile(projectedFiles, {
    createHelper: createSidebarContextHelperFile,
    findIndex: isSidebarIndexFile,
    placement: "prepend",
  });
  projectedFiles = addProjectedHelperFile(projectedFiles, {
    createHelper: createCompositeMenuOverlayRadioContextHelperFile,
    findIndex: isCompositeMenuOverlayIndexFile,
    placement: "prepend",
  });

  return projectedFiles === model.files ? model : { files: projectedFiles };
}

function projectColorPickerFamily(files: AdapterOutputModel["files"]): AdapterOutputModel["files"] {
  let changed = false;
  const projected = files.map((file) => {
    if (file.kind === "component" && file.component.family?.kind === "color-picker") {
      changed = true;
      return {
        ...file,
        component: {
          ...file.component,
          family: { ...file.component.family, kind: "react-color-picker" },
        },
        target: "react",
      } as unknown as AdapterOutputModel["files"][number];
    }
    if (file.kind === "index" && file.family?.kind === "color-picker") {
      changed = true;
      return {
        ...file,
        family: { ...file.family, kind: "react-color-picker" },
        target: "react",
      } as unknown as AdapterOutputModel["files"][number];
    }
    return file;
  });
  return changed ? projected : files;
}

function isCompositeMenuOverlayIndexFile(
  file: AdapterOutputModel["files"][number],
): file is AdapterIndexFile & {
  family: { facts: AdapterCompositeMenuOverlayFacts; kind: "composite-menu-overlay" };
} {
  return file.kind === "index" && file.family?.kind === "composite-menu-overlay";
}

function isOptionCollectionOverlayIndexFile(
  file: AdapterOutputModel["files"][number],
): file is AdapterIndexFile & {
  family: { facts: AdapterOptionCollectionOverlayFacts; kind: "option-collection-overlay" };
} {
  return file.kind === "index" && file.family?.kind === "option-collection-overlay";
}

function isEditableCollectionOverlayIndexFile(
  file: AdapterOutputModel["files"][number],
): file is AdapterIndexFile & {
  family: { facts: AdapterEditableCollectionOverlayFacts; kind: "editable-collection-overlay" };
} {
  return file.kind === "index" && file.family?.kind === "editable-collection-overlay";
}

function isControlledValuePresenceIndexFile(
  file: AdapterOutputModel["files"][number],
): file is AdapterIndexFile & {
  family: { facts: AdapterControlledValuePresenceFacts; kind: "controlled-value-presence" };
} {
  return file.kind === "index" && file.family?.kind === "controlled-value-presence";
}

function isSidebarIndexFile(file: AdapterOutputModel["files"][number]): file is AdapterIndexFile & {
  family: { facts: AdapterSidebarFacts; kind: "sidebar" };
} {
  return file.kind === "index" && file.family?.kind === "sidebar";
}

function createCompositeMenuOverlayRadioContextHelperFile(
  indexFile: AdapterIndexFile & {
    family: { facts: AdapterCompositeMenuOverlayFacts; kind: "composite-menu-overlay" };
  },
): AdapterHelperFile {
  const directory = indexFile.path.replace(/\/index\.ts$/, "");
  const facts = indexFile.family.facts;

  return {
    body: { code: "" },
    family: { facts, kind: "composite-menu-overlay-radio-context" },
    imports: [],
    kind: "helper",
    name: `${facts.displayName}RadioContext`,
    path: `${directory}/${facts.displayName}RadioContext.tsx`,
  };
}

function createOptionCollectionOverlayContextHelperFile(
  indexFile: AdapterIndexFile & {
    family: { facts: AdapterOptionCollectionOverlayFacts; kind: "option-collection-overlay" };
  },
): AdapterHelperFile {
  const directory = indexFile.path.replace(/\/index\.ts$/, "");
  const facts = indexFile.family.facts;

  return {
    body: { code: "" },
    family: { facts, kind: "option-collection-overlay" },
    imports: [],
    kind: "helper",
    name: facts.context.rootContext,
    path: `${directory}/${facts.context.rootContext}.tsx`,
  };
}

function createEditableCollectionOverlayContextHelperFile(
  indexFile: AdapterIndexFile & {
    family: { facts: AdapterEditableCollectionOverlayFacts; kind: "editable-collection-overlay" };
  },
): AdapterHelperFile {
  const directory = indexFile.path.replace(/\/index\.ts$/, "");
  const facts = indexFile.family.facts;

  return {
    body: { code: "" },
    family: { facts, kind: "editable-collection-overlay" },
    imports: [],
    kind: "helper",
    name: facts.context.rootContext,
    path: `${directory}/${facts.context.rootContext}.tsx`,
  };
}

function createControlledValuePresenceContextHelperFile(
  indexFile: AdapterIndexFile & {
    family: { facts: AdapterControlledValuePresenceFacts; kind: "controlled-value-presence" };
  },
): AdapterHelperFile {
  const directory = indexFile.path.replace(/\/index\.ts$/, "");
  const facts = indexFile.family.facts;

  return {
    body: { code: "" },
    family: { facts, kind: "controlled-value-presence" },
    imports: [],
    kind: "helper",
    name: facts.context.hookName,
    path: `${directory}/${facts.context.componentName}.tsx`,
  };
}

function createSidebarContextHelperFile(
  indexFile: AdapterIndexFile & {
    family: { facts: AdapterSidebarFacts; kind: "sidebar" };
  },
): AdapterHelperFile {
  const directory = indexFile.path.replace(/\/index\.ts$/, "");
  const facts = indexFile.family.facts;

  return {
    body: { code: "" },
    family: { facts, kind: "sidebar-context" },
    imports: [],
    kind: "helper",
    name: facts.context.name,
    path: `${directory}/${facts.context.name}.tsx`,
  };
}

function addProjectedHelperFile<TIndexFile extends AdapterIndexFile>(
  files: AdapterOutputModel["files"],
  {
    createHelper,
    findIndex,
    placement,
  }: {
    createHelper: (indexFile: TIndexFile) => AdapterHelperFile;
    findIndex: (file: AdapterOutputModel["files"][number]) => file is TIndexFile;
    placement: "before-index" | "prepend";
  },
): AdapterOutputModel["files"] {
  const indexFile = files.find(findIndex);
  if (!indexFile) return files;

  const helperFile = createHelper(indexFile);
  if (files.some((file) => file.path === helperFile.path)) return files;

  if (placement === "prepend") {
    return [helperFile, ...files];
  }

  const indexFilePosition = files.indexOf(indexFile);
  return [...files.slice(0, indexFilePosition), helperFile, ...files.slice(indexFilePosition)];
}
