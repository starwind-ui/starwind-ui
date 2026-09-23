import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName as Part,
} from "../../primitive-output-model/color-picker.js";

type Prop = { name: string; type: string; default?: string; required?: boolean };
const channel = (name: string, fallback?: string): Prop => ({
  name,
  type: "ColorPickerInitialChannel",
  default: fallback && JSON.stringify(fallback),
});
const step = (name = "step"): Prop => ({ name, type: "number" });
/** Part inputs and context inheritance feed Runtime's existing initial-part projector. */
export const colorPickerPartProps: Partial<Record<Part, readonly Prop[]>> = {
  area: [
    channel("xChannel", "saturation"),
    channel("yChannel", "brightness"),
    step("xStep"),
    step("yStep"),
  ],
  areaInput: [{ name: "axis", type: '"x" | "y"', default: '"x"' }, step()],
  channelSlider: [
    channel("channel", "hue"),
    { name: "orientation", type: '"horizontal" | "vertical"', default: '"horizontal"' },
    step(),
  ],
  channelSliderInput: [step()],
  channelInput: [channel("channel", "hue")],
  swatch: [
    { name: "swatchValue", type: "ColorPickerValue", required: true },
    { name: "swatchDisabled", type: "boolean", default: "false" },
  ],
};
export const colorPickerPartContext: Partial<Record<Part, "area" | "slider">> = {
  areaBackground: "area",
  areaThumb: "area",
  areaInput: "area",
  channelSliderTrack: "slider",
  channelSliderThumb: "slider",
  channelSliderInput: "slider",
};
export type ColorPickerPartAccess = {
  prop(name: string): string;
  area(name: string): string;
  slider(name: string): string;
  aria(name: string): string;
};

export function colorPickerPartRequest(part: Part, a: ColorPickerPartAccess): string {
  const entries: Record<string, string> = { part: JSON.stringify(part) };
  const copy = (names: string[], read: (name: string) => string) => {
    for (const name of names) entries[name] = read(name);
  };
  if (part === "area") copy(["xChannel", "yChannel", "xStep", "yStep"], a.prop);
  if (colorPickerPartContext[part] === "area")
    copy(["xChannel", "yChannel", "xStep", "yStep"], a.area);
  if (part === "areaInput") {
    entries.axis = a.prop("axis");
    for (const axis of ["x", "y"])
      entries[`${axis}Step`] =
        `${a.prop("axis")} === "${axis}" ? ${a.prop("step")} ?? ${a.area(`${axis}Step`)} : ${a.area(`${axis}Step`)}`;
    entries.ariaLabel = a.aria("aria-label");
    entries.ariaLabelledBy = a.aria("aria-labelledby");
    entries.ariaRoleDescription = a.aria("aria-roledescription");
  }
  if (part === "channelSlider") copy(["channel", "orientation", "step"], a.prop);
  if (colorPickerPartContext[part] === "slider") copy(["channel", "orientation", "step"], a.slider);
  if (part === "channelSliderInput") {
    entries.step = `${a.prop("step")} ?? ${a.slider("step")}`;
    entries.ariaLabel = a.aria("aria-label");
  }
  if (part === "channelInput") entries.channel = a.prop("channel");
  if (part === "swatch") {
    entries.value = a.prop("swatchValue");
    entries.disabled = a.prop("swatchDisabled");
  }
  return `{ ${Object.entries(entries)
    .map(([name, value]) => `${name}: ${value}`)
    .join(", ")} }`;
}

export function colorPickerPartAttributes(part: Part, a: ColorPickerPartAccess): string[] {
  const entries: Record<string, string> = {};
  if (part === "area") {
    entries["data-x-channel"] = a.prop("xChannel");
    entries["data-y-channel"] = a.prop("yChannel");
  }
  if (part === "areaInput") {
    entries["data-axis"] = a.prop("axis");
    entries["data-step"] =
      `${a.prop("step")} ?? (${a.prop("axis")} === "x" ? ${a.area("xStep")} : ${a.area("yStep")})`;
  }
  if (part === "channelSlider") {
    entries["data-channel"] = a.prop("channel");
    entries["data-orientation"] = a.prop("orientation");
  }
  if (part === "channelSliderInput")
    entries["data-step"] = `${a.prop("step")} ?? ${a.slider("step")}`;
  if (part === "channelInput") entries["data-channel"] = a.prop("channel");
  if (part === "swatch") {
    entries["data-value"] =
      `typeof ${a.prop("swatchValue")} === "string" ? ${a.prop("swatchValue")} : ${a.prop("swatchValue")}?.toString()`;
    entries["data-disabled"] = `${a.prop("swatchDisabled")} ? "" : undefined`;
  }
  return Object.entries(entries).map(([name, value]) => `${JSON.stringify(name)}: ${value}`);
}

