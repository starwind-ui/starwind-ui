import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    targetId?: string;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const DialogTrigger: import("svelte").Component<Props, {}, "">;
type DialogTrigger = ReturnType<typeof DialogTrigger>;
export default DialogTrigger;
//# sourceMappingURL=DialogTrigger.svelte.d.ts.map