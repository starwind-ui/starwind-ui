/** Assertions embedded in isolated Svelte consumers, after each effect flush. */
export const nativeAttachmentOwnership = `
const attachmentOwners = new Map<string, Element>();
function beginAttachment(name: string, node: Element) {
  if (attachmentOwners.has(name)) throw new Error("duplicate live attachment " + name);
  attachmentOwners.set(name, node);
  return () => {
    if (attachmentOwners.get(name) !== node) throw new Error("attachment cleanup lost owner " + name);
    attachmentOwners.delete(name);
  };
}
function verifyAttachmentOwners(owners: Map<string, Element>) {
  for (const [name, node] of owners) {
    if (attachmentOwners.get(name) !== node) throw new Error("ref and attachment semantic owners differ " + name);
  }
}`;
