import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledSliderConsumer = (root: string) =>
  createStyledNativeConsumer(root, ["slider"]);
const imports = `import Slider,{Slider as NamedSlider,SliderVariants,type SliderProps} from "./slider/index.js";
import Primitive,{type SliderValue,type SliderValueChangeDetails,type SliderValueCommitDetails} from "@starwind-ui/svelte/slider";
import {createAttachmentKey} from "svelte/attachments";`;
export const sliderPositive = `<script lang="ts">
${imports}
let value=$state<SliderValue>();
const props:SliderProps={defaultValue:[20,80],variant:"primary",name:"range",form:"preferences",min:0,max:100,step:5,largeStep:20,orientation:"vertical",disabled:false,onValueChange(next,details){const value:SliderValue=next;const detail:SliderValueChangeDetails=details;detail.cancel();void value;},onValueCommitted(next,details){const value:SliderValue=next;const detail:SliderValueCommitDetails=details;void [value,detail];},ref(node){const root:HTMLDivElement|null=node;void root;}};
const attached={[createAttachmentKey()]:(node:HTMLDivElement)=>{void node.dataset;return()=>{};}};
void [SliderVariants.slider(),SliderVariants.sliderControl(),SliderVariants.sliderTrack(),SliderVariants.sliderRange({variant:"error"}),SliderVariants.sliderThumb({variant:"warning"})];
</script>
<Slider {...props} {...attached} bind:value onclick={event=>{const node:HTMLDivElement=event.currentTarget;void node;}} aria-label="Range"/>
<NamedSlider value={50}/>
<Primitive.Root value={[10,90]} minStepsBetweenValues={1}><Primitive.Label>Price</Primitive.Label><Primitive.Control><Primitive.Track><Primitive.Indicator/></Primitive.Track><Primitive.Thumb index={0} ref={(node:HTMLDivElement|null)=>{}} inputRef={(node:HTMLInputElement|null)=>{}}/></Primitive.Control></Primitive.Root>`;
