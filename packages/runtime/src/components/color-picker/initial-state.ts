import {
  COLOR_PICKER_FORMATS,
  parseColor,
  type ColorPickerColor,
  type ColorPickerFormat,
} from "./color-picker";

export const COLOR_PICKER_INITIAL_PARTS = [
  "root",
  "label",
  "control",
  "valueInput",
  "valueSwatch",
  "valueText",
  "area",
  "areaBackground",
  "areaThumb",
  "areaInput",
  "channelSlider",
  "channelSliderTrack",
  "channelSliderThumb",
  "channelSliderInput",
  "channelInput",
  "formatControl",
  "formatSelect",
  "transparencyGrid",
  "swatchGroup",
  "swatch",
  "eyeDropperTrigger",
  "clear",
  "hiddenInput",
] as const;
export const COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE =
  "data-sw-color-picker-initial-owned" as const;

export type ColorPickerInitialPartName = (typeof COLOR_PICKER_INITIAL_PARTS)[number];
export type ColorPickerInitialDirection = "ltr" | "rtl";
export type ColorPickerInitialValue = string | ColorPickerColor | null;
export type ColorPickerInitialChannel =
  | "hue"
  | "saturation"
  | "brightness"
  | "lightness"
  | "red"
  | "green"
  | "blue"
  | "alpha";
export type ColorPickerInitialAxis = "x" | "y";
export type ColorPickerInitialOrientation = "horizontal" | "vertical";

export type ColorPickerInitialStateOptions = {
  value?: ColorPickerInitialValue;
  defaultValue?: ColorPickerInitialValue;
  format?: ColorPickerFormat;
  alpha?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  name?: string;
  form?: string;
  locale?: string;
  dir?: ColorPickerInitialDirection;
  getAriaValueText?: (
    channel: ColorPickerInitialChannel,
    value: number,
    color: ColorPickerColor,
  ) => string;
  getAreaRoleDescription?: (locale?: string) => string;
  getColorDescription?: (color: ColorPickerColor | null) => string;
};

export type ColorPickerInitialState = Readonly<{
  value: ColorPickerColor | null;
  valueAsString: string;
  defaultValueAsString: string;
  cssColor: string;
  colorDescription: string;
  format: ColorPickerFormat;
  alpha: boolean;
  allowEmpty: boolean;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  invalid: boolean;
  name?: string;
  form?: string;
  locale?: string;
  dir?: ColorPickerInitialDirection;
  getAriaValueText?: ColorPickerInitialStateOptions["getAriaValueText"];
  getAreaRoleDescription?: ColorPickerInitialStateOptions["getAreaRoleDescription"];
}>;

type EmptyPartRequest = { part: Exclude<ColorPickerInitialPartName, ContextPartName> };
type ContextPartName =
  | "area"
  | "areaBackground"
  | "areaThumb"
  | "areaInput"
  | "channelSlider"
  | "channelSliderTrack"
  | "channelSliderThumb"
  | "channelSliderInput"
  | "channelInput"
  | "swatch";
type AreaContext = {
  xChannel?: ColorPickerInitialChannel;
  yChannel?: ColorPickerInitialChannel;
  xStep?: number;
  yStep?: number;
};
type SliderContext = {
  channel: ColorPickerInitialChannel;
  orientation?: ColorPickerInitialOrientation;
  step?: number;
};

export type ColorPickerInitialPartRequest =
  | EmptyPartRequest
  | ({ part: "area" | "areaBackground" | "areaThumb" } & AreaContext)
  | ({
      part: "areaInput";
      axis: ColorPickerInitialAxis;
      ariaLabel?: string;
      ariaLabelledBy?: string;
      ariaRoleDescription?: string;
    } & AreaContext)
  | ({ part: "channelSlider" | "channelSliderTrack" | "channelSliderThumb" } & SliderContext)
  | ({ part: "channelSliderInput"; ariaLabel?: string } & SliderContext)
  | { part: "channelInput"; channel: ColorPickerInitialChannel }
  | { part: "swatch"; value: ColorPickerInitialValue; disabled?: boolean };

