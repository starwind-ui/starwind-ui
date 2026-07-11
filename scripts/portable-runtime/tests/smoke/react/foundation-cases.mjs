import { expectText } from "../shared/text.mjs";

export async function verifyReactFoundationCases({ page }) {
  await verifyReactProseCases({ page });

  const buttonGroupState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-button-group-demo");
    const groups = Array.from(demoRoot?.querySelectorAll('[data-slot="button-group"]') ?? []);
    const horizontal = demoRoot?.querySelector("#runtime-button-group-horizontal");
    const vertical = demoRoot?.querySelector("#runtime-button-group-vertical");
    const separators = Array.from(
      demoRoot?.querySelectorAll('[data-slot="button-group-separator"]') ?? [],
    );
    const text = demoRoot?.querySelector("#runtime-button-group-text");
    const inputGroup = demoRoot?.querySelector("#runtime-button-group-input");
    const directInput = Array.from(inputGroup?.children ?? []).find(
      (child) => child instanceof HTMLInputElement,
    );
    const nested = demoRoot?.querySelector("#runtime-button-group-nested");
    const dropdownTrigger = demoRoot?.querySelector("#runtime-button-group-dropdown-trigger");
    const dropdownTriggerStyle =
      dropdownTrigger instanceof HTMLElement ? getComputedStyle(dropdownTrigger) : null;
    const selectGroup = demoRoot?.querySelector("#runtime-button-group-select-amount");
    const selectTrigger = demoRoot?.querySelector("#runtime-button-group-select-trigger");
    const variantsGroup = demoRoot?.querySelector("#runtime-button-group-variants");
    const componentHeadings = Array.from(document.querySelectorAll("h2")).map((heading) =>
      heading.textContent?.trim(),
    );
    const buttonGroupHeadingIndex = componentHeadings.indexOf("Button Group");
    const buttonHeadingIndex = componentHeadings.indexOf("Button");
    const directNonScriptChildren = Array.from(horizontal?.children ?? []).filter(
      (child) => child.tagName !== "SCRIPT",
    );

    return {
      directInputClass: directInput?.getAttribute("class") ?? null,
      directInputHasDataSwInput:
        directInput instanceof HTMLElement ? directInput.hasAttribute("data-sw-input") : null,
      directInputSlot: directInput?.getAttribute("data-slot") ?? null,
      dropdownTriggerHasDataSwMenuTrigger:
        dropdownTrigger instanceof HTMLElement
          ? dropdownTrigger.hasAttribute("data-sw-menu-trigger")
          : null,
      dropdownTriggerBorderBottomLeftRadius: dropdownTriggerStyle?.borderBottomLeftRadius ?? null,
      dropdownTriggerBorderLeftWidth: dropdownTriggerStyle?.borderLeftWidth ?? null,
      dropdownTriggerBorderTopLeftRadius: dropdownTriggerStyle?.borderTopLeftRadius ?? null,
      dropdownTriggerSlot: dropdownTrigger?.getAttribute("data-slot") ?? null,
      buttonGroupHeadingIndex,
      buttonHeadingIndex,
      firstComponentHeading: componentHeadings[0] ?? null,
      groupCount: groups.length,
      horizontalClass: horizontal?.getAttribute("class") ?? null,
      horizontalDirectIds: directNonScriptChildren.map((child) => child.id),
      horizontalOrientation: horizontal?.getAttribute("data-orientation"),
      horizontalRole: horizontal?.getAttribute("role"),
      nestedDirectGroupCount: Array.from(nested?.children ?? []).filter(
        (child) => child.getAttribute("data-slot") === "button-group",
      ).length,
      separatorClasses: separators.map((separator) => separator.getAttribute("class")),
      separatorCount: separators.length,
      separatorOrientations: separators.map((separator) =>
        separator.getAttribute("aria-orientation"),
      ),
      separatorRoles: separators.map((separator) => separator.getAttribute("role")),
      selectGroupDirectSlots: Array.from(selectGroup?.children ?? [])
        .filter((child) => child.tagName !== "SCRIPT")
        .map((child) => child.getAttribute("data-slot")),
      selectTriggerHasDataSw:
        selectTrigger instanceof HTMLElement
          ? selectTrigger.hasAttribute("data-sw-select-trigger")
          : null,
      selectTriggerSlot: selectTrigger?.getAttribute("data-slot") ?? null,
      textClass: text?.getAttribute("class") ?? null,
      textSlot: text?.getAttribute("data-slot"),
      variantButtonTexts: Array.from(variantsGroup?.querySelectorAll('[data-slot="button"]') ?? [])
        .map((button) => button.textContent?.trim())
        .filter(Boolean),
      verticalClass: vertical?.getAttribute("class") ?? null,
      verticalOrientation: vertical?.getAttribute("data-orientation"),
      verticalRole: vertical?.getAttribute("role"),
    };
  });

  if (
    buttonGroupState.buttonGroupHeadingIndex < 0 ||
    buttonGroupState.buttonHeadingIndex < 0 ||
    buttonGroupState.buttonGroupHeadingIndex >= buttonGroupState.buttonHeadingIndex ||
    buttonGroupState.groupCount < 14 ||
    buttonGroupState.horizontalRole !== "group" ||
    buttonGroupState.horizontalOrientation !== "horizontal" ||
    buttonGroupState.horizontalClass?.includes(":has(+_script:last-child)") !== true ||
    buttonGroupState.horizontalClass?.includes("[&>input]:flex-1") !== true ||
    buttonGroupState.horizontalDirectIds.join(",") !==
      "runtime-button-group-horizontal-left,runtime-button-group-horizontal-middle,runtime-button-group-horizontal-right" ||
    buttonGroupState.verticalRole !== "group" ||
    buttonGroupState.verticalOrientation !== "vertical" ||
    buttonGroupState.verticalClass?.includes("flex-col") !== true ||
    buttonGroupState.separatorCount !== 4 ||
    buttonGroupState.separatorRoles.some((role) => role !== "separator") ||
    buttonGroupState.separatorOrientations.join(",") !==
      "vertical,vertical,horizontal,horizontal" ||
    buttonGroupState.separatorClasses.some((className) => !className?.includes("self-stretch")) ||
    buttonGroupState.textSlot !== "button-group-text" ||
    buttonGroupState.textClass?.includes("bg-muted") !== true ||
    buttonGroupState.directInputSlot !== "input" ||
    buttonGroupState.directInputHasDataSwInput !== true ||
    buttonGroupState.variantButtonTexts.join(",") !== "Save,Skip,Reset" ||
    buttonGroupState.dropdownTriggerSlot !== "dropdown-trigger" ||
    buttonGroupState.dropdownTriggerHasDataSwMenuTrigger !== true ||
    buttonGroupState.dropdownTriggerBorderLeftWidth !== "0px" ||
    buttonGroupState.dropdownTriggerBorderTopLeftRadius !== "0px" ||
    buttonGroupState.dropdownTriggerBorderBottomLeftRadius !== "0px" ||
    buttonGroupState.selectGroupDirectSlots.join(",") !== "select,input" ||
    buttonGroupState.selectTriggerSlot !== "select-trigger" ||
    buttonGroupState.selectTriggerHasDataSw !== true ||
    buttonGroupState.nestedDirectGroupCount !== 2
  ) {
    throw new Error(
      `Expected React ButtonGroup demo to expose Starwind group, separator, text, input, and nested semantics, got ${JSON.stringify(
        buttonGroupState,
      )}.`,
    );
  }

  const itemState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-item-demo");
    const items = Array.from(demoRoot?.querySelectorAll('[data-slot="item"]') ?? []);
    const group = demoRoot?.querySelector("#runtime-item-group");
    const basic = demoRoot?.querySelector("#runtime-item-basic");
    const link = demoRoot?.querySelector("#runtime-item-link");
    const iconMedia = demoRoot?.querySelector("#runtime-item-media-icon");
    const imageMedia = demoRoot?.querySelector("#runtime-item-media-image");
    const image = imageMedia?.querySelector("img");
    const separator = demoRoot?.querySelector("#runtime-item-separator");
    const header = demoRoot?.querySelector("#runtime-item-header");
    const footer = demoRoot?.querySelector("#runtime-item-footer");
    const muted = demoRoot?.querySelector("#runtime-item-muted");
    const outline = demoRoot?.querySelector("#runtime-item-outline");
    const defaultItem = demoRoot?.querySelector("#runtime-item-link");

    return {
      actionCount: demoRoot?.querySelectorAll('[data-slot="item-actions"]').length ?? 0,
      basicClass: basic?.getAttribute("class") ?? null,
      basicRole: basic?.getAttribute("role"),
      defaultClass: defaultItem?.getAttribute("class") ?? null,
      descriptionTags: Array.from(
        demoRoot?.querySelectorAll('[data-slot="item-description"]') ?? [],
      )
        .map((description) => description.tagName)
        .sort(),
      footerSlot: footer?.getAttribute("data-slot"),
      groupRole: group?.getAttribute("role"),
      groupSlot: group?.getAttribute("data-slot"),
      groupItemRoles: Array.from(group?.querySelectorAll(":scope > [data-slot='item']") ?? []).map(
        (item) => item.getAttribute("role"),
      ),
      headerSlot: header?.getAttribute("data-slot"),
      iconMediaClass: iconMedia?.getAttribute("class") ?? null,
      iconMediaVariant: iconMedia?.getAttribute("data-variant"),
      imageAlt: image?.getAttribute("alt"),
      imageLoading: image?.getAttribute("loading"),
      imageMediaClass: imageMedia?.getAttribute("class") ?? null,
      imageMediaVariant: imageMedia?.getAttribute("data-variant"),
      itemCount: items.length,
      linkClass: link?.getAttribute("class") ?? null,
      linkHref: link?.getAttribute("href"),
      linkInGroup: group?.contains(link) ?? null,
      linkRole: link?.getAttribute("role"),
      linkSlot: link?.getAttribute("data-slot"),
      linkTagName: link?.tagName,
      mutedClass: muted?.getAttribute("class") ?? null,
      outlineClass: outline?.getAttribute("class") ?? null,
      separatorClass: separator?.getAttribute("class") ?? null,
      separatorAriaOrientation: separator?.getAttribute("aria-orientation"),
      separatorDataOrientation: separator?.getAttribute("data-orientation"),
      separatorHasDataSw:
        separator instanceof HTMLElement ? separator.hasAttribute("data-sw-separator") : null,
      separatorRole: separator?.getAttribute("role"),
      separatorSlot: separator?.getAttribute("data-slot"),
      titleCount: demoRoot?.querySelectorAll('[data-slot="item-title"]').length ?? 0,
    };
  });
  if (
    itemState.itemCount !== 8 ||
    itemState.groupRole !== "list" ||
    itemState.groupSlot !== "item-group" ||
    itemState.groupItemRoles.join(",") !== "listitem,listitem" ||
    itemState.basicClass?.includes("border-border") !== true ||
    itemState.basicRole !== "listitem" ||
    itemState.basicClass?.includes("gap-4") !== true ||
    itemState.linkTagName !== "A" ||
    itemState.linkHref !== "#runtime-item-link-target" ||
    itemState.linkInGroup !== false ||
    itemState.linkRole !== null ||
    itemState.linkSlot !== "item" ||
    itemState.linkClass?.includes("gap-2.5") !== true ||
    itemState.defaultClass?.includes("bg-transparent") !== true ||
    itemState.outlineClass?.includes("border-border") !== true ||
    itemState.mutedClass?.includes("bg-muted/50") !== true ||
    itemState.iconMediaVariant !== "icon" ||
    itemState.iconMediaClass?.includes("size-8") !== true ||
    itemState.imageMediaVariant !== "image" ||
    itemState.imageMediaClass?.includes("size-10") !== true ||
    itemState.imageAlt !== "" ||
    itemState.imageLoading !== "lazy" ||
    itemState.headerSlot !== "item-header" ||
    itemState.footerSlot !== "item-footer" ||
    itemState.separatorSlot !== "item-separator" ||
    itemState.separatorRole !== "separator" ||
    itemState.separatorAriaOrientation !== "horizontal" ||
    itemState.separatorDataOrientation !== "horizontal" ||
    itemState.separatorHasDataSw !== true ||
    itemState.separatorClass?.includes("my-0") !== true ||
    itemState.titleCount !== 8 ||
    itemState.descriptionTags.length !== 7 ||
    itemState.descriptionTags.some((tagName) => tagName !== "P") ||
    itemState.actionCount !== 3
  ) {
    throw new Error(
      `Expected React Item demo to expose Item anatomy, variants, media, polymorphic root, and composed separator semantics, got ${JSON.stringify(
        itemState,
      )}.`,
    );
  }

  const nativeSelectState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-native-select-demo");
    const selects = Array.from(
      demoRoot?.querySelectorAll('select[data-slot="native-select"]') ?? [],
    );
    const wrappers = Array.from(
      demoRoot?.querySelectorAll('[data-slot="native-select-wrapper"]') ?? [],
    );
    const icons = Array.from(demoRoot?.querySelectorAll('[data-slot="native-select-icon"]') ?? []);
    const small = demoRoot?.querySelector("#runtime-native-select-sm");
    const medium = demoRoot?.querySelector("#runtime-native-select-md");
    const large = demoRoot?.querySelector("#runtime-native-select-lg");
    const custom = demoRoot?.querySelector("#runtime-native-select-custom-icon");
    const customIcon = demoRoot?.querySelector("#runtime-native-select-custom-icon-node");
    const disabled = demoRoot?.querySelector("#runtime-native-select-disabled");
    const invalid = demoRoot?.querySelector("#runtime-native-select-invalid");
    const option = demoRoot?.querySelector("option[data-slot='native-select-option']");
    const optGroup = demoRoot?.querySelector("optgroup[data-slot='native-select-optgroup']");
    const smallLabel = demoRoot?.querySelector('label[for="runtime-native-select-sm"]');

    if (small instanceof HTMLSelectElement) {
      small.value = "pst";
      small.dispatchEvent(new Event("change", { bubbles: true }));
    }

    return {
      customIconClass: customIcon?.getAttribute("class") ?? null,
      customIconCount: custom?.parentElement?.querySelectorAll('[data-slot="native-select-icon"]')
        .length,
      customIconSlot: customIcon?.getAttribute("data-slot"),
      disabledNative: disabled instanceof HTMLSelectElement ? disabled.disabled : null,
      disabledWrapperClass: disabled?.parentElement?.getAttribute("class") ?? null,
      iconCount: icons.length,
      invalidAria: invalid?.getAttribute("aria-invalid"),
      invalidClass: invalid?.getAttribute("class") ?? null,
      largeClass: large?.getAttribute("class") ?? null,
      largeWrapperSize: large?.parentElement?.getAttribute("data-size"),
      mediumClass: medium?.getAttribute("class") ?? null,
      optionClass: option?.getAttribute("class") ?? null,
      optionDisabled: option instanceof HTMLOptionElement ? option.disabled : null,
      optionSlot: option?.getAttribute("data-slot"),
      optGroupClass: optGroup?.getAttribute("class") ?? null,
      optGroupLabel: optGroup?.getAttribute("label"),
      optGroupSlot: optGroup?.getAttribute("data-slot"),
      selectCount: selects.length,
      smallClass: small?.getAttribute("class") ?? null,
      smallLabelControlId: smallLabel instanceof HTMLLabelElement ? smallLabel.control?.id : null,
      smallName: small instanceof HTMLSelectElement ? small.name : null,
      smallValue: small instanceof HTMLSelectElement ? small.value : null,
      smallWrapperSize: small?.parentElement?.getAttribute("data-size"),
      wrapperCount: wrappers.length,
    };
  });
  if (
    nativeSelectState.selectCount !== 6 ||
    nativeSelectState.wrapperCount !== 6 ||
    nativeSelectState.iconCount !== 6 ||
    nativeSelectState.smallLabelControlId !== "runtime-native-select-sm" ||
    nativeSelectState.smallName !== "runtime-native-select-sm" ||
    nativeSelectState.smallValue !== "pst" ||
    nativeSelectState.smallWrapperSize !== "sm" ||
    nativeSelectState.smallClass?.includes("h-9") !== true ||
    nativeSelectState.mediumClass?.includes("h-11") !== true ||
    nativeSelectState.largeWrapperSize !== "lg" ||
    nativeSelectState.largeClass?.includes("h-12") !== true ||
    nativeSelectState.optionSlot !== "native-select-option" ||
    nativeSelectState.optionDisabled !== true ||
    nativeSelectState.optGroupSlot !== "native-select-optgroup" ||
    nativeSelectState.optGroupLabel !== "North America" ||
    nativeSelectState.customIconCount !== 1 ||
    nativeSelectState.customIconSlot !== "native-select-icon" ||
    nativeSelectState.customIconClass?.includes("right-3") !== true ||
    nativeSelectState.disabledNative !== true ||
    nativeSelectState.disabledWrapperClass?.includes("has-[select:disabled]:opacity-50") !== true ||
    nativeSelectState.invalidAria !== "true" ||
    (nativeSelectState.invalidClass?.includes("aria-invalid:border-error") !== true &&
      nativeSelectState.invalidClass?.includes("data-error-visible:border-error") !== true)
  ) {
    throw new Error(
      `Expected React Native Select demo to expose native select semantics, sizing, options, custom icon, and states, got ${JSON.stringify(
        nativeSelectState,
      )}.`,
    );
  }

  const paginationState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-pagination-demo");
    const defaultRoot = demoRoot?.querySelector("#runtime-pagination-default");
    const defaultContent = defaultRoot?.querySelector('[data-slot="pagination-content"]');
    const previous = demoRoot?.querySelector("#runtime-pagination-default-previous");
    const next = demoRoot?.querySelector("#runtime-pagination-default-next");
    const inactive = demoRoot?.querySelector("#runtime-pagination-default-page-1");
    const active = demoRoot?.querySelector("#runtime-pagination-default-active");
    const defaultEllipsis = demoRoot?.querySelector("#runtime-pagination-default-ellipsis");
    const smallPage = demoRoot?.querySelector("#runtime-pagination-sm-page-1");
    const smallNext = demoRoot?.querySelector("#runtime-pagination-sm-next");
    const smallEllipsis = demoRoot?.querySelector("#runtime-pagination-sm-ellipsis");
    const largePage = demoRoot?.querySelector("#runtime-pagination-lg-page-1");
    const largeNext = demoRoot?.querySelector("#runtime-pagination-lg-next");
    const largeEllipsis = demoRoot?.querySelector("#runtime-pagination-lg-ellipsis");

    return {
      activeAriaCurrent: active?.getAttribute("aria-current"),
      activeClass: active?.getAttribute("class") ?? null,
      activeSlot: active?.getAttribute("data-slot"),
      contentClass: defaultContent?.getAttribute("class") ?? null,
      contentSlot: defaultContent?.getAttribute("data-slot"),
      contentTagName: defaultContent?.tagName,
      defaultClass: defaultRoot?.getAttribute("class") ?? null,
      ellipsisAriaHidden: defaultEllipsis?.hasAttribute("aria-hidden") ?? null,
      ellipsisClass: defaultEllipsis?.getAttribute("class") ?? null,
      ellipsisIconCount: defaultEllipsis?.querySelectorAll("svg").length ?? 0,
      ellipsisSrOnlyText: defaultEllipsis?.querySelector(".sr-only")?.textContent?.trim() ?? null,
      ellipsisSlot: defaultEllipsis?.getAttribute("data-slot"),
      inactiveClass: inactive?.getAttribute("class") ?? null,
      inactiveSlot: inactive?.getAttribute("data-slot"),
      itemCount: demoRoot?.querySelectorAll('[data-slot="pagination-item"]').length ?? 0,
      largeEllipsisClass: largeEllipsis?.getAttribute("class") ?? null,
      largeNextClass: largeNext?.getAttribute("class") ?? null,
      largePageClass: largePage?.getAttribute("class") ?? null,
      navCount: demoRoot?.querySelectorAll('nav[data-slot="pagination"]').length ?? 0,
      nextAriaLabel: next?.getAttribute("aria-label"),
      nextClass: next?.getAttribute("class") ?? null,
      nextHref: next?.getAttribute("href"),
      nextIconCount: next?.querySelectorAll("svg").length ?? 0,
      nextSlot: next?.getAttribute("data-slot"),
      previousAriaLabel: previous?.getAttribute("aria-label"),
      previousClass: previous?.getAttribute("class") ?? null,
      previousHref: previous?.getAttribute("href"),
      previousIconCount: previous?.querySelectorAll("svg").length ?? 0,
      previousSlot: previous?.getAttribute("data-slot"),
      rootAriaLabel: defaultRoot?.getAttribute("aria-label"),
      rootRole: defaultRoot?.getAttribute("role"),
      rootSlot: defaultRoot?.getAttribute("data-slot"),
      smallEllipsisClass: smallEllipsis?.getAttribute("class") ?? null,
      smallNextClass: smallNext?.getAttribute("class") ?? null,
      smallPageClass: smallPage?.getAttribute("class") ?? null,
    };
  });
  if (
    paginationState.navCount !== 3 ||
    paginationState.rootRole !== "navigation" ||
    paginationState.rootAriaLabel !== "pagination" ||
    paginationState.rootSlot !== "pagination" ||
    paginationState.defaultClass?.includes("justify-center") !== true ||
    paginationState.contentTagName !== "UL" ||
    paginationState.contentSlot !== "pagination-content" ||
    paginationState.contentClass?.includes("gap-1") !== true ||
    paginationState.itemCount !== 18 ||
    paginationState.previousSlot !== "pagination-previous" ||
    paginationState.previousAriaLabel !== "Go to previous page" ||
    paginationState.previousHref !== "#runtime-pagination-demo" ||
    paginationState.previousClass?.includes("group") !== true ||
    paginationState.previousClass?.includes("h-11") !== true ||
    paginationState.previousIconCount !== 1 ||
    paginationState.nextSlot !== "pagination-next" ||
    paginationState.nextAriaLabel !== "Go to next page" ||
    paginationState.nextHref !== "#runtime-pagination-demo" ||
    paginationState.nextClass?.includes("group") !== true ||
    paginationState.nextIconCount !== 1 ||
    paginationState.inactiveSlot !== "pagination-link" ||
    paginationState.inactiveClass?.includes("hover:bg-muted") !== true ||
    paginationState.activeSlot !== "pagination-link" ||
    paginationState.activeAriaCurrent !== "page" ||
    paginationState.activeClass?.includes("border") !== true ||
    paginationState.activeClass?.includes("shadow-xs") !== true ||
    paginationState.ellipsisSlot !== "pagination-ellipsis" ||
    paginationState.ellipsisAriaHidden !== true ||
    paginationState.ellipsisClass?.includes("size-11") !== true ||
    paginationState.ellipsisIconCount !== 1 ||
    paginationState.ellipsisSrOnlyText !== "More pages" ||
    paginationState.smallPageClass?.includes("size-9") !== true ||
    paginationState.smallNextClass?.includes("h-9") !== true ||
    paginationState.smallEllipsisClass?.includes("size-9") !== true ||
    paginationState.largePageClass?.includes("size-12") !== true ||
    paginationState.largeNextClass?.includes("h-12") !== true ||
    paginationState.largeEllipsisClass?.includes("size-12") !== true
  ) {
    throw new Error(
      `Expected React Pagination demo to expose nav/list semantics, active page state, previous/next controls, ellipsis, and size variants, got ${JSON.stringify(
        paginationState,
      )}.`,
    );
  }

  const tableState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-table-demo");
    const table = demoRoot?.querySelector("#runtime-table-invoices");
    const container = table?.parentElement;
    const caption = table?.querySelector('[data-slot="table-caption"]');
    const header = table?.querySelector('[data-slot="table-header"]');
    const body = table?.querySelector('[data-slot="table-body"]');
    const foot = table?.querySelector('[data-slot="table-foot"]');
    const selectedRow = table?.querySelector("#runtime-table-selected-row");
    const firstHead = table?.querySelector('[data-slot="table-head"]');
    const firstCell = table?.querySelector('[data-slot="table-cell"]');
    const totalCell = foot?.querySelector('[data-slot="table-cell"]');

    return {
      bodySlot: body?.getAttribute("data-slot"),
      captionSlot: caption?.getAttribute("data-slot"),
      captionText: caption?.textContent?.trim() ?? null,
      cellClass: firstCell?.getAttribute("class") ?? null,
      cellCount: table?.querySelectorAll('[data-slot="table-cell"]').length ?? 0,
      containerClass: container?.getAttribute("class") ?? null,
      containerSlot: container?.getAttribute("data-slot"),
      footSlot: foot?.getAttribute("data-slot"),
      headClass: firstHead?.getAttribute("class") ?? null,
      headRole: firstHead?.getAttribute("role"),
      headTagName: firstHead?.tagName,
      headerSlot: header?.getAttribute("data-slot"),
      rowCount: table?.querySelectorAll('[data-slot="table-row"]').length ?? 0,
      selectedClass: selectedRow?.getAttribute("class") ?? null,
      selectedState: selectedRow?.getAttribute("data-state"),
      tableClass: table?.getAttribute("class") ?? null,
      tableRole: table?.getAttribute("role"),
      tableSlot: table?.getAttribute("data-slot"),
      tableTagName: table?.tagName,
      totalCellColSpan: totalCell?.getAttribute("colspan"),
    };
  });
  if (
    tableState.containerSlot !== "table-container" ||
    tableState.containerClass?.includes("overflow-x-auto") !== true ||
    tableState.tableTagName !== "TABLE" ||
    tableState.tableRole !== null ||
    tableState.tableSlot !== "table" ||
    tableState.tableClass?.includes("caption-bottom") !== true ||
    tableState.captionSlot !== "table-caption" ||
    tableState.captionText !== "A list of your recent invoices" ||
    tableState.headerSlot !== "table-header" ||
    tableState.bodySlot !== "table-body" ||
    tableState.footSlot !== "table-foot" ||
    tableState.rowCount !== 5 ||
    tableState.cellCount !== 14 ||
    tableState.headTagName !== "TH" ||
    tableState.headRole !== null ||
    tableState.headClass?.includes("h-10") !== true ||
    tableState.cellClass?.includes("whitespace-nowrap") !== true ||
    tableState.selectedState !== "selected" ||
    tableState.selectedClass?.includes("data-[state=selected]:bg-muted") !== true ||
    tableState.totalCellColSpan !== "3"
  ) {
    throw new Error(
      `Expected React Table demo to expose semantic table parts, scroll wrapper, selected row state, and footer summary, got ${JSON.stringify(
        tableState,
      )}.`,
    );
  }

  const aspectRatioState = await page.evaluate(() => {
    const demoRoot = document.querySelector("#runtime-aspect-ratio-demo");
    const wide = demoRoot?.querySelector("#runtime-aspect-ratio-wide");
    const square = demoRoot?.querySelector("#runtime-aspect-ratio-square");
    const wideWrapper = wide?.parentElement;
    const squareWrapper = square?.parentElement;
    const image = wide?.querySelector("img");

    return {
      imageAlt: image?.getAttribute("alt"),
      imageClass: image?.getAttribute("class") ?? null,
      imageSrc: image?.getAttribute("src") ?? null,
      innerClass: wide?.getAttribute("class") ?? null,
      innerSlot: wide?.getAttribute("data-slot"),
      squareClass: square?.getAttribute("class") ?? null,
      squareTagName: square?.tagName,
      squareText: square?.textContent?.replace(/\s+/g, " ").trim() ?? null,
      squareWrapperStyle: squareWrapper?.getAttribute("style"),
      wrapperClass: wideWrapper?.getAttribute("class") ?? null,
      wrapperSlot: wideWrapper?.getAttribute("data-slot"),
      wrapperStyle: wideWrapper?.getAttribute("style"),
      wrapperCount: demoRoot?.querySelectorAll('[data-slot="aspect-ratio-wrapper"]').length ?? 0,
    };
  });
  if (
    aspectRatioState.wrapperCount !== 2 ||
    aspectRatioState.wrapperSlot !== "aspect-ratio-wrapper" ||
    aspectRatioState.wrapperClass?.includes("relative w-full") !== true ||
    aspectRatioState.wrapperStyle?.includes("56.25%") !== true ||
    aspectRatioState.innerSlot !== "aspect-ratio" ||
    aspectRatioState.innerClass?.includes("absolute") !== true ||
    aspectRatioState.innerClass?.includes("inset-0") !== true ||
    aspectRatioState.innerClass?.includes("overflow-hidden") !== true ||
    aspectRatioState.imageSrc?.startsWith("data:image/svg+xml") !== true ||
    aspectRatioState.imageAlt !== "Layered abstract landscape" ||
    aspectRatioState.imageClass?.includes("object-cover") !== true ||
    aspectRatioState.squareTagName !== "ARTICLE" ||
    aspectRatioState.squareWrapperStyle?.includes("100%") !== true ||
    aspectRatioState.squareClass?.includes("justify-end") !== true ||
    aspectRatioState.squareText?.includes("The default ratio renders as a square.") !== true
  ) {
    throw new Error(
      `Expected React Aspect Ratio demo to expose wrapper ratio styles, image content, and polymorphic inner element, got ${JSON.stringify(
        aspectRatioState,
      )}.`,
    );
  }

  const buttonState = await page.evaluate(() => {
    const defaultButton = document.querySelector("#react-runtime-button-default");
    const submitButton = document.querySelector("#react-runtime-button-submit");
    const disabledButton = document.querySelector("#react-runtime-button-disabled");
    const focusableDisabledButton = document.querySelector(
      "#react-runtime-button-focusable-disabled",
    );
    const anchorButton = document.querySelector("#react-runtime-button-link");
    const ghostAnchorButton = document.querySelector("#react-runtime-button-link-ghost");
    let ghostAnchorKeyboardClicks = 0;
    let focusableDisabledClicks = 0;

    ghostAnchorButton?.addEventListener("click", (event) => {
      event.preventDefault();
      ghostAnchorKeyboardClicks += 1;
    });
    focusableDisabledButton?.addEventListener("click", () => {
      focusableDisabledClicks += 1;
    });
    if (focusableDisabledButton instanceof HTMLElement) {
      focusableDisabledButton.click();
    }
    if (ghostAnchorButton instanceof HTMLElement) {
      ghostAnchorButton.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }),
      );
      ghostAnchorButton.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }));
      ghostAnchorButton.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: " " }));
    }

    const focusableDisabledStyle =
      focusableDisabledButton instanceof HTMLElement
        ? getComputedStyle(focusableDisabledButton)
        : null;

    return {
      anchorHref:
        anchorButton instanceof HTMLAnchorElement ? new URL(anchorButton.href).href : null,
      anchorNativeAttribute: anchorButton?.getAttribute("data-native"),
      anchorRole: anchorButton?.getAttribute("role"),
      ghostAnchorAttribute: ghostAnchorButton?.getAttribute("data-native"),
      ghostAnchorHref:
        ghostAnchorButton instanceof HTMLAnchorElement
          ? new URL(ghostAnchorButton.href).href
          : null,
      ghostAnchorKeyboardClicks,
      ghostAnchorRole: ghostAnchorButton?.getAttribute("role"),
      defaultType: defaultButton instanceof HTMLButtonElement ? defaultButton.type : null,
      disabledData: disabledButton?.hasAttribute("data-disabled") ?? null,
      disabledNative: disabledButton instanceof HTMLButtonElement ? disabledButton.disabled : null,
      focusableDisabledAria: focusableDisabledButton?.getAttribute("aria-disabled"),
      focusableDisabledClicks,
      focusableDisabledData: focusableDisabledButton?.hasAttribute("data-disabled") ?? null,
      focusableDisabledNative:
        focusableDisabledButton instanceof HTMLButtonElement
          ? focusableDisabledButton.disabled
          : null,
      focusableDisabledOpacity: focusableDisabledStyle?.opacity ?? null,
      submitType: submitButton instanceof HTMLButtonElement ? submitButton.type : null,
    };
  });
  if (
    buttonState.defaultType !== "button" ||
    buttonState.submitType !== "submit" ||
    buttonState.disabledNative !== true ||
    buttonState.disabledData !== true ||
    buttonState.focusableDisabledNative !== false ||
    buttonState.focusableDisabledAria !== "true" ||
    buttonState.focusableDisabledData !== true ||
    buttonState.focusableDisabledClicks !== 0 ||
    Number(buttonState.focusableDisabledOpacity) > 0.8 ||
    buttonState.anchorHref !== "https://starwind.dev/" ||
    buttonState.anchorRole !== null ||
    buttonState.anchorNativeAttribute !== null ||
    buttonState.ghostAnchorHref !== "https://starwind.dev/" ||
    buttonState.ghostAnchorKeyboardClicks !== 0 ||
    buttonState.ghostAnchorRole !== null ||
    buttonState.ghostAnchorAttribute !== null
  ) {
    throw new Error(
      `Expected React Button semantics to match the runtime contract, got ${JSON.stringify(
        buttonState,
      )}.`,
    );
  }

  const badgeState = await page.evaluate(() => {
    const badgeRoot = document.querySelector("#runtime-badge-demo");
    const legacyHeading = Array.from(badgeRoot?.querySelectorAll("h3") ?? []).find(
      (heading) => heading.textContent?.trim() === "Legacy variants",
    );
    const legacyRoot = legacyHeading?.parentElement ?? null;
    const legacyBadges = Array.from(legacyRoot?.querySelectorAll('[data-slot="badge"]') ?? []);
    const findLegacyByText = (text) =>
      legacyBadges.find((badge) => badge.textContent?.trim() === text) ?? null;
    const linkBadge = findLegacyByText("Link badge");

    return {
      legacyBadgeCount: legacyBadges.length,
      linkCount: legacyBadges.filter(
        (badge) =>
          badge instanceof HTMLAnchorElement && badge.matches('[data-sw-badge][data-slot="badge"]'),
      ).length,
      linkHref: linkBadge instanceof HTMLAnchorElement ? linkBadge.href : null,
      linkRel: linkBadge instanceof HTMLAnchorElement ? linkBadge.getAttribute("rel") : null,
      primaryClass: findLegacyByText("Primary")?.getAttribute("class") ?? null,
      warningClass: findLegacyByText("Warning")?.getAttribute("class") ?? null,
    };
  });
  if (
    badgeState.legacyBadgeCount < 8 ||
    badgeState.linkCount !== 1 ||
    badgeState.linkHref !== "https://starwind.dev/" ||
    badgeState.linkRel !== "noreferrer" ||
    !badgeState.warningClass?.includes("text-base") ||
    !badgeState.primaryClass?.includes("bg-primary")
  ) {
    throw new Error(
      `Expected React legacy badges with one styled link badge, got ${JSON.stringify(badgeState)}.`,
    );
  }

  const labelCount = await page.locator('[data-slot="label"][data-sw-label]').count();
  const smallLabelClass = await page
    .locator('label[data-slot="label"][for="react-runtime-label-sm"]')
    .getAttribute("class");
  const defaultLabelClass = await page
    .locator('label[data-slot="label"][for="react-runtime-label-md"]')
    .getAttribute("class");
  const largeLabelClass = await page
    .locator('label[data-slot="label"][for="react-runtime-label-lg"]')
    .getAttribute("class");
  const peerLabelClass = await page
    .locator('label[data-slot="label"][for="react-runtime-label-peer"]')
    .getAttribute("class");
  const labelAssociation = await page.evaluate(() => {
    const label = document.querySelector('label[data-slot="label"][for="react-runtime-label-sm"]');
    if (label instanceof HTMLLabelElement) {
      label.click();
    }

    return {
      activeId: document.activeElement?.id,
      controlId: label instanceof HTMLLabelElement ? label.control?.id : null,
    };
  });
  const disabledLabelStyle = await page
    .locator('label[data-slot="label"][for="react-runtime-label-lg"]')
    .evaluate((label) => {
      const style = getComputedStyle(label);

      return { cursor: style.cursor, opacity: style.opacity };
    });
  const peerDisabledLabelStyle = await page
    .locator('label[data-slot="label"][for="react-runtime-label-peer"]')
    .evaluate((label) => {
      const style = getComputedStyle(label);

      return { cursor: style.cursor, opacity: style.opacity };
    });
  if (
    labelCount < 4 ||
    labelAssociation.activeId !== "react-runtime-label-sm" ||
    labelAssociation.controlId !== "react-runtime-label-sm" ||
    !smallLabelClass?.includes("text-sm") ||
    !defaultLabelClass?.includes("text-base") ||
    !largeLabelClass?.includes("text-lg") ||
    !peerLabelClass?.includes("text-sm") ||
    disabledLabelStyle.cursor !== "not-allowed" ||
    Number(disabledLabelStyle.opacity) > 0.8 ||
    peerDisabledLabelStyle.cursor !== "not-allowed" ||
    Number(peerDisabledLabelStyle.opacity) > 0.8
  ) {
    throw new Error(
      `Expected at least four React labels with native association and disabled styling, got ${JSON.stringify(
        {
          defaultLabelClass,
          disabledLabelStyle,
          labelCount,
          labelAssociation,
          largeLabelClass,
          peerDisabledLabelStyle,
          peerLabelClass,
          smallLabelClass,
        },
      )}.`,
    );
  }

  const inputCount = await page.locator('input[data-slot="input"][data-sw-input]').count();
  const defaultInput = page.locator("#react-runtime-input-default");
  const inputLabelAssociation = await page.evaluate(() => {
    const label = document.querySelector(
      'label[data-slot="label"][for="react-runtime-input-default"]',
    );
    if (label instanceof HTMLLabelElement) {
      label.click();
    }

    return {
      activeId: document.activeElement?.id,
      controlId: label instanceof HTMLLabelElement ? label.control?.id : null,
    };
  });
  const initialInputState = await defaultInput.evaluate((input) => ({
    className: input.getAttribute("class"),
    dataSlot: input.getAttribute("data-slot"),
    hasDataSwInput: input.hasAttribute("data-sw-input"),
    hasDirty: input.hasAttribute("data-dirty"),
    hasFilled: input.hasAttribute("data-filled"),
    name: input.getAttribute("name"),
    value: input instanceof HTMLInputElement ? input.value : null,
  }));
  await defaultInput.fill("Grace");
  await defaultInput.blur();
  const defaultInputState = await defaultInput.evaluate((input) => ({
    className: input.getAttribute("class"),
    dataSlot: input.getAttribute("data-slot"),
    formValue:
      input instanceof HTMLInputElement && input.form
        ? new FormData(input.form).get(input.name)
        : null,
    hasDataSwInput: input.hasAttribute("data-sw-input"),
    hasDirty: input.hasAttribute("data-dirty"),
    hasFilled: input.hasAttribute("data-filled"),
    hasTouched: input.hasAttribute("data-touched"),
    name: input.getAttribute("name"),
    placeholder: input.getAttribute("placeholder"),
    value: input instanceof HTMLInputElement ? input.value : null,
  }));
  const controlledInput = page.locator("#react-runtime-input-controlled");
  await expectText(page.locator("[data-runtime-input-value]"), "Input value: Ada");
  await controlledInput.fill("Grace");
  await expectText(page.locator("[data-runtime-input-value]"), "Input value: Grace");
  await expectText(page.locator("[data-runtime-input-count]"), "Input changes: 1");
  await expectText(
    page.locator("[data-runtime-input-native-change]"),
    "Native input change: Grace",
  );
  const controlledInputState = await controlledInput.evaluate((input) => ({
    dataSlot: input.getAttribute("data-slot"),
    hasDirty: input.hasAttribute("data-dirty"),
    hasFilled: input.hasAttribute("data-filled"),
    value: input instanceof HTMLInputElement ? input.value : null,
  }));
  const rejectedInput = page.locator("#react-runtime-input-rejected");
  await rejectedInput.fill("Grace");
  await expectText(page.locator("[data-runtime-input-rejected-count]"), "Rejected changes: 1");
  await page.waitForFunction(() => {
    const input = document.querySelector("#react-runtime-input-rejected");

    return (
      input instanceof HTMLInputElement &&
      input.value === "Ada" &&
      !input.hasAttribute("data-dirty") &&
      input.hasAttribute("data-filled")
    );
  });
  const rejectedInputState = await rejectedInput.evaluate((input) => ({
    dataSlot: input.getAttribute("data-slot"),
    hasDirty: input.hasAttribute("data-dirty"),
    hasFilled: input.hasAttribute("data-filled"),
    value: input instanceof HTMLInputElement ? input.value : null,
  }));
  const disabledInputState = await page
    .locator("#react-runtime-input-disabled")
    .evaluate((input) => {
      const style = getComputedStyle(input);

      return {
        dataSlot: input.getAttribute("data-slot"),
        disabled: input instanceof HTMLInputElement ? input.disabled : null,
        hasDataDisabled: input.hasAttribute("data-disabled"),
        opacity: style.opacity,
      };
    });
  const fileInput = page.locator("#react-runtime-input-file");
  await fileInput.setInputFiles({
    buffer: Buffer.from("portable runtime"),
    mimeType: "text/plain",
    name: "react-runtime-note.txt",
  });
  const fileInputState = await fileInput.evaluate((input) => {
    const formDataFile =
      input instanceof HTMLInputElement && input.form
        ? new FormData(input.form).get(input.name)
        : null;

    return {
      dataSlot: input.getAttribute("data-slot"),
      fileName: input instanceof HTMLInputElement ? input.files?.[0]?.name : null,
      formFileName: formDataFile instanceof File ? formDataFile.name : null,
      hasDirty: input.hasAttribute("data-dirty"),
      hasFilled: input.hasAttribute("data-filled"),
      value: input instanceof HTMLInputElement ? input.value : null,
    };
  });
  await page.locator("[data-runtime-input-form]").evaluate((form) => {
    if (form instanceof HTMLFormElement) {
      form.reset();
    }
  });
  await page.waitForFunction(() => {
    const defaultInput = document.querySelector("#react-runtime-input-default");
    const fileInput = document.querySelector("#react-runtime-input-file");

    return (
      defaultInput instanceof HTMLInputElement &&
      fileInput instanceof HTMLInputElement &&
      defaultInput.value === "Ada" &&
      !defaultInput.hasAttribute("data-dirty") &&
      fileInput.files?.length === 0 &&
      fileInput.value === "" &&
      !fileInput.hasAttribute("data-dirty") &&
      !fileInput.hasAttribute("data-filled")
    );
  });
  const resetInputState = await page.evaluate(() => {
    const defaultInput = document.querySelector("#react-runtime-input-default");
    const fileInput = document.querySelector("#react-runtime-input-file");
    const form = document.querySelector("[data-runtime-input-form]");

    return {
      defaultDirty: defaultInput?.hasAttribute("data-dirty"),
      defaultFilled: defaultInput?.hasAttribute("data-filled"),
      defaultFormValue:
        defaultInput instanceof HTMLInputElement && form instanceof HTMLFormElement
          ? new FormData(form).get(defaultInput.name)
          : null,
      defaultValue: defaultInput instanceof HTMLInputElement ? defaultInput.value : null,
      fileDirty: fileInput?.hasAttribute("data-dirty"),
      fileFilled: fileInput?.hasAttribute("data-filled"),
      fileLength: fileInput instanceof HTMLInputElement ? fileInput.files?.length : null,
      fileValue: fileInput instanceof HTMLInputElement ? fileInput.value : null,
    };
  });
  await expectText(page.locator("[data-runtime-input-ref]"), "input");
  if (
    inputCount < 5 ||
    inputLabelAssociation.activeId !== "react-runtime-input-default" ||
    inputLabelAssociation.controlId !== "react-runtime-input-default" ||
    initialInputState.className?.includes("runtime-input-custom") !== true ||
    initialInputState.dataSlot !== "input" ||
    initialInputState.hasDataSwInput !== true ||
    initialInputState.hasDirty !== false ||
    initialInputState.hasFilled !== true ||
    initialInputState.name !== "react-runtime-input-default" ||
    initialInputState.value !== "Ada" ||
    defaultInputState.formValue !== "Grace" ||
    defaultInputState.hasDirty !== true ||
    defaultInputState.hasFilled !== true ||
    defaultInputState.hasTouched !== true ||
    defaultInputState.placeholder !== "Type a name" ||
    defaultInputState.value !== "Grace" ||
    controlledInputState.dataSlot !== "input" ||
    controlledInputState.hasDirty !== true ||
    controlledInputState.hasFilled !== true ||
    controlledInputState.value !== "Grace" ||
    rejectedInputState.dataSlot !== "input" ||
    rejectedInputState.hasDirty !== false ||
    rejectedInputState.hasFilled !== true ||
    rejectedInputState.value !== "Ada" ||
    disabledInputState.dataSlot !== "input" ||
    disabledInputState.disabled !== true ||
    disabledInputState.hasDataDisabled !== true ||
    Number(disabledInputState.opacity) > 0.8 ||
    fileInputState.dataSlot !== "input" ||
    fileInputState.fileName !== "react-runtime-note.txt" ||
    fileInputState.formFileName !== "react-runtime-note.txt" ||
    fileInputState.hasDirty !== true ||
    fileInputState.hasFilled !== true ||
    resetInputState.defaultDirty !== false ||
    resetInputState.defaultFilled !== true ||
    resetInputState.defaultFormValue !== "Ada" ||
    resetInputState.defaultValue !== "Ada" ||
    resetInputState.fileDirty !== false ||
    resetInputState.fileFilled !== false ||
    resetInputState.fileLength !== 0 ||
    resetInputState.fileValue !== ""
  ) {
    throw new Error(
      `Expected at least five React inputs with runtime state, controlled updates, rejected controlled sync, reset behavior, file support, and Starwind styling, got ${JSON.stringify(
        {
          controlledInputState,
          defaultInputState,
          disabledInputState,
          fileInputState,
          initialInputState,
          inputCount,
          inputLabelAssociation,
          rejectedInputState,
          resetInputState,
        },
      )}.`,
    );
  }
}

