import { useCallback, useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Checkbox,
  CheckboxGroup,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  ToggleGroup,
  ToggleGroupItem,
} from "../kit";

type ChoiceItem = {
  disabled?: boolean;
  label: string;
  value: string;
};

const initialToggleItems: ChoiceItem[] = [
  { label: "Bold", value: "bold" },
  { label: "Italic", value: "italic" },
  { label: "Underline", value: "underline" },
];

const initialRadioItems: ChoiceItem[] = [
  { label: "Standard", value: "standard" },
  { label: "Express", value: "express" },
  { label: "Priority", value: "priority" },
];

const initialCheckboxItems: ChoiceItem[] = [
  { label: "Security", value: "security" },
  { label: "Analytics", value: "analytics" },
  { label: "Exports", value: "exports" },
];

const initialAccordionItems: ChoiceItem[] = [
  { label: "Shipping", value: "shipping" },
  { label: "Billing", value: "billing" },
  { label: "Returns", value: "returns" },
];

const initialSelectItems: ChoiceItem[] = [
  { label: "Light", value: "light" },
  { label: "System", value: "system" },
  { label: "Dark", value: "dark" },
  { label: "High contrast", value: "contrast" },
];

export function RuntimeCollectionsDemoPage() {
  const toggleRef = useRef<HTMLDivElement>(null);
  const radioRef = useRef<HTMLDivElement>(null);
  const checkboxRef = useRef<HTMLDivElement>(null);
  const [toggleItems, setToggleItems] = useState(initialToggleItems);
  const [radioItems, setRadioItems] = useState(initialRadioItems);
  const [checkboxItems, setCheckboxItems] = useState(initialCheckboxItems);
  const [accordionItems, setAccordionItems] = useState(initialAccordionItems);
  const [selectItems, setSelectItems] = useState(initialSelectItems);
  const [output, setOutput] = useState("");

  const refreshOutput = useCallback(() => {
    window.setTimeout(() => {
      setOutput(
        [
          `Toggle: ${toggleRef.current?.getAttribute("data-value") ?? "[]"}`,
          `Radio: ${radioRef.current?.getAttribute("data-value") ?? ""}`,
          `Checkbox: ${checkboxRef.current?.getAttribute("data-value") ?? "[]"}`,
          `Accordion: ${getOpenAccordionValues().join(", ") || "closed"}`,
          `Select: ${
            document.querySelector("#react-runtime-dynamic-select")?.getAttribute("data-value") ??
            ""
          }`,
        ].join("\n"),
      );
    }, 0);
  }, []);

  useEffect(() => {
    refreshOutput();
  }, [accordionItems, checkboxItems, radioItems, refreshOutput, selectItems, toggleItems]);

  return (
    <div className="min-h-[calc(100lvh-4.25rem)]">
      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <div className="mb-8 space-y-3">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Runtime collections
          </p>
          <h1 className="font-heading text-4xl font-semibold tracking-tight">Dynamic item sets</h1>
          <p className="text-muted-foreground max-w-2xl">
            Choice groups keep value, disabled state, and keyboard order current as items change.
          </p>
        </div>

        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Toggle group</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setToggleItems((items) =>
                      items.some((item) => item.value === "strike")
                        ? items
                        : [...items, { label: "Strike", value: "strike" }],
                    )
                  }
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setToggleItems((items) => toggleDisabled(items, "italic"))}
                >
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setToggleItems((items) => items.filter((item) => item.value !== "strike"))
                  }
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setToggleItems((items) => moveBefore(items, "underline", "bold"))}
                >
                  Reorder
                </Button>
              </div>
            </div>
            <ToggleGroup
              ref={toggleRef}
              defaultValue={["bold"]}
              variant="outline"
              onValueChange={refreshOutput}
            >
              {toggleItems.map((item) => (
                <ToggleGroupItem key={item.value} value={item.value} disabled={item.disabled}>
                  {item.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Radio group</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRadioItems((items) =>
                      items.some((item) => item.value === "drone")
                        ? items
                        : [...items, { label: "Drone", value: "drone" }],
                    )
                  }
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRadioItems((items) => toggleDisabled(items, "express"))}
                >
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRadioItems((items) => items.filter((item) => item.value !== "drone"))
                  }
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setRadioItems((items) => moveBefore(items, "priority", "standard"))
                  }
                >
                  Reorder
                </Button>
              </div>
            </div>
            <RadioGroup
              ref={radioRef}
              defaultValue="standard"
              legend="Fulfillment speed"
              name="reactRuntimeFulfillmentSpeed"
              onValueChange={refreshOutput}
            >
              {radioItems.map((item) => (
                <label key={item.value} className="flex w-fit items-center gap-3 text-sm">
                  <RadioGroupItem
                    id={`react-runtime-radio-${item.value}`}
                    value={item.value}
                    disabled={item.disabled}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </RadioGroup>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Checkbox group</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCheckboxItems((items) =>
                      items.some((item) => item.value === "audit")
                        ? items
                        : [...items, { label: "Audit trail", value: "audit" }],
                    )
                  }
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCheckboxItems((items) => toggleDisabled(items, "analytics"))}
                >
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCheckboxItems((items) => items.filter((item) => item.value !== "audit"))
                  }
                >
                  Remove
                </Button>
              </div>
            </div>
            <CheckboxGroup
              ref={checkboxRef}
              defaultValue={["security"]}
              onValueChange={refreshOutput}
            >
              {checkboxItems.map((item) => (
                <Checkbox
                  key={item.value}
                  id={`react-runtime-checkbox-${item.value}`}
                  name="reactRuntimeFeatures"
                  value={item.value}
                  label={item.label}
                  disabled={item.disabled}
                />
              ))}
            </CheckboxGroup>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Accordion</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAccordionItems((items) =>
                      items.some((item) => item.value === "tracking")
                        ? items
                        : [...items, { label: "Tracking", value: "tracking" }],
                    )
                  }
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAccordionItems((items) => toggleDisabled(items, "billing"))}
                >
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAccordionItems((items) => items.filter((item) => item.value !== "tracking"))
                  }
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setAccordionItems((items) => moveBefore(items, "returns", "shipping"))
                  }
                >
                  Reorder
                </Button>
              </div>
            </div>
            <Accordion
              id="react-runtime-dynamic-accordion"
              collapsible
              defaultValue="shipping"
              onValueChange={refreshOutput}
            >
              {accordionItems.map((item) => (
                <AccordionItem key={item.value} value={item.value} disabled={item.disabled}>
                  <AccordionTrigger>{item.label}</AccordionTrigger>
                  <AccordionContent>{item.label} content</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Select</h2>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectItems((items) =>
                      items.some((item) => item.value === "solarized")
                        ? items
                        : [...items, { label: "Solarized", value: "solarized" }],
                    )
                  }
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectItems((items) => toggleDisabled(items, "contrast"))}
                >
                  Disable
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setSelectItems((items) => items.filter((item) => item.value !== "solarized"))
                  }
                >
                  Remove
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectItems((items) => moveBefore(items, "dark", "light"))}
                >
                  Reorder
                </Button>
              </div>
            </div>
            <Select
              id="react-runtime-dynamic-select"
              defaultValue="system"
              name="reactRuntimeTheme"
              onValueChange={refreshOutput}
            >
              <SelectTrigger placeholder="Theme" />
              <SelectContent alignItemWithTrigger={false}>
                {selectItems.map((item) => (
                  <SelectItem key={item.value} value={item.value} disabled={item.disabled}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </section>
        </div>

        <output className="border-border bg-muted text-muted-foreground mt-8 block min-h-24 rounded-md border p-4 text-sm whitespace-pre-wrap">
          {output}
        </output>
      </main>
    </div>
  );
}

function toggleDisabled(items: ChoiceItem[], value: string): ChoiceItem[] {
  return items.map((item) => (item.value === value ? { ...item, disabled: !item.disabled } : item));
}

function moveBefore(items: ChoiceItem[], value: string, beforeValue: string): ChoiceItem[] {
  const moving = items.find((item) => item.value === value);
  if (!moving) return items;

  const withoutMoving = items.filter((item) => item.value !== value);
  const beforeIndex = withoutMoving.findIndex((item) => item.value === beforeValue);
  if (beforeIndex < 0) return items;

  return [...withoutMoving.slice(0, beforeIndex), moving, ...withoutMoving.slice(beforeIndex)];
}

function getOpenAccordionValues(): string[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      "#react-runtime-dynamic-accordion [data-sw-accordion-item][data-state='open']",
    ),
  ).map((item) => item.getAttribute("data-value") ?? "");
}
