import { createStyledDropdownConsumer } from "./styled-dropdown-consumer.js";
import { writeStyledConsumerFiles } from "./styled-consumer-files.js";

export async function createStyledContextMenuConsumer(repoRoot: string) {
  const consumer = await createStyledDropdownConsumer(repoRoot);
  try {
    await writeStyledConsumerFiles(consumer, repoRoot, ["context-menu"]);
    return consumer;
  } catch (error) {
    await consumer.dispose();
    throw error;
  }
}

export const positiveStyledContextMenuConsumer = `<script lang="ts">
import Menu, { ContextMenu, ContextMenuVariants } from "./context-menu/index.js";
let open = $state<boolean | undefined>(); let checked = $state<boolean | undefined>(); let value = $state<string | undefined>();
void ContextMenuVariants;
</script>
<Menu.Root bind:open onOpenChange={(next, detail) => { void next; detail.cancel(); }} onCloseComplete={(detail) => { void detail; }}>
 <Menu.Trigger ref={(node: HTMLDivElement | null) => { void node; }} tabindex={0}>Open</Menu.Trigger><Menu.Content portalContainer="#target" side="bottom" ref={(node: HTMLDivElement | null) => { void node; }}>
 <Menu.Group><Menu.Label>Settings</Menu.Label><Menu.Item inset>Profile<Menu.Shortcut>⌘P</Menu.Shortcut></Menu.Item></Menu.Group><Menu.Separator />
 <Menu.CheckboxItem bind:checked onCheckedChange={(next, detail) => { void next; detail.cancel(); }} showIndicator={false}><Menu.CheckboxItemIndicator />Checked</Menu.CheckboxItem>
 <Menu.RadioGroup bind:value onValueChange={(next, detail) => { void next; detail.cancel(); }}><Menu.RadioItem value="one" showIndicator={false}><Menu.RadioItemIndicator />One</Menu.RadioItem></Menu.RadioGroup>
 <Menu.Sub closeDelay={150}><Menu.SubTrigger>More</Menu.SubTrigger><Menu.SubContent><Menu.Item>Nested</Menu.Item></Menu.SubContent></Menu.Sub>
 </Menu.Content>
</Menu.Root><ContextMenu open={false} />`;
