<script lang="ts">
  import { Checkbox } from "@starwind-ui/svelte/checkbox";
  import { Combobox } from "@starwind-ui/svelte/combobox";
  import { Dialog } from "@starwind-ui/svelte/dialog";
  import { Input } from "@starwind-ui/svelte/input";
  import { Select } from "@starwind-ui/svelte/select";
  import { Switch } from "@starwind-ui/svelte/switch";
  import { Tabs } from "@starwind-ui/svelte/tabs";
  import { parent, record, refused } from "../shared/harness";

  let comboText = $state("");
  let comboValue = $state<string | null>(null);
  let wrappedValue = $state<string | null>(null);
  let dialogOpen = $state(false);
  let selectValue = $state<string | null>("a");
  let tab = $state<string | null>("one");
  let checked = $state(false);
  let switched = $state(false);
  let inputValue = $state("hello");

  parent("cc", { write: (next) => (comboText = next as string), read: () => comboText });
  parent("cv", { write: (next) => (comboValue = next as string | null), read: () => comboValue });
  parent("cw", { write: (next) => (wrappedValue = next as string | null), read: () => wrappedValue });
  parent("dp", { write: (next) => (dialogOpen = next as boolean), read: () => dialogOpen });
  parent("sp", { write: (next) => (selectValue = next as string | null), read: () => selectValue });
  parent("tp", { write: (next) => (tab = next as string | null), read: () => tab });
  parent("kp", { write: (next) => (checked = next as boolean), read: () => checked });
  parent("wp", { write: (next) => (switched = next as boolean), read: () => switched });
  parent("ip", { write: (next) => (inputValue = next as string), read: () => inputValue });

  const log = (id: string, event: string) => (value: unknown, details: unknown) =>
    record(id, event, value, details);
  function held<T>(id: string, event: string, write: (value: T) => void) {
    return (value: T, details: { isCanceled?: boolean }) => {
      record(id, event, value, details);
      if (!refused(id) && !details.isCanceled) write(value);
    };
  }
</script>

