import type { DescendantConnectionOperations } from "../../shared-recipes/structured/document-controls/form-policy.js";
/** Svelte attachments can run before descendant controls finish attaching. */
export const svelteDocumentConnection: DescendantConnectionOperations = {
  afterDescendants: (body) =>
    `queueMicrotask(() => {\n      if (!active) return;\n      ${body.replaceAll("\n", "\n      ")}\n    });`,
};
