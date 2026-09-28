export function printSvelteRefAttachmentHelper(): string {
  return `import { untrack } from "svelte";
import type { Attachment } from "svelte/attachments";

export function createRefAttachment<
  Element extends EventTarget,
  PublicElement extends Element = Element,
>(readRef: () => ((element: PublicElement | null) => void) | undefined): Attachment<Element> {
  return (element) => {
    const callback = readRef();
    untrack(() => callback?.(element as PublicElement));
    return () => untrack(() => callback?.(null));
  };
}`;
}