export type ColorPickerInitialPartProjection = Readonly<{
  part: ColorPickerInitialPartName;
  attributes: Readonly<Record<string, string | number | boolean | undefined>>;
  properties: Readonly<{
    value?: string | number;
    defaultValue?: string;
    disabled?: boolean;
    readOnly?: boolean;
    hidden?: boolean;
  }>;
  styles: Readonly<Record<string, string | undefined>>;
  ownership: Readonly<{
    attributes: readonly string[];
    properties: readonly string[];
  }>;
  text?: string;
}>;

export type ColorPickerChannelProjection = Readonly<{
  channel: ColorPickerInitialChannel;
  min: number;
  max: number;
  step: number;
  exact: number;
  displayed: number;
  ratio: number;
}>;

export function createColorPickerInitialState(
  options: ColorPickerInitialStateOptions = {},
): ColorPickerInitialState {
  const alpha = options.alpha ?? true;
  const allowEmpty = options.allowEmpty ?? false;
  const format = validFormat(options.format) ?? "hex";
  const requested = Object.hasOwn(options, "value")
    ? options.value
    : Object.hasOwn(options, "defaultValue")
      ? options.defaultValue
      : "#000000";
  const value = normalizeInitialValue(requested, { allowEmpty, alpha });
  const valueAsString = serializeColorPickerValue(value, format, alpha);
  const locale = options.locale;
  const getColorDescription = options.getColorDescription;
  const required = options.required ?? false;
  const disabled = options.disabled ?? false;
  const state: ColorPickerInitialState = {
    value,
    valueAsString,
    defaultValueAsString: valueAsString,
    cssColor: value?.toString(value.alpha < 1 ? "hexa" : "hex") ?? "transparent",
    colorDescription:
      getColorDescription?.(value) ?? describeColorPickerValue(value, format, alpha, locale),
    format,
    alpha,
    allowEmpty,
    disabled,
    readOnly: options.readOnly ?? false,
    required,
    invalid: !disabled && allowEmpty && required && value === null,
    ...(options.name === undefined ? {} : { name: options.name }),
    ...(options.form === undefined ? {} : { form: options.form }),
    ...(locale === undefined ? {} : { locale }),
    ...(options.dir === undefined ? {} : { dir: options.dir }),
    ...(options.getAriaValueText === undefined
      ? {}
      : { getAriaValueText: options.getAriaValueText }),
    ...(options.getAreaRoleDescription === undefined
      ? {}
      : { getAreaRoleDescription: options.getAreaRoleDescription }),
  };
  return Object.freeze(state);
}

