import React from "react";
import "./style.css";
import { Dialog } from "@base-ui/react/dialog";
import { NavigationMenu } from "@base-ui/react/navigation-menu";
import { Tabs } from "@base-ui/react/tabs";
import { Accordion } from "@base-ui/react/accordion";
import { Radio } from "@base-ui/react/radio";
import { RadioGroup } from "@base-ui/react/radio-group";
import { boot, LinkList, thousand, workload } from "./common.jsx";

function DialogFixture() {
  return (
    <>
      <Dialog.Root>
        <Dialog.Trigger data-stress-trigger data-stress-target="true">
          Open dialog
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop />
          <Dialog.Popup data-stress-dialog="true">
            <Dialog.Title>Dialog</Dialog.Title>
            <Dialog.Description>Content</Dialog.Description>
            <Dialog.Close>Close</Dialog.Close>
          </Dialog.Popup>
        </Dialog.Portal>
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
    <NavigationMenu.Root defaultValue="primary" delay={200} closeDelay={300}>
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
            <NavigationMenu.Content keepMounted data-stress-panel={value}>
              <LinkList group={value} />
            </NavigationMenu.Content>
          </NavigationMenu.Item>
        ))}
      </NavigationMenu.List>
      <NavigationMenu.Portal>
        <NavigationMenu.Positioner>
          <NavigationMenu.Popup>
            <NavigationMenu.Viewport />
          </NavigationMenu.Popup>
        </NavigationMenu.Positioner>
      </NavigationMenu.Portal>
    </NavigationMenu.Root>
  );
}
function TabsFixture() {
  return (
    <Tabs.Root defaultValue="item-1">
      <Tabs.List>
        {thousand.map((item, index) => (
          <Tabs.Tab
            key={item.value}
            value={item.value}
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            {item.label}
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {thousand.map((item, index) => (
        <Tabs.Panel
          keepMounted
          key={item.value}
          value={item.value}
          data-stress-panel={index === 0 ? "primary" : index === 999 ? "target" : "other"}
        >
          Panel {item.label}
        </Tabs.Panel>
      ))}
    </Tabs.Root>
  );
}
function AccordionFixture() {
  return (
    <Accordion.Root defaultValue={[]} keepMounted multiple={false}>
      {thousand.map((item, index) => (
        <Accordion.Item key={item.value} value={item.value} data-stress-item>
          <Accordion.Header>
            <Accordion.Trigger
              data-stress-trigger
              data-stress-target={index === 999 ? "true" : undefined}
            >
              {item.label}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel data-stress-panel={index === 999 ? "target" : "other"}>
            Panel {item.label}
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
function RadioFixture() {
  return (
    <form data-stress-form>
      <RadioGroup defaultValue="item-1" name="choice">
        {thousand.map((item, index) => (
          <Radio.Root
            key={item.value}
            value={item.value}
            data-stress-item
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            {item.label}
          </Radio.Root>
        ))}
      </RadioGroup>
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
boot("base-ui", App);
