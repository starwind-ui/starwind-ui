import { createMenuConsumer } from "./menu-consumer.js";
export const createColorPickerConsumer = createMenuConsumer;

export const colorPickerPositive = `<script lang="ts">
import Picker, { ColorPicker, ColorPickerRoot, ColorPickerLabel, ColorPickerControl, ColorPickerValueInput, ColorPickerValueSwatch, ColorPickerValueText, ColorPickerArea, ColorPickerAreaBackground, ColorPickerAreaThumb, ColorPickerAreaInput, ColorPickerChannelSlider, ColorPickerChannelSliderTrack, ColorPickerChannelSliderThumb, ColorPickerChannelSliderInput, ColorPickerChannelInput, ColorPickerFormatSelect, ColorPickerFormatControl, ColorPickerTransparencyGrid, ColorPickerSwatchGroup, ColorPickerSwatch, ColorPickerEyeDropperTrigger, ColorPickerClear, ColorPickerHiddenInput, parseColor, createColorPickerInitialState, projectColorPickerInitialPart, type ColorPickerValue, type ColorPickerColor, type ColorPickerFormat, type ColorPickerOptions } from "@starwind-ui/svelte/color-picker";
import {ColorPickerRoot as RootExport,parseColor as rootParse} from "@starwind-ui/svelte";
import {createAttachmentKey,type Attachment} from "svelte/attachments";
let value=$state<ColorPickerValue|undefined>(),format=$state<ColorPickerFormat|undefined>();
const divRef=(node:HTMLDivElement|null)=>{}, spanRef=(node:HTMLSpanElement|null)=>{}, inputRef=(node:HTMLInputElement|null)=>{},buttonRef=(node:HTMLButtonElement|null)=>{},selectRef=(node:HTMLSelectElement|null)=>{};
const attachment:Attachment<HTMLInputElement>=(node)=>{void node.value;return()=>{};};
const attrs = {[createAttachmentKey()]:attachment};
const options:ColorPickerOptions={defaultValue:parseColor("#123456"),format:"hsb",alpha:false,allowEmpty:true,getColorDescription:color=>color?.toString()??"Empty"};
const initialState=createColorPickerInitialState(options);void projectColorPickerInitialPart(initialState,{part:"areaInput",axis:"x"});void [ColorPicker,RootExport,rootParse];
</script>
<ColorPickerRoot {...options} bind:value bind:format ref={divRef} onValueChange={(next,details)=>{const color:ColorPickerColor|null=next;void color?.withChannels("rgb",{alpha:0.5});details.cancel();}} onValueCommitted={(next,details)=>{if(details.previousValue)void next?.equals(details.previousValue);}} onFormatChange={(next,details)=>{const current:ColorPickerFormat=next;void details.previousFormat;void current;}}>
<ColorPickerLabel ref={spanRef}>Color</ColorPickerLabel><ColorPickerControl ref={divRef}><ColorPickerValueInput ref={inputRef} {...attrs}/><ColorPickerValueSwatch ref={spanRef}/><ColorPickerValueText ref={spanRef}/></ColorPickerControl>
<ColorPickerArea xChannel="saturation" yChannel="brightness" ref={divRef}><ColorPickerAreaBackground/><ColorPickerAreaThumb ref={spanRef}/><ColorPickerAreaInput axis="x" step={1} ref={inputRef}/><ColorPickerAreaInput axis="y"/></ColorPickerArea>
<ColorPickerChannelSlider channel="hue" orientation="vertical" step={2}><ColorPickerChannelSliderTrack/><ColorPickerChannelSliderThumb/><ColorPickerChannelSliderInput/></ColorPickerChannelSlider>
<ColorPickerChannelInput channel="red"/><ColorPickerFormatSelect ref={selectRef}><option value="hex">Hex</option></ColorPickerFormatSelect><ColorPickerFormatControl/>
<ColorPickerTransparencyGrid/><ColorPickerSwatchGroup><ColorPickerSwatch swatchValue="#ff0000" swatchDisabled ref={buttonRef} onclick={(event)=>{const button:HTMLButtonElement=event.currentTarget;void button;}}/></ColorPickerSwatchGroup><ColorPickerEyeDropperTrigger/><ColorPickerClear/><ColorPickerHiddenInput ref={inputRef}/>
</ColorPickerRoot>
<Picker.Root value={null} allowEmpty format="hsl"/><Picker.Root value="#ffffff" format="rgb"/>`;
