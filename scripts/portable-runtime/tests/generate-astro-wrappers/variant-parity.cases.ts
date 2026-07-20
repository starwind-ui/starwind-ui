import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindAstroWrappers,
  it,
  path,
  readFile,
  readGeneratedFile,
  starwindStyledContracts,
  toArray,
} from "./shared.js";

export function defineAstroVariantParityTests(getTempRoot: GetTempRoot): void {
  it("keeps the Textarea styled variant contract aligned with canonical Starwind classes", async () => {
    const textareaContract = starwindStyledContracts.find(
      (contract) => contract.component === "textarea",
    )!;
    const canonicalTextareaVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/textarea/variants.ts"),
      "utf8",
    );
    const textareaVariant = textareaContract.variants!.textarea;
    const classGroups = [
      ...toArray(textareaVariant.base),
      ...Object.values(textareaVariant.variants!.size).flatMap(toArray),
    ];

    for (const classGroup of classGroups) {
      expectCanonicalVariantsToContainRuntimeClassGroup(canonicalTextareaVariants, classGroup);
    }

    expect(textareaVariant.defaultVariants).toEqual({ size: "md" });
  });

  it("keeps the Input styled variant contract aligned with canonical Starwind classes", async () => {
    const inputContract = starwindStyledContracts.find(
      (contract) => contract.component === "input",
    )!;
    const canonicalInputVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/input/variants.ts"),
      "utf8",
    );
    const inputVariant = inputContract.variants!.input;
    const classGroups = [
      ...toArray(inputVariant.base),
      ...Object.values(inputVariant.variants!.size).flatMap(toArray),
    ];

    for (const classGroup of classGroups) {
      expectCanonicalVariantsToContainRuntimeClassGroup(canonicalInputVariants, classGroup);
    }

    expect(inputVariant.defaultVariants).toEqual({ size: "md" });
  });

  it("keeps the Input Group styled variant contract aligned with canonical Starwind classes", async () => {
    const inputGroupContract = starwindStyledContracts.find(
      (contract) => contract.component === "input-group",
    )!;
    const canonicalInputGroupVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/input-group/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(inputGroupContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expectCanonicalVariantsToContainRuntimeClassGroup(canonicalInputGroupVariants, classGroup);
      }
    }

    expect(inputGroupContract.defaultExport).toEqual({
      Root: "InputGroup",
      Addon: "InputGroupAddon",
      Button: "InputGroupButton",
      Input: "InputGroupInput",
      Text: "InputGroupText",
      Textarea: "InputGroupTextarea",
    });
  });

  it("keeps the Button Group styled variant contract aligned with canonical Starwind classes", async () => {
    const buttonGroupContract = starwindStyledContracts.find(
      (contract) => contract.component === "button-group",
    )!;
    const canonicalButtonGroupVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/button-group/variants.ts"),
      "utf8",
    );
    // Old core ButtonGroup targets the prior menu-shaped dropdown slot; normalize to runtime Dropdown.
    const normalizedCanonicalButtonGroupVariants = canonicalButtonGroupVariants.replaceAll(
      ["data-slot=dropdown", "menu"].join("-"),
      "data-slot=dropdown",
    );

    for (const variant of Object.values(buttonGroupContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(normalizedCanonicalButtonGroupVariants).toContain(classGroup);
      }
    }

    expect(buttonGroupContract.defaultExport).toEqual({
      Root: "ButtonGroup",
      Separator: "ButtonGroupSeparator",
      Text: "ButtonGroupText",
    });
  });

  it("generates Button Group styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const buttonGroup = await readGeneratedFile(outputRoot, "button-group/ButtonGroup.astro");
    const buttonGroupSeparator = await readGeneratedFile(
      outputRoot,
      "button-group/ButtonGroupSeparator.astro",
    );
    const buttonGroupText = await readGeneratedFile(
      outputRoot,
      "button-group/ButtonGroupText.astro",
    );
    const buttonGroupIndex = await readGeneratedFile(outputRoot, "button-group/index.ts");
    const buttonGroupVariants = await readGeneratedFile(outputRoot, "button-group/variants.ts");

    expect(buttonGroup).toContain('type Props = HTMLAttributes<"div">');
    expect(buttonGroup).toContain('orientation = "horizontal"');
    expect(buttonGroup).toContain('role="group"');
    expect(buttonGroup).toContain("data-orientation={orientation}");
    expect(buttonGroup).toContain("buttonGroup({ orientation, class: className })");
    expect(buttonGroup).toContain('data-slot="button-group"');
    expect(buttonGroupSeparator).toContain('import type { ComponentProps } from "astro/types"');
    expect(buttonGroupSeparator).toContain('import { Separator } from "../separator"');
    expect(buttonGroupSeparator).toContain("type Props = ComponentProps<typeof Separator>");
    expect(buttonGroupSeparator).toContain('orientation = "vertical"');
    expect(buttonGroupSeparator).toContain("<Separator");
    expect(buttonGroupSeparator).toContain("orientation={orientation}");
    expect(buttonGroupSeparator).toContain("buttonGroupSeparator({ class: className })");
    expect(buttonGroupSeparator).toContain('data-slot="button-group-separator"');
    expect(buttonGroupText).toContain("buttonGroupText({ class: className })");
    expect(buttonGroupText).toContain('data-slot="button-group-text"');
    expect(buttonGroupIndex).toContain("Root: ButtonGroup");
    expect(buttonGroupIndex).toContain("Separator: ButtonGroupSeparator");
    expect(buttonGroupIndex).toContain("Text: ButtonGroupText");
    expect(buttonGroupVariants).toContain(":has(+_script:last-child)");
    expect(buttonGroupVariants).toContain("data-slot=dropdown");
    expect(buttonGroupVariants).toContain("[data-slot=dropdown]_>_[data-sw-menu-trigger]");
    expect(buttonGroupVariants).toContain("[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]");
    expect(buttonGroupVariants).not.toContain("[data-slot=dropdown]_[data-slot=button]");
  });

  it("keeps the Item styled variant contract aligned with canonical Starwind classes", async () => {
    const itemContract = starwindStyledContracts.find((contract) => contract.component === "item")!;
    const canonicalItemVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/item/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(itemContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(canonicalItemVariants).toContain(classGroup);
      }
    }

    expect(itemContract.defaultExport).toEqual({
      Root: "Item",
      Actions: "ItemActions",
      Content: "ItemContent",
      Description: "ItemDescription",
      Footer: "ItemFooter",
      Group: "ItemGroup",
      Header: "ItemHeader",
      Media: "ItemMedia",
      Separator: "ItemSeparator",
      Title: "ItemTitle",
    });
  });

  it("generates Item styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const item = await readGeneratedFile(outputRoot, "item/Item.astro");
    const itemGroup = await readGeneratedFile(outputRoot, "item/ItemGroup.astro");
    const itemMedia = await readGeneratedFile(outputRoot, "item/ItemMedia.astro");
    const itemSeparator = await readGeneratedFile(outputRoot, "item/ItemSeparator.astro");
    const itemIndex = await readGeneratedFile(outputRoot, "item/index.ts");
    const itemVariants = await readGeneratedFile(outputRoot, "item/variants.ts");

    expect(item).toContain('import type { HTMLTag, Polymorphic } from "astro/types";');
    expect(item).toContain("type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>");
    expect(item).toContain("VariantProps<typeof item>");
    expect(item).not.toContain('Omit<HTMLAttributes<"a">, "type">');
    expect(item).not.toContain("as?: keyof HTMLElementTagNameMap;");
    expect(item).toContain('as: Tag = "div"');
    expect(item).toContain("<Tag");
    expect(item).toContain("data-sw-item");
    expect(item).toContain("item({ variant, size, class: className })");
    expect(item).toContain('data-slot="item"');
    expect(itemGroup).toContain('role="list"');
    expect(itemGroup).toContain("itemGroup({ class: className })");
    expect(itemMedia).toContain('variant = "default"');
    expect(itemMedia).toContain("data-variant={variant}");
    expect(itemMedia).toContain("itemMedia({ variant, class: className })");
    expect(itemSeparator).toContain('import { Separator } from "../separator";');
    expect(itemSeparator).toContain('orientation = "horizontal"');
    expect(itemSeparator).toContain("<Separator");
    expect(itemSeparator).toContain("itemSeparator({ class: className })");
    expect(itemSeparator).toContain('data-slot="item-separator"');
    expect(itemIndex).toContain("Root: Item");
    expect(itemIndex).toContain("Separator: ItemSeparator");
    expect(itemVariants).toContain("group/item flex flex-wrap items-center");
    expect(itemVariants).toContain("group-has-[[data-slot=item-description]]/item:self-start");
  });

  it("keeps the Native Select styled variant contract aligned with canonical Starwind classes", async () => {
    const nativeSelectContract = starwindStyledContracts.find(
      (contract) => contract.component === "native-select",
    )!;
    const canonicalNativeSelectVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/native-select/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(nativeSelectContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expectCanonicalVariantsToContainRuntimeClassGroup(
          canonicalNativeSelectVariants,
          classGroup,
        );
      }
    }

    expect(nativeSelectContract.defaultExport).toEqual({
      Root: "NativeSelect",
      Option: "NativeSelectOption",
      OptGroup: "NativeSelectOptGroup",
    });
  });

  it("generates Native Select styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const nativeSelect = await readGeneratedFile(outputRoot, "native-select/NativeSelect.astro");
    const nativeSelectOption = await readGeneratedFile(
      outputRoot,
      "native-select/NativeSelectOption.astro",
    );
    const nativeSelectOptGroup = await readGeneratedFile(
      outputRoot,
      "native-select/NativeSelectOptGroup.astro",
    );
    const nativeSelectIndex = await readGeneratedFile(outputRoot, "native-select/index.ts");
    const nativeSelectVariants = await readGeneratedFile(outputRoot, "native-select/variants.ts");

    expect(nativeSelect).toContain("import ChevronDown");
    expect(nativeSelect).toContain('Omit<HTMLAttributes<"select">, "size">');
    expect(nativeSelect).toContain("VariantProps<typeof nativeSelect>");
    expect(nativeSelect).toContain("nativeSelectWrapper()");
    expect(nativeSelect).toContain("data-size={size}");
    expect(nativeSelect).toContain('data-slot="native-select-wrapper"');
    expect(nativeSelect).toContain("nativeSelect({ size, class: className })");
    expect(nativeSelect).toContain('data-slot="native-select"');
    expect(nativeSelect).toContain('<slot name="icon">');
    expect(nativeSelect).toContain("<ChevronDown");
    expect(nativeSelect).toContain("nativeSelectIcon({ size })");
    expect(nativeSelect).toContain('aria-hidden="true"');
    expect(nativeSelect).toContain('data-slot="native-select-icon"');
    expect(nativeSelectOption).not.toContain("starwind-native-select-option");
    expect(nativeSelectOption).toContain('"bg-[Canvas] text-[CanvasText]", className');
    expect(nativeSelectOption).toContain('data-slot="native-select-option"');
    expect(nativeSelectOptGroup).not.toContain("starwind-native-select-optgroup");
    expect(nativeSelectOptGroup).toContain('"bg-[Canvas] text-[CanvasText]", className');
    expect(nativeSelectOptGroup).toContain('data-slot="native-select-optgroup"');
    expect(nativeSelectIndex).toContain("Root: NativeSelect");
    expect(nativeSelectIndex).toContain("Option: NativeSelectOption");
    expect(nativeSelectIndex).toContain("OptGroup: NativeSelectOptGroup");
    expect(nativeSelectVariants).not.toContain("starwind-native-select");
    expect(nativeSelectVariants).toContain(
      "group/native-select relative w-fit has-[select:disabled]:opacity-50",
    );
    expect(nativeSelectVariants).toContain(
      "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
    );
    expect(nativeSelectVariants).toContain("text-foreground pointer-events-none absolute");
    expect(nativeSelectVariants).toContain('md: "right-3 size-4"');
  });

  it("keeps the Pagination styled variant contract aligned with canonical Starwind classes", async () => {
    const paginationContract = starwindStyledContracts.find(
      (contract) => contract.component === "pagination",
    )!;
    const canonicalPaginationVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/pagination/variants.ts"),
      "utf8",
    );

    for (const [variantName, variant] of Object.entries(paginationContract.variants!)) {
      if (variantName === "paginationLink") continue;

      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(canonicalPaginationVariants).toContain(classGroup);
      }
    }

    expect(paginationContract.defaultExport).toEqual({
      Root: "Pagination",
      Content: "PaginationContent",
      Ellipsis: "PaginationEllipsis",
      Item: "PaginationItem",
      Link: "PaginationLink",
      Next: "PaginationNext",
      Previous: "PaginationPrevious",
    });
  });

  it("generates Pagination styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const pagination = await readGeneratedFile(outputRoot, "pagination/Pagination.astro");
    const paginationContent = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationContent.astro",
    );
    const paginationItem = await readGeneratedFile(outputRoot, "pagination/PaginationItem.astro");
    const paginationLink = await readGeneratedFile(outputRoot, "pagination/PaginationLink.astro");
    const paginationPrevious = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationPrevious.astro",
    );
    const paginationNext = await readGeneratedFile(outputRoot, "pagination/PaginationNext.astro");
    const paginationEllipsis = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationEllipsis.astro",
    );
    const paginationIndex = await readGeneratedFile(outputRoot, "pagination/index.ts");
    const paginationVariants = await readGeneratedFile(outputRoot, "pagination/variants.ts");

    expect(pagination).toContain('role="navigation"');
    expect(pagination).toContain('aria-label="pagination"');
    expect(pagination).toContain("pagination({ class: className })");
    expect(pagination).toContain('data-slot="pagination"');
    expect(paginationContent).toContain("paginationContent({ class: className })");
    expect(paginationContent).toContain('data-slot="pagination-content"');
    expect(paginationItem).toContain('HTMLAttributes<"li">');
    expect(paginationItem).toContain('data-slot="pagination-item"');
    expect(paginationLink).toContain('import { Button } from "../button"');
    expect(paginationLink).toContain(
      'Omit<ComponentProps<typeof Button>, "variant" | "as" | "ref">',
    );
    expect(paginationLink).toContain('size = "icon"');
    expect(paginationLink).toContain('"data-slot": dataSlot = "pagination-link"');
    expect(paginationLink).toContain('aria-current={isActive ? "page" : undefined}');
    expect(paginationLink).toContain("<Button");
    expect(paginationLink).toContain('as="a"');
    expect(paginationLink).toContain('{...rest}\n  as="a"');
    expect(paginationLink).toContain('variant={isActive ? "outline" : "ghost"}');
    expect(paginationLink).toContain("size={size}");
    expect(paginationLink).toContain("class={className}");
    expect(paginationLink).not.toContain("paginationLink(");
    expect(paginationLink).toContain("data-slot={dataSlot}");
    expect(paginationPrevious).toContain('import PaginationLink from "./PaginationLink.astro";');
    expect(paginationPrevious).toContain("type Props = ComponentProps<typeof PaginationLink>");
    expect(paginationPrevious).toContain('aria-label="Go to previous page"');
    expect(paginationPrevious).toContain('size = "md"');
    expect(paginationPrevious).toContain('data-slot="pagination-previous"');
    expect(paginationPrevious).toContain("<ChevronLeft");
    expect(paginationPrevious).toContain("paginationPrevious({ class: className })");
    expect(paginationNext).toContain('aria-label="Go to next page"');
    expect(paginationNext).toContain('data-slot="pagination-next"');
    expect(paginationNext).toContain("<ChevronRight");
    expect(paginationEllipsis).toContain("import Dots");
    expect(paginationEllipsis).toContain("paginationEllipsis({ size, class: className })");
    expect(paginationEllipsis).toContain("aria-hidden");
    expect(paginationEllipsis).toContain("<Dots");
    expect(paginationEllipsis).toContain('<span class="sr-only">More pages</span>');
    expect(paginationIndex).toContain("Previous: PaginationPrevious");
    expect(paginationIndex).toContain("Next: PaginationNext");
    expect(paginationVariants).toContain("mx-auto flex w-full justify-center");
    expect(paginationVariants).toContain("flex flex-row items-center gap-1");
    expect(paginationVariants).not.toContain("paginationLink");
    expect(paginationVariants).toContain('"icon-lg": "size-12');
  });

  it("keeps the Table styled variant contract aligned with canonical Starwind classes", async () => {
    const tableContract = starwindStyledContracts.find(
      (contract) => contract.component === "table",
    )!;
    const canonicalTableVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/table/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(tableContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(canonicalTableVariants).toContain(classGroup);
      }
    }

    expect(tableContract.defaultExport).toEqual({
      Root: "Table",
      Body: "TableBody",
      Caption: "TableCaption",
      Cell: "TableCell",
      Foot: "TableFoot",
      Head: "TableHead",
      Header: "TableHeader",
      Row: "TableRow",
    });
  });

  it("generates Table styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const table = await readGeneratedFile(outputRoot, "table/Table.astro");
    const tableHeader = await readGeneratedFile(outputRoot, "table/TableHeader.astro");
    const tableBody = await readGeneratedFile(outputRoot, "table/TableBody.astro");
    const tableFoot = await readGeneratedFile(outputRoot, "table/TableFoot.astro");
    const tableRow = await readGeneratedFile(outputRoot, "table/TableRow.astro");
    const tableHead = await readGeneratedFile(outputRoot, "table/TableHead.astro");
    const tableCell = await readGeneratedFile(outputRoot, "table/TableCell.astro");
    const tableCaption = await readGeneratedFile(outputRoot, "table/TableCaption.astro");
    const tableIndex = await readGeneratedFile(outputRoot, "table/index.ts");
    const tableVariants = await readGeneratedFile(outputRoot, "table/variants.ts");

    expect(table).toContain('data-slot="table-container"');
    expect(table).toContain("relative w-full overflow-x-auto");
    expect(table).not.toContain('role="table"');
    expect(table).toContain("table({ class: className })");
    expect(table).toContain('data-slot="table"');
    expect(tableHeader).toContain('HTMLAttributes<"thead">');
    expect(tableHeader).toContain("tableHeader({ class: className })");
    expect(tableHeader).toContain('data-slot="table-header"');
    expect(tableBody).toContain("tableBody({ class: className })");
    expect(tableBody).toContain('data-slot="table-body"');
    expect(tableFoot).toContain("tableFoot({ class: className })");
    expect(tableFoot).toContain('data-slot="table-foot"');
    expect(tableRow).not.toContain('role="row"');
    expect(tableRow).toContain('data-slot="table-row"');
    expect(tableHead).not.toContain('role="columnheader"');
    expect(tableHead).toContain('data-slot="table-head"');
    expect(tableCell).toContain('HTMLAttributes<"td">');
    expect(tableCell).toContain('data-slot="table-cell"');
    expect(tableCaption).toContain('HTMLAttributes<"caption">');
    expect(tableCaption).toContain('data-slot="table-caption"');
    expect(tableIndex).toContain("Foot: TableFoot");
    expect(tableIndex).toContain("Header: TableHeader");
    expect(tableVariants).toContain("w-full caption-bottom text-sm");
    expect(tableVariants).toContain("hover:bg-muted/50 data-[state=selected]:bg-muted");
  });

  it("keeps the Aspect Ratio styled variant contract aligned with canonical Starwind classes", async () => {
    const aspectRatioContract = starwindStyledContracts.find(
      (contract) => contract.component === "aspect-ratio",
    )!;
    const canonicalAspectRatioVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/aspect-ratio/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(aspectRatioContract.variants!)) {
      for (const classGroup of toArray(variant.base)) {
        expect(canonicalAspectRatioVariants).toContain(classGroup);
      }
    }

    expect(aspectRatioContract.defaultExport).toEqual({ Root: "AspectRatio" });
    expect(aspectRatioContract.defaultExportMode).toBe("component");
  });

  it("generates Aspect Ratio styled Astro wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindAstroWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/astro",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const aspectRatio = await readGeneratedFile(outputRoot, "aspect-ratio/AspectRatio.astro");
    const aspectRatioIndex = await readGeneratedFile(outputRoot, "aspect-ratio/index.ts");
    const aspectRatioVariants = await readGeneratedFile(outputRoot, "aspect-ratio/variants.ts");

    expect(aspectRatio).toContain('import type { HTMLTag, Polymorphic } from "astro/types";');
    expect(aspectRatio).toContain("type Props<Tag extends HTMLTag> = Polymorphic<{ as: Tag }>");
    expect(aspectRatio).toContain("ratio = 1");
    expect(aspectRatio).toContain('as: Tag = "div"');
    expect(aspectRatio).toContain("`padding-bottom: ${100 / ratio}%`");
    expect(aspectRatio).toContain("aspectRatioWrapper()");
    expect(aspectRatio).toContain("style={wrapperStyle}");
    expect(aspectRatio).toContain('data-slot="aspect-ratio-wrapper"');
    expect(aspectRatio).toContain("aspectRatio({ class: className })");
    expect(aspectRatio).toContain('data-slot="aspect-ratio"');
    expect(aspectRatioIndex).toContain("export default AspectRatio;");
    expect(aspectRatioIndex).not.toContain("Root: AspectRatio");
    expect(aspectRatioVariants).toContain("relative w-full");
    expect(aspectRatioVariants).toContain("absolute inset-0");
  });

  it("keeps the Spinner styled variant contract aligned with canonical Starwind classes", async () => {
    const spinnerContract = starwindStyledContracts.find(
      (contract) => contract.component === "spinner",
    )!;
    const canonicalSpinnerVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/spinner/variants.ts"),
      "utf8",
    );
    const spinnerVariant = spinnerContract.variants!.spinner;

    for (const classGroup of toArray(spinnerVariant.base)) {
      expect(canonicalSpinnerVariants).toContain(classGroup);
    }
  });

  it("keeps the Switch styled variant contract aligned with canonical Starwind classes", async () => {
    const switchContract = starwindStyledContracts.find(
      (contract) => contract.component === "switch",
    )!;
    const canonicalSwitchVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/switch/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(switchContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        if (classGroup === "flex items-center") continue;
        if (
          classGroup ===
          "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40"
        ) {
          continue;
        }

        expect(canonicalSwitchVariants).toContain(classGroup);
      }
    }

    expect(switchContract.variants!.switchButton.defaultVariants).toEqual({
      variant: "default",
    });
    expect(switchContract.variants!.switchToggle.defaultVariants).toEqual({ size: "md" });
    expect(switchContract.variants!.switchLabel.defaultVariants).toEqual({ size: "md" });
  });

  it("keeps the Tabs styled variant contract aligned with canonical Starwind classes", async () => {
    const tabsContract = starwindStyledContracts.find((contract) => contract.component === "tabs")!;
    const canonicalTabsVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/tabs/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(tabsContract.variants!)) {
      for (const classGroup of toArray(variant.base)) {
        expect(canonicalTabsVariants).toContain(classGroup);
      }
    }
  });

  it("keeps the Alert Dialog styled variant contract aligned with canonical Starwind classes while allowing runtime-only additions", async () => {
    const alertDialogContract = starwindStyledContracts.find(
      (contract) => contract.component === "alert-dialog",
    )!;
    const canonicalAlertDialogVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/alert-dialog/variants.ts"),
      "utf8",
    );

    for (const variantName of [
      "alertDialogBackdrop",
      "alertDialogContent",
      "alertDialogDescription",
      "alertDialogFooter",
      "alertDialogHeader",
      "alertDialogTitle",
    ]) {
      const variant = alertDialogContract.variants![variantName]!;
      for (const classGroup of toArray(variant.base)) {
        expect(canonicalAlertDialogVariants).toContain(stripRuntimeOnlyClassAdditions(classGroup));
      }
    }
  });

  it("keeps the Sheet styled variant contract aligned with canonical Sheet classes", async () => {
    const sheetContract = starwindStyledContracts.find(
      (contract) => contract.component === "sheet",
    )!;
    const canonicalSheetVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/sheet/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(sheetContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        if (classGroup.startsWith("starwind-sheet-")) continue;

        expect(canonicalSheetVariants).toContain(classGroup);
      }
    }

    expect(sheetContract.variants!.sheetContent.defaultVariants).toEqual({ side: "right" });
  });

  it("keeps the Toggle styled variant contract aligned with canonical Starwind classes", async () => {
    const toggleContract = starwindStyledContracts.find(
      (contract) => contract.component === "toggle",
    )!;
    const canonicalToggleVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/toggle/variants.ts"),
      "utf8",
    );
    const toggleVariant = toggleContract.variants!.toggle;
    const classGroups = [
      ...toArray(toggleVariant.base),
      ...Object.values(toggleVariant.variants ?? {}).flatMap((values) =>
        Object.values(values).flatMap(toArray),
      ),
    ];

    for (const classGroup of classGroups) {
      if (classGroup.startsWith("starwind-runtime-toggle ")) {
        expect(classGroup).toContain("inline-flex items-center");
        continue;
      }

      expect(canonicalToggleVariants).toContain(classGroup);
    }

    expect(toggleVariant.defaultVariants).toEqual({ variant: "default", size: "md" });
  });

  it("keeps the Skeleton styled variant contract aligned with canonical Starwind classes", async () => {
    const skeletonContract = starwindStyledContracts.find(
      (contract) => contract.component === "skeleton",
    )!;
    const canonicalSkeletonVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/skeleton/variants.ts"),
      "utf8",
    );
    const skeletonVariant = skeletonContract.variants!.skeleton;

    for (const classGroup of toArray(skeletonVariant.base)) {
      expect(canonicalSkeletonVariants).toContain(classGroup);
    }
  });

  it("keeps the Prose styled contract aligned with canonical Starwind styles", async () => {
    const proseContract = starwindStyledContracts.find(
      (contract) => contract.component === "prose",
    )!;
    const canonicalProseVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/prose/variants.ts"),
      "utf8",
    );
    const canonicalProse = await readFile(
      path.join(process.cwd(), "packages/core/src/components/prose/Prose.astro"),
      "utf8",
    );
    const proseVariant = proseContract.variants!.prose;

    for (const classGroup of toArray(proseVariant.base)) {
      expect(canonicalProseVariants).toContain(classGroup);
    }

    expect(proseContract.defaultExportMode).toBe("component");
    expect(proseContract.styles?.importFrom).toEqual(["Prose"]);
    expect(proseContract.styles?.content.join("\n")).toBe(extractGlobalStyle(canonicalProse));
  });

  it("keeps the Video styled variant contract aligned with canonical Starwind classes", async () => {
    const videoContract = starwindStyledContracts.find(
      (contract) => contract.component === "video",
    )!;
    const canonicalVideoVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/video/variants.ts"),
      "utf8",
    );
    const videoVariant = videoContract.variants!.video;

    for (const classGroup of toArray(videoVariant.base)) {
      expect(canonicalVideoVariants).toContain(classGroup);
    }

    expect(videoContract.defaultExportMode).toBe("component");
  });

  it("keeps the Image styled variant contract aligned with canonical Starwind classes", async () => {
    const imageContract = starwindStyledContracts.find(
      (contract) => contract.component === "image",
    )!;
    const canonicalImageVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/image/variants.ts"),
      "utf8",
    );
    const imageVariant = imageContract.variants!.image;

    for (const classGroup of toArray(imageVariant.base)) {
      expect(canonicalImageVariants).toContain(classGroup);
    }

    expect(imageContract.defaultExportMode).toBe("component");
    expect(imageContract.frameworks).toEqual(["astro"]);
  });

  it("keeps non-spacing Card styles aligned with the legacy canonical component", async () => {
    const cardContract = starwindStyledContracts.find((contract) => contract.component === "card")!;
    const canonicalCardVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/card/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(cardContract.variants!)) {
      for (const className of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ].flatMap((classGroup) => classGroup.split(" "))) {
        if (!className.includes("--card-spacing")) {
          expect(canonicalCardVariants).toContain(className);
        }
      }
    }

    expect(cardContract.variants!.card.defaultVariants).toEqual({ size: "default" });
  });

  it("keeps the Breadcrumb styled variant contract aligned with canonical Starwind classes", async () => {
    const breadcrumbContract = starwindStyledContracts.find(
      (contract) => contract.component === "breadcrumb",
    )!;
    const canonicalBreadcrumbVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/breadcrumb/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(breadcrumbContract.variants!)) {
      for (const classGroup of toArray(variant.base)) {
        expect(canonicalBreadcrumbVariants).toContain(classGroup);
      }
    }
  });

  it("keeps the Alert styled variant contract aligned with canonical Starwind classes", async () => {
    const alertContract = starwindStyledContracts.find(
      (contract) => contract.component === "alert",
    )!;
    const canonicalAlertVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/alert/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(alertContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(canonicalAlertVariants).toContain(classGroup);
      }
    }

    expect(alertContract.variants!.alert.defaultVariants).toEqual({ variant: "default" });
  });

  it("keeps the Avatar styled variant contract aligned with canonical Starwind classes", async () => {
    const avatarContract = starwindStyledContracts.find(
      (contract) => contract.component === "avatar",
    )!;
    const canonicalAvatarVariants = await readFile(
      path.join(process.cwd(), "packages/core/src/components/avatar/variants.ts"),
      "utf8",
    );

    for (const variant of Object.values(avatarContract.variants!)) {
      for (const classGroup of [
        ...toArray(variant.base),
        ...Object.values(variant.variants ?? {}).flatMap((values) =>
          Object.values(values).flatMap(toArray),
        ),
      ]) {
        expect(canonicalAvatarVariants).toContain(classGroup);
      }
    }

    expect(avatarContract.variants!.avatar.defaultVariants).toEqual({
      size: "md",
      variant: "default",
    });
  });

  it("keeps the Collapsible styled variant contract data-hook based", async () => {
    const collapsibleContract = starwindStyledContracts.find(
      (contract) => contract.component === "collapsible",
    )!;

    expect(collapsibleContract.variants).toEqual({
      collapsible: { base: "" },
      collapsibleContent: { base: "" },
      collapsibleTrigger: { base: "" },
    });
  });
}

