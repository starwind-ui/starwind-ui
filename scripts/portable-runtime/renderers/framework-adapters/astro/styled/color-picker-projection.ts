import type {
  StyledOutputAttribute,
  StyledOutputComponent,
  StyledOutputRenderNode,
} from "../../../styled-output-model/index.js";

const projectionTypes: Record<string, string> = {
  ColorPickerLabel: "ColorPickerInitialPartProjection",
  ColorPickerControl: "ColorPickerInitialPartProjection",
  ColorPickerInput: "ColorPickerRenderProjection",
  ColorPickerTrigger: "ColorPickerRenderProjection",
  ColorPickerContent: "ColorPickerRenderProjection",
  ColorPickerArea: "ColorPickerAreaProjection",
  ColorPickerAreaThumb: "ColorPickerInitialPartProjection",
  ColorPickerSliders: "ColorPickerRenderProjection",
  ColorPickerChannelSlider: "ColorPickerRenderProjection",
  ColorPickerChannelInput: "ColorPickerInitialPartProjection",
  ColorPickerValueInput: "ColorPickerInitialPartProjection",
  ColorPickerNativeFormatSelect: "ColorPickerInitialPartProjection",
  ColorPickerFormatSelect: "ColorPickerInitialPartProjection",
  ColorPickerValueSwatch: "ColorPickerRenderProjection",
  ColorPickerSwatchGroup: "ColorPickerInitialPartProjection",
  ColorPickerSwatch: "ColorPickerRenderProjection",
  ColorPickerEyeDropper: "ColorPickerInitialPartProjection",
  ColorPickerClear: "ColorPickerInitialPartProjection",
  ColorPickerHiddenInput: "ColorPickerInitialPartProjection",
};

export function projectAstroColorPickerComponent(
  component: StyledOutputComponent,
): StyledOutputComponent {
  const projectionType = projectionTypes[component.exportName];
  if (!projectionType) return component;

  return {
    ...component,
    props: component.props && {
      ...component.props,
      fields: [
        ...component.props.fields,
        ...(component.exportName === "ColorPickerChannelSlider"
          ? [{ name: "step", optional: true, type: "number" }]
          : []),
        {
          name: "initial",
          optional: true,
          type:
            projectionType === "ColorPickerInitialPartProjection"
              ? `import("@starwind-ui/runtime/color-picker").${projectionType}`
              : `import("@starwind-ui/astro/color-picker").${projectionType}`,
        },
      ],
    },
    destructure: component.destructure && {
      ...component.destructure,
      props: [
        { name: "initial" },
        ...(component.exportName === "ColorPickerChannelSlider" ? [{ name: "step" }] : []),
        ...component.destructure.props,
      ],
    },
    render: projectNodes(component.exportName, component.render),
  };
}

function projectNodes(
  exportName: string,
  nodes: StyledOutputRenderNode[],
): StyledOutputRenderNode[] {
  return nodes.map((node) => {
    const children = "children" in node ? projectNodes(exportName, node.children) : undefined;
    if (node.type === "slot") {
      return { ...node, fallback: projectNodes(exportName, node.fallback) };
    }
    if (node.type === "primitive") {
      const expression = primitiveProjection(exportName, node.part, node.attrs);
      return {
        ...node,
        attrs: expression ? [initialAttribute(expression), ...node.attrs] : node.attrs,
        children: children ?? node.children,
      };
    }
    if (node.type === "component" && node.component === "color-picker") {
      const expression = componentProjection(exportName, node.exportName);
      return {
        ...node,
        attrs: expression ? [initialAttribute(expression), ...node.attrs] : node.attrs,
        children: children ?? node.children,
      };
    }
    if (node.type === "condition") {
      return {
        ...node,
        then: projectNodes(exportName, node.then),
        else: projectNodes(exportName, node.else),
      };
    }
    if (children) return { ...node, children };
    return node;
  });
}

function initialAttribute(code: string): StyledOutputAttribute {
  return { name: "initial", value: { type: "raw", code } };
}

function primitiveProjection(
  exportName: string,
  part: string,
  attrs: StyledOutputAttribute[],
): string | undefined {
  const simple: Record<string, string> = {
    ColorPickerLabel: "initial",
    ColorPickerControl: "initial",
    ColorPickerAreaThumb: "initial",
    ColorPickerChannelInput: "initial",
    ColorPickerValueInput: "initial",
    ColorPickerNativeFormatSelect: "initial",
    ColorPickerFormatSelect: "initial",
    ColorPickerSwatchGroup: "initial",
    ColorPickerEyeDropper: "initial",
    ColorPickerClear: "initial",
    ColorPickerHiddenInput: "initial",
  };
  if (simple[exportName]) return simple[exportName];

  if (exportName === "ColorPickerInput")
    return part === "ValueInput" ? "initial?.valueInput.initial" : "initial?.formatSelect.initial";
  if (exportName === "ColorPickerTrigger") {
    if (part === "ValueSwatch") return "initial?.valueSwatch.initial";
    if (part === "TransparencyGrid") return "initial?.transparencyGrid.initial";
    if (part === "ValueText") return "initial?.valueText.initial";
  }
  if (exportName === "ColorPickerArea") {
    if (part === "Area") return "initial?.root.initial";
    if (part === "AreaBackground") return "initial?.background.initial";
    if (part === "AreaInput")
      return `initial?.input({ axis: "${literalAttribute(attrs, "axis")}" }).initial`;
  }
  if (exportName === "ColorPickerChannelSlider") {
    const member: Record<string, string> = {
      ChannelSlider: "root",
      ChannelSliderTrack: "track",
      ChannelSliderThumb: "thumb",
    };
    if (member[part])
      return `initial?.channelSlider({ channel, orientation, step }).${member[part]}.initial`;
    if (part === "ChannelSliderInput")
      return "initial?.channelSlider({ channel, orientation, step }).input().initial";
    if (part === "TransparencyGrid") return "initial?.transparencyGrid.initial";
  }
  if (exportName === "ColorPickerValueSwatch")
    return part === "ValueSwatch"
      ? "initial?.valueSwatch.initial"
      : "initial?.transparencyGrid.initial";
  if (exportName === "ColorPickerSwatch")
    return part === "Swatch"
      ? "initial?.swatch({ value, disabled }).initial"
      : "initial?.transparencyGrid.initial";
  return undefined;
}

function componentProjection(exportName: string, childExportName: string): string | undefined {
  if (exportName === "ColorPickerArea" && childExportName === "ColorPickerAreaThumb")
    return "initial?.thumb.initial";
  if (exportName === "ColorPickerContent") {
    const values: Record<string, string> = {
      ColorPickerArea: "initial?.area()",
      ColorPickerSliders: "initial",
      ColorPickerInput: "initial",
      ColorPickerEyeDropper: "initial?.eyeDropperTrigger.initial",
      ColorPickerClear: "initial?.clear.initial",
    };
    return values[childExportName];
  }
  if (exportName === "ColorPickerInput") {
    const values: Record<string, string> = {
      ColorPickerValueInput: "initial?.valueInput.initial",
      ColorPickerNativeFormatSelect: "initial?.formatSelect.initial",
      ColorPickerFormatSelect: "initial?.formatControl.initial",
    };
    return values[childExportName];
  }
  if (exportName === "ColorPickerSliders" && childExportName === "ColorPickerChannelSlider")
    return "initial";
  return undefined;
}

function literalAttribute(attrs: StyledOutputAttribute[], name: string): string {
  const attr = attrs.find((candidate) => candidate.name === name);
  return attr?.value?.type === "literal" ? String(attr.value.value) : "";
}
