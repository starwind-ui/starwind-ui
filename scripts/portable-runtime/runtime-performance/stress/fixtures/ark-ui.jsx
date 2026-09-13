import React from "react";
import "./style.css";
import { Dialog } from "@ark-ui/react/dialog";
import { NavigationMenu } from "@ark-ui/react/navigation-menu";
import { Tabs } from "@ark-ui/react/tabs";
import { Accordion } from "@ark-ui/react/accordion";
import { RadioGroup } from "@ark-ui/react/radio-group";
import { Portal } from "@ark-ui/react/portal";
import { boot, LinkList, thousand, workload } from "./common.jsx";

function DialogFixture() {
  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger data-stress-trigger data-stress-target="true">
          Open dialog
        </Dialog.Trigger>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content data-stress-dialog="true">
              <Dialog.Title>Dialog</Dialog.Title>
              <Dialog.Description>Content</Dialog.Description>
              <Dialog.CloseTrigger>Close</Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
      <div>
        {Array.from({ length: 10000 }, (_, index) => (
          <span data-stress-outside key={index}>
            Outside {index}
          </span>
        ))}
      </div>
    </>
  );
}
function NavigationFixture() {
  return (
    <NavigationMenu.Root
      defaultValue="primary"
      openDelay={200}
      closeDelay={300}
      lazyMount={false}
      unmountOnExit={false}
    >
      <NavigationMenu.List data-stress-nav-list>
        {["primary", "target"].map((value) => (
          <NavigationMenu.Item key={value} value={value}>
            <NavigationMenu.Trigger
              data-stress-trigger
              data-stress-target={value === "target" ? "true" : undefined}
              data-stress-primary={value === "primary" ? "true" : undefined}
            >
              {value}
            </NavigationMenu.Trigger>
            <NavigationMenu.Content data-stress-panel={value}>
              <LinkList group={value} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
      <NavigationMenu.ViewportPositioner>
        <NavigationMenu.Viewport />
      </NavigationMenu.ViewportPositioner>
    </NavigationMenu.Root>
  );
}
function TabsFixture() {
  return (
    <Tabs.Root
      defaultValue="item-1"
      activationMode="manual"
      lazyMount={false}
      unmountOnExit={false}
    >
      <Tabs.List>
        {thousand.map((item, index) => (
          <Tabs.Trigger
            key={item.value}
            value={item.value}
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            {item.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {thousand.map((item, index) => (
        <Tabs.Content
          key={item.value}
          value={item.value}
          data-stress-panel={index === 0 ? "primary" : index === 999 ? "target" : "other"}
        >
          Panel {item.label}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
function AccordionFixture() {
  return (
    <Accordion.Root defaultValue={[]} lazyMount={false} unmountOnExit={false} collapsible>
      {thousand.map((item, index) => (
        <Accordion.Item key={item.value} value={item.value} data-stress-item>
          <Accordion.ItemTrigger
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
          >
            {item.label}
          </Accordion.ItemTrigger>
          <Accordion.ItemContent data-stress-panel={index === 999 ? "target" : "other"}>
            Panel {item.label}
          </Accordion.ItemContent>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
function RadioFixture() {
  return (
    <form data-stress-form>
      <RadioGroup.Root defaultValue="item-1" name="choice">
        {thousand.map((item, index) => (
          <RadioGroup.Item
            key={item.value}
            value={item.value}
            data-stress-item
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemControl />
            <RadioGroup.ItemText>{item.label}</RadioGroup.ItemText>
          </RadioGroup.Item>
        ))}
      </RadioGroup.Root>
    </form>
  );
}
const App = {
  dialog: DialogFixture,
  "navigation-menu": NavigationFixture,
  tabs: TabsFixture,
  accordion: AccordionFixture,
  "radio-group": RadioFixture,
}[workload];
if (!App) throw new Error(`Unknown workload: ${workload}`);
boot("ark-ui", App);
