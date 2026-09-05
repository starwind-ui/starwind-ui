import { type Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
type Props = Omit<HTMLButtonAttributes, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLButtonElement | null) => void;
};
declare const AccordionTrigger: import("svelte").Component<Props, {}, "">;
type AccordionTrigger = ReturnType<typeof AccordionTrigger>;
export default AccordionTrigger;
//# sourceMappingURL=AccordionTrigger.svelte.d.ts.map