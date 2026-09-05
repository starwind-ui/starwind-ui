import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const ToastTitle: import("svelte").Component<Props, {}, "">;
type ToastTitle = ReturnType<typeof ToastTitle>;
export default ToastTitle;
//# sourceMappingURL=ToastTitle.svelte.d.ts.map