import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Variant = "default" | "error" | "info" | "loading" | "success" | "warning";
type Props = Omit<HTMLAttributes<HTMLTemplateElement>, "children"> & {
    children?: Snippet;
    variant?: Variant;
    ref?: (element: HTMLTemplateElement | null) => void;
};
declare const ToastTemplate: import("svelte").Component<Props, {}, "">;
type ToastTemplate = ReturnType<typeof ToastTemplate>;
export default ToastTemplate;
//# sourceMappingURL=ToastTemplate.svelte.d.ts.map