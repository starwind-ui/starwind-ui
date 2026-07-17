import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../primitive-output-model/index.js";

export type ReactColorPickerComponentProjection = {
  facts: AdapterColorPickerFacts;
  kind: "react-color-picker";
  part: AdapterColorPickerPartName;
};

export type ReactColorPickerIndexProjection = {
  facts: AdapterColorPickerFacts;
  kind: "react-color-picker";
};

const VOID_PARTS = new Set<AdapterColorPickerPartName>([
  "areaInput",
  "channelInput",
  "channelSliderInput",
  "hiddenInput",
  "valueInput",
]);

export function printReactColorPickerComponent({
  facts,
  part,
}: ReactColorPickerComponentProjection): string {
  assertReactColorPickerProjectionFacts(facts);
  return part === "root" ? printRoot(facts) : printPart(facts, part);
}

export function printReactColorPickerIndex({ facts }: ReactColorPickerIndexProjection): string {
  assertReactColorPickerProjectionFacts(facts);
  const imports = Object.entries(facts.exports.parts)
    .map(([, exportName]) => `import ${exportName} from "./${exportName}";`)
    .join("\n");
  const namespaceMembers = Object.entries(facts.exports.parts)
    .map(
      ([part, exportName]) =>
        `  ${facts.parts[part as AdapterColorPickerPartName].namespaceKey}: ${exportName},`,
    )
    .join("\n");
  const namedExports = Object.values(facts.exports.parts)
    .map((name) => `  ${name},`)
    .join("\n");
  const runtimeTypes = facts.exports.runtimeFacades.types.map((name) => `  ${name},`).join("\n");
  const runtimeValues = facts.exports.runtimeFacades.values.join(", ");

  return `${imports}

const ${facts.exports.namespace} = {
${namespaceMembers}
};

export {
  ${facts.exports.namespace},
${namedExports}
};

export default ${facts.exports.namespace};

export type {
${runtimeTypes}
} from "${facts.exports.runtimeFacades.importSource}";
export { ${runtimeValues} } from "${facts.exports.runtimeFacades.importSource}";
`;
}

function assertReactColorPickerProjectionFacts(facts: AdapterColorPickerFacts): void {
  const formatControl = facts.initialStateProjection.compositionDependencies.find(
    (entry) => entry.part === "formatControl",
  );
  if (!formatControl || formatControl.dependsOn.join(",") !== "root") {
    throw new Error(
      "React Color Picker requires FormatControl to depend on Root projection state.",
    );
  }

  for (const [name, part] of [
    ["--sw-color-picker-area-thumb-color", "areaThumb"],
    ["--sw-color-picker-channel-thumb-color", "channelSliderThumb"],
  ] as const) {
    const variable = facts.cssVariables.find((candidate) => candidate.name === name);
    if (!variable || variable.source !== "runtime" || variable.parts.join(",") !== part) {
      throw new Error(`React Color Picker requires Runtime ${name} projection on ${part}.`);
    }
  }
}

