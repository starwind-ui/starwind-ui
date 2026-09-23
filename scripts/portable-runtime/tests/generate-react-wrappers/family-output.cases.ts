import { compactCode } from "../source-comparison.js";
import type { GetTempRoot } from "./shared.js";
import { expect, generateStarwindReactWrappers, it, path, readGeneratedFile } from "./shared.js";

export function defineReactFamilyOutputTests(getTempRoot: GetTempRoot): void {
  it("generates Button Group styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const buttonGroup = await readGeneratedFile(outputRoot, "button-group/ButtonGroup.tsx");
    const buttonGroupSeparator = await readGeneratedFile(
      outputRoot,
      "button-group/ButtonGroupSeparator.tsx",
    );
    const buttonGroupText = await readGeneratedFile(outputRoot, "button-group/ButtonGroupText.tsx");
    const buttonGroupIndex = await readGeneratedFile(outputRoot, "button-group/index.ts");
    const buttonGroupVariants = await readGeneratedFile(outputRoot, "button-group/variants.ts");

    expect(compactCode(buttonGroup)).toContain(
      compactCode('React.ComponentPropsWithoutRef<"div">'),
    );
    expect(compactCode(buttonGroup)).toContain(compactCode('orientation = "horizontal"'));
    expect(compactCode(buttonGroup)).toContain(compactCode('role="group"'));
    expect(compactCode(buttonGroup)).toContain(compactCode("data-orientation={orientation}"));
    expect(compactCode(buttonGroup)).toContain(
      compactCode("buttonGroup({ orientation, class: className })"),
    );
    expect(compactCode(buttonGroup)).toContain(compactCode('data-slot="button-group"'));
    expect(compactCode(buttonGroupSeparator)).toContain(
      compactCode('import { Separator } from "../separator"'),
    );
    expect(compactCode(buttonGroupSeparator)).toContain(
      compactCode("export type ButtonGroupSeparatorProps = React.ComponentProps<typeof Separator>"),
    );
    expect(compactCode(buttonGroupSeparator)).toContain(compactCode('orientation = "vertical"'));
    expect(compactCode(buttonGroupSeparator)).toContain(compactCode("<Separator"));
    expect(compactCode(buttonGroupSeparator)).toContain(compactCode("orientation={orientation}"));
    expect(compactCode(buttonGroupSeparator)).toContain(
      compactCode("buttonGroupSeparator({ class: className })"),
    );
    expect(compactCode(buttonGroupSeparator)).toContain(
      compactCode('data-slot="button-group-separator"'),
    );
    expect(compactCode(buttonGroupText)).toContain(
      compactCode("buttonGroupText({ class: className })"),
    );
    expect(compactCode(buttonGroupText)).toContain(compactCode('data-slot="button-group-text"'));
    expect(compactCode(buttonGroupIndex)).toContain(compactCode("Root: ButtonGroup"));
    expect(compactCode(buttonGroupIndex)).toContain(compactCode("Separator: ButtonGroupSeparator"));
    expect(compactCode(buttonGroupIndex)).toContain(compactCode("Text: ButtonGroupText"));
    expect(compactCode(buttonGroupVariants)).toContain(compactCode(":has(+_script:last-child)"));
    expect(compactCode(buttonGroupVariants)).toContain(compactCode("data-slot=dropdown"));
    expect(compactCode(buttonGroupVariants)).toContain(
      compactCode("[data-slot=dropdown]_>_[data-sw-menu-trigger]"),
    );
    expect(compactCode(buttonGroupVariants)).toContain(
      compactCode("[data-slot=dropdown]_>_*_>_[data-sw-menu-trigger]"),
    );
    expect(compactCode(buttonGroupVariants)).not.toContain(
      compactCode("[data-slot=dropdown]_[data-slot=button]"),
    );
  });

  it("generates Item styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const item = await readGeneratedFile(outputRoot, "item/Item.tsx");
    const itemGroup = await readGeneratedFile(outputRoot, "item/ItemGroup.tsx");
    const itemMedia = await readGeneratedFile(outputRoot, "item/ItemMedia.tsx");
    const itemSeparator = await readGeneratedFile(outputRoot, "item/ItemSeparator.tsx");
    const itemIndex = await readGeneratedFile(outputRoot, "item/index.ts");
    const itemVariants = await readGeneratedFile(outputRoot, "item/variants.ts");

    expect(compactCode(item)).toContain(compactCode('React.ComponentPropsWithoutRef<"div">'));
    expect(compactCode(item)).toContain(
      compactCode('Omit<React.ComponentPropsWithoutRef<"a">, "type">'),
    );
    expect(compactCode(item)).toContain(compactCode("VariantProps<typeof item>"));
    expect(compactCode(item)).toContain(compactCode("as?: React.ElementType;"));
    expect(compactCode(item)).toContain(compactCode('as: Tag = "div"'));
    expect(compactCode(item)).toContain(compactCode("<Tag"));
    expect(compactCode(item)).toContain(compactCode("data-sw-item"));
    expect(compactCode(item)).toContain(compactCode("item({ variant, size, class: className })"));
    expect(compactCode(item)).toContain(compactCode('data-slot="item"'));
    expect(compactCode(itemGroup)).toContain(compactCode('role="list"'));
    expect(compactCode(itemGroup)).toContain(compactCode("itemGroup({ class: className })"));
    expect(compactCode(itemMedia)).toContain(compactCode('variant = "default"'));
    expect(compactCode(itemMedia)).toContain(compactCode("data-variant={variant}"));
    expect(compactCode(itemMedia)).toContain(
      compactCode("itemMedia({ variant, class: className })"),
    );
    expect(compactCode(itemSeparator)).toContain(
      compactCode('import { Separator } from "../separator";'),
    );
    expect(compactCode(itemSeparator)).toContain(compactCode('orientation = "horizontal"'));
    expect(compactCode(itemSeparator)).toContain(compactCode("<Separator"));
    expect(compactCode(itemSeparator)).toContain(
      compactCode("itemSeparator({ class: className })"),
    );
    expect(compactCode(itemSeparator)).toContain(compactCode('data-slot="item-separator"'));
    expect(compactCode(itemIndex)).toContain(compactCode("Root: Item"));
    expect(compactCode(itemIndex)).toContain(compactCode("Separator: ItemSeparator"));
    expect(compactCode(itemVariants)).toContain(
      compactCode("group/item flex flex-wrap items-center"),
    );
    expect(compactCode(itemVariants)).toContain(
      compactCode("group-has-[[data-slot=item-description]]/item:self-start"),
    );
  });

  it("generates Native Select styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const nativeSelect = await readGeneratedFile(outputRoot, "native-select/NativeSelect.tsx");
    const nativeSelectOption = await readGeneratedFile(
      outputRoot,
      "native-select/NativeSelectOption.tsx",
    );
    const nativeSelectOptGroup = await readGeneratedFile(
      outputRoot,
      "native-select/NativeSelectOptGroup.tsx",
    );
    const nativeSelectIndex = await readGeneratedFile(outputRoot, "native-select/index.ts");
    const nativeSelectVariants = await readGeneratedFile(outputRoot, "native-select/variants.ts");

    expect(compactCode(nativeSelect)).toContain(compactCode("IconChevronDown as ChevronDown"));
    expect(compactCode(nativeSelect)).toContain(
      compactCode('Omit<React.ComponentPropsWithoutRef<"select">, "size">'),
    );
    expect(compactCode(nativeSelect)).toContain(compactCode("VariantProps<typeof nativeSelect>"));
    expect(compactCode(nativeSelect)).toContain(compactCode("icon?: React.ReactNode;"));
    expect(compactCode(nativeSelect)).toContain(compactCode("ref?: React.Ref<HTMLSelectElement>;"));
    expect(compactCode(nativeSelect)).toContain(compactCode("nativeSelectWrapper()"));
    expect(compactCode(nativeSelect)).toContain(compactCode("data-size={size}"));
    expect(compactCode(nativeSelect)).toContain(compactCode('data-slot="native-select-wrapper"'));
    expect(compactCode(nativeSelect)).toContain(
      compactCode("nativeSelect({ size, class: className })"),
    );
    expect(compactCode(nativeSelect)).toContain(compactCode('data-slot="native-select"'));
    expect(compactCode(nativeSelect)).toContain(compactCode("icon ??"));
    expect(compactCode(nativeSelect)).toContain(compactCode("<ChevronDown"));
    expect(compactCode(nativeSelect)).toContain(compactCode("nativeSelectIcon({ size })"));
    expect(compactCode(nativeSelect)).toContain(compactCode("aria-hidden"));
    expect(compactCode(nativeSelect)).toContain(compactCode('data-slot="native-select-icon"'));
    expect(compactCode(nativeSelectOption)).not.toContain(
      compactCode("starwind-native-select-option"),
    );
    expect(compactCode(nativeSelectOption)).toContain(
      compactCode('"bg-[Canvas] text-[CanvasText]", className'),
    );
    expect(compactCode(nativeSelectOption)).toContain(
      compactCode('data-slot="native-select-option"'),
    );
    expect(compactCode(nativeSelectOptGroup)).not.toContain(
      compactCode("starwind-native-select-optgroup"),
    );
    expect(compactCode(nativeSelectOptGroup)).toContain(
      compactCode('"bg-[Canvas] text-[CanvasText]", className'),
    );
    expect(compactCode(nativeSelectOptGroup)).toContain(
      compactCode('data-slot="native-select-optgroup"'),
    );
    expect(compactCode(nativeSelectIndex)).toContain(compactCode("Root: NativeSelect"));
    expect(compactCode(nativeSelectIndex)).toContain(compactCode("Option: NativeSelectOption"));
    expect(compactCode(nativeSelectIndex)).toContain(compactCode("OptGroup: NativeSelectOptGroup"));
    expect(compactCode(nativeSelectVariants)).not.toContain(compactCode("starwind-native-select"));
    expect(compactCode(nativeSelectVariants)).toContain(
      compactCode("group/native-select relative w-fit has-[select:disabled]:opacity-50"),
    );
    expect(compactCode(nativeSelectVariants)).toContain(
      compactCode(
        "data-error-visible:border-error data-error-visible:focus-visible:ring-error/40 data-error-visible:focus-visible:ring-3",
      ),
    );
    expect(compactCode(nativeSelectVariants)).toContain(
      compactCode("text-foreground pointer-events-none absolute"),
    );
    expect(compactCode(nativeSelectVariants)).toContain(compactCode('md: "right-3 size-4"'));
  });

  it("generates Pagination styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const pagination = await readGeneratedFile(outputRoot, "pagination/Pagination.tsx");
    const paginationContent = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationContent.tsx",
    );
    const paginationItem = await readGeneratedFile(outputRoot, "pagination/PaginationItem.tsx");
    const paginationLink = await readGeneratedFile(outputRoot, "pagination/PaginationLink.tsx");
    const paginationPrevious = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationPrevious.tsx",
    );
    const paginationNext = await readGeneratedFile(outputRoot, "pagination/PaginationNext.tsx");
    const paginationEllipsis = await readGeneratedFile(
      outputRoot,
      "pagination/PaginationEllipsis.tsx",
    );
    const paginationIndex = await readGeneratedFile(outputRoot, "pagination/index.ts");
    const paginationVariants = await readGeneratedFile(outputRoot, "pagination/variants.ts");

    expect(compactCode(pagination)).toContain(compactCode('role="navigation"'));
    expect(compactCode(pagination)).toContain(compactCode('aria-label="pagination"'));
    expect(compactCode(pagination)).toContain(compactCode("pagination({ class: className })"));
    expect(compactCode(pagination)).not.toContain(compactCode("size ="));
    expect(compactCode(pagination)).not.toContain(compactCode("data-size="));
    expect(compactCode(pagination)).toContain(compactCode('data-slot="pagination"'));
    expect(compactCode(paginationContent)).toContain(
      compactCode("paginationContent({ class: className })"),
    );
    expect(compactCode(paginationContent)).toContain(compactCode('data-slot="pagination-content"'));
    expect(compactCode(paginationItem)).toContain(
      compactCode('React.ComponentPropsWithoutRef<"li">'),
    );
    expect(compactCode(paginationItem)).toContain(compactCode('data-slot="pagination-item"'));
    expect(compactCode(paginationLink)).toContain(
      compactCode('import { Button } from "../button"'),
    );
    expect(compactCode(paginationLink)).toContain(
      compactCode('Omit<React.ComponentProps<typeof Button>, "variant" | "as" | "ref">'),
    );
    expect(compactCode(paginationLink)).toContain(
      compactCode("ref?: React.Ref<HTMLAnchorElement>;"),
    );
    expect(compactCode(paginationLink)).not.toContain(compactCode("size?:"));
    expect(compactCode(paginationLink)).toContain(
      compactCode('"data-slot": dataSlot = "pagination-link"'),
    );
    expect(compactCode(paginationLink)).toContain(
      compactCode('aria-current={isActive ? "page" : undefined}'),
    );
    expect(compactCode(paginationLink)).toContain(compactCode("<Button"));
    expect(compactCode(paginationLink)).toContain(compactCode('as="a"'));
    expect(compactCode(paginationLink)).toContain(compactCode('{...rest}\n      as="a"'));
    expect(compactCode(paginationLink)).toContain(
      compactCode('variant={isActive ? "outline" : "ghost"}'),
    );
    expect(compactCode(paginationLink)).toContain(compactCode('size = "icon"'));
    expect(compactCode(paginationLink)).toContain(compactCode("size={size}"));
    expect(compactCode(paginationLink)).toContain(compactCode("className={className}"));
    expect(compactCode(paginationLink)).not.toContain(compactCode("paginationLink("));
    expect(compactCode(paginationLink)).toContain(compactCode("data-slot={dataSlot}"));
    expect(compactCode(paginationPrevious)).toContain(
      compactCode('import PaginationLink from "./PaginationLink";'),
    );
    expect(compactCode(paginationPrevious)).toContain(
      compactCode(
        "export type PaginationPreviousProps = React.ComponentProps<typeof PaginationLink>",
      ),
    );
    expect(compactCode(paginationPrevious)).toContain(
      compactCode('aria-label="Go to previous page"'),
    );
    expect(compactCode(paginationPrevious)).toContain(compactCode('size = "md"'));
    expect(compactCode(paginationPrevious)).toContain(compactCode("size={size}"));
    expect(compactCode(paginationPrevious)).toContain(
      compactCode('data-slot="pagination-previous"'),
    );
    expect(compactCode(paginationPrevious)).toContain(compactCode("<ChevronLeft />"));
    expect(compactCode(paginationPrevious)).not.toContain(compactCode("group-hover:"));
    expect(compactCode(paginationPrevious)).not.toContain(compactCode("transition-transform"));
    expect(compactCode(paginationPrevious)).toContain(compactCode("className={className}"));
    expect(compactCode(paginationPrevious)).not.toContain(compactCode("paginationPrevious("));
    expect(compactCode(paginationNext)).toContain(compactCode('aria-label="Go to next page"'));
    expect(compactCode(paginationNext)).toContain(compactCode('size = "md"'));
    expect(compactCode(paginationNext)).toContain(compactCode("size={size}"));
    expect(compactCode(paginationNext)).toContain(compactCode('data-slot="pagination-next"'));
    expect(compactCode(paginationNext)).toContain(compactCode("<ChevronRight />"));
    expect(compactCode(paginationNext)).not.toContain(compactCode("group-hover:"));
    expect(compactCode(paginationNext)).not.toContain(compactCode("transition-transform"));
    expect(compactCode(paginationEllipsis)).toContain(compactCode("IconDots as Dots"));
    expect(compactCode(paginationEllipsis)).toContain(
      compactCode("VariantProps<typeof paginationEllipsis>"),
    );
    expect(compactCode(paginationEllipsis)).toContain(
      compactCode("paginationEllipsis({ size, class: className })"),
    );
    expect(compactCode(paginationEllipsis)).toContain(compactCode("aria-hidden"));
    expect(compactCode(paginationEllipsis)).toContain(compactCode("<Dots"));
    expect(compactCode(paginationEllipsis)).not.toContain(compactCode('<Dots className="size-4"'));
    expect(compactCode(paginationEllipsis)).toContain(
      compactCode('<span className="sr-only">More pages</span>'),
    );
    expect(compactCode(paginationIndex)).toContain(compactCode("Previous: PaginationPrevious"));
    expect(compactCode(paginationIndex)).toContain(compactCode("Next: PaginationNext"));
    expect(compactCode(paginationVariants)).toContain(
      compactCode("mx-auto flex w-full justify-center"),
    );
    expect(compactCode(paginationVariants)).toContain(
      compactCode("flex flex-row items-center gap-1"),
    );
    expect(compactCode(paginationVariants)).not.toContain(
      compactCode("export const paginationLink"),
    );
    expect(compactCode(paginationVariants)).not.toContain(compactCode("group-data-[size="));
    expect(compactCode(paginationVariants)).toContain(
      compactCode(`"icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-3.5"`),
    );
    expect(compactCode(paginationVariants)).toContain(
      compactCode(`icon: "size-11 [&_svg:not([class*='size-'])]:size-4.5"`),
    );
    expect(compactCode(paginationVariants)).toContain(
      compactCode(`"icon-lg": "size-12 [&_svg:not([class*='size-'])]:size-5"`),
    );
  });

  it("generates Table styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const table = await readGeneratedFile(outputRoot, "table/Table.tsx");
    const tableHeader = await readGeneratedFile(outputRoot, "table/TableHeader.tsx");
    const tableBody = await readGeneratedFile(outputRoot, "table/TableBody.tsx");
    const tableFoot = await readGeneratedFile(outputRoot, "table/TableFoot.tsx");
    const tableRow = await readGeneratedFile(outputRoot, "table/TableRow.tsx");
    const tableHead = await readGeneratedFile(outputRoot, "table/TableHead.tsx");
    const tableCell = await readGeneratedFile(outputRoot, "table/TableCell.tsx");
    const tableCaption = await readGeneratedFile(outputRoot, "table/TableCaption.tsx");
    const tableIndex = await readGeneratedFile(outputRoot, "table/index.ts");
    const tableVariants = await readGeneratedFile(outputRoot, "table/variants.ts");

    expect(compactCode(table)).toContain(compactCode('data-slot="table-container"'));
    expect(compactCode(table)).toContain(compactCode("relative w-full overflow-x-auto"));
    expect(compactCode(table)).not.toContain(compactCode('role="table"'));
    expect(compactCode(table)).toContain(compactCode("table({ class: className })"));
    expect(compactCode(table)).toContain(compactCode('data-slot="table"'));
    expect(compactCode(tableHeader)).toContain(
      compactCode('React.ComponentPropsWithoutRef<"thead">'),
    );
    expect(compactCode(tableHeader)).toContain(compactCode("tableHeader({ class: className })"));
    expect(compactCode(tableHeader)).toContain(compactCode('data-slot="table-header"'));
    expect(compactCode(tableBody)).toContain(compactCode("tableBody({ class: className })"));
    expect(compactCode(tableBody)).toContain(compactCode('data-slot="table-body"'));
    expect(compactCode(tableFoot)).toContain(compactCode("tableFoot({ class: className })"));
    expect(compactCode(tableFoot)).toContain(compactCode('data-slot="table-foot"'));
    expect(compactCode(tableRow)).not.toContain(compactCode('role="row"'));
    expect(compactCode(tableRow)).toContain(compactCode('data-slot="table-row"'));
    expect(compactCode(tableHead)).not.toContain(compactCode('role="columnheader"'));
    expect(compactCode(tableHead)).toContain(compactCode('data-slot="table-head"'));
    expect(compactCode(tableCell)).toContain(compactCode('React.ComponentPropsWithoutRef<"td">'));
    expect(compactCode(tableCell)).toContain(compactCode('data-slot="table-cell"'));
    expect(compactCode(tableCaption)).toContain(
      compactCode('React.ComponentPropsWithoutRef<"caption">'),
    );
    expect(compactCode(tableCaption)).toContain(compactCode('data-slot="table-caption"'));
    expect(compactCode(tableIndex)).toContain(compactCode("Foot: TableFoot"));
    expect(compactCode(tableIndex)).toContain(compactCode("Header: TableHeader"));
    expect(compactCode(tableVariants)).toContain(compactCode("w-full caption-bottom text-sm"));
    expect(compactCode(tableVariants)).toContain(
      compactCode("hover:bg-muted/50 data-[state=selected]:bg-muted"),
    );
  });

  it("generates Aspect Ratio styled React wrappers", async () => {
    const tempRoot = getTempRoot();
    await generateStarwindReactWrappers({
      outputDir: "generated",
      primitiveOutputDir: "generated/primitives/react",
      repoRoot: tempRoot,
    });

    const outputRoot = path.join(tempRoot, "generated");
    const aspectRatio = await readGeneratedFile(outputRoot, "aspect-ratio/AspectRatio.tsx");
    const aspectRatioIndex = await readGeneratedFile(outputRoot, "aspect-ratio/index.ts");
    const aspectRatioVariants = await readGeneratedFile(outputRoot, "aspect-ratio/variants.ts");

    expect(compactCode(aspectRatio)).toContain(compactCode("ratio = 1"));
    expect(compactCode(aspectRatio)).toContain(compactCode('as: Tag = "div"'));
    expect(compactCode(aspectRatio)).toContain(
      compactCode("{ paddingBottom: `${100 / ratio}%` } as React.CSSProperties"),
    );
    expect(compactCode(aspectRatio)).toContain(compactCode("aspectRatioWrapper()"));
    expect(compactCode(aspectRatio)).toContain(compactCode("style={wrapperStyle}"));
    expect(compactCode(aspectRatio)).toContain(compactCode('data-slot="aspect-ratio-wrapper"'));
    expect(compactCode(aspectRatio)).toContain(compactCode("aspectRatio({ class: className })"));
    expect(compactCode(aspectRatio)).toContain(compactCode('data-slot="aspect-ratio"'));
    expect(compactCode(aspectRatio)).toContain(compactCode("ref={ref}"));
    expect(compactCode(aspectRatioIndex)).toContain(compactCode("export default AspectRatio;"));
    expect(compactCode(aspectRatioIndex)).not.toContain(compactCode("Root: AspectRatio"));
    expect(compactCode(aspectRatioVariants)).toContain(compactCode("relative w-full"));
    expect(compactCode(aspectRatioVariants)).toContain(compactCode("absolute inset-0"));
  });
}