export function projectColorPickerInitialPart(
  state: ColorPickerInitialState,
  request: ColorPickerInitialPartRequest,
): ColorPickerInitialPartProjection {
  const base = () => projection(request.part);
  switch (request.part) {
    case "root": {
      const hsb = state.value?.hsb;
      return projection("root", {
        attributes: {
          role: "group",
          "data-value": state.valueAsString,
          "data-format": state.format,
          "data-alpha": state.alpha,
          "data-allow-empty": state.allowEmpty,
          "data-disabled": state.disabled,
          "data-readonly": state.readOnly,
          "data-invalid": state.invalid,
          "data-name": state.name,
          "data-form": state.form,
          "data-required": state.required,
          "data-locale": state.locale,
          dir: state.dir,
        },
        ownedAttributes: [
          "data-value",
          "data-format",
          "data-alpha",
          "data-allow-empty",
          "data-disabled",
          "data-readonly",
          "data-invalid",
          "data-name",
          "data-form",
          "data-required",
          "data-locale",
          "dir",
        ],
        styles: {
          "--sw-color-picker-color": state.cssColor,
          "--sw-color-picker-hue": hsb ? cssNumber(hsb.hue) : undefined,
          "--sw-color-picker-saturation": hsb ? `${cssNumber(hsb.saturation)}%` : undefined,
          "--sw-color-picker-brightness": hsb ? `${cssNumber(hsb.brightness)}%` : undefined,
          "--sw-color-picker-alpha": hsb ? cssNumber(hsb.alpha) : undefined,
        },
      });
    }
    case "valueInput":
      return projection("valueInput", {
        attributes: {
          "aria-invalid": state.invalid ? "true" : "false",
          "data-invalid": state.invalid,
        },
        properties: {
          value: state.valueAsString,
          disabled: state.disabled,
          readOnly: state.readOnly,
        },
        ownedAttributes: ["aria-invalid", "data-invalid"],
        ownedProperties: ["value", "disabled", "readOnly"],
      });
    case "valueSwatch":
      return projection("valueSwatch", {
        styles: { "--sw-color-picker-swatch-color": state.cssColor },
      });
    case "valueText":
      return projection("valueText", { text: state.valueAsString });
    case "area": {
      const context = areaContext(request);
      return projection("area", {
        attributes: {
          "data-x-channel": context.xChannel,
          "data-y-channel": context.yChannel,
          "data-focused": false,
          "data-dragging": false,
          "data-disabled": state.disabled,
          "data-readonly": state.readOnly,
        },
      });
    }
    case "areaThumb": {
      const context = areaContext(request);
      const x = projectColorPickerChannel(state.value, context.xChannel, context.xStep).ratio * 100;
      const y =
        (1 - projectColorPickerChannel(state.value, context.yChannel, context.yStep).ratio) * 100;
      return projection("areaThumb", {
        attributes: surfaceAttributes(state),
        styles: {
          "--sw-color-picker-area-x": `${cssNumber(x)}%`,
          "--sw-color-picker-area-y": `${cssNumber(y)}%`,
          "--sw-color-picker-area-thumb-color": thumbDisplayColor(state.value),
        },
      });
    }
    case "areaInput": {
      const context = areaContext(request);
      const channel = request.axis === "y" ? context.yChannel : context.xChannel;
      const step = request.axis === "y" ? context.yStep : context.xStep;
      const channelProjection = projectColorPickerChannel(state.value, channel, step);
      const otherChannel = request.axis === "y" ? context.xChannel : context.yChannel;
      const otherStep = request.axis === "y" ? context.xStep : context.yStep;
      const valueText = state.value
        ? (state.getAriaValueText?.(channel, channelProjection.displayed, state.value) ??
          `${formatColorPickerChannel(channel, channelProjection.displayed, state.locale)}, ${formatColorPickerChannel(
            otherChannel,
            projectColorPickerChannel(state.value, otherChannel, otherStep).displayed,
            state.locale,
          )}`)
        : "Empty";
      return projection("areaInput", {
        attributes: {
          type: "range",
          "data-axis": request.axis,
          "data-step": channelProjection.step,
          min: channelProjection.min,
          max: channelProjection.max,
          step: channelProjection.step,
          "aria-valuemin": channelProjection.min,
          "aria-valuemax": channelProjection.max,
          "aria-valuenow": channelProjection.displayed,
          "aria-orientation": request.axis === "y" ? "vertical" : "horizontal",
          "aria-roledescription":
            request.ariaRoleDescription ??
            state.getAreaRoleDescription?.(state.locale) ??
            "2D Slider",
          "aria-valuetext": valueText,
          "aria-description": state.colorDescription,
          "aria-label": request.ariaLabel ?? label(channel),
          "aria-labelledby": request.ariaLabelledBy,
        },
        properties: {
          value: String(channelProjection.displayed),
          disabled: state.disabled,
          readOnly: state.readOnly,
        },
        ownedAttributes: [
          "min",
          "max",
          "step",
          "aria-valuemin",
          "aria-valuemax",
          "aria-valuenow",
          "aria-orientation",
          ...(request.ariaRoleDescription === undefined ? ["aria-roledescription"] : []),
          "aria-valuetext",
          "aria-description",
        ],
        ownedProperties: ["value", "disabled", "readOnly"],
      });
    }
    case "channelSlider": {
      const channelProjection = projectColorPickerChannel(
        state.value,
        request.channel,
        request.step,
      );
      return projection("channelSlider", {
        attributes: {
          "data-channel": request.channel,
          "data-orientation": request.orientation ?? "horizontal",
          "data-focused": false,
          "data-dragging": false,
          "data-disabled": state.disabled,
          "data-readonly": state.readOnly,
        },
        properties: { hidden: request.channel === "alpha" && !state.alpha },
        styles: {
          "--sw-color-picker-channel-position": `${cssNumber(channelProjection.ratio * 100)}%`,
        },
      });
    }
    case "channelSliderThumb":
      return projection("channelSliderThumb", {
        attributes: surfaceAttributes(state),
        styles: {
          "--sw-color-picker-channel-thumb-color": thumbDisplayColor(state.value, request.channel),
        },
      });
    case "channelSliderInput": {
      const channelProjection = projectColorPickerChannel(
        state.value,
        request.channel,
        request.step,
      );
      const valueText = state.value
        ? (state.getAriaValueText?.(request.channel, channelProjection.displayed, state.value) ??
          formatColorPickerChannel(request.channel, channelProjection.displayed, state.locale))
        : "Empty";
      return projection("channelSliderInput", {
        attributes: {
          type: "range",
          "data-step": channelProjection.step,
          min: channelProjection.min,
          max: channelProjection.max,
          step: channelProjection.step,
          "aria-valuemin": channelProjection.min,
          "aria-valuemax": channelProjection.max,
          "aria-valuenow": channelProjection.displayed,
          "aria-orientation": request.orientation ?? "horizontal",
          "aria-valuetext": valueText,
          "aria-description": state.colorDescription,
          "aria-label": request.ariaLabel ?? label(request.channel),
        },
        properties: {
          value: String(channelProjection.displayed),
          disabled: state.disabled,
          readOnly: state.readOnly,
        },
        ownedAttributes: [
          "min",
          "max",
          "step",
          "aria-valuemin",
          "aria-valuemax",
          "aria-valuenow",
          "aria-orientation",
          "aria-valuetext",
          "aria-description",
        ],
        ownedProperties: ["value", "disabled", "readOnly"],
      });
    }
    case "channelInput":
      return projection("channelInput", {
        attributes: {
          "data-channel": request.channel,
          "aria-invalid": "false",
          "data-invalid": false,
        },
        properties: {
          value: state.value ? String(channelValue(state.value, request.channel)) : "",
          disabled: state.disabled,
          readOnly: state.readOnly,
          hidden: request.channel === "alpha" && !state.alpha,
        },
      });
    case "formatControl":
      return projection("formatControl", {
        attributes: {
          "data-format": state.format,
          "data-disabled": state.disabled,
          "data-readonly": state.readOnly,
        },
      });
    case "formatSelect":
      return projection("formatSelect", {
        attributes: { "aria-readonly": state.readOnly ? "true" : "false" },
        properties: { value: state.format, disabled: state.disabled },
      });
    case "swatchGroup":
      return projection("swatchGroup", { attributes: { role: "group" } });
    case "swatch": {
      const parsed = normalizeColorPickerValue(request.value, state.alpha);
      const selected = parsed !== null && equalColor(parsed, state.value);
      return projection("swatch", {
        attributes: {
          type: "button",
          "data-value":
            typeof request.value === "string"
              ? request.value
              : request.value?.toString(request.value.alpha < 1 ? "hexa" : "hex"),
          "data-disabled": request.disabled ?? false,
          "data-selected": selected,
          "aria-pressed": selected ? "true" : "false",
          "aria-readonly": state.readOnly ? "true" : "false",
        },
        properties: { disabled: state.disabled || (request.disabled ?? false) },
        ownedAttributes: ["data-selected", "aria-pressed", "aria-readonly"],
        ownedProperties: state.disabled ? ["disabled"] : [],
        styles: {
          "--sw-color-picker-swatch-color": parsed
            ? parsed.toString(parsed.alpha < 1 ? "hexa" : "hex")
            : undefined,
        },
      });
    }
    case "eyeDropperTrigger":
      return projection("eyeDropperTrigger", {
        attributes: {
          type: "button",
          "data-unsupported": true,
          "aria-readonly": state.readOnly ? "true" : "false",
        },
        properties: { hidden: true, disabled: state.disabled },
        ownedAttributes: ["data-unsupported", "aria-readonly"],
        ownedProperties: ["hidden", "disabled"],
      });
    case "clear":
      return projection("clear", {
        attributes: {
          type: "button",
          "aria-readonly": state.readOnly ? "true" : "false",
        },
        properties: {
          hidden: !state.allowEmpty,
          disabled: state.disabled || !state.allowEmpty,
        },
        ownedAttributes: ["aria-readonly"],
        ownedProperties: ["hidden", "disabled"],
      });
    case "hiddenInput":
      return projection("hiddenInput", {
        attributes: {
          type: "text",
          "aria-hidden": "true",
          tabindex: -1,
          name: state.name,
          form: state.form,
          required: state.allowEmpty && state.required,
        },
        properties: {
          value: state.valueAsString,
          defaultValue: state.defaultValueAsString,
          disabled: state.disabled,
        },
        ownedAttributes: ["aria-hidden", "tabindex", "name", "form", "required"],
        ownedProperties: ["value", "defaultValue", "disabled"],
        styles: {
          position: "absolute",
          width: "1px",
          height: "1px",
          margin: "-1px",
          overflow: "hidden",
          "clip-path": "inset(50%)",
          "white-space": "nowrap",
          border: "0",
        },
      });
    case "label":
    case "control":
    case "areaBackground":
    case "channelSliderTrack":
    case "transparencyGrid":
      return base();
  }
}