function printRoot(facts: AdapterColorPickerFacts): string {
  const root = facts.parts.root;
  const rootExport = facts.exports.parts.root;
  const createInitialState = facts.initialStateProjection.createFunction;
  const projectInitialPart = facts.initialStateProjection.projectFunction;
  const ownershipAttribute = facts.initialStateProjection.ownershipAttribute;
  const partSelector = Object.values(facts.parts)
    .map((part) => `[${part.discoveryAttribute}]`)
    .join(", ");
  return `import * as React from "react";
import {
  ${facts.runtime.factory},
  ${createInitialState},
  ${projectInitialPart},
  type ColorPickerColor,
  type ColorPickerDirection,
  type ColorPickerFormat,
  type ColorPickerFormatChangeDetails,
  type ColorPickerInitialChannel,
  type ColorPickerInitialPartProjection,
  type ColorPickerInitialPartRequest,
  type ColorPickerInitialState,
  type ColorPickerOptions,
  type ColorPickerValue,
  type ColorPickerValueChangeDetails,
  type ColorPickerValueCommitDetails,
} from "${facts.runtime.importSource}";
import { setRef } from "../internal/compose-refs";
import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";

type ColorPickerRootContextValue = {
  initialState: ColorPickerInitialState;
};

export type ColorPickerAreaContextValue = {
  xChannel: ColorPickerInitialChannel;
  yChannel: ColorPickerInitialChannel;
  xStep?: number;
  yStep?: number;
};

export type ColorPickerChannelSliderContextValue = {
  channel: ColorPickerInitialChannel;
  orientation: "horizontal" | "vertical";
  step?: number;
};

const ColorPickerRootContext = React.createContext<ColorPickerRootContextValue | null>(null);
export const ColorPickerAreaContext = React.createContext<ColorPickerAreaContextValue | null>(null);
export const ColorPickerChannelSliderContext =
  React.createContext<ColorPickerChannelSliderContextValue | null>(null);

const COLOR_PICKER_PART_SELECTOR = ${JSON.stringify(partSelector)};
const COLOR_PICKER_CONFIGURATION_ATTRIBUTES = [
  "data-axis",
  "data-channel",
  "data-disabled",
  "data-orientation",
  "data-step",
  "data-value",
  "data-x-channel",
  "data-y-channel",
  "aria-label",
  "aria-labelledby",
  "aria-roledescription",
] as const;
const COLOR_PICKER_AUTHORED_ARIA_ATTRIBUTES = [
  "aria-label",
  "aria-labelledby",
  "aria-roledescription",
] as const;

export type ColorPickerProjectedProps = Record<string, unknown> & {
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

export function useColorPickerPartProjection(
  request: ColorPickerInitialPartRequest,
  authoredProps: ColorPickerProjectedProps,
): { props: ColorPickerProjectedProps; text?: string } {
  const context = React.useContext(ColorPickerRootContext);
  if (!context) {
    throw new Error("Color Picker parts must be rendered inside ColorPicker.Root.");
  }
  const initialProjectionRef = React.useRef<ColorPickerInitialPartProjection | undefined>(undefined);
  initialProjectionRef.current ??= ${projectInitialPart}(context.initialState, request);
  const ownershipPendingRef = React.useRef(true);
  const authoredAriaHistoryRef = React.useRef(new Set<string>());
  const projection = initialProjectionRef.current;
  const initialValueRef = React.useRef(projection.properties.value);
  const dynamicAuthoredProps = { ...authoredProps };
  for (const name of COLOR_PICKER_AUTHORED_ARIA_ATTRIBUTES) {
    if (authoredProps[name] === undefined) {
      delete dynamicAuthoredProps[name];
      if (authoredAriaHistoryRef.current.has(name)) dynamicAuthoredProps[name] = undefined;
    }
  }
  useIsomorphicLayoutEffect(() => {
    ownershipPendingRef.current = false;
    for (const name of COLOR_PICKER_AUTHORED_ARIA_ATTRIBUTES) {
      if (authoredProps[name] !== undefined) authoredAriaHistoryRef.current.add(name);
    }
  });
  const stableProjection =
    projection.properties.value === undefined
      ? projection
      : {
          ...projection,
          properties: { ...projection.properties, value: initialValueRef.current },
        };
  return {
    props: translateColorPickerProjection(
      stableProjection,
      dynamicAuthoredProps,
      ownershipPendingRef.current,
    ),
    ...(projection.text === undefined ? {} : { text: projection.text }),
  };
}

export function useColorPickerAreaContext(): ColorPickerAreaContextValue {
  return (
    React.useContext(ColorPickerAreaContext) ?? {
      xChannel: "saturation",
      yChannel: "brightness",
    }
  );
}

export function useColorPickerChannelSliderContext(): ColorPickerChannelSliderContextValue {
  return (
    React.useContext(ColorPickerChannelSliderContext) ?? {
      channel: "hue",
      orientation: "horizontal",
    }
  );
}

export type ${rootExport}Props = Omit<
  React.ComponentPropsWithoutRef<"${root.defaultElement}">,
  "value" | "defaultValue" | "dir"
> & {
  value?: ColorPickerValue;
  defaultValue?: ColorPickerValue;
  format?: ColorPickerFormat;
  alpha?: boolean;
  allowEmpty?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  name?: string;
  form?: string;
  required?: boolean;
  locale?: string;
  dir?: ColorPickerDirection;
  getAriaValueText?: ColorPickerOptions["getAriaValueText"];
  getAreaRoleDescription?: ColorPickerOptions["getAreaRoleDescription"];
  getColorDescription?: ColorPickerOptions["getColorDescription"];
  onValueChange?: (value: ColorPickerColor | null, details: ColorPickerValueChangeDetails) => void;
  onValueCommitted?: (value: ColorPickerColor | null, details: ColorPickerValueCommitDetails) => void;
  onFormatChange?: (format: ColorPickerFormat, details: ColorPickerFormatChangeDetails) => void;
};

const ${rootExport} = React.forwardRef<React.ElementRef<"${root.defaultElement}">, ${rootExport}Props>(function ${rootExport}(
  {
    value,
    defaultValue = "#000000",
    format,
    alpha = true,
    allowEmpty = false,
    disabled = false,
    readOnly = false,
    name,
    form,
    required = false,
    locale,
    dir,
    getAriaValueText,
    getAreaRoleDescription,
    getColorDescription,
    onValueChange,
    onValueCommitted,
    onFormatChange,
    children,
    ...props
  },
  forwardedRef,
) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const instanceRef = React.useRef<ReturnType<typeof ${facts.runtime.factory}> | undefined>(undefined);
  const ownershipSeedsRef = React.useRef(new Map<Element, string>());
  const structuralFingerprintRef = React.useRef("");
  const structuralElementIdsRef = React.useRef(new WeakMap<Element, number>());
  const nextStructuralElementIdRef = React.useRef(1);
  const rootOwnershipPendingRef = React.useRef(true);
  const isValueControlledRef = React.useRef(value !== undefined);
  const isFormatControlledRef = React.useRef(format !== undefined);
  const valueRef = React.useRef(value);
  const formatRef = React.useRef(format);
  const defaultValueRef = React.useRef(defaultValue);
  const onValueChangeRef = React.useRef(onValueChange);
  const onValueCommittedRef = React.useRef(onValueCommitted);
  const onFormatChangeRef = React.useRef(onFormatChange);
  const initialUncontrolledStateRef = React.useRef(
    ${createInitialState}({
      defaultValue: defaultValueRef.current,
      format: formatRef.current,
      alpha,
      allowEmpty,
    }),
  );
  const [uncontrolledValue, setUncontrolledValue] = React.useState<ColorPickerColor | null>(
    initialUncontrolledStateRef.current.value,
  );
  const [uncontrolledFormat, setUncontrolledFormat] = React.useState<ColorPickerFormat>(
    initialUncontrolledStateRef.current.format,
  );

  if (isValueControlledRef.current && value !== undefined) valueRef.current = value;
  if (isFormatControlledRef.current && format !== undefined) formatRef.current = format;
  onValueChangeRef.current = onValueChange;
  onValueCommittedRef.current = onValueCommitted;
  onFormatChangeRef.current = onFormatChange;

  const renderedValue = isValueControlledRef.current ? valueRef.current : uncontrolledValue;
  const renderedFormat = isFormatControlledRef.current
    ? (formatRef.current ?? uncontrolledFormat)
    : uncontrolledFormat;
  const initialState = React.useMemo(
    () =>
      ${createInitialState}({
        value: renderedValue,
        format: renderedFormat,
        alpha,
        allowEmpty,
        disabled,
        readOnly,
        required,
        name,
        form,
        locale,
        dir,
        getAriaValueText,
        getAreaRoleDescription,
        getColorDescription,
      }),
    [
      renderedValue,
      renderedFormat,
      alpha,
      allowEmpty,
      disabled,
      readOnly,
      required,
      name,
      form,
      locale,
      dir,
      getAriaValueText,
      getAreaRoleDescription,
      getColorDescription,
    ],
  );
  const contextValue = React.useMemo(() => ({ initialState }), [initialState]);

  const composedRef = React.useCallback(
    (node: HTMLDivElement | null) => {
      rootRef.current = node;
      return setRef(forwardedRef, node);
    },
    [forwardedRef],
  );

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    replayColorPickerOwnership(root, ownershipSeedsRef.current);
    captureColorPickerOwnership(root, ownershipSeedsRef.current);
    const instance = ${facts.runtime.factory}(root, {
      ...(isValueControlledRef.current
        ? { value: valueRef.current }
        : { defaultValue: defaultValueRef.current }),
      format: formatRef.current ?? uncontrolledFormat,
      alpha,
      allowEmpty,
      disabled,
      readOnly,
      name,
      form,
      required,
      locale,
      dir,
      getAriaValueText,
      getAreaRoleDescription,
      getColorDescription,
      onValueChange: (nextValue, details) => {
        onValueChangeRef.current?.(nextValue, details);
        if (!details.isCanceled && !isValueControlledRef.current) {
          setUncontrolledValue(() => nextValue);
        }
      },
      onValueCommitted: (nextValue, details) => {
        onValueCommittedRef.current?.(nextValue, details);
      },
      onFormatChange: (nextFormat, details) => {
        onFormatChangeRef.current?.(nextFormat, details);
        if (isFormatControlledRef.current) {
          const controlledFormat = formatRef.current;
          if (controlledFormat !== undefined && controlledFormat !== nextFormat) {
            instanceRef.current?.setFormat(controlledFormat, { emit: false });
          }
          return;
        }
        setUncontrolledFormat(() => nextFormat);
      },
    });
    instanceRef.current = instance;
    rootOwnershipPendingRef.current = false;
    instance.refresh();
    structuralFingerprintRef.current = colorPickerStructuralFingerprint(
      root,
      structuralElementIdsRef.current,
      nextStructuralElementIdRef,
    );

    return () => {
      instance.destroy();
      if (instanceRef.current === instance) instanceRef.current = undefined;
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root || typeof MutationObserver === "undefined") return;
    let refreshScheduled = false;
    let disposed = false;
    const refreshStructure = () => {
      refreshScheduled = false;
      if (disposed) return;
      const nextFingerprint = colorPickerStructuralFingerprint(
        root,
        structuralElementIdsRef.current,
        nextStructuralElementIdRef,
      );
      if (nextFingerprint === structuralFingerprintRef.current) return;
      structuralFingerprintRef.current = nextFingerprint;
      captureColorPickerOwnership(root, ownershipSeedsRef.current);
      instanceRef.current?.refresh({ preserveState: true });
      structuralFingerprintRef.current = colorPickerStructuralFingerprint(
        root,
        structuralElementIdsRef.current,
        nextStructuralElementIdRef,
      );
    };
    const observer = new MutationObserver((records) => {
      if (!records.some((record) => isColorPickerConfigurationMutation(root, record))) return;
      if (refreshScheduled) return;
      refreshScheduled = true;
      Promise.resolve().then(refreshStructure);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: [...COLOR_PICKER_CONFIGURATION_ATTRIBUTES],
      childList: true,
      subtree: true,
    });
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!isValueControlledRef.current || value === undefined) return;
    instanceRef.current?.setValue(value, { emit: false });
  }, [value]);

  useIsomorphicLayoutEffect(() => {
    if (!isFormatControlledRef.current || format === undefined) return;
    instanceRef.current?.setFormat(format, { emit: false });
  }, [format]);

  useIsomorphicLayoutEffect(() => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.setDisabled(disabled);
    instance.setReadOnly(readOnly);
    instance.setName(name ?? null);
    instance.setOptions({
      alpha,
      allowEmpty,
      dir: dir ?? null,
      form: form ?? null,
      getAreaRoleDescription,
      getAriaValueText,
      getColorDescription,
      locale: locale ?? null,
      required,
    });
  }, [
    alpha,
    allowEmpty,
    dir,
    disabled,
    form,
    getAreaRoleDescription,
    getAriaValueText,
    getColorDescription,
    locale,
    name,
    readOnly,
    required,
  ]);

  const initialRootProjectionRef = React.useRef<ColorPickerInitialPartProjection | undefined>(
    undefined,
  );
  initialRootProjectionRef.current ??= ${projectInitialPart}(initialState, { part: "root" });
  const rootProps = translateColorPickerProjection(
    initialRootProjectionRef.current,
    { ...props, ${JSON.stringify(root.discoveryAttribute)}: "" },
    rootOwnershipPendingRef.current,
  );

  return (
    <ColorPickerRootContext.Provider value={contextValue}>
      <div {...rootProps} ref={composedRef}>
        {children}
      </div>
    </ColorPickerRootContext.Provider>
  );
});

${rootExport}.displayName = "${facts.exports.namespace}.Root";

export default ${rootExport};

function translateColorPickerProjection(
  projection: ColorPickerInitialPartProjection,
  authoredProps: ColorPickerProjectedProps,
  includeOwnership: boolean,
): ColorPickerProjectedProps {
  const projected: ColorPickerProjectedProps = {};
  for (const [name, value] of Object.entries(projection.attributes)) {
    if (name === "${ownershipAttribute}" || value === undefined || value === false) continue;
    projected[toReactPropName(name)] = name.startsWith("data-") && value === true ? "" : value;
  }
  for (const [name, value] of Object.entries(projection.properties)) {
    if (value === undefined || name === "defaultValue") continue;
    projected[name === "value" ? "defaultValue" : name] = value;
  }
  if (Object.keys(projection.styles).length > 0) {
    projected.style = Object.fromEntries(
      Object.entries(projection.styles).map(([name, value]) => [toReactStyleName(name), value]),
    ) as React.CSSProperties;
  }

  const result = { ...projected, ...authoredProps };
  if (projected.style || authoredProps.style) {
    result.style = { ...projected.style, ...authoredProps.style };
  }
  if (includeOwnership) {
    const tokens = [
      ...projection.ownership.attributes
        .filter((name) => !Object.hasOwn(authoredProps, toReactPropName(name)))
        .map((name) => \`a:\${name}\`),
      ...projection.ownership.properties
        .filter(
          (name) =>
            !Object.hasOwn(authoredProps, name) &&
            !(name === "value" && Object.hasOwn(authoredProps, "defaultValue")),
        )
        .map((name) => \`p:\${name}\`),
    ];
    if (tokens.length > 0) result["${ownershipAttribute}"] = tokens.join(",");
  }
  return result;
}

function toReactPropName(name: string): string {
  if (name === "class") return "className";
  if (name === "for") return "htmlFor";
  if (name === "readonly") return "readOnly";
  if (name === "tabindex") return "tabIndex";
  return name;
}

function toReactStyleName(name: string): string {
  return name.startsWith("--") ? name : name.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

function ownedColorPickerParts(root: HTMLElement): Element[] {
  return [root, ...root.querySelectorAll(COLOR_PICKER_PART_SELECTOR)].filter(
    (element) => element.closest("[data-sw-color-picker]") === root,
  );
}

function captureColorPickerOwnership(root: HTMLElement, seeds: Map<Element, string>): void {
  for (const element of ownedColorPickerParts(root)) {
    const marker = element.getAttribute("${ownershipAttribute}");
    if (marker) seeds.set(element, marker);
  }
}

function replayColorPickerOwnership(root: HTMLElement, seeds: Map<Element, string>): void {
  for (const [element, marker] of seeds) {
    if (!element.isConnected || element.closest("[data-sw-color-picker]") !== root) {
      seeds.delete(element);
      continue;
    }
    element.setAttribute("${ownershipAttribute}", marker);
  }
}

function isColorPickerConfigurationMutation(root: HTMLElement, record: MutationRecord): boolean {
  const target = record.target instanceof Element ? record.target : null;
  if (!target || target.closest("[data-sw-color-picker]") !== root) return false;
  if (record.type === "childList") return true;
  if (record.type !== "attributes" || !record.attributeName) return false;
  if (record.attributeName === "data-value" || record.attributeName === "data-disabled") {
    return target.hasAttribute("data-sw-color-picker-swatch");
  }
  return true;
}

function colorPickerStructuralFingerprint(
  root: HTMLElement,
  ids: WeakMap<Element, number>,
  nextIdRef: React.MutableRefObject<number>,
): string {
  return ownedColorPickerParts(root)
    .map((element) => {
      let id = ids.get(element);
      if (id === undefined) {
        id = nextIdRef.current;
        nextIdRef.current += 1;
        ids.set(element, id);
      }
      const attributes = colorPickerConfigurationAttributes(element)
        .map((name) => \`\${name}=\${element.getAttribute(name) ?? ""}\`)
        .join(";");
      return \`\${id}:\${element.tagName}:\${attributes}\`;
    })
    .join("|");
}

function colorPickerConfigurationAttributes(element: Element): readonly string[] {
  if (element.hasAttribute("data-sw-color-picker-area")) {
    return ["data-x-channel", "data-y-channel"];
  }
  if (element.hasAttribute("data-sw-color-picker-area-input")) {
    return [
      "data-axis",
      "data-step",
      "aria-label",
      "aria-labelledby",
      "aria-roledescription",
    ];
  }
  if (element.hasAttribute("data-sw-color-picker-channel-slider")) {
    return ["data-channel", "data-orientation"];
  }
  if (element.hasAttribute("data-sw-color-picker-channel-input")) return ["data-step"];
  if (element.hasAttribute("data-sw-color-picker-channel-field")) return ["data-channel"];
  if (element.hasAttribute("data-sw-color-picker-swatch")) {
    return ["data-value", "data-disabled"];
  }
  return [];
}
`;
}

