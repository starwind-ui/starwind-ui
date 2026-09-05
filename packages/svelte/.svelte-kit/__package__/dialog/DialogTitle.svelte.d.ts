import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLHeadingElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLHeadingElement | null) => void;
};
declare const DialogTitle: import("svelte").Component<Props, {}, "">;
type DialogTitle = ReturnType<typeof DialogTitle>;
export default DialogTitle;
//# sourceMappingURL=DialogTitle.svelte.d.ts.map