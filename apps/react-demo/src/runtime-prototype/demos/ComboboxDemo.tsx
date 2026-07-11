import { useRuntimePrototypeContext } from "../context";
import {
  button,
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxSeparator,
  ComboboxTrigger,
  comboboxCities,
  comboboxDesserts,
  comboboxFruits,
  InputGroupAddon,
} from "../kit";

export function ComboboxDemo() {
  const {
    controlledComboboxValue,
    setControlledComboboxValue,
    controlledComboboxInputValue,
    setControlledComboboxInputValue,
    controlledComboboxOpen,
    setControlledComboboxOpen,
    controlledComboboxChanges,
    setControlledComboboxChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Combobox</h2>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <form
          data-runtime-combobox-form
          className="space-y-3"
          onSubmit={(event) => event.preventDefault()}
        >
          <h3 className="font-heading text-base font-semibold">Uncontrolled searchable value</h3>
          <Combobox
            id="react-runtime-combobox-fruit"
            defaultValue="banana"
            name="reactRuntimeFruit"
            required
          >
            <ComboboxLabel>Fruit</ComboboxLabel>
            <ComboboxInput id="react-runtime-combobox-fruit-input" placeholder="Search fruit" />
            <ComboboxContent id="react-runtime-combobox-fruit-content">
              <ComboboxEmpty>No fruit found.</ComboboxEmpty>
              <ComboboxGroup>
                <ComboboxGroupLabel>Common fruit</ComboboxGroupLabel>
                {comboboxFruits.map((item) => (
                  <ComboboxItem
                    key={item.value}
                    id={`react-runtime-combobox-fruit-${item.value}`}
                    value={item.value}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
              <ComboboxSeparator />
              <ComboboxItem id="react-runtime-combobox-fruit-pear" value="pear">
                Pear
              </ComboboxItem>
            </ComboboxContent>
          </Combobox>
        </form>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Controlled input and value</h3>
          <Combobox
            id="react-runtime-combobox-controlled"
            inputValue={controlledComboboxInputValue}
            name="reactRuntimeControlledFruit"
            open={controlledComboboxOpen}
            value={controlledComboboxValue}
            onInputValueChange={(nextInputValue) => {
              setControlledComboboxInputValue(nextInputValue);
            }}
            onOpenChange={(nextOpen) => {
              setControlledComboboxOpen(nextOpen);
            }}
            onValueChange={(nextValue) => {
              const selected = comboboxFruits.find((item) => item.value === nextValue);
              setControlledComboboxValue(nextValue ?? "apple");
              setControlledComboboxInputValue(selected?.label ?? "");
              setControlledComboboxChanges((count) => count + 1);
            }}
          >
            <ComboboxLabel>Controlled fruit</ComboboxLabel>
            <ComboboxInput
              id="react-runtime-combobox-controlled-input"
              placeholder="Search controlled fruit"
            />
            <ComboboxContent id="react-runtime-combobox-controlled-content">
              <ComboboxEmpty>No fruit found.</ComboboxEmpty>
              {comboboxFruits
                .filter((item) => !item.disabled)
                .map((item) => (
                  <ComboboxItem
                    key={item.value}
                    id={`react-runtime-combobox-controlled-${item.value}`}
                    value={item.value}
                  >
                    {item.label}
                  </ComboboxItem>
                ))}
            </ComboboxContent>
          </Combobox>
          <p data-runtime-combobox-value>Combobox value: {controlledComboboxValue}</p>
          <p data-runtime-combobox-input-value>Combobox input: {controlledComboboxInputValue}</p>
          <p data-runtime-combobox-count>Combobox changes: {controlledComboboxChanges}</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">asChild trigger</h3>
          <Combobox id="react-runtime-combobox-city" defaultValue="kyoto" name="reactRuntimeCity">
            <ComboboxLabel>City</ComboboxLabel>
            <ComboboxInput
              id="react-runtime-combobox-city-input"
              placeholder="Search city"
              showTrigger={false}
              className="h-9 text-sm [&_[data-slot=combobox-input]]:text-sm"
            >
              <InputGroupAddon align="inline-end">
                <ComboboxTrigger asChild showIcon={false}>
                  <button
                    id="react-runtime-combobox-city-trigger"
                    type="button"
                    className={button({ variant: "outline", size: "sm" })}
                  >
                    Cities
                  </button>
                </ComboboxTrigger>
              </InputGroupAddon>
            </ComboboxInput>
            <ComboboxContent id="react-runtime-combobox-city-content" sideOffset={8}>
              <ComboboxEmpty>No city found.</ComboboxEmpty>
              {comboboxCities.map((item) => (
                <ComboboxItem
                  key={item.value}
                  id={`react-runtime-combobox-city-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Read-only form metadata</h3>
          <Combobox
            id="react-runtime-combobox-readonly"
            defaultValue="kyoto"
            name="reactRuntimeReadonlyCity"
            form="react-runtime-settings-form"
            autoComplete="address-level2"
            readOnly
          >
            <ComboboxLabel>Read-only city</ComboboxLabel>
            <ComboboxInput id="react-runtime-combobox-readonly-input" placeholder="Search city" />
            <ComboboxContent id="react-runtime-combobox-readonly-content">
              <ComboboxEmpty>No city found.</ComboboxEmpty>
              {comboboxCities.map((item) => (
                <ComboboxItem
                  key={item.value}
                  id={`react-runtime-combobox-readonly-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Starts-with filtering</h3>
          <Combobox
            id="react-runtime-combobox-starts-with"
            name="reactRuntimeDessert"
            filterMode="startsWith"
            locale="en"
            highlightItemOnHover={false}
          >
            <ComboboxLabel>Dessert</ComboboxLabel>
            <ComboboxInput
              id="react-runtime-combobox-starts-with-input"
              placeholder="Search dessert"
            />
            <ComboboxContent id="react-runtime-combobox-starts-with-content">
              <ComboboxEmpty>No dessert found.</ComboboxEmpty>
              {comboboxDesserts.map((item) => (
                <ComboboxItem
                  key={item.value}
                  id={`react-runtime-combobox-starts-with-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </ComboboxItem>
              ))}
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    </section>
  );
}
