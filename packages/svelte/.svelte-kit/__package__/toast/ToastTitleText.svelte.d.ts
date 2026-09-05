import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLSpanElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLSpanElement | null) => void;
};
declare const ToastTitleText: import("svelte").Component<Props, {}, "">;
type ToastTitleText = ReturnType<typeof ToastTitleText>;
export default ToastTitleText;
//# sourceMappingURL=ToastTitleText.svelte.d.ts.map