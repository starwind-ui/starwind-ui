import { type AccordionValue, type AccordionValueChangeDetails } from "@starwind-ui/runtime/accordion";
import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[AccordionValue]>;
    type?: "single" | "multiple";
    defaultValue?: AccordionValue;
    value?: AccordionValue;
    collapsible?: boolean;
    onValueChange?: (value: AccordionValue, detail: AccordionValueChangeDetails) => void;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const AccordionRoot: import("svelte").Component<Props, {}, "value">;
type AccordionRoot = ReturnType<typeof AccordionRoot>;
export default AccordionRoot;
//# sourceMappingURL=AccordionRoot.svelte.d.ts.map