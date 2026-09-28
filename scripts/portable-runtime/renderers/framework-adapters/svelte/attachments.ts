// These printers keep generated element refs and forwarded attachment symbols reactive.
export function printSvelteRefAttachment(
  elementType: string,
  ref = "ref",
  name = "attachRef",
): string {
  const factory = `create${name[0]!.toUpperCase()}${name.slice(1)}`;
  return `  import { createRefAttachment as ${factory} } from "../_internal/ref-attachment.js";
  const ${name} = ${factory}<${elementType}>(() => ${ref});`;
}

export function printSvelteForwardedAttachments(elementType: string): string {
  return `  import { discoverForwardedAttachments } from "../_internal/forwarded-attachment-discovery.js";
  import { createForwardedAttachment } from "../_internal/attachment-execution.svelte.js";
  let forwardedCache: [symbol, Attachment<${elementType}>][] = [];
  let forwardedAttachments = $derived.by(() => {
    return (forwardedCache = discoverForwardedAttachments(rest, forwardedCache));
  });
  const attachForwarded = createForwardedAttachment(() => forwardedAttachments);`;
}
