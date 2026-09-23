import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const nativeFormRoots = ["native-select", "textarea"] as const;
export const nativeFormImports = `import NativeSelect, {NativeSelect as NamedSelect, NativeSelectOption, NativeSelectOptGroup, NativeSelectVariants, type NativeSelectProps, type NativeSelectOptionProps, type NativeSelectOptGroupProps} from "./native-select/index.js";
import Textarea, {Textarea as NamedTextarea, TextareaVariants, type TextareaProps} from "./textarea/index.js";`;
export const createStyledNativeFormConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, nativeFormRoots);
export const nativeFormPositive = `<script lang="ts">
${nativeFormImports}
let text:string|null|undefined=$state(undefined), single=$state(2), multiple:number[]=$state([1,2]);
const object={id:1}; let selected:typeof object|undefined=$state(undefined);
let textareaRef=$state<HTMLTextAreaElement>(), selectRef=$state<HTMLSelectElement>(), optionRef=$state<HTMLOptionElement>(), groupRef=$state<HTMLOptGroupElement>();
const textarea:TextareaProps={name:"notes",defaultValue:"Draft",rows:4,cols:30,wrap:"soft",maxlength:200,"aria-describedby":"hint",class:["writing",{active:true}],style:"resize:vertical",ref:textareaRef,oninput(event){const owner:HTMLTextAreaElement=event.currentTarget;void owner;}};
const select:NativeSelectProps={name:"choice",size:"sm",required:true,disabled:false,class:["choice",{active:true}],ref:selectRef,onchange(event){const owner:HTMLSelectElement=event.currentTarget;void owner;}};
const option:NativeSelectOptionProps={class:["option",{active:true}],value:object,selected:true,disabled:false,label:"One",ref:optionRef,onclick(event){const owner:HTMLOptionElement=event.currentTarget;void owner;}};
const group:NativeSelectOptGroupProps={class:["group",{active:true}],label:"Options",disabled:false,ref:groupRef,onpointerdown(event){const owner:HTMLOptGroupElement=event.currentTarget;void owner;}};
void [NativeSelectVariants.nativeSelect({size:"lg"}),NativeSelectVariants.nativeSelectWrapper(),NativeSelectVariants.nativeSelectIcon({size:"sm"}),TextareaVariants.textarea({size:"lg"})];
</script>
<Textarea {...textarea} bind:value={text}/><NamedTextarea value="Plain"/><Textarea defaultValue="Default"/><Textarea value={undefined}/>
<NativeSelect.Root {...select} bind:value={single}><NativeSelect.OptGroup {...group}><NativeSelect.Option value={1}>One</NativeSelect.Option><NativeSelect.Option value={2}>Two</NativeSelect.Option></NativeSelect.OptGroup>{#snippet icon()}<span aria-hidden="true">⌄</span>{/snippet}</NativeSelect.Root>
<NamedSelect multiple bind:value={multiple}><NativeSelectOption value={1}>One</NativeSelectOption><NativeSelectOption value={2}>Two</NativeSelectOption></NamedSelect>
<NamedSelect bind:value={selected}><NativeSelectOptGroup {...group}><NativeSelectOption {...option}>Object</NativeSelectOption></NativeSelectOptGroup></NamedSelect>
<NamedSelect multiple><NativeSelectOption selected value={1}>Omitted multiple</NativeSelectOption></NamedSelect>
<NamedSelect value={object}><NativeSelectOption value={object}>Object</NativeSelectOption></NamedSelect><NamedSelect><NativeSelectOption>Omitted</NativeSelectOption></NamedSelect><NamedSelect value={undefined}><NativeSelectOption>Undefined</NativeSelectOption></NamedSelect>`;
