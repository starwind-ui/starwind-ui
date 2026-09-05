import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLParagraphElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLParagraphElement | null) => void;
};
declare const DialogDescription: import("svelte").Component<Props, {}, "">;
type DialogDescription = ReturnType<typeof DialogDescription>;
export default DialogDescription;
//# sourceMappingURL=DialogDescription.svelte.d.ts.map