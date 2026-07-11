import {
  IconChevronDown,
  Label,
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from "../kit";

export function NativeSelectDemo() {
  return (
    <section className="space-y-4" id="runtime-native-select-demo">
      <h2 className="font-heading text-xl font-semibold">Native Select</h2>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-sm" size="sm">
            Small
          </Label>
          <NativeSelect
            id="runtime-native-select-sm"
            name="runtime-native-select-sm"
            size="sm"
            defaultValue=""
          >
            <NativeSelectOption value="" disabled>
              Select a timezone
            </NativeSelectOption>
            <NativeSelectOptGroup label="North America">
              <NativeSelectOption value="est">Eastern Standard Time (EST)</NativeSelectOption>
              <NativeSelectOption value="cst">Central Standard Time (CST)</NativeSelectOption>
              <NativeSelectOption value="pst">Pacific Standard Time (PST)</NativeSelectOption>
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label="Asia">
              <NativeSelectOption value="ist">India Standard Time (IST)</NativeSelectOption>
              <NativeSelectOption value="jst">Japan Standard Time (JST)</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-md">Medium</Label>
          <NativeSelect
            id="runtime-native-select-md"
            name="runtime-native-select-md"
            defaultValue=""
          >
            <NativeSelectOption value="" disabled>
              Select a timezone
            </NativeSelectOption>
            <NativeSelectOptGroup label="Europe & Africa">
              <NativeSelectOption value="gmt">Greenwich Mean Time (GMT)</NativeSelectOption>
              <NativeSelectOption value="cet">Central European Time (CET)</NativeSelectOption>
              <NativeSelectOption value="eat">East Africa Time (EAT)</NativeSelectOption>
            </NativeSelectOptGroup>
            <NativeSelectOptGroup label="Australia & Pacific">
              <NativeSelectOption value="aest">
                Australian Eastern Standard Time (AEST)
              </NativeSelectOption>
              <NativeSelectOption value="nzst">New Zealand Standard Time (NZST)</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-lg" size="lg">
            Large
          </Label>
          <NativeSelect
            id="runtime-native-select-lg"
            name="runtime-native-select-lg"
            size="lg"
            defaultValue=""
          >
            <NativeSelectOption value="" disabled>
              Select a timezone
            </NativeSelectOption>
            <NativeSelectOptGroup label="South America">
              <NativeSelectOption value="art">Argentina Time (ART)</NativeSelectOption>
              <NativeSelectOption value="bot">Bolivia Time (BOT)</NativeSelectOption>
              <NativeSelectOption value="brt">Brasilia Time (BRT)</NativeSelectOption>
            </NativeSelectOptGroup>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-custom-icon">Custom Icon</Label>
          <NativeSelect
            id="runtime-native-select-custom-icon"
            name="runtime-native-select-custom-icon"
            defaultValue="owner"
            icon={
              <IconChevronDown
                id="runtime-native-select-custom-icon-node"
                className="text-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 opacity-50"
                aria-hidden="true"
                data-slot="native-select-icon"
              />
            }
          >
            <NativeSelectOption value="owner">Owner</NativeSelectOption>
            <NativeSelectOption value="editor">Editor</NativeSelectOption>
            <NativeSelectOption value="viewer">Viewer</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-disabled">Disabled</Label>
          <NativeSelect
            id="runtime-native-select-disabled"
            name="runtime-native-select-disabled"
            disabled
          >
            <NativeSelectOption value="disabled">Disabled select</NativeSelectOption>
          </NativeSelect>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="runtime-native-select-invalid">Invalid</Label>
          <NativeSelect
            id="runtime-native-select-invalid"
            name="runtime-native-select-invalid"
            aria-invalid="true"
          >
            <NativeSelectOption value="invalid">Invalid state</NativeSelectOption>
          </NativeSelect>
        </div>
      </div>
    </section>
  );
}
