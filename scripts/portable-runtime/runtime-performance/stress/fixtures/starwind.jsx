import React from "react";
import "./style.css";
import StarwindDialog from "@starwind-ui/react/dialog";
import StarwindNavigationMenu from "@starwind-ui/react/navigation-menu";
import StarwindTabs from "@starwind-ui/react/tabs";
import StarwindAccordion from "@starwind-ui/react/accordion";
import StarwindRadio from "@starwind-ui/react/radio";
import StarwindRadioGroup from "@starwind-ui/react/radio-group";
import { boot, LinkList, thousand, workload } from "./common.jsx";

function DialogFixture() {
  return (
    <>
      <StarwindDialog.Root>
        <StarwindDialog.Trigger data-stress-trigger data-stress-target="true">
          Open dialog
        </StarwindDialog.Trigger>
        <StarwindDialog.Backdrop />
        <StarwindDialog.Popup data-stress-dialog="true">
          <StarwindDialog.Title>Dialog</StarwindDialog.Title>
          <StarwindDialog.Description>Content</StarwindDialog.Description>
          <StarwindDialog.Close>Close</StarwindDialog.Close>
        </StarwindDialog.Popup>
      </StarwindDialog.Root>
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
    <StarwindNavigationMenu.Root defaultValue="primary" openDelay={200} closeDelay={300}>
      <StarwindNavigationMenu.List data-stress-nav-list>
        {["primary", "target"].map((value) => (
          <StarwindNavigationMenu.Item key={value} value={value}>
            <StarwindNavigationMenu.Trigger
              data-stress-trigger
              data-stress-target={value === "target" ? "true" : undefined}
              data-stress-primary={value === "primary" ? "true" : undefined}
            >
              {value}
            </StarwindNavigationMenu.Trigger>
            <StarwindNavigationMenu.Content data-stress-panel={value}>
              <LinkList group={value} />
            </StarwindNavigationMenu.Content>
          </StarwindNavigationMenu.Item>
        ))}
      </StarwindNavigationMenu.List>
      <StarwindNavigationMenu.Portal>
        <StarwindNavigationMenu.Positioner>
          <StarwindNavigationMenu.Popup>
            <StarwindNavigationMenu.Viewport />
          </StarwindNavigationMenu.Popup>
        </StarwindNavigationMenu.Positioner>
      </StarwindNavigationMenu.Portal>
    </StarwindNavigationMenu.Root>
  );
}
function TabsFixture() {
  return (
    <StarwindTabs.Root defaultValue="item-1">
      <StarwindTabs.List>
        {thousand.map((item, index) => (
          <StarwindTabs.Tab
            key={item.value}
            value={item.value}
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            {item.label}
          </StarwindTabs.Tab>
        ))}
      </StarwindTabs.List>
      {thousand.map((item, index) => (
        <StarwindTabs.Panel
          keepMounted
          key={item.value}
          value={item.value}
          data-stress-panel={index === 0 ? "primary" : index === 999 ? "target" : "other"}
        >
          Panel {item.label}
        </StarwindTabs.Panel>
      ))}
    </StarwindTabs.Root>
  );
}
function AccordionFixture() {
  return (
    <StarwindAccordion.Root type="single" collapsible>
      {thousand.map((item, index) => (
        <StarwindAccordion.Item key={item.value} value={item.value} data-stress-item>
          <StarwindAccordion.Header>
            <StarwindAccordion.Trigger
              data-stress-trigger
              data-stress-target={index === 999 ? "true" : undefined}
            >
              {item.label}
            </StarwindAccordion.Trigger>
          </StarwindAccordion.Header>
          <StarwindAccordion.Panel data-stress-panel={index === 999 ? "target" : "other"}>
            Panel {item.label}
          </StarwindAccordion.Panel>
        </StarwindAccordion.Item>
      ))}
    </StarwindAccordion.Root>
  );
}
function RadioFixture() {
  return (
    <form data-stress-form>
      <StarwindRadioGroup.Root defaultValue="item-1" name="choice">
        {thousand.map((item, index) => (
          <StarwindRadio.Root
            key={item.value}
            value={item.value}
            data-stress-item
            data-stress-trigger
            data-stress-target={index === 999 ? "true" : undefined}
            data-stress-primary={index === 0 ? "true" : undefined}
          >
            {item.label}
          </StarwindRadio.Root>
        ))}
      </StarwindRadioGroup.Root>
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
boot("starwind", App);
