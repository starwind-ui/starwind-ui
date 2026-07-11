import type {
  AdapterCodeBlock,
  AdapterNamespaceExport,
  AdapterTypeFacade,
} from "./types.js";

export type AdapterExportMode = "type" | "value";
export type AdapterReExportRole = "helper" | "runtime-type" | "value";

export type AdapterExportInventory = {
  namespace: AdapterNamespaceExportFacts;
  reExports: AdapterReExportFacts[];
  typeFacades: AdapterTypeFacadeFacts[];
};

export type AdapterNamespaceExportFacts = {
  kind: AdapterNamespaceExport["kind"];
  members: AdapterNamespaceMemberFacts[];
  name: string;
};

export type AdapterNamespaceMemberFacts = {
  from: string;
  mode: AdapterExportMode;
  name: string;
};

export type AdapterReExportFacts = {
  kind: "re-export";
  mode: AdapterExportMode;
  names: string[];
  role: AdapterReExportRole;
  source: string;
};

export type AdapterTypeFacadeFacts = {
  /**
   * Target-neutral TypeScript type payload. Target adapters own the surrounding
   * file syntax and must not require framework syntax inside this block.
   */
  body: AdapterCodeBlock;
  exports: string[];
  name: string;
};

export function createAdapterExportInventory({
  namespaceExport,
  reExports = [],
  typeFacades = [],
}: {
  namespaceExport: AdapterNamespaceExport;
  reExports?: readonly AdapterReExportFacts[];
  typeFacades?: readonly AdapterTypeFacade[];
}): AdapterExportInventory {
  return {
    namespace: createNamespaceExportFacts(namespaceExport),
    reExports: reExports.map((reExport) => ({
      ...reExport,
      names: [...reExport.names],
    })),
    typeFacades: typeFacades.map(createTypeFacadeFacts),
  };
}

export function createRuntimeTypeExportFacts({
  names,
  source,
}: {
  names: readonly string[];
  source: string;
}): AdapterReExportFacts {
  return createAdapterReExportFacts({
    mode: "type",
    names,
    role: "runtime-type",
    source,
  });
}

export function createHelperExportFacts({
  names,
  source,
}: {
  names: readonly string[];
  source: string;
}): AdapterReExportFacts {
  return createAdapterReExportFacts({
    mode: "value",
    names,
    role: "helper",
    source,
  });
}

export function createValueExportFacts({
  names,
  source,
}: {
  names: readonly string[];
  source: string;
}): AdapterReExportFacts {
  return createAdapterReExportFacts({
    mode: "value",
    names,
    role: "value",
    source,
  });
}

function createNamespaceExportFacts(
  namespaceExport: AdapterNamespaceExport,
): AdapterNamespaceExportFacts {
  return {
    kind: namespaceExport.kind,
    members: namespaceExport.members.map((member) => ({
      from: member.from,
      mode: member.kind ?? "value",
      name: member.name,
    })),
    name: namespaceExport.namespace,
  };
}

function createAdapterReExportFacts({
  mode,
  names,
  role,
  source,
}: {
  mode: AdapterExportMode;
  names: readonly string[];
  role: AdapterReExportRole;
  source: string;
}): AdapterReExportFacts {
  return {
    kind: "re-export",
    mode,
    names: [...names],
    role,
    source,
  };
}

function createTypeFacadeFacts(typeFacade: AdapterTypeFacade): AdapterTypeFacadeFacts {
  return {
    body: typeFacade.body,
    exports: [...typeFacade.exports],
    name: typeFacade.name,
  };
}
