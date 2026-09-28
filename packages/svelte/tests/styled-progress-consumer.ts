import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledProgressConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["progress"]);
export const progressImports = `import Progress, { Progress as NamedProgress, ProgressVariants, type ProgressProps } from "./progress/index.js";
import Primitive, { ProgressRoot, ProgressTrack, ProgressIndicator, ProgressLabel, ProgressValue } from "@starwind-ui/svelte/progress";
import { ProgressValue as RootValue } from "@starwind-ui/svelte";`;
export const progressPositive = `<script lang="ts">
${progressImports}
import { createAttachmentKey, type Attachment } from "svelte/attachments";
let value: ProgressValue = 25; const rootValue: RootValue = null; void rootValue;
const divRef = (node: HTMLDivElement | null) => { void node; };
const spanRef = (node: HTMLSpanElement | null) => { void node; };
const attachment: Attachment<HTMLDivElement> = (node) => { void node.style; return () => {}; };
const attachmentProps = { [createAttachmentKey()]: attachment };
const styled: ProgressProps = { value: 25, min: 10, max: 90, variant: "success", label: "Upload", ref: divRef, class: ["caller", { active: true }], style: "height: 1rem" };
void [ProgressVariants.progress(), ProgressVariants.progressTrack(), ProgressVariants.progressIndicator({ variant: "indeterminate", color: "primary" })];
</script>
<Progress {...styled} {...attachmentProps} onclick={(event) => { const node: HTMLDivElement = event.currentTarget; void node; }} />
<NamedProgress value={null} label="Waiting" />
<Primitive.Root {value} min={0} max={100} locale="en-US" format={{ style: "decimal", maximumFractionDigits: 1 }} getAriaValueText={(formatted, next) => { const typed: ProgressValue = next; return formatted ?? String(typed); }} ref={divRef}>
  <Primitive.Label ref={spanRef}>Download</Primitive.Label>
  <Primitive.Track ref={divRef}><Primitive.Indicator ref={divRef} style="transform: translateX(-75%)" /></Primitive.Track>
  <Primitive.Value ref={spanRef} /><Primitive.Value>Caller text</Primitive.Value>
</Primitive.Root>
<ProgressRoot value={null} ref={divRef}><ProgressTrack ref={divRef}><ProgressIndicator ref={divRef} /></ProgressTrack><ProgressLabel ref={spanRef}>Named</ProgressLabel><ProgressValue ref={spanRef} /></ProgressRoot>`;
