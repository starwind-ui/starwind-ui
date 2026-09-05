import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLElement | null) => void;
};
declare const AccordionHeader: import("svelte").Component<Props, {}, "">;
type AccordionHeader = ReturnType<typeof AccordionHeader>;
export default AccordionHeader;
//# sourceMappingURL=AccordionHeader.svelte.d.ts.map