function printPart(facts: AdapterColorPickerFacts, partName: AdapterColorPickerPartName): string {
  const part = facts.parts[partName];
  const exportName = facts.exports.parts[partName];
  const element = part.defaultElement;
  const elementType = reactElementType(element);
  const customProps = renderCustomProps(partName);
  const destructuredProps = renderDestructuredProps(partName);
  const request = renderProjectionRequest(partName);
  const isVoid = VOID_PARTS.has(partName);
  const childrenType = isVoid ? "" : "\n  children?: React.ReactNode;";
  const childrenDestructure = isVoid
    ? destructuredProps
    : ["children", destructuredProps].filter(Boolean).join(", ");
  const authoredProps = renderAuthoredProps(partName, part.discoveryAttribute);
  const childExpression = partName === "valueText" ? "children ?? text" : "children";
  const elementJsx = isVoid
    ? `<${element} {...projectedProps} ref={forwardedRef} />`
    : `<${element} {...projectedProps} ref={forwardedRef}>\n        {${childExpression}}\n      </${element}>`;
  const provider = renderProvider(partName, elementJsx);
  const contextImports = renderContextImports(partName);

  return `import * as React from "react";
${contextImports}

export type ${exportName}Props = React.ComponentPropsWithoutRef<"${element}"> & {${childrenType}${customProps}
};

const ${exportName} = React.forwardRef<${elementType}, ${exportName}Props>(function ${exportName}(
  { ${childrenDestructure ? `${childrenDestructure}, ` : ""}...props },
  forwardedRef,
) {
  ${renderContextSetup(partName)}
  const { props: projectedProps${partName === "valueText" ? ", text" : ""} } = useColorPickerPartProjection(
    ${request},
    ${authoredProps},
  );
  return (
    ${provider}
  );
});

${exportName}.displayName = "${facts.exports.namespace}.${part.namespaceKey}";

export default ${exportName};
`;
}

