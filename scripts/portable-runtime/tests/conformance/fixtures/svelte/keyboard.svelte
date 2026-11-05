<script lang="ts">
  import { Dialog } from "@starwind-ui/svelte/dialog";
  import { Input } from "@starwind-ui/svelte/input";
  import { Menu } from "@starwind-ui/svelte/menu";
  import { Tabs } from "@starwind-ui/svelte/tabs";
  import { Toggle } from "@starwind-ui/svelte/toggle";
  import { ToggleGroup } from "@starwind-ui/svelte/toggle-group";
  import { Dialog as SDialog, DialogClose as SDialogClose, DialogContent as SDialogContent, DialogTitle as SDialogTitle, DialogTrigger as SDialogTrigger } from "@conformance/styled-svelte/dialog";
  import { Dropdown as SDropdown, DropdownContent as SDropdownContent, DropdownItem as SDropdownItem, DropdownTrigger as SDropdownTrigger } from "@conformance/styled-svelte/dropdown";
  import { Input as SInput } from "@conformance/styled-svelte/input";
  import { Tabs as STabs, TabsContent as STabsContent, TabsList as STabsList, TabsTrigger as STabsTrigger } from "@conformance/styled-svelte/tabs";
  import { ToggleGroup as SToggleGroup, ToggleGroupItem as SToggleGroupItem } from "@conformance/styled-svelte/toggle-group";

  let held = $state("hello");
</script>

<main>
  <Tabs.Root data-testid="pt-root" defaultValue="one">
    <Tabs.List data-testid="pt-list">
      <Tabs.Tab value="one" data-testid="pt-tab-one">One</Tabs.Tab>
      <Tabs.Tab value="two" data-testid="pt-tab-two">Two</Tabs.Tab>
      <Tabs.Tab value="three" data-testid="pt-tab-three">Three</Tabs.Tab>
    </Tabs.List>
    <Tabs.Panel value="one" data-testid="pt-panel-one">Panel one</Tabs.Panel>
    <Tabs.Panel value="two" data-testid="pt-panel-two">Panel two</Tabs.Panel>
    <Tabs.Panel value="three" data-testid="pt-panel-three">Panel three</Tabs.Panel>
  </Tabs.Root>

  <ToggleGroup.Root data-testid="pg-root">
    <Toggle.Root value="a" data-testid="pg-a">A</Toggle.Root>
    <Toggle.Root value="b" data-testid="pg-b">B</Toggle.Root>
    <Toggle.Root value="c" data-testid="pg-c">C</Toggle.Root>
  </ToggleGroup.Root>

  <Dialog.Root data-testid="pd-root">
    <Dialog.Trigger data-testid="pd-trigger">Open</Dialog.Trigger>
    <Dialog.Popup data-testid="pd-popup">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Close data-testid="pd-close">Close</Dialog.Close>
    </Dialog.Popup>
  </Dialog.Root>

  <Menu.Root data-testid="pm-root">
    <Menu.Trigger data-testid="pm-trigger">Open</Menu.Trigger>
    <Menu.Positioner>
      <Menu.Popup data-testid="pm-popup">
        <Menu.Item data-testid="pm-item">Item</Menu.Item>
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Root>

  <Input.Root data-testid="pi" defaultValue="hello" />

  <STabs data-testid="st-root" defaultValue="one">
    <STabsList data-testid="st-list">
      <STabsTrigger value="one" data-testid="st-tab-one">One</STabsTrigger>
      <STabsTrigger value="two" data-testid="st-tab-two">Two</STabsTrigger>
      <STabsTrigger value="three" data-testid="st-tab-three">Three</STabsTrigger>
    </STabsList>
    <STabsContent value="one" data-testid="st-panel-one">Panel one</STabsContent>
    <STabsContent value="two" data-testid="st-panel-two">Panel two</STabsContent>
    <STabsContent value="three" data-testid="st-panel-three">Panel three</STabsContent>
  </STabs>

  <SToggleGroup data-testid="sg-root">
    <SToggleGroupItem value="a" data-testid="sg-a">A</SToggleGroupItem>
    <SToggleGroupItem value="b" data-testid="sg-b">B</SToggleGroupItem>
    <SToggleGroupItem value="c" data-testid="sg-c">C</SToggleGroupItem>
  </SToggleGroup>

  <SDialog data-testid="sd-root">
    <SDialogTrigger data-testid="sd-trigger">Open</SDialogTrigger>
    <SDialogContent data-testid="sd-popup">
      <SDialogTitle>Title</SDialogTitle>
      <SDialogClose data-testid="sd-close">Close</SDialogClose>
    </SDialogContent>
  </SDialog>

  <SDropdown data-testid="sm-root">
    <SDropdownTrigger data-testid="sm-trigger">Open</SDropdownTrigger>
    <SDropdownContent data-testid="sm-popup">
      <SDropdownItem data-testid="sm-item">Item</SDropdownItem>
    </SDropdownContent>
  </SDropdown>

  <SInput data-testid="si" defaultValue="hello" />

  <Input.Root bind:value={held} data-testid="ph" />
  <SInput bind:value={held} data-testid="sh" />
</main>