export const colorPickerConfiguration: Partial<Record<Part, readonly string[]>> = {
  area: ["data-x-channel", "data-y-channel"],
  areaInput: ["data-axis", "data-step", "aria-label", "aria-labelledby", "aria-roledescription"],
  channelSlider: ["data-channel", "data-orientation"],
  channelSliderInput: ["data-step"],
  channelInput: ["data-channel"],
  swatch: ["data-value", "data-disabled"],
};
export function colorPickerConfigurationAttributes(): string[] {
  return [...new Set(Object.values(colorPickerConfiguration).flat())].sort();
}
export function colorPickerConfigurationLookup(
  f: AdapterColorPickerFacts,
  element: string,
): string {
  return (
    Object.entries(colorPickerConfiguration)
      .map(
        ([part, attributes]) =>
          `if (${element}.hasAttribute(${JSON.stringify(f.parts[part as Part].discoveryAttribute)})) return ${JSON.stringify(attributes)};`,
      )
      .join("\n") + "\nreturn [];"
  );
}

/** React and Vue observe authored configuration and conditional parts through native DOM APIs. */
export function printColorPickerStructure(f: AdapterColorPickerFacts): string {
  const selector = Object.values(f.parts)
    .map((part) => `[${part.discoveryAttribute}]`)
    .join(", ");
  const rootSelector = `[${f.parts.root.discoveryAttribute}]`;
  return `function colorPickerStructure(root: HTMLElement) {
  const seeds = new Map<Element, string>();
  const ids = new WeakMap<Element, number>();
  let nextId = 0;
  const ownedParts = () => [root, ...root.querySelectorAll(${JSON.stringify(selector)})].filter(part => part.closest(${JSON.stringify(rootSelector)}) === root);
  function configuration(part: Element): readonly string[] {
    ${colorPickerConfigurationLookup(f, "part")}
  }
  function captureOwnership(): void {
    for (const part of ownedParts()) {
      const marker = part.getAttribute(${JSON.stringify(f.initialStateProjection.ownershipAttribute)});
      if (marker) seeds.set(part, marker);
    }
  }
  function restoreOwnership(): void {
    for (const [part, marker] of seeds) {
      if (!part.isConnected || part.closest(${JSON.stringify(rootSelector)}) !== root) { seeds.delete(part); continue; }
      part.setAttribute(${JSON.stringify(f.initialStateProjection.ownershipAttribute)}, marker);
    }
  }
  function fingerprint(): string {
    return ownedParts().map(part => {
      let id = ids.get(part);
      if (id === undefined) { id = nextId++; ids.set(part, id); }
      return id + ":" + part.tagName + ":" + configuration(part).map(name => name + "=" + (part.getAttribute(name) ?? "")).join(";");
    }).join("|");
  }
  function observe(refresh: () => void): () => void {
    let previous = fingerprint(), pending = false, active = true;
    const observer = new MutationObserver(records => {
      const relevant = records.some(record => {
        const target = record.target instanceof Element ? record.target : undefined;
        if (!target || target.closest(${JSON.stringify(rootSelector)}) !== root) return false;
        if (record.type === "childList") return true;
        return record.type === "attributes" && record.attributeName !== null && configuration(target).includes(record.attributeName);
      });
      if (!relevant || pending) return;
      pending = true;
      queueMicrotask(() => {
        pending = false;
        if (!active) return;
        const next = fingerprint();
        if (next === previous) return;
        previous = next;
        captureOwnership();
        refresh();
        previous = fingerprint();
      });
    });
    observer.observe(root, { attributes: true, attributeFilter: ${JSON.stringify(colorPickerConfigurationAttributes())}, childList: true, subtree: true });
    return () => { active = false; observer.disconnect(); };
  }
  return { captureOwnership, restoreOwnership, observe };
}
`;
}