function renderCustomProps(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return "\n  xChannel?: ColorPickerInitialChannel;\n  yChannel?: ColorPickerInitialChannel;\n  xStep?: number;\n  yStep?: number;";
    case "areaInput":
      return '\n  axis?: "x" | "y";\n  step?: number;';
    case "channelSlider":
      return '\n  channel?: ColorPickerInitialChannel;\n  orientation?: "horizontal" | "vertical";\n  step?: number;';
    case "channelSliderInput":
      return "\n  step?: number;";
    case "channelInput":
      return "\n  channel?: ColorPickerInitialChannel;";
    case "swatch":
      return "\n  swatchValue: ColorPickerValue;\n  swatchDisabled?: boolean;";
    default:
      return "";
  }
}

function renderDestructuredProps(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return 'xChannel = "saturation", yChannel = "brightness", xStep, yStep';
    case "areaInput":
      return 'axis = "x", step';
    case "channelSlider":
      return 'channel = "hue", orientation = "horizontal", step';
    case "channelSliderInput":
      return "step";
    case "channelInput":
      return 'channel = "hue"';
    case "swatch":
      return "swatchValue, swatchDisabled = false";
    default:
      return "";
  }
}

function renderProjectionRequest(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return '{ part: "area", ...areaContextValue }';
    case "areaBackground":
    case "areaThumb":
      return `{ part: "${part}", ...areaContext }`;
    case "areaInput":
      return '{ part: "areaInput", ...areaContext, axis, ...(axis === "x" ? { xStep: step ?? areaContext.xStep } : { yStep: step ?? areaContext.yStep }) }';
    case "channelSlider":
      return '{ part: "channelSlider", ...sliderContextValue }';
    case "channelSliderTrack":
    case "channelSliderThumb":
      return `{ part: "${part}", ...sliderContext }`;
    case "channelSliderInput":
      return '{ part: "channelSliderInput", ...sliderContext, step: step ?? sliderContext.step }';
    case "channelInput":
      return '{ part: "channelInput", channel }';
    case "swatch":
      return '{ part: "swatch", value: swatchValue, disabled: swatchDisabled }';
    default:
      return `{ part: "${part}" }`;
  }
}

