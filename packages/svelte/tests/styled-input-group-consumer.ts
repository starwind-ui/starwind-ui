import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const inputGroupRoots = ["input-group", "button", "input", "textarea"] as const;
export const createStyledInputGroupConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, inputGroupRoots);
export const inputGroupImports = `import Group, { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea, InputGroupVariants, type InputGroupProps, type InputGroupAddonProps, type InputGroupButtonProps, type InputGroupInputProps, type InputGroupTextProps, type InputGroupTextareaProps } from "./input-group/index.js";`;
export const inputGroupPositive = `<script lang="ts">
${inputGroupImports}
import { createAttachmentKey } from "svelte/attachments";
import type { InputValue } from "@starwind-ui/svelte/input";
let input = $state<InputValue | undefined>(undefined), textarea = $state<string | null | undefined>(undefined);
let rootRef=$state<HTMLDivElement>(), addonRef=$state<HTMLDivElement>(), textRef=$state<HTMLSpanElement>(), textareaRef=$state<HTMLTextAreaElement>();
const root: InputGroupProps = { ref: rootRef };
const addon: InputGroupAddonProps = { align:"inline-end", ref: addonRef };
const button: InputGroupButtonProps = { type:"button", size:"icon-sm", variant:"outline", ref(node) { const button: HTMLButtonElement | null = node; void button; } };
const inputProps: InputGroupInputProps = { value:["a","b"], defaultValue:3, ref(node) { const input: HTMLInputElement | null = node; void input; }, onValueChange(next,detail) { const value: InputValue = next; void value; detail.cancel(); } };
const text: InputGroupTextProps = { ref: textRef };
const textareaProps: InputGroupTextareaProps = { defaultValue:"Seed", ref: textareaRef };
const attached = { [createAttachmentKey()]: (node:HTMLInputElement) => { void node.value; return () => {}; } };
void [InputGroupVariants.inputGroup(),InputGroupVariants.inputGroupAddon({align:"block-start"}),InputGroupVariants.inputGroupButton({size:"sm"}),InputGroupVariants.inputGroupInput(),InputGroupVariants.inputGroupText(),InputGroupVariants.inputGroupTextarea()];
</script>
<InputGroup {...root}><InputGroupAddon {...addon}><InputGroupText {...text}>Label</InputGroupText></InputGroupAddon><InputGroupInput {...inputProps} {...attached} bind:value={input} oninput={event=>{const node:HTMLInputElement=event.currentTarget;void node;}} /><InputGroupButton {...button}>Run</InputGroupButton></InputGroup>
<Group.Root><Group.Addon align="block-end"><Group.Text>More</Group.Text><Group.Button>Save</Group.Button></Group.Addon><Group.Input value={42} /><Group.Textarea {...textareaProps} bind:value={textarea} oninput={event=>{const node:HTMLTextAreaElement=event.currentTarget;void node;}} /></Group.Root>
<InputGroupTextarea value={null} />
<InputGroupButton as="a" href="/details" ref={(node:HTMLAnchorElement|null)=>{void node;}}>Details</InputGroupButton>`;
