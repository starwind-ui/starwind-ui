import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const DialogClose: import("svelte").Component<Props, {}, "">;
type DialogClose = ReturnType<typeof DialogClose>;
export default DialogClose;
//# sourceMappingURL=DialogClose.svelte.d.ts.map