function stripRuntimeOnlyClassAdditions(classGroup: string): string {
  return classGroup.replace(/\sduration-(?:\d+|\[[^\]]+\])/g, "");
}

function expectCanonicalVariantsToContainRuntimeClassGroup(
  canonicalVariants: string,
  classGroup: string,
): void {
  expect(canonicalVariants).toContain(toCanonicalFormControlClassGroup(classGroup));
}

function toCanonicalFormControlClassGroup(classGroup: string): string {
  return classGroup
    .replaceAll("data-error-visible:border-error", "aria-invalid:border-error")
    .replaceAll(
      "data-error-visible:focus-visible:ring-error/40",
      "aria-invalid:focus-visible:ring-error/40",
    )
    .replaceAll("data-error-visible:focus-visible:ring-3", "aria-invalid:focus-visible:ring-3")
    .replaceAll(
      "has-[[data-slot][data-error-visible]]:border-error",
      "has-[[data-slot][aria-invalid=true]]:border-error",
    )
    .replaceAll(
      "has-[[data-slot][data-error-visible]]:ring-error/40",
      "has-[[data-slot][aria-invalid=true]]:ring-error/40",
    )
    .replaceAll(
      "has-[[data-slot][data-error-visible]]:ring-3",
      "has-[[data-slot][aria-invalid=true]]:ring-3",
    );
}

function extractGlobalStyle(source: string): string {
  const match = source.match(/<style is:global>\r?\n([\s\S]*?)\r?\n<\/style>/);
  expect(match).not.toBeNull();

  return match![1]
    .split(/\r?\n/)
    .map((line) => (line.startsWith("  ") ? line.slice(2) : line))
    .join("\n")
    .trimEnd();
}