export function normalizeColorPickerValue(
  value: ColorPickerInitialValue | undefined,
  alpha: boolean,
): ColorPickerColor | null {
  const parsed = typeof value === "string" ? parseColor(value) : (value ?? null);
  if (!parsed || alpha || parsed.alpha === 1) return parsed;
  return parsed.withChannels("rgb", { alpha: 1 });
}

export function normalizeColorPickerCapabilityValue(
  value: ColorPickerInitialValue | undefined,
  capability: { alpha: boolean; allowEmpty: boolean },
): ColorPickerColor | null {
  if (value === null && capability.allowEmpty) return null;
  return normalizeColorPickerValue(value, capability.alpha) ?? parseColor("#000000")!;
}

export function serializeColorPickerValue(
  value: ColorPickerColor | null,
  format: ColorPickerFormat,
  alpha: boolean,
): string {
  const normalized = normalizeColorPickerValue(value, alpha);
  return normalized?.toString(alpha ? alphaFormat(format, normalized.alpha) : format) ?? "";
}

export function projectColorPickerChannel(
  color: ColorPickerColor | null,
  channel: ColorPickerInitialChannel,
  requestedStep?: number,
): ColorPickerChannelProjection {
  const step = validStep(requestedStep, channel);
  const min = 0;
  const max =
    channel === "hue"
      ? hueUpperBound(step)
      : steppedUpperBound(
          channel === "red" || channel === "green" || channel === "blue" ? 255 : 100,
          step,
        );
  const exact = color ? channelValue(color, channel) : min;
  const index = Math.round((clamp(exact, min, max) - min) / step);
  const displayed = clamp(roundToPrecision(min + index * step, decimalPlaces(step)), min, max);
  const ratio = max === min ? 0 : clamp((displayed - min) / (max - min), 0, 1);
  return Object.freeze({ channel, min, max, step, exact, displayed, ratio });
}

