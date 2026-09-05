import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const ToastClose: import("svelte").Component<Props, {}, "">;
type ToastClose = ReturnType<typeof ToastClose>;
export default ToastClose;
//# sourceMappingURL=ToastClose.svelte.d.ts.map