function renderAuthoredProps(part: AdapterColorPickerPartName, discoveryAttribute: string): string {
  const discovery = `${JSON.stringify(discoveryAttribute)}: ""`;
  switch (part) {
    case "area":
      return `{ ...props, ${discovery}, "data-x-channel": xChannel, "data-y-channel": yChannel }`;
    case "areaInput":
      return `{ ...props, ${discovery}, "data-axis": axis, "data-step": step ?? (axis === "x" ? areaContext.xStep : areaContext.yStep) }`;
    case "channelSlider":
      return `{ ...props, ${discovery}, "data-channel": channel, "data-orientation": orientation }`;
    case "channelSliderInput":
      return `{ ...props, ${discovery}, "data-step": step ?? sliderContext.step }`;
    case "channelInput":
      return `{ ...props, ${discovery}, "data-channel": channel }`;
    case "swatch":
      return `{ ...props, ${discovery}, "data-value": typeof swatchValue === "string" ? swatchValue : (swatchValue?.toString() ?? undefined), "data-disabled": swatchDisabled ? "" : undefined }`;
    default:
      return `{ ...props, ${discovery} }`;
  }
}

function renderContextImports(part: AdapterColorPickerPartName): string {
  const imports = ["useColorPickerPartProjection"];
  if (["areaBackground", "areaThumb", "areaInput"].includes(part)) {
    imports.push("useColorPickerAreaContext");
  }
  if (part === "area") imports.push("ColorPickerAreaContext");
  if (["channelSliderTrack", "channelSliderThumb", "channelSliderInput"].includes(part)) {
    imports.push("useColorPickerChannelSliderContext");
  }
  if (part === "channelSlider") imports.push("ColorPickerChannelSliderContext");
  const typeImports: string[] = [];
  if (["area", "channelInput", "channelSlider"].includes(part)) {
    typeImports.push("ColorPickerInitialChannel");
  }
  if (part === "swatch") typeImports.push("ColorPickerValue");
  return [
    `import { ${imports.join(", ")} } from "./${"ColorPickerRoot"}";`,
    ...(typeImports.length > 0
      ? [`import type { ${typeImports.join(", ")} } from "${"@starwind-ui/runtime/color-picker"}";`]
      : []),
  ].join("\n");
}

