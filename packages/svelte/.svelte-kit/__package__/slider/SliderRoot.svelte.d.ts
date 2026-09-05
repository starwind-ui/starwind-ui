import { type SliderOrientation, type SliderValue, type SliderValueChangeDetails, type SliderValueCommitDetails } from "@starwind-ui/runtime/slider";
import { type Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
type Props = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
    children?: Snippet<[SliderValue]>;
    defaultValue?: SliderValue;
    value?: SliderValue;
    disabled?: boolean;
    form?: string;
    largeStep?: number;
    max?: number;
    min?: number;
    minStepsBetweenValues?: number;
    name?: string;
    orientation?: SliderOrientation;
    step?: number;
    onValueChange?: (value: SliderValue, detail: SliderValueChangeDetails) => void;
    onValueCommitted?: (value: SliderValue, detail: SliderValueCommitDetails) => void;
    ref?: (element: HTMLDivElement | null) => void;
};
declare const SliderRoot: import("svelte").Component<Props, {}, "value">;
type SliderRoot = ReturnType<typeof SliderRoot>;
export default SliderRoot;
//# sourceMappingURL=SliderRoot.svelte.d.ts.map