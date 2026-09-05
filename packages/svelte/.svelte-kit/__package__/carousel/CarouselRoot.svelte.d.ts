import { type CarouselInstance, type CarouselOptions } from "@starwind-ui/runtime/carousel";
import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet;
    orientation?: "horizontal" | "vertical";
    opts?: CarouselOptions["opts"];
    plugins?: CarouselOptions["plugins"];
    setApi?: (api: CarouselInstance["api"]) => void;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const CarouselRoot: import("svelte").Component<Props, {}, "">;
type CarouselRoot = ReturnType<typeof CarouselRoot>;
export default CarouselRoot;
//# sourceMappingURL=CarouselRoot.svelte.d.ts.map