<script lang="ts">
  import { Avatar } from "@starwind-ui/svelte/avatar";
  import { Menu } from "@starwind-ui/svelte/menu";
  import { Popover } from "@starwind-ui/svelte/popover";
  import { Toggle } from "@starwind-ui/svelte/toggle";
  import { parent, record } from "../shared/harness";

  const ids = ["ph", "pb", "th", "tb", "tl", "mh", "mb", "av", "mdl"] as const;
  type Id = (typeof ids)[number];
  // A parent that holds each model and mirrors each accepted change through `bind:`.
  const held = $state<Record<Id, boolean | undefined>>({
    ph: true,
    pb: false,
    th: true,
    tb: false,
    tl: undefined,
    mh: true,
    mb: false,
    av: false,
    mdl: true,
  });
  for (const id of ids) {
    parent(id, {
      write: (next) => {
        held[id] = next as boolean;
      },
      read: () => held[id],
    });
  }

  function listenAncestor(element: HTMLDivElement) {
    const listener = (event: Event) =>
      record("av", "ancestor", (event as CustomEvent<{ status: string }>).detail.status);
    element.addEventListener("starwind:loading-status-change", listener);
    return () => element.removeEventListener("starwind:loading-status-change", listener);
  }
</script>

<main>
  <Toggle.Root defaultPressed data-testid="td-root">Default</Toggle.Root>
  <Toggle.Root bind:pressed={held.th} data-testid="th-root">Held</Toggle.Root>
  <Toggle.Root bind:pressed={held.tb} defaultPressed data-testid="tb-root">Both</Toggle.Root>
  <Toggle.Root bind:pressed={held.tl} defaultPressed data-testid="tl-root">Late</Toggle.Root>

  <Menu.Root data-testid="md-root">
    <Menu.Trigger data-testid="md-trigger">Menu</Menu.Trigger>
    <Menu.Positioner>
      <Menu.Popup data-testid="md-popup">
        <Menu.CheckboxItem defaultChecked data-testid="md-check">Default</Menu.CheckboxItem>
        <Menu.CheckboxItem bind:checked={held.mh} data-testid="mh-check">Held</Menu.CheckboxItem>
        <Menu.CheckboxItem bind:checked={held.mb} defaultChecked data-testid="mb-check">
          Both
        </Menu.CheckboxItem>
        <Menu.CheckboxItem defaultChecked={held.mdl} data-testid="mdl-check">Late default</Menu.CheckboxItem>
        <Menu.RadioGroup>
          <Menu.RadioItem value="c" defaultChecked={held.mdl} data-testid="mdl-radio">C</Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.RadioGroup data-testid="mr-group">
          <Menu.RadioItem value="a" checked={false} defaultChecked data-testid="mr-a">Held off</Menu.RadioItem>
          <Menu.RadioItem value="b" checked data-testid="mr-b">Held on</Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.RadioGroup>
          <Menu.RadioItem value="a" defaultChecked data-testid="md-radio-a">A</Menu.RadioItem>
          <Menu.RadioItem value="b" data-testid="md-radio-b">B</Menu.RadioItem>
        </Menu.RadioGroup>
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Root>

  <div {@attach listenAncestor}>
    {#if held.av}
      <Avatar.Root data-testid="av-root">
        <Avatar.Image
          src="/conformance-avatar.png"
          alt="Avatar"
          onLoadingStatusChange={(status) => record("av", "callback", status)}
        />
      </Avatar.Root>
    {/if}
  </div>

  <Popover.Root defaultOpen data-testid="pd-root">
    <Popover.Trigger>Default</Popover.Trigger>
    <Popover.Positioner>
      <Popover.Popup>Default body</Popover.Popup>
    </Popover.Positioner>
  </Popover.Root>
  <Popover.Root bind:open={held.ph} data-testid="ph-root">
    <Popover.Trigger>Held</Popover.Trigger>
    <Popover.Positioner>
      <Popover.Popup>Held body</Popover.Popup>
    </Popover.Positioner>
  </Popover.Root>
  <Popover.Root bind:open={held.pb} defaultOpen data-testid="pb-root">
    <Popover.Trigger>Both</Popover.Trigger>
    <Popover.Positioner>
      <Popover.Popup>Both body</Popover.Popup>
    </Popover.Positioner>
  </Popover.Root>
</main>
