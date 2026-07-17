import type { AdapterColorPickerFacts } from "../../primitive-output-model/index.js";
import type { AdapterOutputModel } from "../types.js";

export function projectSpecializedAdapterOutputModel(
  model: AdapterOutputModel,
): AdapterOutputModel {
  const colorPickerIndex = model.files.find(
    (file) => file.kind === "index" && file.family?.kind === "color-picker",
  );
  if (!colorPickerIndex || colorPickerIndex.kind !== "index") return model;

  const facts = colorPickerIndex.family!.facts as AdapterColorPickerFacts;
  assertAstroColorPickerProjectionFacts(facts);

  return {
    files: model.files.map((file) => {
      if (file.kind === "component" && file.component.family?.kind === "color-picker") {
        return {
          ...file,
          component: {
            ...file.component,
            family: {
              ...file.component.family,
              kind: "astro-color-picker",
            },
          },
          target: "astro",
        } as unknown as AdapterOutputModel["files"][number];
      }
      if (file.kind === "index" && file.family?.kind === "color-picker") {
        return {
          ...file,
          family: { ...file.family, kind: "astro-color-picker" },
          target: "astro",
        } as unknown as AdapterOutputModel["files"][number];
      }
      return file;
    }),
  };
}

function assertAstroColorPickerProjectionFacts(facts: AdapterColorPickerFacts): void {
  const projection = facts.initialStateProjection;
  const requiredDependencies = {
    areaInput: ["root", "area"],
    areaThumb: ["root", "area"],
    channelSliderInput: ["root", "channelSlider"],
    channelSliderThumb: ["root", "channelSlider"],
    formatControl: ["root"],
    swatch: ["root", "swatch"],
  } as const;

  if (
    projection.importSource !== "@starwind-ui/runtime/color-picker" ||
    projection.createFunction !== "createColorPickerInitialState" ||
    projection.projectFunction !== "projectColorPickerInitialPart"
  ) {
    throw new Error(
      "Astro Color Picker requires the authoritative Runtime initial-state projector.",
    );
  }

  for (const [part, expected] of Object.entries(requiredDependencies)) {
    const dependency = projection.compositionDependencies.find((entry) => entry.part === part);
    if (!dependency || dependency.dependsOn.join(",") !== expected.join(",")) {
      throw new Error(
        `Astro Color Picker requires ${part} composition dependencies: ${expected.join(", ")}.`,
      );
    }
  }

  for (const [name, part] of [
    ["--sw-color-picker-area-thumb-color", "areaThumb"],
    ["--sw-color-picker-channel-thumb-color", "channelSliderThumb"],
  ] as const) {
    const variable = facts.cssVariables.find((candidate) => candidate.name === name);
    if (!variable || variable.source !== "runtime" || variable.parts.join(",") !== part) {
      throw new Error(`Astro Color Picker requires Runtime ${name} projection on ${part}.`);
    }
  }
}