export function snapColorPickerChannelValue(
  value: number,
  channel: ColorPickerInitialChannel,
  requestedStep?: number,
): number {
  const projection = projectColorPickerChannel(null, channel, requestedStep);
  const index = Math.round(
    (clamp(value, projection.min, projection.max) - projection.min) / projection.step,
  );
  return clamp(
    roundToPrecision(projection.min + index * projection.step, decimalPlaces(projection.step)),
    projection.min,
    projection.max,
  );
}

export function stepColorPickerHue(
  value: number,
  stepDelta: number,
  requestedStep?: number,
): number {
  const step = validStep(requestedStep, "hue");
  const count = hueStepCount(step);
  const currentIndex = clamp(Math.round(value / step), 0, count - 1);
  const nextIndex = (((currentIndex + stepDelta) % count) + count) % count;
  return roundToPrecision(nextIndex * step, decimalPlaces(step));
}

export function formatColorPickerChannel(
  channel: ColorPickerInitialChannel,
  value: number,
  locale?: string,
): string {
  const name = label(channel);
  if (["saturation", "brightness", "lightness", "alpha"].includes(channel)) {
    return `${name} ${new Intl.NumberFormat(locale, {
      maximumFractionDigits: 2,
      style: "percent",
    }).format(value / 100)}`;
  }
  const formatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: channel === "hue" ? 2 : 0,
  }).format(value);
  return channel === "hue" ? `${name} ${formatted}°` : `${name} ${formatted}`;
}

