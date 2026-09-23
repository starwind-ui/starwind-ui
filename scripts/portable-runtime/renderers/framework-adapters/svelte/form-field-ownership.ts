import {
  connectDocumentOwner,
  disposeDocumentOwner,
} from "../../shared-recipes/structured/document-controls/form-policy.js";
/** Private connection ownership; Runtime retains discovery and behavior. */
export function printSvelteFormFieldOwnership(): string {
  return `import { getContext, setContext } from "svelte";
import { createForm, type FormInstance } from "@starwind-ui/runtime/form";
const FORM_CONTEXT = Symbol("starwind-form");
const FIELD_CONTEXT = Symbol("starwind-field-refresh");
export function provideFieldRefresh(refresh: () => void): void { setContext(FIELD_CONTEXT, refresh); }
export function getFieldRefresh(): (() => void) | undefined { return getContext<(() => void) | undefined>(FIELD_CONTEXT); }
interface FormOwner { refresh(): void; }
export function getFormOwner(): FormOwner | undefined { return getContext<FormOwner | undefined>(FORM_CONTEXT); }
export function provideFormOwner() {
  let instance: FormInstance | undefined;
  const owner = {
    refresh() { instance?.refresh(); },
    connect(element: HTMLFormElement) { ${connectDocumentOwner("createForm", "element", "instance")} return instance; },
    disconnect(owned: FormInstance) { ${disposeDocumentOwner("instance", "owned")} },
  };
  setContext(FORM_CONTEXT, owner);
  return owner;
}
`;
}