function renderContextSetup(part: AdapterColorPickerPartName): string {
  switch (part) {
    case "area":
      return "const areaContextValue = React.useMemo(() => ({ xChannel, yChannel, xStep, yStep }), [xChannel, yChannel, xStep, yStep]);";
    case "areaBackground":
    case "areaThumb":
    case "areaInput":
      return "const areaContext = useColorPickerAreaContext();";
    case "channelSlider":
      return "const sliderContextValue = React.useMemo(() => ({ channel, orientation, step }), [channel, orientation, step]);";
    case "channelSliderTrack":
    case "channelSliderThumb":
    case "channelSliderInput":
      return "const sliderContext = useColorPickerChannelSliderContext();";
    default:
      return "";
  }
}

function renderProvider(part: AdapterColorPickerPartName, elementJsx: string): string {
  if (part === "area") {
    return `<ColorPickerAreaContext.Provider value={areaContextValue}>\n      ${elementJsx}\n    </ColorPickerAreaContext.Provider>`;
  }
  if (part === "channelSlider") {
    return `<ColorPickerChannelSliderContext.Provider value={sliderContextValue}>\n      ${elementJsx}\n    </ColorPickerChannelSliderContext.Provider>`;
  }
  return elementJsx;
}

function reactElementType(element: string): string {
  const names: Record<string, string> = {
    button: "HTMLButtonElement",
    div: "HTMLDivElement",
    input: "HTMLInputElement",
    select: "HTMLSelectElement",
    span: "HTMLSpanElement",
  };
  return names[element] ?? "HTMLElement";
}
