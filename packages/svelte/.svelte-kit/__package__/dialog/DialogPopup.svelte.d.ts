import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDialogElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDialogElement | null) => void;
};
declare const DialogPopup: import("svelte").Component<Props, {}, "">;
type DialogPopup = ReturnType<typeof DialogPopup>;
export default DialogPopup;
//# sourceMappingURL=DialogPopup.svelte.d.ts.map