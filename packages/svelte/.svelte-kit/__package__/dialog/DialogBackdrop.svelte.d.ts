import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const DialogBackdrop: import("svelte").Component<Props, {}, "">;
type DialogBackdrop = ReturnType<typeof DialogBackdrop>;
export default DialogBackdrop;
//# sourceMappingURL=DialogBackdrop.svelte.d.ts.map