async function verifyReactProseCases({ page }) {
  const proseState = await page.evaluate(() => {
    const root = document.querySelector("#react-runtime-prose-demo [data-slot='prose']");
    const heading = root?.querySelector("#react-runtime-prose-heading");
    const paragraph = root?.querySelector("#react-runtime-prose-paragraph");
    const code = root?.querySelector("#react-runtime-prose-code");
    const escapedCode = root?.querySelector("#react-runtime-prose-escaped-code");
    const escapedHeading = root?.querySelector("#react-runtime-prose-escaped-heading");
    const list = root?.querySelector("#react-runtime-prose-list");

    const headingStyle = heading instanceof HTMLElement ? getComputedStyle(heading) : null;
    const paragraphStyle = paragraph instanceof HTMLElement ? getComputedStyle(paragraph) : null;
    const codeStyle = code instanceof HTMLElement ? getComputedStyle(code) : null;
    const escapedCodeStyle =
      escapedCode instanceof HTMLElement ? getComputedStyle(escapedCode) : null;
    const escapedHeadingStyle =
      escapedHeading instanceof HTMLElement ? getComputedStyle(escapedHeading) : null;
    const listStyle = list instanceof HTMLElement ? getComputedStyle(list) : null;

    return {
      codeBackground: codeStyle?.backgroundColor ?? null,
      customClass: root?.classList.contains("runtime-prose-custom") ?? null,
      escapedCodeBackground: escapedCodeStyle?.backgroundColor ?? null,
      escapedHeadingFontSize: escapedHeadingStyle?.fontSize ?? null,
      hasDataSwProse: root instanceof HTMLElement ? root.hasAttribute("data-sw-prose") : null,
      hasSwProseClass: root?.classList.contains("sw-prose") ?? null,
      headingFontSize: headingStyle?.fontSize ?? null,
      listStyleType: listStyle?.listStyleType ?? null,
      maxWidth: root instanceof HTMLElement ? getComputedStyle(root).maxWidth : null,
      paragraphFontSize: paragraphStyle?.fontSize ?? null,
      slot: root?.getAttribute("data-slot") ?? null,
    };
  });

  if (
    proseState.slot !== "prose" ||
    proseState.hasDataSwProse !== true ||
    proseState.hasSwProseClass !== true ||
    proseState.customClass !== true ||
    proseState.maxWidth !== "520px" ||
    Number.parseFloat(proseState.headingFontSize ?? "0") <=
      Number.parseFloat(proseState.paragraphFontSize ?? "0") ||
    proseState.listStyleType !== "disc" ||
    !proseState.codeBackground ||
    proseState.codeBackground === "rgba(0, 0, 0, 0)" ||
    proseState.escapedCodeBackground !== "rgba(0, 0, 0, 0)" ||
    proseState.escapedHeadingFontSize === proseState.headingFontSize
  ) {
    throw new Error(
      `Expected React Prose demo to render scoped sw-prose typography and preserve not-sw-prose escape styles, got ${JSON.stringify(
        proseState,
      )}.`,
    );
  }
}
