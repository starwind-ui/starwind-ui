import {
  Dialog as SDialog,
  DialogClose as SDialogClose,
  DialogContent as SDialogContent,
  DialogTitle as SDialogTitle,
  DialogTrigger as SDialogTrigger,
} from "@conformance/styled-react/dialog";
import {
  Tooltip as STooltip,
  TooltipContent as STooltipContent,
  TooltipTrigger as STooltipTrigger,
} from "@conformance/styled-react/tooltip";
import { Dialog } from "@starwind-ui/react/dialog";
import { Select } from "@starwind-ui/react/select";
import { Tooltip } from "@starwind-ui/react/tooltip";
import { type ComponentPropsWithRef, forwardRef } from "react";

const MyButton = forwardRef<HTMLButtonElement, ComponentPropsWithRef<"button">>(
  function MyButton(props, ref) {
    return <button ref={ref} {...props} />;
  },
);

export default function Composition() {
  return (
    <main>
      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button type="button" data-testid="pn-trigger">
            Open
          </button>
        </Dialog.Trigger>
        <Dialog.Popup data-testid="pn-popup">
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Close asChild>
            <button type="button" data-testid="pn-close">
              Close
            </button>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <MyButton type="button" data-testid="pc-trigger">
            Open
          </MyButton>
        </Dialog.Trigger>
        <Dialog.Popup data-testid="pc-popup">
          <Dialog.Title>Title</Dialog.Title>
          <Dialog.Close asChild>
            <MyButton type="button" data-testid="pc-close">
              Close
            </MyButton>
          </Dialog.Close>
        </Dialog.Popup>
      </Dialog.Root>

      <SDialog>
        <SDialogTrigger asChild>
          <button type="button" data-testid="sn-trigger">
            Open
          </button>
        </SDialogTrigger>
        <SDialogContent data-testid="sn-popup">
          <SDialogTitle>Title</SDialogTitle>
          <SDialogClose asChild>
            <button type="button" data-testid="sn-close">
              Close
            </button>
          </SDialogClose>
        </SDialogContent>
      </SDialog>

      <SDialog>
        <SDialogTrigger asChild>
          <MyButton type="button" data-testid="sc-trigger">
            Open
          </MyButton>
        </SDialogTrigger>
        <SDialogContent data-testid="sc-popup">
          <SDialogTitle>Title</SDialogTitle>
          <SDialogClose asChild>
            <MyButton type="button" data-testid="sc-close">
              Close
            </MyButton>
          </SDialogClose>
        </SDialogContent>
      </SDialog>

      <Select.Root>
        <Select.Trigger asChild>
          <button type="button" data-testid="en-trigger">
            Open
          </button>
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup data-testid="en-popup">
            <Select.List>
              <Select.Item value="a">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>

      <Select.Root>
        <Select.Trigger asChild>
          <MyButton type="button" data-testid="ec-trigger">
            Open
          </MyButton>
        </Select.Trigger>
        <Select.Positioner>
          <Select.Popup data-testid="ec-popup">
            <Select.List>
              <Select.Item value="a">
                <Select.ItemText>Apple</Select.ItemText>
              </Select.Item>
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Root>

      <Tooltip.Root openDelay={0} closeDelay={0}>
        <Tooltip.Trigger asChild>
          <button type="button" data-testid="tb-trigger">
            Button
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="tb-popup">Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root openDelay={0} closeDelay={0}>
        <Tooltip.Trigger asChild>
          <a href="#link" data-testid="tl-trigger">
            Link
          </a>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="tl-popup">Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <Tooltip.Root openDelay={0} closeDelay={0}>
        <Tooltip.Trigger data-testid="tt-trigger">Text</Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Positioner>
            <Tooltip.Popup data-testid="tt-popup">Tip</Tooltip.Popup>
          </Tooltip.Positioner>
        </Tooltip.Portal>
      </Tooltip.Root>

      <STooltip openDelay={0} closeDelay={0}>
        <STooltipTrigger asChild>
          <button type="button" data-testid="ub-trigger">
            Button
          </button>
        </STooltipTrigger>
        <STooltipContent data-testid="ub-popup">Tip</STooltipContent>
      </STooltip>

      <STooltip openDelay={0} closeDelay={0}>
        <STooltipTrigger asChild>
          <a href="#link" data-testid="ul-trigger">
            Link
          </a>
        </STooltipTrigger>
        <STooltipContent data-testid="ul-popup">Tip</STooltipContent>
      </STooltip>

      <STooltip openDelay={0} closeDelay={0}>
        <STooltipTrigger data-testid="ut-trigger">Text</STooltipTrigger>
        <STooltipContent data-testid="ut-popup">Tip</STooltipContent>
      </STooltip>
    </main>
  );
}
