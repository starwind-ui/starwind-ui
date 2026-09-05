import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Position = "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    duration?: number;
    gap?: string;
    limit?: number;
    peek?: string;
    position?: Position;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const ToastViewport: import("svelte").Component<Props, {}, "">;
type ToastViewport = ReturnType<typeof ToastViewport>;
export default ToastViewport;
//# sourceMappingURL=ToastViewport.svelte.d.ts.map