function normalizeInitialValue(
  requested: ColorPickerInitialValue | undefined,
  capability: { allowEmpty: boolean; alpha: boolean },
): ColorPickerColor | null {
  return normalizeColorPickerCapabilityValue(requested, capability);
}

function describeColorPickerValue(
  value: ColorPickerColor | null,
  format: ColorPickerFormat,
  alpha: boolean,
  locale?: string,
): string {
  if (!value) return "Empty";
  const channels =
    format === "hsl"
      ? (["hue", "saturation", "lightness", "alpha"] as const)
      : format === "hsb"
        ? (["hue", "saturation", "brightness", "alpha"] as const)
        : (["red", "green", "blue", "alpha"] as const);
  return `${serializeColorPickerValue(value, format, alpha)}; ${channels
    .map((channel) => formatColorPickerChannel(channel, channelValue(value, channel), locale))
    .join(", ")}`;
}

function areaContext(request: Extract<ColorPickerInitialPartRequest, AreaContext>) {
  return {
    xChannel: request.xChannel ?? "saturation",
    yChannel: request.yChannel ?? "brightness",
    xStep: request.xStep,
    yStep: request.yStep,
  } as const;
}

function projection(
  part: ColorPickerInitialPartName,
  values: {
    attributes?: ColorPickerInitialPartProjection["attributes"];
    properties?: ColorPickerInitialPartProjection["properties"];
    styles?: ColorPickerInitialPartProjection["styles"];
    text?: string;
    ownedAttributes?: readonly string[];
    ownedProperties?: readonly string[];
  } = {},
): ColorPickerInitialPartProjection {
  const ownership = Object.freeze({
    attributes: Object.freeze([...(values.ownedAttributes ?? [])]),
    properties: Object.freeze([...(values.ownedProperties ?? [])]),
  });
  const marker = encodeOwnership(ownership);
  return Object.freeze({
    part,
    attributes: Object.freeze({
      ...normalizeProjectedAttributes(values.attributes),
      ...(marker === undefined ? {} : { [COLOR_PICKER_INITIAL_OWNERSHIP_ATTRIBUTE]: marker }),
    }),
    properties: Object.freeze({ ...(values.properties ?? {}) }),
    styles: Object.freeze({ ...(values.styles ?? {}) }),
    ownership,
    ...(values.text === undefined ? {} : { text: values.text }),
  });
}

