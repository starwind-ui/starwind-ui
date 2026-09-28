export function printSvelteAttachmentExecution(): string {
  return `import type { Attachment } from "svelte/attachments";

export function createForwardedAttachment<Target extends EventTarget>(
  readAttachments: () => readonly [symbol, Attachment<Target>][],
): Attachment<Target> {
  return (element) => {
    const effects = new Map<
      symbol,
      { attachment: Attachment<Target>; destroy: () => void }
    >();
    $effect(() => {
      const next = new Map(readAttachments());
      for (const [key, effect] of effects) {
        if (next.get(key) !== effect.attachment) {
          effect.destroy();
          effects.delete(key);
        }
      }
      for (const [key, attachment] of next) {
        if (!effects.has(key)) {
          effects.set(key, {
            attachment,
            destroy: $effect.root(() => {
              $effect(() => attachment(element));
            }),
          });
        }
      }
    });
    return () => {
      for (const effect of effects.values()) effect.destroy();
    };
  };
}`;
}
