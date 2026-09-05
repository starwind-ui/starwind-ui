import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const ToastAction: import("svelte").Component<Props, {}, "">;
type ToastAction = ReturnType<typeof ToastAction>;
export default ToastAction;
//# sourceMappingURL=ToastAction.svelte.d.ts.map