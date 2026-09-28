import { createStyledPopoverConsumer } from "./styled-popover-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";
export async function createStyledColorPickerConsumer(repoRoot: string) {
  const consumer = await createStyledPopoverConsumer(repoRoot);
  try {
    await writeStyledConsumerFiles(consumer, repoRoot, [
      "color-picker",
      "select",
      "native-select",
      "input",
      "dialog",
    ]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}
export const styledColorPickerPositive = `<script lang="ts">
import Picker,{ColorPicker,ColorPickerInput,ColorPickerTrigger,ColorPickerContent,ColorPickerArea,ColorPickerChannelSlider,ColorPickerChannelInput,ColorPickerValueSwatch,ColorPickerSwatchGroup,ColorPickerSwatch,ColorPickerEyeDropper,ColorPickerClear,ColorPickerVariants} from "./color-picker/index.js";
import type {ColorPickerValue,ColorPickerFormat} from "@starwind-ui/svelte/color-picker";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let value=$state.raw<ColorPickerValue|undefined>(),format=$state<ColorPickerFormat|undefined>(),open=$state<boolean|undefined>();
const attachment:Attachment<HTMLDivElement>=node=>{void node;return()=>{};};
ColorPickerVariants.colorPickerChannelInput();ColorPickerVariants.colorPickerValueInput();ColorPickerVariants.colorPickerNativeFormatSelect();
</script>
<ColorPicker bind:value bind:format bind:open label="Accent" name="accent" clearable defaultOpen onOpenChange={(next,detail)=>{const accepted:boolean=next;detail.cancel();void accepted;}} onCloseComplete={detail=>{void detail;}} onValueChange={(color,detail)=>{color?.toString("hex");detail.cancel();}} onValueCommitted={(color,detail)=>{void [color,detail];}} onFormatChange={(next,detail)=>{const typed:ColorPickerFormat=next;void [typed,detail];}} ref={node=>{const element:HTMLDivElement|null=node;void element;}} {...{[createAttachmentKey()]:attachment}}>
<ColorPickerTrigger>Accent</ColorPickerTrigger><ColorPickerContent formatControl="native"><ColorPickerArea/><ColorPickerChannelSlider channel="hue" orientation="vertical"/><ColorPickerChannelInput channel="red"/><ColorPickerInput formatControl="none"/><ColorPickerValueSwatch/><ColorPickerSwatchGroup><ColorPickerSwatch value="#ff0000" disabled={false}/></ColorPickerSwatchGroup><ColorPickerEyeDropper/><ColorPickerClear>Clear</ColorPickerClear></ColorPickerContent></ColorPicker>
<Picker.Root inline open={true} formatControl="select" swatches={["#00ff00",{value:"#ff0000",label:"Red",disabled:true}]}/>`;
