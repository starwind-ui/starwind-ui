import type {
  AdapterCompositeMenuOverlayFacts,
  AdapterControlledValuePresenceFacts,
  AdapterEngineViewportFacts,
  AdapterOutputModel,
  AdapterSidebarFacts,
} from "../types.js";
import { printVueControlledValuePresenceContext } from "./controlled-value-presence.js";
import { printVueRepeatedDisclosureContext } from "./repeated-disclosure.js";
import { printVueEngineViewportTypes } from "./engine-viewport.js";
import { printVueColorPickerContext } from "./color-picker.js";

export function projectVueSpecializedAdapterOutputModel(
  model: AdapterOutputModel,
): AdapterOutputModel {
  const colorPickerFiles = model.files.some(
    (file) =>
      (file.kind === "component" && file.component.family?.kind === "color-picker") ||
      (file.kind === "index" && file.family?.kind === "color-picker"),
  );
  if (colorPickerFiles) {
    const projected = model.files.map((file) => {
      if (file.kind === "component" && file.component.family?.kind === "color-picker") {
        return {
          ...file,
          component: {
            ...file.component,
            family: { ...file.component.family, kind: "vue-color-picker" },
          },
          target: "vue",
        } as unknown as AdapterOutputModel["files"][number];
      }
      if (file.kind === "index" && file.family?.kind === "color-picker") {
        return {
          ...file,
          family: { ...file.family, kind: "vue-color-picker" },
          target: "vue",
        } as unknown as AdapterOutputModel["files"][number];
      }
      return file;
    });
    const index = model.files.find(
      (file) => file.kind === "index" && file.family?.kind === "color-picker",
    );
    if (index?.kind !== "index" || index.family?.kind !== "color-picker") return model;
    return {
      files: [
        ...projected.slice(0, -1),
        {
          body: { code: printVueColorPickerContext(index.family.facts) },
          imports: [],
          kind: "helper",
          name: "ColorPickerContext",
          path: "color-picker/ColorPickerContext.ts",
          target: "vue",
        },
        ...projected.slice(-1),
      ],
    };
  }
  const sidebarIndex = model.files.find(
    (file) => file.kind === "index" && file.family?.kind === "sidebar",
  );
  if (sidebarIndex?.kind === "index" && sidebarIndex.family?.kind === "sidebar") {
    const facts: AdapterSidebarFacts = sidebarIndex.family.facts;
    return {
      files: [
        ...model.files.slice(0, -1),
        {
          body: { code: "" },
          family: { facts, kind: "sidebar-context" },
          imports: [],
          kind: "helper",
          name: facts.context.name,
          path: `${facts.exports.namespace.toLowerCase()}/${facts.context.name}.ts`,
        },
        ...model.files.slice(-1),
      ],
    };
  }
  const engineViewport = model.files.find(
    (file) => file.kind === "component" && file.component.family?.kind === "engine-viewport",
  );
  if (
    engineViewport?.kind === "component" &&
    engineViewport.component.family?.kind === "engine-viewport"
  ) {
    const facts: AdapterEngineViewportFacts = engineViewport.component.family.facts;
    return {
      files: [
        ...model.files.slice(0, -1),
        {
          exports: { kind: "named", members: [], namespace: facts.displayName },
          imports: [],
          kind: "type-facade",
          path: `${facts.exports.namespace.toLowerCase()}/${facts.displayName}Types.ts`,
          typeFacades: [
            {
              body: { code: printVueEngineViewportTypes(facts) },
              exports: [`${facts.exports.root}Props`],
              name: `${facts.displayName}Types`,
            },
          ],
        },
        ...model.files.slice(-1),
      ],
    };
  }

  const compositeMenu = model.files.find(
    (file) => file.kind === "component" && file.component.family?.kind === "composite-menu-overlay",
  );
  if (
    compositeMenu?.kind === "component" &&
    compositeMenu.component.family?.kind === "composite-menu-overlay"
  ) {
    const facts: AdapterCompositeMenuOverlayFacts = compositeMenu.component.family.facts;
    return {
      files: [
        ...model.files.slice(0, -1),
        {
          body: { code: "" },
          family: { facts, kind: "composite-menu-overlay-radio-context" },
          imports: [],
          kind: "helper",
          name: `${facts.displayName}Context`,
          path: `${facts.exports.namespace.toLowerCase()}/${facts.displayName}Context.ts`,
        },
        ...model.files.slice(-1),
      ],
    };
  }

  const controlledValuePresence = model.files.find(
    (file) =>
      file.kind === "component" && file.component.family?.kind === "controlled-value-presence",
  );
  if (
    controlledValuePresence?.kind === "component" &&
    controlledValuePresence.component.family?.kind === "controlled-value-presence"
  ) {
    const facts: AdapterControlledValuePresenceFacts =
      controlledValuePresence.component.family.facts;
    return {
      files: [
        ...model.files.slice(0, -1),
        {
          body: { code: printVueControlledValuePresenceContext(facts) },
          family: { facts, kind: "controlled-value-presence" },
          imports: [],
          kind: "helper",
          name: facts.context.componentName,
          path: `${facts.exports.namespace.toLowerCase()}/${facts.context.componentName}.ts`,
        },
        ...model.files.slice(-1),
      ],
    };
  }

  const repeatedDisclosure = model.files.find(
    (file) => file.kind === "component" && file.component.family?.kind === "repeated-disclosure",
  );
  if (
    !repeatedDisclosure ||
    repeatedDisclosure.kind !== "component" ||
    repeatedDisclosure.component.family?.kind !== "repeated-disclosure"
  ) {
    return model;
  }
  const facts = repeatedDisclosure.component.family.facts;
  const contextName = `${facts.displayName}ItemContext`;
  return {
    files: [
      ...model.files,
      {
        body: { code: printVueRepeatedDisclosureContext(facts) },
        imports: [],
        kind: "helper",
        name: contextName,
        path: `${facts.exports.namespace.toLowerCase()}/${contextName}.ts`,
      },
    ],
  };
}
