import { useState } from "react";

import {
  Button,
  IconFlame,
  IconSettings,
  Label,
  NativeSelect,
  NativeSelectOption,
  Switch,
  ThemeToggle,
} from "../kit";

export function ThemeToggleDemo() {
  const [renderCount, setRenderCount] = useState(0);

  return (
    <section className="space-y-4" id="react-runtime-theme-toggle-demo">
      <h2 className="font-heading text-xl font-semibold">Theme Toggle</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Toggles</h3>
          <div className="flex flex-wrap gap-2">
            <ThemeToggle id="react-runtime-theme-toggle-primary" />
            <ThemeToggle id="react-runtime-theme-toggle-secondary" />
            <ThemeToggle
              id="react-runtime-theme-toggle-custom"
              ariaLabel="Toggle theme with custom icons"
              lightIcon={
                <IconFlame
                  className="hidden size-5 group-data-[state=off]:data-ready:block"
                  aria-hidden="true"
                  data-theme-icon
                />
              }
              darkIcon={
                <IconSettings
                  className="hidden size-5 group-data-[state=on]:data-ready:block"
                  aria-hidden="true"
                  data-theme-icon
                />
              }
            />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="react-runtime-theme-native-select">Theme select</Label>
            <NativeSelect
              id="react-runtime-theme-native-select"
              name="react-runtime-theme-native-select"
              data-sw-theme-control
              defaultValue="system"
            >
              <NativeSelectOption value="light">Light</NativeSelectOption>
              <NativeSelectOption value="system">System</NativeSelectOption>
              <NativeSelectOption value="dark">Dark</NativeSelectOption>
            </NativeSelect>
          </div>

          <Switch
            id="react-runtime-theme-switch"
            label="Theme switch"
            data-sw-theme-control
            data-theme-on="dark"
            data-theme-off="light"
          />

          <div className="flex flex-wrap gap-2">
            <Button
              id="react-runtime-theme-value-light"
              type="button"
              variant="outline"
              size="sm"
              data-sw-theme-control
              data-theme-value="light"
            >
              Light
            </Button>
            <Button
              id="react-runtime-theme-value-system"
              type="button"
              variant="outline"
              size="sm"
              data-sw-theme-control
              data-theme-value="system"
            >
              System
            </Button>
            <Button
              id="react-runtime-theme-value-dark"
              type="button"
              variant="outline"
              size="sm"
              data-sw-theme-control
              data-theme-value="dark"
            >
              Dark
            </Button>
          </div>

          <Button
            id="react-runtime-theme-rerender"
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRenderCount((count) => count + 1)}
          >
            Rerender theme controls {renderCount}
          </Button>
        </div>
      </div>
    </section>
  );
}
