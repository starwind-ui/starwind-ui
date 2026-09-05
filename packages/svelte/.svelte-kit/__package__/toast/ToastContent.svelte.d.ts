import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const ToastContent: import("svelte").Component<Props, {}, "">;
type ToastContent = ReturnType<typeof ToastContent>;
export default ToastContent;
//# sourceMappingURL=ToastContent.svelte.d.ts.map