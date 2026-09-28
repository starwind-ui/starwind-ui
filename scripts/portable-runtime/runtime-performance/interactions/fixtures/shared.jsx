import React, { useCallback, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { recordMenuCallback } from "./menu-actions.mjs";

export const menuItems = Array.from({ length: 20 }, (_, index) => ({
  id: `action-${index + 1}`,
  label: `Action ${index + 1}`,
  disabled: index === 2,
}));

export const selectItems = Array.from({ length: 100 }, (_, index) => ({
  id: `option-${index + 1}`,
  value: `option-${index + 1}`,
  label: `Option ${index + 1}`,
  disabled: index === 2,
}));

export const comboboxItems = Array.from({ length: 500 }, (_, index) => ({
  id: `item-${String(index + 1).padStart(3, "0")}`,
  value: `item-${String(index + 1).padStart(3, "0")}`,
  label: `Item ${String(index + 1).padStart(3, "0")}`,
}));

const scenario = new URLSearchParams(location.search).get("scenario") ?? "menu-20";
export const pageItems = selectItems.slice(0, 20);
export const parentItems = Array.from({ length: 8 }, (_, index) => ({
  id: `parent-${index + 1}`,
  label: `Parent ${index + 1}`,
}));
export const childItems = Array.from({ length: 8 }, (_, index) => ({
  id: `child-${index + 1}`,
  label: `Child ${index + 1}`,
}));
const isPage = scenario.startsWith("select-page-");
const controlCount = scenario === "select-page-20" ? 20 : 1;
const initialValue = scenario.startsWith("select-") ? selectItems[0].value : null;

// The page reuses the complete Select adapter, including its native form and callbacks.
export function createSelectPage(SelectFixture) {
  function Cell({ index, target, ...props }) {
    const [value, setValue] = useState(pageItems[0].value);
    return (
      <section className="select-cell" data-control-cell={index}>
        <label>Control {index}</label>
        <SelectFixture
          {...props}
          items={pageItems}
          controlId={index}
          target={target}
          selectedValue={target ? props.selectedValue : value}
          onSelectValue={target ? props.onSelectValue : setValue}
        />
      </section>
    );
  }
  return function SelectPage(props) {
    return (
      <div className="select-grid">
        {Array.from({ length: controlCount }, (_, index) => (
          <Cell
            key={index + 1}
            index={index + 1}
            target={index + 1 === (controlCount === 20 ? 10 : 1)}
            {...props}
          />
        ))}
      </div>
    );
  };
}

export function boot(fixtures, provider, { openFocus = "popup" } = {}) {
  const Fixture = typeof fixtures === "function" ? fixtures : fixtures[scenario];
  if (!Fixture) throw new Error(`Unsupported fixture scenario: ${scenario}`);

  function Host() {
    const [invoked, setInvoked] = useState([]);
    const rawMenuCallbacks = useRef([]);
    const [selectedValue, setSelectedValue] = useState(initialValue);
    const [inputValue, setInputValue] = useState("");
    const [submittedValue, setSubmittedValue] = useState(null);
    const instanceId = useRef(crypto.randomUUID());
    const selectValue = useCallback((value) => setSelectedValue(value), []);
    const changeInput = useCallback((value) => setInputValue(value), []);
    const submit = useCallback((event) => {
      event.preventDefault();
      setSubmittedValue(new FormData(event.currentTarget).get("choice"));
    }, []);
    const reset = useCallback(() => {
      setInvoked([]);
      rawMenuCallbacks.current = [];
      setSelectedValue(initialValue);
      setInputValue("");
      setSubmittedValue(null);
    }, []);
    useEffect(() => {
      window.__fixture = {
        provider,
        scenario,
        openFocus,
        controlCount,
        targetControl: controlCount === 20 ? 10 : 1,
        itemsPerControl: isPage ? 20 : scenario === "select-100" ? 100 : null,
        submenuDelays:
          provider === "starwind"
            ? { openMs: 0, closeMs: 200 }
            : provider === "base-ui"
              ? { openMs: 100, closeMs: 0 }
              : { openMs: 200, closeMs: 100 },
        selectors: {
          trigger: '[data-bench="trigger"]',
          popup: '[data-bench="popup"]',
          item: "[data-item]",
        },
        expected:
          scenario === "submenu-8x8"
            ? { chosen: "child-4", invocationCount: 1 }
            : scenario === "menu-20"
              ? { chosen: "action-8", disabled: "action-3", invocationCount: 1 }
              : scenario.startsWith("select-")
                ? { initial: "option-1", chosen: "option-4", disabled: "option-3" }
                : {
                    initial: null,
                    chosen: "item-042",
                    chosenLabel: "Item 042",
                    query: "Item 04",
                    matches: 10,
                  },
        instanceId: instanceId.current,
        get rawMenuCallbacks() {
          return rawMenuCallbacks.current;
        },
        reset,
        ready: true,
      };
      window.__bench?.ready();
    }, [reset]);
    return (
      <main id="fixture" data-scenario={scenario}>
        <h1>{scenario} interaction</h1>
        <p>{provider}</p>
        <Fixture
          selectedValue={selectedValue}
          inputValue={inputValue}
          onInputValueChange={changeInput}
          onSelectValue={selectValue}
          onSubmit={submit}
          onInvoke={(id) => setInvoked((previous) => [...previous, id])}
          onMenuAction={(item, source) =>
            recordMenuCallback(
              item,
              source,
              (receipt) => rawMenuCallbacks.current.push(receipt),
              (id) => setInvoked((previous) => [...previous, id]),
            )
          }
        />
        <output
          data-invoked={JSON.stringify(invoked)}
          data-selected-value={selectedValue ?? ""}
          data-input-value={inputValue}
          data-submitted-value={submittedValue ?? ""}
          data-instance-id={instanceId.current}
        >
          Result: {submittedValue ?? (invoked.join(", ") || "none")}
        </output>
      </main>
    );
  }
  const root = createRoot(document.getElementById("root"));
  window.__bench?.renderStarted();
  root.render(<Host />);
}
