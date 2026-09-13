import React from "react";
import { Combobox } from "@starwind-ui/react/combobox";
import { Menu } from "@starwind-ui/react/menu";
import { Select } from "@starwind-ui/react/select";
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

function MenuFixture({ onMenuAction }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="trigger" data-bench="trigger">
        Open menu
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner data-bench-portal="menu" sideOffset={8} align="start">
          <Menu.Popup className="popup" data-bench="popup" sideOffset={8}>
            {menuItems.map((item) => (
              <Menu.Item
                key={item.id}
                data-item={item.id}
                className="item"
                disabled={item.disabled}
                onClick={() => onMenuAction(item, "onClick")}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

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
      <Select.Root name="choice" value={selectedValue} onValueChange={onSelectValue}>
        <Select.Trigger
          className="trigger"
          data-bench={target ? "trigger" : "control-trigger"}
          data-control={controlId}
        >
          <Select.Value />
        </Select.Trigger>
        <Select.Portal>
          <Select.Positioner
            data-bench-portal="select"
            sideOffset={8}
            align="start"
            alignItemWithTrigger={false}
          >
            <Select.Popup
              className="popup"
              data-bench={target ? "popup" : "control-popup"}
              data-control={controlId}
            >
              <Select.List>
                {items.map((item) => (
                  <Select.Item
                    key={item.id}
                    value={item.value}
                    disabled={item.disabled}
                    className="item"
                    data-item={item.value}
                  >
                    <Select.ItemText>{item.label}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
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
  return (
    <form data-bench="form" onSubmit={onSubmit}>
      <Combobox.Root
        name="choice"
        value={selectedValue}
        inputValue={inputValue}
        onInputValueChange={onInputValueChange}
        onValueChange={onSelectValue}
        filterMode="contains"
      >
        <Combobox.InputGroup>
          <Combobox.Input className="trigger" data-bench="trigger" />
        </Combobox.InputGroup>
        <Combobox.Portal>
          <Combobox.Positioner data-bench-portal="combobox" sideOffset={8} align="start">
            <Combobox.Popup className="popup" data-bench="popup">
              <Combobox.List>
                {comboboxItems.map((item) => (
                  <Combobox.Item
                    key={item.id}
                    value={item.value}
                    className="item"
                    data-item={item.value}
                  >
                    <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  </Combobox.Item>
                ))}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
      <button data-bench="submit" type="submit">
        Submit
      </button>
    </form>
  );
}

function SubmenuFixture({ onInvoke }) {
  return (
    <Menu.Root>
      <Menu.Trigger className="trigger" data-bench="trigger">
        Open menu
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner data-bench-portal="menu" sideOffset={8} align="start">
          <Menu.Popup className="popup" data-bench="popup" sideOffset={8}>
            {parentItems.map((item, index) =>
              index === 3 ? (
                <Menu.SubmenuRoot key={item.id}>
                  <Menu.SubmenuTrigger
                    className="item"
                    data-bench="submenu-trigger"
                    data-item="parent-4"
                  >
                    More actions ›
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner
                      data-bench-portal="submenu"
                      side="right"
                      align="start"
                      sideOffset={8}
                    >
                      <Menu.Popup
                        className="popup"
                        data-bench="child-popup"
                        side="right"
                        align="start"
                        sideOffset={8}
                      >
                        {childItems.map((child) => (
                          <Menu.Item
                            key={child.id}
                            className="item"
                            data-item={child.id}
                            onClick={() => onInvoke(child.id)}
                          >
                            {child.label}
                          </Menu.Item>
                        ))}
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
              ) : (
                <Menu.Item
                  key={item.id}
                  className="item"
                  data-item={item.id}
                  onClick={() => onInvoke(item.id)}
                >
                  {item.label}
                </Menu.Item>
              ),
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
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
  "starwind",
  { openFocus: "trigger-or-popup" },
);
