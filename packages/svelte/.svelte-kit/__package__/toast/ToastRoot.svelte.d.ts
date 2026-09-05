import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Variant = "default" | "error" | "info" | "loading" | "success" | "warning";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    variant?: Variant;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const ToastRoot: import("svelte").Component<Props, {}, "">;
type ToastRoot = ReturnType<typeof ToastRoot>;
export default ToastRoot;
//# sourceMappingURL=ToastRoot.svelte.d.ts.map