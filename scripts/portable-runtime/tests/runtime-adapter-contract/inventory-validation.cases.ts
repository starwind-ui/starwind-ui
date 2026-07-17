import {
  CONTRACT_RUNTIME_ALIGNMENT_FILES,
  cloneContract,
  expect,
  getRuntimeAdapterContract,
  it,
  RUNTIME_CONTRACT_EXPORTS,
  readRuntimeComponent,
  representativeRuntimeAdapterContracts,
  runtimeAdapterContractExports,
  runtimeAdapterContracts,
  validateRuntimeAdapterContracts,
} from "./shared.js";

export function defineRuntimeInventoryValidationTests(): void {
  it("is exercised by simple, form-control, and complex floating primitives", () => {
    expect(representativeRuntimeAdapterContracts.map((contract) => contract.component)).toEqual([
      "button",
      "carousel",
      "toggle",
      "field",
      "fieldset",
      "form",
      "input",
      "switch",
      "checkbox",
      "radio",
      "slider",
      "collapsible",
      "toggle-group",
      "radio-group",
      "checkbox-group",
      "tabs",
      "accordion",
      "avatar",
      "progress",
      "scroll-area",
      "input-otp",
      "tooltip",
      "popover",
      "preview-card",
      "dialog",
      "alert-dialog",
      "drawer",
      "dropzone",
      "menu",
      "navigation-menu",
      "context-menu",
      "select",
      "sidebar",
      "combobox",
      "color-picker",
      "toast",
    ]);

    expect(representativeRuntimeAdapterContracts.map((contract) => contract.category)).toEqual([
      "static-semantic",
      "viewport-measurement",
      "single-boolean-control",
      "field-control-coordinator",
      "field-control-coordinator",
      "field-control-coordinator",
      "form-value-control",
      "single-boolean-control",
      "single-boolean-control",
      "single-boolean-control",
      "form-value-control",
      "presence-disclosure-control",
      "controlled-value-group",
      "controlled-value-group",
      "controlled-value-group",
      "controlled-value-group",
      "controlled-value-group",
      "static-semantic",
      "static-semantic",
      "viewport-measurement",
      "form-value-control",
      "presence-floating-overlay",
      "presence-floating-overlay",
      "presence-floating-overlay",
      "dialog-native-overlay",
      "dialog-native-overlay",
      "dialog-native-overlay",
      "form-value-control",
      "composite-menu-overlay",
      "floating-value-control",
      "composite-menu-overlay",
      "floating-value-control",
      "presence-disclosure-control",
      "floating-value-control",
      "form-value-control",
      "notification-system",
    ]);
  });

  it("preserves named contract exports and the runtime contract aggregate seam", () => {
    expect(representativeRuntimeAdapterContracts).toBe(runtimeAdapterContracts);

    for (const exportName of RUNTIME_CONTRACT_EXPORTS) {
      const contract = runtimeAdapterContractExports[exportName];

      expect(contract).toBeDefined();
      expect(runtimeAdapterContracts).toContain(contract);
      expect(representativeRuntimeAdapterContracts).toContain(contract);
    }
  });

  it("captures the runtime bridge and framework notes each generator target needs", () => {
    for (const contract of representativeRuntimeAdapterContracts) {
      expect(contract.runtime.importSource).toMatch(/^@starwind-ui\/runtime(?:\/.+)?$/);
      expect(contract.runtime.factory).toMatch(/^create[A-Z]/);
      expect(contract.runtime.destroys).toBe(true);
      expect(contract.parts.some((part) => part.name === contract.runtime.rootPart)).toBe(true);
      expect(contract.frameworkNotes?.astro).toBeDefined();
      expect(contract.frameworkNotes?.react).toBeDefined();
      expect(contract.refs?.some((ref) => ref.public)).toBe(true);
    }
  });

  it("validates adapter-generation invariants for every runtime adapter contract", () => {
    expect(validateRuntimeAdapterContracts(runtimeAdapterContracts)).toEqual([]);
  });

  it("reports missing runtime bridge facts", () => {
    const missingRuntimeFacts = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    missingRuntimeFacts.component = "missing-runtime-facts";
    missingRuntimeFacts.runtime.factory = "  ";
    missingRuntimeFacts.runtime.importSource = "  " as never;
    missingRuntimeFacts.runtime.rootPart = "  ";
    missingRuntimeFacts.runtime.destroys = false as never;

    expect(validateRuntimeAdapterContracts([missingRuntimeFacts])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "missing-runtime-facts",
          message: "Missing runtime factory.",
          path: "runtime.factory",
        }),
        expect.objectContaining({
          component: "missing-runtime-facts",
          message: "Missing runtime import source.",
          path: "runtime.importSource",
        }),
        expect.objectContaining({
          component: "missing-runtime-facts",
          message: "Missing runtime root part.",
          path: "runtime.rootPart",
        }),
        expect.objectContaining({
          component: "missing-runtime-facts",
          message: "Runtime bridge must declare destroys: true.",
          path: "runtime.destroys",
        }),
      ]),
    );
  });

  it("reports undocumented runtime adapter contract escape hatches", () => {
    const undocumentedEscapeHatch = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    undocumentedEscapeHatch.component = "undocumented-escape-hatch";
    undocumentedEscapeHatch.escapeHatches = [
      {
        affectedFrameworks: [],
        boundary: "",
        contractOwnedFacts: [""],
        demotionCriteria: "",
        reason: "",
        tests: [],
      },
    ];

    expect(validateRuntimeAdapterContracts([undocumentedEscapeHatch])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch must list at least one affected framework.",
          path: "escapeHatches.0.affectedFrameworks",
        }),
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch is missing a boundary.",
          path: "escapeHatches.0.boundary",
        }),
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch is missing a reason.",
          path: "escapeHatches.0.reason",
        }),
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch must list at least one contract-owned fact.",
          path: "escapeHatches.0.contractOwnedFacts",
        }),
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch is missing demotion criteria.",
          path: "escapeHatches.0.demotionCriteria",
        }),
        expect.objectContaining({
          component: "undocumented-escape-hatch",
          message: "Escape hatch must list at least one test.",
          path: "escapeHatches.0.tests",
        }),
      ]),
    );
  });

  it("reports invalid adapter-generation cross references", () => {
    const missingRootPart = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    missingRootPart.component = "missing-root-part";
    missingRootPart.runtime.rootPart = "missingRoot";

    const missingRuntimeOptionProp = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    missingRuntimeOptionProp.component = "missing-runtime-option-prop";
    missingRuntimeOptionProp.runtime.optionProps = ["missingOption"];

    const missingFloatingPart = cloneContract(
      runtimeAdapterContractExports.popoverRuntimeAdapterContract,
    );
    missingFloatingPart.component = "missing-floating-part";
    missingFloatingPart.floating = {
      ...missingFloatingPart.floating!,
      popupPart: "missingPopup",
    };

    const missingInitialMarkupAttribute = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    missingInitialMarkupAttribute.component = "missing-initial-markup-attribute";
    missingInitialMarkupAttribute.initialMarkup = [
      {
        part: "root",
        attributes: ["data-sw-button", "data-missing"],
        reason: "Synthetic invalid markup attribute for validator coverage.",
      },
    ];

    const duplicateDiscoveryAttribute = cloneContract(
      runtimeAdapterContractExports.buttonRuntimeAdapterContract,
    );
    duplicateDiscoveryAttribute.component = "duplicate-discovery-attribute";
    duplicateDiscoveryAttribute.parts = [
      ...duplicateDiscoveryAttribute.parts,
      {
        ...duplicateDiscoveryAttribute.parts[0],
        name: "duplicateRoot",
      },
    ];

    expect(
      validateRuntimeAdapterContracts([
        missingRootPart,
        missingRuntimeOptionProp,
        missingFloatingPart,
        missingInitialMarkupAttribute,
        duplicateDiscoveryAttribute,
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "missing-root-part",
          message: 'Missing part "missingRoot".',
          path: "runtime.rootPart",
        }),
        expect.objectContaining({
          component: "missing-runtime-option-prop",
          message: 'Missing prop "missingOption".',
          path: "runtime.optionProps.missingOption",
        }),
        expect.objectContaining({
          component: "missing-floating-part",
          message: 'Missing part "missingPopup".',
          path: "floating.popupPart",
        }),
        expect.objectContaining({
          component: "missing-initial-markup-attribute",
          message: 'Initial markup attribute "data-missing" is not declared on part "root".',
          path: "initialMarkup.root.attributes",
        }),
        expect.objectContaining({
          component: "duplicate-discovery-attribute",
          message: 'Duplicate discovery attribute "data-sw-button".',
          path: "parts.duplicateRoot.discoveryAttribute",
        }),
      ]),
    );
  });

  it("allows target-scoped duplicate prop names for collection primitives", () => {
    const contextMenu = runtimeAdapterContractExports.contextMenuRuntimeAdapterContract;

    expect(contextMenu.props.filter((prop) => prop.name === "value").length).toBeGreaterThan(1);
    expect(validateRuntimeAdapterContracts([contextMenu])).toEqual([]);
  });

  it("keeps completed component contract names aligned with the runtime API surface", async () => {
    for (const [component, runtimeFile] of Object.entries(CONTRACT_RUNTIME_ALIGNMENT_FILES)) {
      const contract = getRuntimeAdapterContract(component);
      const source = await readRuntimeComponent(runtimeFile);

      expect(source).toContain(`export function ${contract.runtime.factory}(`);

      for (const optionProp of contract.runtime.optionProps ?? []) {
        expect(source).toContain(`${optionProp}?:`);
      }

      if (contract.runtime.optionProps?.length) {
        expect(Object.keys(contract.runtime.optionPropLifecycles ?? {}).sort()).toEqual(
          [...contract.runtime.optionProps].sort(),
        );
      }

      for (const stateModel of contract.stateModels ?? []) {
        if (stateModel.runtimeGetter) {
          expect(source).toContain(`${stateModel.runtimeGetter}():`);
        }
        if (stateModel.runtimeSetter) {
          expect(source).toContain(`${stateModel.runtimeSetter}(`);
        }
      }

      for (const setter of contract.setters ?? []) {
        expect(source).toContain(`${setter.method}(`);
      }

      for (const event of contract.events ?? []) {
        if (contract.runtime.optionProps?.includes(event.callbackProp)) {
          expect(source).toContain(`${event.callbackProp}?:`);
        }
        if (event.detailsType) {
          expect(source).toContain(`type ${event.detailsType} =`);
        }
        if (event.valueProperty) {
          expect(source).toContain(`${event.valueProperty}:`);
        }
      }
    }
  });
}
