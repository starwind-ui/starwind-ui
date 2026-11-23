import { Avatar } from "@starwind-ui/react/avatar";
import { Menu } from "@starwind-ui/react/menu";
import { Popover } from "@starwind-ui/react/popover";
import { Toggle } from "@starwind-ui/react/toggle";
import { useEffect, useRef, useState } from "react";
import { parent, record } from "../shared/harness";

/** A parent that holds one model and mirrors each accepted change. */
// biome-ignore lint/suspicious/noExplicitAny: fixture values differ per component.
function useHeld(id: string, initial: unknown): [any, (next: any) => void] {
  const [value, setValue] = useState(initial);
  const current = useRef(value);
  current.current = value;
  useEffect(() => {
    parent(id, { write: (next) => setValue(next), read: () => current.current });
  }, [id]);
  return [value, setValue];
}

function AvatarOrder() {
  const [shown] = useHeld("av", false);
  const wrapper = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = wrapper.current;
    if (!element) return;
    const listener = (event: Event) =>
      record("av", "ancestor", (event as CustomEvent<{ status: string }>).detail.status);
    element.addEventListener("starwind:loading-status-change", listener);
    return () => element.removeEventListener("starwind:loading-status-change", listener);
  }, []);
  return (
    <div ref={wrapper}>
      {shown ? (
        <Avatar.Root data-testid="av-root">
          <Avatar.Image
            src="/conformance-avatar.png"
            alt="Avatar"
            onLoadingStatusChange={(status) => record("av", "callback", status)}
          />
        </Avatar.Root>
      ) : null}
    </div>
  );
}

export default function Markers() {
  const [ph, setPh] = useHeld("ph", true);
  const [pb, setPb] = useHeld("pb", false);
  const [th, setTh] = useHeld("th", true);
  const [tb, setTb] = useHeld("tb", false);
  const [tl, setTl] = useHeld("tl", undefined);
  const [mh, setMh] = useHeld("mh", true);
  const [mb, setMb] = useHeld("mb", false);
  const [mdl] = useHeld("mdl", true);
  return (
    <main>
      <Toggle.Root defaultPressed data-testid="td-root">
        Default
      </Toggle.Root>
      <Toggle.Root pressed={th} onPressedChange={setTh} data-testid="th-root">
        Held
      </Toggle.Root>
      <Toggle.Root pressed={tb} onPressedChange={setTb} defaultPressed data-testid="tb-root">
        Both
      </Toggle.Root>
      <Toggle.Root pressed={tl} onPressedChange={setTl} defaultPressed data-testid="tl-root">
        Late
      </Toggle.Root>

      <Menu.Root data-testid="md-root">
        <Menu.Trigger data-testid="md-trigger">Menu</Menu.Trigger>
        <Menu.Positioner>
          <Menu.Popup data-testid="md-popup">
            <Menu.CheckboxItem defaultChecked data-testid="md-check">
              Default
            </Menu.CheckboxItem>
            <Menu.CheckboxItem checked={mh} onCheckedChange={setMh} data-testid="mh-check">
              Held
            </Menu.CheckboxItem>
            <Menu.CheckboxItem
              checked={mb}
              onCheckedChange={setMb}
              defaultChecked
              data-testid="mb-check"
            >
              Both
            </Menu.CheckboxItem>
            <Menu.CheckboxItem defaultChecked={mdl} data-testid="mdl-check">
              Late default
            </Menu.CheckboxItem>
            <Menu.RadioGroup>
              <Menu.RadioItem value="c" defaultChecked={mdl} data-testid="mdl-radio">
                C
              </Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.RadioGroup data-testid="mr-group">
              <Menu.RadioItem value="a" checked={false} defaultChecked data-testid="mr-a">
                Held off
              </Menu.RadioItem>
              <Menu.RadioItem value="b" checked data-testid="mr-b">
                Held on
              </Menu.RadioItem>
            </Menu.RadioGroup>
            <Menu.RadioGroup>
              <Menu.RadioItem value="a" defaultChecked data-testid="md-radio-a">
                A
              </Menu.RadioItem>
              <Menu.RadioItem value="b" data-testid="md-radio-b">
                B
              </Menu.RadioItem>
            </Menu.RadioGroup>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Root>

      <AvatarOrder />

      <Popover.Root defaultOpen data-testid="pd-root">
        <Popover.Trigger>Default</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Popup>Default body</Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>
      <Popover.Root open={ph} onOpenChange={setPh} data-testid="ph-root">
        <Popover.Trigger>Held</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Popup>Held body</Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>
      <Popover.Root open={pb} onOpenChange={setPb} defaultOpen data-testid="pb-root">
        <Popover.Trigger>Both</Popover.Trigger>
        <Popover.Positioner>
          <Popover.Popup>Both body</Popover.Popup>
        </Popover.Positioner>
      </Popover.Root>
    </main>
  );
}
