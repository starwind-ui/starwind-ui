import type { AdapterFileDropControlFacts } from "../../../framework-adapters/types.js";
import { requireRefreshConnection } from "../../../primitive-output-model/refresh-connection.js";

export interface DropzoneOperations {
  read: string;
  notify(files: string, detail: string): string;
  untrack(body: string): string;
}

export const dropzoneInitialState = { dragActive: "false", hasFiles: "false" } as const;
export function dropzoneTabIndex(disabled: string): string {
  return `${disabled} ? -1 : 0`;
}

/** Accepted Runtime events own files. Authored option changes are commands; unchanged props preserve imperative upload state. */
export function dropzoneConnection(
  facts: AdapterFileDropControlFacts,
  ops: DropzoneOperations,
): string {
  const refresh = requireRefreshConnection(facts.runtime.refresh, "owned-descendants");
  const fields = [
    { name: facts.props.disabled.name, setter: facts.setters.disabled },
    { name: facts.props.isUploading.name, setter: facts.setters.uploading },
  ];
  return `function connectDropzone(root: HTMLElement) {
    let previous = ${ops.read};
    const instance = ${facts.runtime.factory}(root, {
      ${fields.map(({ name }) => `${name}: previous.${name},`).join("\n")}
    });
    const unsubscribe = instance.subscribe("${facts.event.name}", (detail) => {
      ${ops.untrack(ops.notify("detail.files", "detail"))}
    });
    const stopDiscovery = observeFormDiscovery(root.ownerDocument, () => {
      ${ops.untrack(`instance.${refresh.method}();`)}
    });
    return {
      update(): void {
        const next = ${ops.read};
        ${fields.map(({ name, setter }) => `if (next.${name} !== previous.${name}) instance.${setter}(next.${name});`).join("\n")}
        previous = next;
      },
      destroy(): void {
        stopDiscovery();
        unsubscribe();
        instance.destroy();
      },
    };
  }`;
}

export function dropzoneIndicatorHidden(
  part: "loadingIndicator" | "uploadIndicator",
  uploading: string,
): string {
  return part === "loadingIndicator" ? `!${uploading}` : uploading;
}
