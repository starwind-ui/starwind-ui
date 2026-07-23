import { expect, it, representativeRuntimeAdapterContracts } from "./shared.js";

export function defineRuntimeOverlayFloatingTests(): void {
  it("describes Tooltip open state, floating anatomy, asChild trigger, and overlay escape hatch", () => {
    const tooltip = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "tooltip",
    )!;

    expect(tooltip.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "positioner",
      "popup",
      "arrow",
    ]);
    expect(
      Object.fromEntries(tooltip.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      arrow: "data-sw-tooltip-arrow",
      popup: "data-sw-tooltip-popup",
      portal: "data-sw-tooltip-portal",
      positioner: "data-sw-tooltip-positioner",
      root: "data-sw-tooltip",
      trigger: "data-sw-tooltip-trigger",
    });
    expect(tooltip.runtime.optionProps).toEqual([
      "closeDelay",
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "disabled",
      "disableHoverableContent",
      "onOpenChange",
      "open",
      "openDelay",
    ]);
    expect(tooltip.runtime.optionPropLifecycles).toEqual({
      closeDelay: "constructor-only",
      closeOnEscape: "constructor-only",
      closeOnOutsideInteract: "constructor-only",
      defaultOpen: "constructor-only",
      disabled: "setter-backed",
      disableHoverableContent: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
      openDelay: "constructor-only",
    });
    expect(tooltip.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(tooltip.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "TooltipOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(tooltip.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
      { method: "setDisabled", prop: "disabled" },
    ]);
    expect(tooltip.presence).toEqual({
      initialHiddenParts: ["popup"],
      unmountPolicy: "runtime-owned",
    });
    expect(tooltip.floating).toEqual({
      anchorPart: "trigger",
      portalPart: "portal",
      positionerPart: "positioner",
      popupPart: "popup",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
    });
    expect(tooltip.asChild).toContainEqual({ part: "trigger", merges: ["data", "ref"] });
    expect(
      tooltip.parts
        .find((part) => part.name === "trigger")
        ?.initialAttributes?.map((attribute) => attribute.name),
    ).toEqual([
      "type",
      "data-as-child",
      "data-disabled",
      "aria-disabled",
      "data-state",
      "disabled",
    ]);
    expect(tooltip.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: [
          "data-sw-tooltip-popup",
          "role",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          "hidden",
        ],
      }),
    );
    expect(tooltip.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/trigger/portal/positioner/popup/arrow parts and discovery attributes",
          "open state model",
          "open-change event/callback/details value",
          "floating placement prop names and defaults",
          "trigger asChild support marker",
        ]),
      }),
    );
  });

  it("describes Popover dialog-like floating anatomy, open state, trigger asChild, and overlay escape hatch", () => {
    const popover = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "popover",
    )!;

    expect(popover.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "positioner",
      "popup",
      "arrow",
      "backdrop",
      "title",
      "description",
      "close",
      "viewport",
    ]);
    expect(
      Object.fromEntries(popover.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      arrow: "data-sw-popover-arrow",
      backdrop: "data-sw-popover-backdrop",
      close: "data-sw-popover-close",
      description: "data-sw-popover-description",
      popup: "data-sw-popover-popup",
      portal: "data-sw-popover-portal",
      positioner: "data-sw-popover-positioner",
      root: "data-sw-popover",
      title: "data-sw-popover-title",
      trigger: "data-sw-popover-trigger",
      viewport: "data-sw-popover-viewport",
    });
    expect(popover.runtime.optionProps).toEqual([
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
      "openOnHover",
    ]);
    expect(popover.runtime.optionPropLifecycles).toEqual({
      closeOnEscape: "constructor-only",
      closeOnOutsideInteract: "constructor-only",
      defaultOpen: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
      openOnHover: "constructor-only",
    });
    expect(popover.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "200",
        name: "closeDelay",
        targets: ["root"],
      }),
    );
    expect(popover.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        name: "modal",
        type: "boolean",
      }),
    );
    expect(popover.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(popover.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "PopoverOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(popover.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(popover.presence).toEqual({
      initialHiddenParts: ["popup", "backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(popover.floating).toEqual({
      anchorPart: "trigger",
      portalPart: "portal",
      positionerPart: "positioner",
      popupPart: "popup",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions", "collisionStrategy"],
    });
    expect(popover.asChild).toContainEqual({
      part: "trigger",
      merges: ["aria", "className", "data", "ref"],
    });
    expect(popover.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: [
          "data-sw-popover-popup",
          "role",
          "tabindex",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          "data-collision-strategy",
          "hidden",
        ],
      }),
    );
    expect((popover as { escapeHatches?: unknown }).escapeHatches).toBeUndefined();
  });

  it("describes Dialog native overlay anatomy, open state, and dismissal options", () => {
    const dialog = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "dialog",
    )!;

    expect(dialog.category).toBe("dialog-native-overlay");
    expect(dialog.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "backdrop",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(
      Object.fromEntries(dialog.parts.map((part) => [part.name, part.defaultElement])),
    ).toEqual({
      backdrop: "div",
      close: "button",
      description: "p",
      popup: "dialog",
      root: "div",
      title: "h2",
      trigger: "button",
    });
    expect(
      Object.fromEntries(dialog.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      backdrop: "data-sw-dialog-overlay",
      close: "data-sw-dialog-close",
      description: "data-sw-dialog-description",
      popup: "data-sw-dialog-content",
      root: "data-sw-dialog",
      title: "data-sw-dialog-title",
      trigger: "data-sw-dialog-trigger",
    });
    expect(dialog.runtime.optionProps).toEqual([
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
    ]);
    expect(dialog.runtime.optionPropLifecycles).toEqual({
      closeOnEscape: "constructor-only",
      closeOnOutsideInteract: "constructor-only",
      defaultOpen: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
    });
    expect(dialog.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(dialog.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "DialogOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(dialog.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(dialog.presence).toEqual({
      initialHiddenParts: ["backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(dialog.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-dialog",
          "data-default-open",
          "data-close-on-escape",
          "data-close-on-outside-interact",
          "data-modal",
          "data-state",
        ],
      }),
    );
    expect(dialog.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: ["data-sw-dialog-content", "data-state"],
      }),
    );
    expect((dialog as { escapeHatches?: unknown }).escapeHatches).toBeUndefined();
  });

  it("describes Alert Dialog native overlay anatomy, role specialization, and dismissal defaults", () => {
    const alertDialog = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "alert-dialog",
    )!;

    expect(alertDialog.category).toBe("dialog-native-overlay");
    expect(alertDialog.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "backdrop",
      "viewport",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(
      Object.fromEntries(alertDialog.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      backdrop: "data-sw-alert-dialog-backdrop",
      close: "data-sw-alert-dialog-close",
      description: "data-sw-alert-dialog-description",
      popup: "data-sw-alert-dialog-popup",
      portal: "data-sw-alert-dialog-portal",
      root: "data-sw-alert-dialog",
      title: "data-sw-alert-dialog-title",
      trigger: "data-sw-alert-dialog-trigger",
      viewport: "data-sw-alert-dialog-viewport",
    });
    expect(alertDialog.runtime.optionProps).toEqual([
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
    ]);
    expect(alertDialog.runtime.optionPropLifecycles).toEqual({
      closeOnEscape: "constructor-only",
      closeOnOutsideInteract: "constructor-only",
      defaultOpen: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
    });
    expect(alertDialog.props).toContainEqual(
      expect.objectContaining({
        defaultValue: "false",
        kind: "option",
        name: "closeOnOutsideInteract",
      }),
    );
    expect(alertDialog.parts).toContainEqual(
      expect.objectContaining({
        defaultElement: "dialog",
        discoveryAttribute: "data-sw-alert-dialog-popup",
        name: "popup",
        role: "alertdialog",
      }),
    );
    expect(alertDialog.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "AlertDialogOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(alertDialog.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(alertDialog.presence).toEqual({
      initialHiddenParts: ["backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(alertDialog.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: ["data-sw-alert-dialog-popup", "role", "data-state"],
      }),
    );
    expect((alertDialog as { escapeHatches?: unknown }).escapeHatches).toBeUndefined();
  });

  it("describes Drawer native overlay anatomy, side placement, and Dialog-backed runtime bridge", () => {
    const drawer = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "drawer",
    )!;

    expect(drawer.category).toBe("dialog-native-overlay");
    expect(drawer.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "backdrop",
      "viewport",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(
      Object.fromEntries(drawer.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      backdrop: "data-sw-drawer-backdrop",
      close: "data-sw-drawer-close",
      description: "data-sw-drawer-description",
      popup: "data-sw-drawer-popup",
      portal: "data-sw-drawer-portal",
      root: "data-sw-drawer",
      title: "data-sw-drawer-title",
      trigger: "data-sw-drawer-trigger",
      viewport: "data-sw-drawer-viewport",
    });
    expect(drawer.runtime.optionProps).toEqual([
      "closeOnEscape",
      "closeOnOutsideInteract",
      "defaultOpen",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
    ]);
    expect(drawer.runtime.optionPropLifecycles).toEqual({
      closeOnEscape: "constructor-only",
      closeOnOutsideInteract: "constructor-only",
      defaultOpen: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
    });
    expect(drawer.props).toContainEqual(
      expect.objectContaining({
        defaultValue: '"right"',
        name: "side",
        targets: ["popup"],
        type: '"top" | "right" | "bottom" | "left"',
      }),
    );
    expect(drawer.parts).toContainEqual(
      expect.objectContaining({
        defaultElement: "dialog",
        discoveryAttribute: "data-sw-drawer-popup",
        name: "popup",
        role: "dialog",
      }),
    );
    expect(drawer.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(drawer.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "DrawerOpenChangeDetails",
        domEvent: "starwind:open-change",
        valueProperty: "open",
        valueType: "boolean",
      }),
    );
    expect(drawer.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(drawer.presence).toEqual({
      initialHiddenParts: ["backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(drawer.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: ["data-sw-drawer-popup", "data-state", "data-side"],
      }),
    );
    expect((drawer as { escapeHatches?: unknown }).escapeHatches).toBeUndefined();
  });

  it("describes Menu floating collection anatomy, root open bridge, item state, and escape hatch", () => {
    const menu = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "menu",
    )!;

    expect(menu.category).toBe("composite-menu-overlay");
    expect(menu.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "positioner",
      "popup",
      "item",
      "linkItem",
      "checkboxItem",
      "checkboxItemIndicator",
      "radioGroup",
      "radioItem",
      "radioItemIndicator",
      "group",
      "label",
      "separator",
      "shortcut",
      "submenuRoot",
      "submenuTrigger",
    ]);
    expect(
      Object.fromEntries(menu.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      checkboxItem: "data-sw-menu-checkbox-item",
      checkboxItemIndicator: "data-sw-menu-checkbox-item-indicator",
      group: "data-sw-menu-group",
      item: "data-sw-menu-item",
      label: "data-sw-menu-label",
      linkItem: "data-sw-menu-link-item",
      popup: "data-sw-menu-popup",
      portal: "data-sw-menu-portal",
      positioner: "data-sw-menu-positioner",
      radioGroup: "data-sw-menu-radio-group",
      radioItem: "data-sw-menu-radio-item",
      radioItemIndicator: "data-sw-menu-radio-item-indicator",
      root: "data-sw-menu",
      separator: "data-sw-menu-separator",
      shortcut: "data-sw-menu-shortcut",
      submenuRoot: "data-sw-menu-submenu-root",
      submenuTrigger: "data-sw-menu-submenu-trigger",
      trigger: "data-sw-menu-trigger",
    });
    expect(menu.runtime.optionProps).toEqual([
      "closeDelay",
      "defaultOpen",
      "disabled",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
      "openOnHover",
    ]);
    expect(menu.runtime.optionPropLifecycles).toEqual({
      closeDelay: "constructor-only",
      defaultOpen: "constructor-only",
      disabled: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
      openOnHover: "constructor-only",
    });
    expect(menu.stateModels?.map((model) => model.name)).toEqual(["open", "checked", "radioValue"]);
    expect(menu.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "MenuOpenChangeDetails",
        domEvent: "starwind:open-change",
        emitsFrom: "root",
        valueProperty: "open",
      }),
    );
    expect(menu.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "MenuValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "radioGroup",
        valueProperty: "value",
      }),
    );
    expect(menu.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(menu.floating).toEqual({
      anchorPart: "trigger",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(menu.asChild).toContainEqual({
      part: "trigger",
      merges: ["aria", "className", "data", "ref"],
    });
    expect(menu.presence).toEqual({
      initialHiddenParts: ["popup"],
      unmountPolicy: "runtime-owned",
    });
    expect(menu.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "popup",
        attributes: [
          "data-sw-menu-popup",
          "role",
          "tabindex",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          "hidden",
        ],
      }),
    );
    expect(menu.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "submenuTrigger",
        attributes: expect.arrayContaining([
          "data-sw-menu-submenu-trigger",
          "aria-haspopup",
          "aria-expanded",
          "tabindex",
        ]),
      }),
    );
    expect(menu.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root open state model",
          "checkbox item checked state model",
          "radio group value state model",
          "floating placement prop names and defaults",
          "trigger asChild merge requirements",
        ]),
      }),
    );
  });

  it("describes Context Menu as a Menu-backed anchoring adapter", () => {
    const contextMenu = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "context-menu",
    )!;

    expect(contextMenu.category).toBe("composite-menu-overlay");
    expect(contextMenu.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "anchor",
      "portal",
      "positioner",
      "popup",
      "item",
      "linkItem",
      "checkboxItem",
      "checkboxItemIndicator",
      "radioGroup",
      "radioItem",
      "radioItemIndicator",
      "group",
      "label",
      "separator",
      "shortcut",
      "submenuRoot",
      "submenuTrigger",
    ]);
    expect(
      Object.fromEntries(contextMenu.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      anchor: "data-sw-context-menu-anchor",
      checkboxItem: "data-sw-menu-checkbox-item",
      checkboxItemIndicator: "data-sw-menu-checkbox-item-indicator",
      group: "data-sw-menu-group",
      item: "data-sw-menu-item",
      label: "data-sw-menu-label",
      linkItem: "data-sw-menu-link-item",
      popup: "data-sw-menu-popup",
      portal: "data-sw-menu-portal",
      positioner: "data-sw-menu-positioner",
      radioGroup: "data-sw-menu-radio-group",
      radioItem: "data-sw-menu-radio-item",
      radioItemIndicator: "data-sw-menu-radio-item-indicator",
      root: "data-sw-context-menu",
      separator: "data-sw-menu-separator",
      shortcut: "data-sw-menu-shortcut",
      submenuRoot: "data-sw-menu-submenu-root",
      submenuTrigger: "data-sw-menu-submenu-trigger",
      trigger: "data-sw-context-menu-trigger",
    });
    expect(contextMenu.runtime.optionProps).toEqual([
      "closeDelay",
      "defaultOpen",
      "disabled",
      "modal",
      "onCloseComplete",
      "onOpenChange",
      "open",
    ]);
    expect(contextMenu.runtime.optionPropLifecycles).toEqual({
      closeDelay: "constructor-only",
      defaultOpen: "constructor-only",
      disabled: "constructor-only",
      modal: "constructor-only",
      onCloseComplete: "constructor-only",
      onOpenChange: "constructor-only",
      open: "setter-backed",
    });
    expect(contextMenu.stateModels?.map((model) => model.name)).toEqual([
      "open",
      "checked",
      "radioValue",
    ]);
    expect(contextMenu.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onOpenChange",
        cancelable: true,
        detailsType: "ContextMenuOpenChangeDetails",
        domEvent: "starwind:open-change",
        emitsFrom: "root",
        valueProperty: "open",
      }),
    );
    expect(contextMenu.events).toContainEqual(
      expect.objectContaining({
        callbackProp: "onValueChange",
        detailsType: "MenuValueChangeDetails",
        domEvent: "starwind:value-change",
        emitsFrom: "radioGroup",
        valueProperty: "value",
      }),
    );
    expect(contextMenu.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(contextMenu.floating).toEqual({
      anchorPart: "anchor",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions"],
      popupPart: "popup",
      portalPart: "portal",
      positionerPart: "positioner",
    });
    expect(contextMenu.refs).toContainEqual({ part: "anchor", public: false });
    expect(contextMenu.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "root",
        attributes: [
          "data-sw-context-menu",
          "data-sw-menu",
          "data-default-open",
          "data-disabled",
          "data-modal",
          "data-close-delay",
          "data-state",
        ],
      }),
    );
    expect(contextMenu.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "trigger",
        attributes: [
          "data-sw-context-menu-trigger",
          "data-sw-menu-trigger",
          "aria-haspopup",
          "aria-expanded",
          "aria-disabled",
          "data-disabled",
          "data-state",
          "tabindex",
        ],
      }),
    );
    expect(contextMenu.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "root/trigger/anchor parts and discovery attributes",
          "Menu-backed portal/positioner/popup/item/linkItem/checkboxItem/checkboxItemIndicator/radioGroup/radioItem/radioItemIndicator/group/label/separator/shortcut/submenuRoot/submenuTrigger parts and discovery attributes",
          "runtime-created anchor as the floating reference",
        ]),
      }),
    );
  });

  it("describes dual controlled state, asChild, form, and floating bridges for Select", () => {
    const select = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "select",
    )!;

    expect(select.stateModels?.map((model) => model.name)).toEqual(["open", "value"]);
    expect(select.setters).toEqual([
      { method: "setOpen", stateModel: "open", suppressesEmit: true },
      { method: "setValue", stateModel: "value", suppressesEmit: true },
    ]);
    expect(select.form?.hiddenInput).toEqual({ part: "input", type: "hidden" });
    expect(select.form?.props).toEqual(["autoComplete", "form", "name", "required", "value"]);
    expect(select.runtime.optionProps).toEqual([
      "autoComplete",
      "defaultOpen",
      "defaultValue",
      "disabled",
      "form",
      "highlightItemOnHover",
      "modal",
      "open",
      "readOnly",
      "value",
    ]);
    expect(select.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "autoComplete" }),
        expect.objectContaining({ name: "form" }),
        expect.objectContaining({ name: "highlightItemOnHover" }),
        expect.objectContaining({ defaultValue: "true", name: "modal" }),
        expect.objectContaining({
          defaultValue: "true",
          name: "alignItemWithTrigger",
          targets: ["positioner"],
        }),
        expect.objectContaining({ name: "readOnly" }),
      ]),
    );
    expect(select.floating).toEqual(
      expect.objectContaining({
        anchorPart: "trigger",
        optionProps: [
          "side",
          "align",
          "sideOffset",
          "alignOffset",
          "avoidCollisions",
          "alignItemWithTrigger",
        ],
        portalPart: "portal",
        positionerPart: "positioner",
        popupPart: "popup",
      }),
    );
    expect(select.asChild).toContainEqual({
      part: "trigger",
      merges: ["aria", "className", "data", "ref"],
    });
    expect(select.escapeHatches).toHaveLength(1);
  });

  it("describes editable state, form, asChild, and floating bridges for Combobox", () => {
    const combobox = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "combobox",
    )!;

    expect(combobox.parts.map((part) => part.name)).toEqual([
      "root",
      "label",
      "inputGroup",
      "input",
      "trigger",
      "icon",
      "clear",
      "value",
      "hiddenInput",
      "portal",
      "positioner",
      "popup",
      "empty",
      "list",
      "group",
      "groupLabel",
      "item",
      "itemText",
      "itemIndicator",
      "separator",
    ]);
    expect(combobox.stateModels?.map((model) => model.name)).toEqual([
      "inputValue",
      "open",
      "value",
    ]);
    expect(combobox.runtime.optionProps).toContain("modal");
    expect(combobox.props).toEqual(
      expect.arrayContaining([expect.objectContaining({ defaultValue: "false", name: "modal" })]),
    );
    expect(combobox.setters).toEqual([
      { method: "setDisabled", prop: "disabled" },
      {
        method: "setInputValue",
        options: { emit: false, filter: false },
        stateModel: "inputValue",
        suppressesEmit: true,
      },
      { method: "setOpen", stateModel: "open", suppressesEmit: true },
      { method: "setValue", stateModel: "value", suppressesEmit: true },
    ]);
    expect(combobox.form?.hiddenInput).toEqual({ part: "hiddenInput", type: "hidden" });
    expect(combobox.floating).toEqual(
      expect.objectContaining({
        anchorPart: "inputGroup",
        optionProps: ["side", "align", "sideOffset", "alignOffset", "avoidCollisions"],
        portalPart: "portal",
        positionerPart: "positioner",
        popupPart: "popup",
      }),
    );
    expect(combobox.asChild).toEqual(
      expect.arrayContaining([
        { part: "clear", merges: ["aria", "className", "data", "events", "ref"] },
        { part: "trigger", merges: ["aria", "className", "data", "ref"] },
      ]),
    );
    expect(combobox.escapeHatches).toHaveLength(1);
  });

  it("describes Sidebar provider, controls, dual open state, and styled-only anatomy boundary", () => {
    const sidebar = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "sidebar",
    )!;

    expect(sidebar.parts.map((part) => part.name)).toEqual([
      "provider",
      "sidebar",
      "trigger",
      "rail",
      "menuButton",
    ]);
    expect(
      Object.fromEntries(sidebar.parts.map((part) => [part.name, part.discoveryAttribute])),
    ).toEqual({
      menuButton: "data-sw-sidebar-menu-button",
      provider: "data-sw-sidebar-provider",
      rail: "data-sw-sidebar-rail",
      sidebar: "data-sw-sidebar",
      trigger: "data-sw-sidebar-trigger",
    });
    expect(sidebar.runtime.optionProps).toEqual([
      "defaultMobileOpen",
      "defaultOpen",
      "keyboardShortcut",
      "mobileOpen",
      "mobileQuery",
      "onMobileOpenChange",
      "onOpenChange",
      "open",
      "persistOpen",
      "persistenceKey",
      "persistenceMaxAge",
      "persistenceStorage",
    ]);
    expect(sidebar.stateModels?.map((model) => model.name)).toEqual(["open", "mobileOpen"]);
    expect(sidebar.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        initialAttribute: "data-default-open",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      }),
    );
    expect(sidebar.stateModels).toContainEqual(
      expect.objectContaining({
        controlledProp: "mobileOpen",
        defaultProp: "defaultMobileOpen",
        initialAttribute: "data-default-mobile-open",
        runtimeGetter: "getMobileOpen",
        runtimeSetter: "setMobileOpen",
        valueType: "boolean",
      }),
    );
    expect(sidebar.events).toEqual([
      expect.objectContaining({
        callbackProp: "onOpenChange",
        detailsType: "SidebarOpenChangeDetails",
        domEvent: "starwind:sidebar-change",
        valueProperty: "open",
      }),
      expect.objectContaining({
        callbackProp: "onMobileOpenChange",
        detailsType: "SidebarMobileOpenChangeDetails",
        domEvent: "starwind:sidebar-mobile-change",
        valueProperty: "open",
      }),
    ]);
    expect(sidebar.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
      {
        method: "setMobileOpen",
        options: { emit: false },
        stateModel: "mobileOpen",
        suppressesEmit: true,
      },
    ]);
    expect(sidebar.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "provider",
        attributes: [
          "data-sw-sidebar-provider",
          "data-default-open",
          "data-default-mobile-open",
          "data-state",
          "data-mobile-open",
          "data-keyboard-shortcut",
          "data-mobile-query",
          "data-persist-open",
          "data-persistence-key",
          "data-persistence-storage",
          "data-persistence-max-age",
        ],
      }),
    );
    expect(sidebar.initialMarkup).toContainEqual(
      expect.objectContaining({
        part: "trigger",
        attributes: ["data-sw-sidebar-trigger", "type", "aria-expanded", "data-state"],
      }),
    );
    expect(sidebar.escapeHatches).toContainEqual(
      expect.objectContaining({
        contractOwnedFacts: expect.arrayContaining([
          "provider/sidebar/trigger/rail/menuButton parts and discovery attributes",
          "desktop open and mobile open state models",
          "open and mobile-open callback/event details",
          "desktop persistence option prop names",
          "styled-only sidebar anatomy boundary",
        ]),
      }),
    );
  });

  it("describes Toast manager viewport, template, root, and configuration attributes", () => {
    const toast = representativeRuntimeAdapterContracts.find(
      (contract) => contract.component === "toast",
    )!;
    const viewport = toast.parts.find((part) => part.name === "viewport")!;
    const root = toast.parts.find((part) => part.name === "root")!;
    const close = toast.parts.find((part) => part.name === "close")!;

    expect(toast.runtime).toEqual({
      factory: "createToastManager",
      importSource: "@starwind-ui/runtime/toast",
      rootPart: "viewport",
      destroys: true,
    });
    expect(toast.parts.map((part) => part.name)).toEqual([
      "viewport",
      "template",
      "root",
      "content",
      "title",
      "titleText",
      "description",
      "action",
      "close",
    ]);
    expect(viewport.discoveryAttribute).toBe("data-sw-toast-viewport");
    expect(viewport.initialAttributes?.map((attribute) => attribute.name)).toEqual(
      expect.arrayContaining(["data-position", "data-limit", "data-duration"]),
    );
    expect(root.discoveryAttribute).toBe("data-sw-toast-root");
    expect(root.initialAttributes?.map((attribute) => attribute.name)).toEqual(
      expect.arrayContaining(["data-toast-id", "data-state", "data-variant"]),
    );
    expect(close.initialAttributes?.map((attribute) => attribute.name)).toEqual(
      expect.arrayContaining(["type", "aria-label"]),
    );
    expect(toast.props).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "duration", type: "number" }),
        expect.objectContaining({ name: "limit", type: "number" }),
        expect.objectContaining({ name: "position" }),
        expect.objectContaining({ name: "variant", targets: ["template", "root"] }),
      ]),
    );
    expect(toast.escapeHatches).toHaveLength(1);
  });
}
