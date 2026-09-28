import { createStyledNativeConsumer } from "./styled-native-consumer.js";
export const createStyledInputConsumer = (repoRoot: string) =>
  createStyledNativeConsumer(repoRoot, ["input"]);
export const inputImports = `import Input, { Input as NamedInput, InputVariants, type InputProps } from "./input/index.js";
import Primitive, { InputRoot, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/input";`;
export const inputPositive = `<script lang="ts">
${inputImports}
import { createAttachmentKey } from "svelte/attachments";
let value = $state<InputValue | undefined>();
const props: InputProps = { size: "lg", defaultValue: ["one", "two"], readonly: true, name: "input", ref(node) { const input: HTMLInputElement | null = node; void input; } };
const attached = { [createAttachmentKey()]: (node: HTMLInputElement) => { void node.value; return () => {}; } };
void InputVariants.input({ size: "sm" });
</script>
<Input {...props} {...attached} bind:value onValueChange={(next, detail) => { const text: string = next; const typed: InputValueChangeDetails = detail; void [text, typed]; }} oninput={(event) => { const node: HTMLInputElement = event.currentTarget; void node; }} />
<NamedInput size="md" value={2} /><Primitive.Root defaultValue="seed" bind:value /><InputRoot value={["a"]} /><Primitive.Root bind:value={() => value, next => value = next} />`;
