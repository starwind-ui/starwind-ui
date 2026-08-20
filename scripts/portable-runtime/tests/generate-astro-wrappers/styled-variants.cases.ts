import type { GetTempRoot } from "./shared.js";
import {
  expect,
  generateStarwindAstroWrappers,
  it,
  path,
  readGeneratedFile,
  starwindStyledContracts,
  toArray,
} from "./shared.js";

export function defineAstroStyledVariantTests(getTempRoot: GetTempRoot): void {
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

  it("keeps Pagination sizing owned by its links", () => {
    const paginationContract = starwindStyledContracts.find(
      (contract) => contract.component === "pagination",
    )!;

    expect(toArray(paginationContract.variants!.pagination.base)).toContain(
      "mx-auto flex w-full justify-center",
    );
    expect(paginationContract.variants!.paginationLink).toBeUndefined();
    expect(paginationContract.variants!.paginationPrevious).toBeUndefined();
    expect(paginationContract.variants!.paginationNext).toBeUndefined();
    expect(paginationContract.variants!.paginationEllipsis.defaultVariants).toEqual({
      size: "icon",
    });

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
    expect(pagination).not.toContain("size =");
    expect(pagination).not.toContain("data-size=");
    expect(pagination).toContain('data-slot="pagination"');
    expect(paginationContent).toContain("paginationContent({ class: className })");
    expect(paginationContent).toContain('data-slot="pagination-content"');
    expect(paginationItem).toContain('HTMLAttributes<"li">');
    expect(paginationItem).toContain('data-slot="pagination-item"');
    expect(paginationLink).toContain('import { Button } from "../button"');
    expect(paginationLink).toContain(
      'Omit<ComponentProps<typeof Button>, "variant" | "as" | "ref">',
    );
    expect(paginationLink).not.toContain("size?:");
    expect(paginationLink).toContain('"data-slot": dataSlot = "pagination-link"');
    expect(paginationLink).toContain('aria-current={isActive ? "page" : undefined}');
    expect(paginationLink).toContain("<Button");
    expect(paginationLink).toContain('as="a"');
    expect(paginationLink).toContain('{...rest}\n  as="a"');
    expect(paginationLink).toContain('variant={isActive ? "outline" : "ghost"}');
    expect(paginationLink).toContain('size = "icon"');
    expect(paginationLink).toContain("size={size}");
    expect(paginationLink).toContain("class={className}");
    expect(paginationLink).not.toContain("paginationLink(");
    expect(paginationLink).toContain("data-slot={dataSlot}");
    expect(paginationPrevious).toContain('import PaginationLink from "./PaginationLink.astro";');
    expect(paginationPrevious).toContain("type Props = ComponentProps<typeof PaginationLink>");
    expect(paginationPrevious).toContain('aria-label="Go to previous page"');
    expect(paginationPrevious).toContain('size = "md"');
    expect(paginationPrevious).toContain("size={size}");
    expect(paginationPrevious).toContain('data-slot="pagination-previous"');
    expect(paginationPrevious).toContain("<ChevronLeft />");
    expect(paginationPrevious).not.toContain("group-hover:");
    expect(paginationPrevious).not.toContain("transition-transform");
    expect(paginationPrevious).toContain("class={className}");
    expect(paginationPrevious).not.toContain("paginationPrevious(");
    expect(paginationNext).toContain('aria-label="Go to next page"');
    expect(paginationNext).toContain('size = "md"');
    expect(paginationNext).toContain("size={size}");
    expect(paginationNext).toContain('data-slot="pagination-next"');
    expect(paginationNext).toContain("<ChevronRight />");
    expect(paginationNext).not.toContain("group-hover:");
    expect(paginationNext).not.toContain("transition-transform");
    expect(paginationEllipsis).toContain("import Dots");
    expect(paginationEllipsis).toContain("VariantProps<typeof paginationEllipsis>");
    expect(paginationEllipsis).toContain("paginationEllipsis({ size, class: className })");
    expect(paginationEllipsis).toContain("aria-hidden");
    expect(paginationEllipsis).toContain("<Dots");
    expect(paginationEllipsis).toContain('<span class="sr-only">More pages</span>');
    expect(paginationIndex).toContain("Previous: PaginationPrevious");
    expect(paginationIndex).toContain("Next: PaginationNext");
    expect(paginationVariants).toContain("mx-auto flex w-full justify-center");
    expect(paginationVariants).toContain("flex flex-row items-center gap-1");
    expect(paginationVariants).not.toContain("export const paginationLink");
    expect(paginationVariants).not.toContain("group-data-[size=");
    expect(paginationVariants).toContain('"icon-lg": "size-12"');
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
