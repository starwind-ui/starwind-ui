import { type DialogCloseCompleteDetails, type DialogOpenChangeDetails } from "@starwind-ui/runtime/dialog";
import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[boolean]>;
    defaultOpen?: boolean;
    open?: boolean;
    closeOnEscape?: boolean;
    closeOnOutsideInteract?: boolean;
    modal?: boolean;
    onOpenChange?: (open: boolean, detail: DialogOpenChangeDetails) => void;
    onCloseComplete?: (detail: DialogCloseCompleteDetails) => void;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const DialogRoot: import("svelte").Component<Props, {}, "open">;
type DialogRoot = ReturnType<typeof DialogRoot>;
export default DialogRoot;
//# sourceMappingURL=DialogRoot.svelte.d.ts.map