function normalizeProjectedAttributes(
  attributes: ColorPickerInitialPartProjection["attributes"] | undefined,
) {
  if (!attributes) return {};
  return Object.fromEntries(
    Object.entries(attributes).flatMap(([name, value]) =>
      value === false || value === undefined ? [] : [[name, value === true ? "" : value]],
    ),
  );
}

function encodeOwnership(ownership: ColorPickerInitialPartProjection["ownership"]) {
  const fields = [
    ...ownership.attributes.map((name) => `a:${name}`),
    ...ownership.properties.map((name) => `p:${name}`),
  ];
  return fields.length === 0 ? undefined : fields.join(",");
}

function surfaceAttributes(state: ColorPickerInitialState) {
  return {
    "data-focused": false,
    "data-dragging": false,
    "data-disabled": state.disabled,
    "data-readonly": state.readOnly,
  } as const;
}

function thumbDisplayColor(color: ColorPickerColor | null, channel?: ColorPickerInitialChannel) {
  if (!color) return undefined;
  if (channel === "alpha") return color.toString(color.alpha < 1 ? "hexa" : "hex");
  if (channel === "hue") {
    return color.withChannels("hsl", { alpha: 1, saturation: 100, lightness: 50 }).toString("hex");
  }
  return color.withChannels("rgb", { alpha: 1 }).toString("hex");
}

function validFormat(value: unknown): ColorPickerFormat | undefined {
  return COLOR_PICKER_FORMATS.includes(value as ColorPickerFormat)
    ? (value as ColorPickerFormat)
    : undefined;
}

function alphaFormat(format: ColorPickerFormat, alpha: number) {
  return alpha < 1
    ? ({ hex: "hexa", rgb: "rgba", hsl: "hsla", hsb: "hsba" } as const)[format]
    : format;
}

function validStep(value: number | undefined, channel: ColorPickerInitialChannel) {
  return value !== undefined &&
    Number.isFinite(value) &&
    value > 0 &&
    (channel !== "hue" || value <= 360)
    ? value
    : 1;
}

function channelValue(color: ColorPickerColor, channel: ColorPickerInitialChannel) {
  if (channel === "alpha") return color.alpha * 100;
  if (channel in color.hsb) return color.hsb[channel as keyof typeof color.hsb];
  if (channel in color.hsl) return color.hsl[channel as keyof typeof color.hsl];
  return color.rgb[channel as keyof typeof color.rgb];
}

function equalColor(a: ColorPickerColor | null, b: ColorPickerColor | null) {
  return a === b || (!!a && !!b && a.equals(b));
}

function label(channel: ColorPickerInitialChannel) {
  return channel[0]!.toUpperCase() + channel.slice(1);
}

function cssNumber(value: number) {
  return String(Math.round(value * 10000) / 10000);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function hueUpperBound(step: number) {
  return roundToPrecision((hueStepCount(step) - 1) * step, decimalPlaces(step));
}

function steppedUpperBound(max: number, step: number) {
  const quotient = max / step;
  const tolerance = Number.EPSILON * Math.max(quotient, 1) * 4;
  return roundToPrecision(Math.floor(quotient + tolerance) * step, decimalPlaces(step));
}

function hueStepCount(step: number) {
  const quotient = 360 / step;
  const tolerance = Number.EPSILON * Math.max(quotient, 1) * 4;
  return Math.max(1, Math.ceil(quotient - tolerance));
}

function roundToPrecision(value: number, precision: number) {
  return Number(value.toFixed(Math.min(Math.max(precision, 0), 12)));
}

function decimalPlaces(value: number) {
  const text = String(value).toLowerCase();
  if (text.includes("e-")) return Number(text.split("e-")[1]);
  return text.includes(".") ? text.split(".")[1]!.length : 0;
}
