import { createStyledNativeConsumer } from "./styled-native-consumer.js";

export const createStyledFieldConsumer = (root: string) =>
  createStyledNativeConsumer(root, [
    "field",
    "separator",
    "form",
    "input",
    "textarea",
    "checkbox",
    "radio-group",
    "checkbox-group",
  ]);
export const fieldImports = `import Field, { Field as Root, FieldContent, FieldControl, FieldDescription, FieldError, FieldGroup, FieldItem, FieldLabel, FieldLegend, FieldSeparator, FieldSet, FieldTitle, FieldValidity, FieldVariants, type FieldControlProps } from "./field/index.js";
import PrimitiveField, { FieldRoot, FieldLabel as PrimitiveLabel, FieldControl as PrimitiveControl, FieldDescription as PrimitiveDescription, FieldItem as PrimitiveItem, FieldError as PrimitiveError, FieldValidity as PrimitiveValidity, type InputValue, type InputValueChangeDetails } from "@starwind-ui/svelte/field";
import { createField, type FieldInstance, type FieldOptions } from "@starwind-ui/runtime/field";`;
export const fieldPositive = `<script lang="ts">
${fieldImports}
import { createAttachmentKey } from "svelte/attachments";
let value = $state<InputValue>();
const props: FieldControlProps = { size: "sm", name: "email", autocomplete: "email", onValueChange(value, detail) { const text: string = value; const details: InputValueChangeDetails = detail; void [text,details]; }, ref(node) { const input: HTMLInputElement | null = node; void input; } };
const attached = { [createAttachmentKey()]: (node: HTMLInputElement) => { void node.value; return () => {}; } };
const options: FieldOptions = { dirty: false, touched: false, invalid: false };
void [options,FieldVariants.field({orientation:"responsive"}),FieldVariants.fieldGroup({variant:"outline"})];
</script>
<Field.Set><Field.Legend>Profile</Field.Legend><Field.Group variant="outline"><Field.Root orientation="horizontal" validationTiming="change" data-validation-timing="blur" dirty={undefined} ref={node=>{if(node){const field:FieldInstance=createField(node);field.setDirty(undefined);}}}><Field.Label for="positive">Email</Field.Label><Field.Content><Field.Control id="positive" {...props} {...attached} bind:value oninput={event=>{const input: HTMLInputElement=event.currentTarget;void input;}} /><Field.Description>Private</Field.Description><Field.Error match="valueMissing" messageSource="children">Required</Field.Error><Field.Validity match={true}>Valid</Field.Validity></Field.Content></Field.Root><Field.Separator>or</Field.Separator><Field.Separator /><Field.Item><Field.Title>Details</Field.Title></Field.Item></Field.Group></Field.Set>
<Root><FieldLabel /><FieldControl /><FieldDescription /><FieldError /><FieldValidity /><FieldItem /></Root><FieldContent /><FieldGroup /><FieldLegend /><FieldSet /><FieldSeparator /><FieldTitle />
<PrimitiveField.Root><PrimitiveField.Label for="primitive">Name</PrimitiveField.Label><PrimitiveField.Control id="primitive" bind:value /><PrimitiveField.Description /><PrimitiveField.Error match={false} /><PrimitiveField.Validity /><PrimitiveField.Item /></PrimitiveField.Root>
<FieldRoot><PrimitiveLabel /><PrimitiveControl /><PrimitiveDescription /><PrimitiveItem /><PrimitiveError /><PrimitiveValidity /></FieldRoot>`;
