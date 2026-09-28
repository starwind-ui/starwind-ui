import React, { useMemo } from "react";
import { Combobox, createListCollection as createComboboxCollection } from "@ark-ui/react/combobox";
import { Menu } from "@ark-ui/react/menu";
import { Portal } from "@ark-ui/react/portal";
import { Select, createListCollection as createSelectCollection } from "@ark-ui/react/select";
import {
  boot,
  comboboxItems,
  menuItems,
  selectItems,
  pageItems,
  parentItems,
  childItems,
  createSelectPage,
} from "./shared.jsx";

const positioning = { placement: "bottom-start", gutter: 8 };
function MenuFixture({ onMenuAction }) {
  return (
    <Menu.Root positioning={positioning}>
      <Menu.Trigger className="trigger" data-bench="trigger">
        Open menu
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner data-bench-portal="menu">
          <Menu.Content className="popup" data-bench="popup">
            {menuItems.map((item) => (
              <Menu.Item
                key={item.id}
                value={item.id}
                data-item={item.id}
                className="item"
                disabled={item.disabled}
                onSelect={() => onMenuAction(item, "onSelect")}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

const selectCollection = createSelectCollection({
  items: selectItems,
  itemToString: (item) => item.label,
  itemToValue: (item) => item.value,
  isItemDisabled: (item) => item.disabled,
});
const pageCollection = createSelectCollection({
  items: pageItems,
  itemToString: (item) => item.label,
  itemToValue: (item) => item.value,
  isItemDisabled: (item) => item.disabled,
});
function SelectFixture({
  selectedValue,
  onSelectValue,
  onSubmit,
  items = selectItems,
  controlId = 1,
  target = true,
}) {
  return (
    <form
      data-bench={target ? "form" : "control-form"}
      data-control={controlId}
      onSubmit={onSubmit}
    >
      <Select.Root
        name="choice"
        collection={items === pageItems ? pageCollection : selectCollection}
        value={selectedValue ? [selectedValue] : []}
        onValueChange={(details) => onSelectValue(details.value[0] ?? null)}
        positioning={positioning}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger
            className="trigger"
            data-bench={target ? "trigger" : "control-trigger"}
            data-control={controlId}
          >
            <Select.ValueText />
          </Select.Trigger>
        </Select.Control>
        <Portal>
          <Select.Positioner data-bench-portal="select">
            <Select.Content
              className="popup"
              data-bench={target ? "popup" : "control-popup"}
              data-control={controlId}
            >
              {items.map((item) => (
                <Select.Item key={item.id} item={item} className="item" data-item={item.value}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      <button data-bench={target ? "submit" : "control-submit"} type="submit">
        Submit
      </button>
    </form>
  );
}

function ComboboxFixture({
  selectedValue,
  inputValue,
  onInputValueChange,
  onSelectValue,
  onSubmit,
}) {
  const collection = useMemo(
    () =>
      createComboboxCollection({
        items: comboboxItems.filter((item) =>
          item.label.toLowerCase().includes(inputValue.toLowerCase()),
        ),
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [inputValue],
  );
  return (
    <form data-bench="form" onSubmit={onSubmit}>
      <Combobox.Root
        collection={collection}
        value={selectedValue ? [selectedValue] : []}
        inputValue={inputValue}
        onInputValueChange={(details) => onInputValueChange(details.inputValue)}
        onValueChange={(details) => onSelectValue(details.value[0] ?? null)}
        positioning={positioning}
      >
        <input type="hidden" name="choice" value={selectedValue ?? ""} />
        <Combobox.Control>
          <Combobox.Input className="trigger" data-bench="trigger" />
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner data-bench-portal="combobox">
            <Combobox.Content className="popup" data-bench="popup">
              {collection.items.map((item) => (
                <Combobox.Item key={item.id} item={item} className="item" data-item={item.value}>
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
      <button data-bench="submit" type="submit">
        Submit
      </button>
    </form>
  );
}

const submenuPositioning = { placement: "right-start", offset: { mainAxis: 8, crossAxis: 0 } };
function SubmenuFixture({ onInvoke }) {
  return (
    <Menu.Root positioning={positioning}>
      <Menu.Trigger className="trigger" data-bench="trigger">
        Open menu
      </Menu.Trigger>
      <Portal>
        <Menu.Positioner data-bench-portal="menu">
          <Menu.Content className="popup" data-bench="popup">
            {parentItems.map((item, index) =>
              index === 3 ? (
                <Menu.Root key={item.id} positioning={submenuPositioning}>
                  <Menu.TriggerItem
                    className="item"
                    data-bench="submenu-trigger"
                    data-item="parent-4"
                  >
                    More actions ›
                  </Menu.TriggerItem>
                  <Portal>
                    <Menu.Positioner data-bench-portal="submenu">
                      <Menu.Content className="popup" data-bench="child-popup">
                        {childItems.map((child) => (
                          <Menu.Item
                            key={child.id}
                            value={child.id}
                            className="item"
                            data-item={child.id}
                            onSelect={() => onInvoke(child.id)}
                          >
                            {child.label}
                          </Menu.Item>
                        ))}
                      </Menu.Content>
                    </Menu.Positioner>
                  </Portal>
                </Menu.Root>
              ) : (
                <Menu.Item
                  key={item.id}
                  value={item.id}
                  className="item"
                  data-item={item.id}
                  onSelect={() => onInvoke(item.id)}
                >
                  {item.label}
                </Menu.Item>
              ),
            )}
          </Menu.Content>
        </Menu.Positioner>
      </Portal>
    </Menu.Root>
  );
}

const SelectPage = createSelectPage(SelectFixture);

boot(
  {
    "menu-20": MenuFixture,
    "select-100": SelectFixture,
    "combobox-500": ComboboxFixture,
    "submenu-8x8": SubmenuFixture,
    "select-page-1": SelectPage,
    "select-page-20": SelectPage,
  },
  "ark-ui",
);
