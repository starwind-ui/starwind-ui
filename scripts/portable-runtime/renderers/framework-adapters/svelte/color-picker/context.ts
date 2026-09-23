/** Target-local context and initial projection merge. Runtime owns every live projection. */
export function printColorPickerContext(): string {
  return `import { getContext, setContext, untrack } from "svelte";
import type { ColorPickerInitialState, ColorPickerInitialPartProjection, ColorPickerInitialPartRequest, ColorPickerInitialChannel } from "@starwind-ui/runtime/color-picker";
export type RootContext = { readonly initialState: ColorPickerInitialState; register(element: HTMLElement): () => void; refresh(): void };
export type AreaContext = { owner: RootContext; readonly xChannel: ColorPickerInitialChannel; readonly yChannel: ColorPickerInitialChannel; readonly xStep?: number; readonly yStep?: number };
export type ChannelContext = { owner: RootContext; readonly channel: ColorPickerInitialChannel; readonly orientation: "horizontal" | "vertical"; readonly step?: number };
const rootKey = Symbol("StarwindColorPicker"), areaKey = Symbol("StarwindColorPickerArea"), channelKey = Symbol("StarwindColorPickerChannel");
export function setRoot(context: RootContext): void { setContext(rootKey, context); }
export function getRoot(): RootContext { const context = getContext<RootContext | undefined>(rootKey); if (!context) throw new Error("Color Picker parts require ColorPickerRoot."); return context; }
export function setArea(context: AreaContext): void { setContext(areaKey, context); }
export function getArea(owner: RootContext): AreaContext { const area = getContext<AreaContext | undefined>(areaKey); return area?.owner === owner ? area : { owner, xChannel: "saturation", yChannel: "brightness" }; }
export function setChannel(context: ChannelContext): void { setContext(channelKey, context); }
export function getChannel(owner: RootContext): ChannelContext { const channel = getContext<ChannelContext | undefined>(channelKey); return channel?.owner === owner ? channel : { owner, channel: "hue", orientation: "horizontal" }; }
export function refreshPart(context: RootContext, request: () => ColorPickerInitialPartRequest, authored: Record<string, unknown>): void {
  request(); authored.style; authored.id; authored["aria-label"]; authored["aria-labelledby"]; authored["aria-roledescription"];
  untrack(() => context.refresh());
}
export function mergeProjection(projection: ColorPickerInitialPartProjection, authored: Record<string, unknown>, protectedProps: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(projection.attributes)) {
    if (name === "data-sw-color-picker-initial-owned" || value === undefined || value === false) continue;
    result[name] = name.startsWith("data-") && value === true ? "" : value;
  }
  for (const [name, value] of Object.entries(projection.properties)) if (value !== undefined && name !== "defaultValue") result[name === "readOnly" ? "readonly" : name] = value;
  const css = Object.entries(projection.styles).filter(([, value]) => value !== undefined).map(([name, value]) => name + ":" + value).join(";");
  // Keep attachment symbols on the native spread. Svelte gives each symbol its own effect.
  Object.assign(result, authored, protectedProps);
  if (css) result.style = css + ";" + (authored.style ?? "");
  const owns = (name: string) => !(name in authored) && !((name === "readOnly" ? "readonly" : name) in authored) && !(name in protectedProps);
  const tokens = [...projection.ownership.attributes.filter(owns).map((name) => "a:" + name), ...projection.ownership.properties.filter(owns).map((name) => "p:" + name)];
  if (tokens.length) result["data-sw-color-picker-initial-owned"] = tokens.join(",");
  return result;
}
`;
}
