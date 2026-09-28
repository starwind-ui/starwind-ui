import { requireColorPickerModelOwnership } from "../../primitive-output-model/color-picker.js";
import type {
  AdapterColorPickerFacts,
  AdapterColorPickerPartName,
} from "../../primitive-output-model/index.js";
import {
  colorPickerLiveOptions,
  printColorPickerConnection,
} from "../../shared-recipes/color-picker/connection.js";
import {
  type ColorPickerPartAccess,
  colorPickerPartAttributes,
  colorPickerPartProps,
  colorPickerPartRequest,
  printColorPickerStructure,
} from "../../shared-recipes/color-picker/parts.js";
import { colorPickerSeeds } from "../../shared-recipes/color-picker/seeds.js";

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
  requireColorPickerModelOwnership(Object.values(facts.controlledness.states));
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
  const seeds = colorPickerSeeds(facts, (name) => name, {
    authority: "parent-prop",
    seed: "seedRef.current",
  });
  const root = facts.parts.root;
  const rootExport = facts.exports.parts.root;
  const createInitialState = facts.initialStateProjection.createFunction;
  const projectInitialPart = facts.initialStateProjection.projectFunction;
  const ownershipAttribute = facts.initialStateProjection.ownershipAttribute;
  return `import * as React from "react";
import {
  ${facts.runtime.factory},
  parseColor,
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
  const connectionRef = React.useRef<ReturnType<typeof connectColorPicker> | undefined>(undefined);
  const seedRef = React.useRef(${seeds.constructor});
  const incomingRef = React.useRef<ColorPickerOptions>({});
  incomingRef.current = { value, format, ${colorPickerLiveOptions(facts).join(", ")}, onValueChange, onValueCommitted, onFormatChange };
  const structureRef = React.useRef<ReturnType<typeof colorPickerStructure> | undefined>(undefined);
  const rootOwnershipPendingRef = React.useRef(true);
  const initialModelRef = React.useRef<ColorPickerInitialState | undefined>(undefined);
  initialModelRef.current ??= ${createInitialState}(${seeds.projection});
  const [acceptedValue, setAcceptedValue] = React.useState<ColorPickerColor | null>(initialModelRef.current.value);
  const [acceptedFormat, setAcceptedFormat] = React.useState<ColorPickerFormat>(initialModelRef.current.format);
  const initialState = React.useMemo(
    () =>
      ${createInitialState}({
        value: acceptedValue,
        format: acceptedFormat,
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
      acceptedValue,
      acceptedFormat,
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

    const structure = structureRef.current ??= colorPickerStructure(root);
    const connection = connectColorPicker(root, {
      seed: seedRef.current,
      read: () => incomingRef.current,
      restoreAuthoredOwnership: structure.restoreOwnership,
      captureAuthoredOwnership: structure.captureOwnership,
      observe: (nextValue, nextFormat) => {
        setAcceptedValue(nextValue);
        setAcceptedFormat(nextFormat);
      },
      afterUpdate: (run) => queueMicrotask(run),
    });
    connectionRef.current = connection;
    rootOwnershipPendingRef.current = false;
    return () => {
      connectionRef.current = undefined;
      connection.destroy();
    };
  }, []);

  useIsomorphicLayoutEffect(() => structureRef.current?.observe(() => connectionRef.current?.update()), []);

  useIsomorphicLayoutEffect(() => { connectionRef.current?.update(); }, [value, format, ${colorPickerLiveOptions(facts).join(", ")}]);

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

${printColorPickerConnection(facts)}
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

${printColorPickerStructure(facts)}
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

const partAccess: ColorPickerPartAccess = {
  prop: (name) => name,
  area: (name) => `areaContext.${name}`,
  slider: (name) => `sliderContext.${name}`,
  aria: (name) => `props[${JSON.stringify(name)}] ?? undefined`,
};
function renderCustomProps(part: AdapterColorPickerPartName): string {
  return (colorPickerPartProps[part] ?? [])
    .map((prop) => `\n  ${prop.name}${prop.required ? "" : "?"}: ${prop.type};`)
    .join("");
}
function renderDestructuredProps(part: AdapterColorPickerPartName): string {
  return (colorPickerPartProps[part] ?? [])
    .map((prop) => `${prop.name}${prop.default === undefined ? "" : ` = ${prop.default}`}`)
    .join(", ");
}
function renderProjectionRequest(part: AdapterColorPickerPartName): string {
  return colorPickerPartRequest(part, partAccess);
}
function renderAuthoredProps(part: AdapterColorPickerPartName, discovery: string): string {
  return `{ ...props, ${[`${JSON.stringify(discovery)}: ""`, ...colorPickerPartAttributes(part, partAccess)].join(", ")} }`;
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
