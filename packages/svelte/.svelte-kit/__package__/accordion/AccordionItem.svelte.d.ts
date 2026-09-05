import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    value?: string;
    disabled?: boolean;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const AccordionItem: import("svelte").Component<Props, {}, "">;
type AccordionItem = ReturnType<typeof AccordionItem>;
export default AccordionItem;
//# sourceMappingURL=AccordionItem.svelte.d.ts.map