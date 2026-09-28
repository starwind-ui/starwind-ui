export function printSvelteForwardedAttachmentDiscovery(): string {
  return `import type { Attachment } from "svelte/attachments";

export function discoverForwardedAttachments<T extends Element>(
  props: object,
  previous: [symbol, Attachment<T>][],
): [symbol, Attachment<T>][] {
  const values = props as Record<symbol, unknown>;
  const next = Object.getOwnPropertySymbols(values)
    .map((key) => [key, values[key]] as [symbol, Attachment<T>])
    .filter(([, attachment]) => typeof attachment === "function");
  if (next.length === previous.length && next.every(([key, attachment], index) =>
    key === previous[index]?.[0] && attachment === previous[index]?.[1]
  )) return previous;
  return next;
}
`;
}
