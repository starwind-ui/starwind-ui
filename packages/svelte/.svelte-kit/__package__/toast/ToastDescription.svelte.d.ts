import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const ToastDescription: import("svelte").Component<Props, {}, "">;
type ToastDescription = ReturnType<typeof ToastDescription>;
export default ToastDescription;
//# sourceMappingURL=ToastDescription.svelte.d.ts.map