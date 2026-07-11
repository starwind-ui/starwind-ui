import { useRuntimePrototypeContext } from "../context";
import {
  button,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectAlignmentOptions,
  selectDensity,
  selectScrollableItems,
  selectThemes,
} from "../kit";

export function SelectDemo() {
  const {
    controlledSelectValue,
    setControlledSelectValue,
    controlledSelectChanges,
    setControlledSelectChanges,
  } = useRuntimePrototypeContext();

  return (
    <section className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Select</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Uncontrolled form value</h3>
          <Select
            id="react-runtime-select-theme"
            defaultValue="system"
            name="reactRuntimeTheme"
            required
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-theme-trigger"
              className="runtime-select-trigger-custom w-full"
              placeholder="Pick theme"
            />
            <SelectContent id="react-runtime-select-theme-content">
              <SelectGroup>
                <SelectLabel>Appearance</SelectLabel>
                {selectThemes.map((item) => (
                  <SelectItem
                    key={item.value}
                    id={`react-runtime-select-theme-${item.value}`}
                    value={item.value}
                    disabled={item.disabled}
                  >
                    {item.label}
                  </SelectItem>
                ))}
                <SelectSeparator />
                <SelectItem id="react-runtime-select-theme-auto" value="auto">
                  Auto detect
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Controlled value</h3>
          <Select
            id="react-runtime-select-controlled"
            value={controlledSelectValue}
            name="reactRuntimeControlledTheme"
            onValueChange={(nextValue) => {
              setControlledSelectValue(nextValue ?? "system");
              setControlledSelectChanges((count) => count + 1);
            }}
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-controlled-trigger"
              className="w-full"
              placeholder="Pick theme"
            />
            <SelectContent id="react-runtime-select-controlled-content">
              {selectThemes
                .filter((item) => !item.disabled)
                .map((item) => (
                  <SelectItem
                    key={item.value}
                    id={`react-runtime-select-controlled-${item.value}`}
                    value={item.value}
                  >
                    {item.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <p data-runtime-select-value>Select value: {controlledSelectValue}</p>
          <p data-runtime-select-count>Select changes: {controlledSelectChanges}</p>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">asChild trigger</h3>
          <Select
            id="react-runtime-select-density"
            defaultValue="comfortable"
            name="reactRuntimeDensity"
          >
            <SelectTrigger asChild showIcon={false} className={button({ variant: "outline" })}>
              <button id="react-runtime-select-density-trigger" type="button">
                <SelectValue placeholder="Density" />
              </button>
            </SelectTrigger>
            <SelectContent id="react-runtime-select-density-content" sideOffset={6}>
              {selectDensity.map((item) => (
                <SelectItem
                  key={item.value}
                  id={`react-runtime-select-density-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Read-only form metadata</h3>
          <Select
            id="react-runtime-select-readonly"
            defaultValue="dark"
            name="reactRuntimeReadonlyTheme"
            form="react-runtime-settings-form"
            autoComplete="organization"
            readOnly
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-readonly-trigger"
              className="w-full"
              placeholder="Theme"
            />
            <SelectContent id="react-runtime-select-readonly-content">
              {selectThemes
                .filter((item) => !item.disabled)
                .map((item) => (
                  <SelectItem
                    key={item.value}
                    id={`react-runtime-select-readonly-${item.value}`}
                    value={item.value}
                  >
                    {item.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">No hover highlight</h3>
          <Select
            id="react-runtime-select-no-hover"
            defaultValue="compact"
            name="reactRuntimeNoHoverDensity"
            highlightItemOnHover={false}
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-no-hover-trigger"
              className="w-full"
              placeholder="Density"
            />
            <SelectContent id="react-runtime-select-no-hover-content">
              {selectDensity.map((item) => (
                <SelectItem
                  key={item.value}
                  id={`react-runtime-select-no-hover-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Item-aligned positioner</h3>
          <Select
            id="react-runtime-select-aligned"
            defaultValue="editor"
            name="reactRuntimeAlignedRole"
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-aligned-trigger"
              className="w-full"
              placeholder="Role"
            />
            <SelectContent id="react-runtime-select-aligned-content" alignItemWithTrigger>
              {selectAlignmentOptions.map((item) => (
                <SelectItem
                  key={item.value}
                  id={`react-runtime-select-aligned-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Non item-aligned positioner</h3>
          <Select
            id="react-runtime-select-standard"
            defaultValue="editor"
            name="reactRuntimeStandardRole"
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-standard-trigger"
              className="w-full"
              placeholder="Role"
            />
            <SelectContent id="react-runtime-select-standard-content" alignItemWithTrigger={false}>
              {selectAlignmentOptions.map((item) => (
                <SelectItem
                  key={item.value}
                  id={`react-runtime-select-standard-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold">Scrollable options</h3>
          <Select
            id="react-runtime-select-scroll"
            defaultValue="item-01"
            name="reactRuntimeScrollableItem"
            className="w-72"
          >
            <SelectTrigger
              id="react-runtime-select-scroll-trigger"
              className="w-full"
              placeholder="Item"
            />
            <SelectContent id="react-runtime-select-scroll-content">
              {selectScrollableItems.map((item) => (
                <SelectItem
                  key={item.value}
                  id={`react-runtime-select-scroll-${item.value}`}
                  value={item.value}
                >
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </section>
  );
}