{#snippet comboboxParts(id: string)}
  <Combobox.InputGroup>
    <Combobox.Input data-testid={`${id}-input`} />
    <Combobox.Trigger data-testid={`${id}-trigger`}>Open</Combobox.Trigger>
    <Combobox.Clear data-testid={`${id}-clear`}>Clear</Combobox.Clear>
  </Combobox.InputGroup>
  <Combobox.Positioner>
    <Combobox.Popup data-testid={`${id}-popup`}>
      <Combobox.List>
        <Combobox.Item value="a" data-testid={`${id}-item-a`}>
          <Combobox.ItemText>Apple</Combobox.ItemText>
        </Combobox.Item>
        <Combobox.Item value="b" data-testid={`${id}-item-b`}>
          <Combobox.ItemText>Banana</Combobox.ItemText>
        </Combobox.Item>
      </Combobox.List>
    </Combobox.Popup>
  </Combobox.Positioner>
{/snippet}

{#snippet selectParts(id: string)}
  <Select.Trigger data-testid={`${id}-trigger`}>
    <Select.Value data-testid={`${id}-value`} placeholder="Pick" />
  </Select.Trigger>
  <Select.Positioner>
    <Select.Popup data-testid={`${id}-popup`}>
      <Select.List>
        <Select.Item value="a" data-testid={`${id}-item-a`}>
          <Select.ItemText>Apple</Select.ItemText>
        </Select.Item>
        <Select.Item value="b" data-testid={`${id}-item-b`}>
          <Select.ItemText>Banana</Select.ItemText>
        </Select.Item>
      </Select.List>
    </Select.Popup>
  </Select.Positioner>
{/snippet}

{#snippet dialogParts(id: string)}
  <Dialog.Trigger data-testid={`${id}-trigger`}>Open</Dialog.Trigger>
  <Dialog.Popup data-testid={`${id}-popup`}>
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Close data-testid={`${id}-close`}>Close</Dialog.Close>
  </Dialog.Popup>
{/snippet}

{#snippet tabsParts(id: string)}
  <Tabs.List>
    <Tabs.Tab value="one" data-testid={`${id}-tab-one`}>One</Tabs.Tab>
    <Tabs.Tab value="two" data-testid={`${id}-tab-two`}>Two</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel value="one" data-testid={`${id}-panel-one`}>Panel one</Tabs.Panel>
  <Tabs.Panel value="two" data-testid={`${id}-panel-two`}>Panel two</Tabs.Panel>
{/snippet}

<main>
  <button type="button" data-testid="outside">Outside</button>

  <Combobox.Root
    data-testid="cu-root"
    onValueChange={log("cu", "value")}
    onInputValueChange={log("cu", "input")}
    onOpenChange={log("cu", "open")}
  >
    {@render comboboxParts("cu")}
  </Combobox.Root>

  <Combobox.Root
    data-testid="cc-root"
    inputValue={comboText}
    onValueChange={log("cc", "value")}
    onInputValueChange={held("cc", "input", (value: string) => (comboText = value))}
    onOpenChange={log("cc", "open")}
  >
    {@render comboboxParts("cc")}
  </Combobox.Root>

  <Combobox.Root
    data-testid="cv-root"
    value={comboValue}
    onValueChange={held("cv", "value", (value: string | null) => (comboValue = value))}
    onInputValueChange={log("cv", "input")}
    onOpenChange={log("cv", "open")}
  >
    {@render comboboxParts("cv")}
  </Combobox.Root>

  <Combobox.Root data-testid="cw-root" bind:value={wrappedValue}>
    {@render comboboxParts("cw")}
  </Combobox.Root>

  <Dialog.Root data-testid="du-root" onOpenChange={log("du", "open")}>
    {@render dialogParts("du")}
  </Dialog.Root>

  <Dialog.Root
    data-testid="dp-root"
    open={dialogOpen}
    onOpenChange={held("dp", "open", (value: boolean) => (dialogOpen = value))}
  >
    {@render dialogParts("dp")}
  </Dialog.Root>

  <Select.Root data-testid="su-root" onValueChange={log("su", "value")} onOpenChange={log("su", "open")}>
    {@render selectParts("su")}
  </Select.Root>

  <Select.Root
    data-testid="sp-root"
    value={selectValue}
    onValueChange={held("sp", "value", (value: string | null) => (selectValue = value))}
  >
    {@render selectParts("sp")}
  </Select.Root>

  <Select.Root data-testid="sw-root" onValueChange={log("sw", "value")}>
    {@render selectParts("sw")}
  </Select.Root>

  <Tabs.Root data-testid="tu-root" defaultValue="one" onValueChange={log("tu", "value")}>
    {@render tabsParts("tu")}
  </Tabs.Root>

  <Tabs.Root
    data-testid="tp-root"
    value={tab}
    onValueChange={held("tp", "value", (value: string | null) => (tab = value))}
  >
    {@render tabsParts("tp")}
  </Tabs.Root>

  <Checkbox.Root data-testid="ku-root" onCheckedChange={log("ku", "checked")}>
    <Checkbox.Indicator />
  </Checkbox.Root>

  <Checkbox.Root
    data-testid="kp-root"
    {checked}
    onCheckedChange={held("kp", "checked", (value: boolean) => (checked = value))}
  >
    <Checkbox.Indicator />
  </Checkbox.Root>

  <Switch.Root
    data-testid="wp-root"
    checked={switched}
    onCheckedChange={held("wp", "checked", (value: boolean) => (switched = value))}
  >
    <Switch.Thumb />
  </Switch.Root>

  <Input.Root
    data-testid="ip-root"
    value={inputValue}
    onValueChange={held("ip", "value", (value: string) => (inputValue = value))}
  />
</main>
