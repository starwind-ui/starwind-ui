import Progress from "./Progress.svelte";
import { progress, progressIndicator, progressTrack } from "./variants.js";
export type { ProgressProps } from "./Progress.svelte";
const ProgressVariants = { progress, progressIndicator, progressTrack };
export { Progress, ProgressVariants };
export default Progress;
