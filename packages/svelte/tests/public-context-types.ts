/**
 * Type checks for the public Select context. svelte-check covers this file through the package
 * tsconfig. The public type carries state only. Runtime wiring stays internal to the parts.
 */
import type { SelectContextValue } from "@starwind-ui/svelte/select";

declare const publicSelectContext: SelectContextValue;
void publicSelectContext.selectedLabel;
// @ts-expect-error Select keeps registerPortal internal.
void publicSelectContext.registerPortal;
// @ts-expect-error Select keeps registerTrigger internal.
void publicSelectContext.registerTrigger;
// @ts-expect-error Select keeps mounted internal.
void publicSelectContext.mounted;
