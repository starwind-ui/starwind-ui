import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const AccordionPanel: import("svelte").Component<Props, {}, "">;
type AccordionPanel = ReturnType<typeof AccordionPanel>;
export default AccordionPanel;
//# sourceMappingURL=AccordionPanel.svelte.d.ts.map