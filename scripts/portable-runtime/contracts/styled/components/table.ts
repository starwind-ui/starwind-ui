import type { StyledAdapterContract, StyledComponentContract } from "../types.js";

type TablePartOptions = {
  exportName: string;
  htmlElement: string;
  refType: string;
  role?: string;
  slot: string;
  tag: string;
  variant: string;
};

function tablePart({
  exportName,
  htmlElement,
  refType,
  role,
  slot,
  tag,
  variant,
}: TablePartOptions): StyledComponentContract {
  return {
    exportName,
    props: {
      extends: [{ type: "htmlAttributes", element: htmlElement }],
      fields: [
        {
          name: "ref",
          optional: true,
          type: `React.Ref<${refType}>`,
          frameworks: ["react"],
        },
      ],
    },
    destructure: {
      props: [
        { name: "ref", frameworks: ["react"] },
        { name: "class", alias: "className" },
      ],
      rest: "rest",
    },
    render: [
      {
        type: "element",
        tag,
        attrs: [
          ...(role ? [{ name: "role", value: { type: "literal", value: role } } as const] : []),
          {
            name: "class",
            value: {
              type: "classVariant",
              variant,
              args: { class: "className" },
            },
          },
          { name: "spread", value: { type: "variable", name: "rest" } },
          { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
          { name: "data-slot", value: { type: "literal", value: slot } },
        ],
        children: [{ type: "slot" }],
      },
    ],
  };
}

export const tableStyledContract: StyledAdapterContract = {
  component: "table",
  publicExports: [
    "Table",
    "TableBody",
    "TableCaption",
    "TableCell",
    "TableFoot",
    "TableHead",
    "TableHeader",
    "TableRow",
  ],
  defaultExport: {
    Root: "Table",
    Body: "TableBody",
    Caption: "TableCaption",
    Cell: "TableCell",
    Foot: "TableFoot",
    Head: "TableHead",
    Header: "TableHeader",
    Row: "TableRow",
  },
  variantCollectionName: "TableVariants",
  variants: {
    table: {
      base: "w-full caption-bottom text-sm",
    },
    tableBody: {
      base: "[&_tr:last-child]:border-0",
    },
    tableCaption: {
      base: "text-muted-foreground mt-4 text-sm",
    },
    tableCell: {
      base: "p-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
    },
    tableFoot: {
      base: "bg-muted/50 border-t font-medium [&>tr]:last:border-b-0",
    },
    tableHead: {
      base: "text-muted-foreground h-10 px-2 text-left align-middle font-medium whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
    },
    tableHeader: {
      base: "[&_tr]:border-b",
    },
    tableRow: {
      base: "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
    },
  },
  components: [
    {
      exportName: "Table",
      props: {
        extends: [
          { type: "htmlAttributes", element: "table" },
          { type: "variantProps", variant: "table" },
        ],
        fields: [
          {
            name: "ref",
            optional: true,
            type: "React.Ref<HTMLTableElement>",
            frameworks: ["react"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "ref", frameworks: ["react"] },
          { name: "class", alias: "className" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "data-slot", value: { type: "literal", value: "table-container" } },
            {
              name: "class",
              value: { type: "literal", value: "relative w-full overflow-x-auto" },
            },
          ],
          children: [
            {
              type: "element",
              tag: "table",
              attrs: [
                {
                  name: "class",
                  value: {
                    type: "classVariant",
                    variant: "table",
                    args: { class: "className" },
                  },
                },
                { name: "spread", value: { type: "variable", name: "rest" } },
                { name: "ref", value: { type: "variable", name: "ref" }, frameworks: ["react"] },
                { name: "data-slot", value: { type: "literal", value: "table" } },
              ],
              children: [{ type: "slot" }],
            },
          ],
        },
      ],
    },
    tablePart({
      exportName: "TableHeader",
      htmlElement: "thead",
      refType: "HTMLTableSectionElement",
      slot: "table-header",
      tag: "thead",
      variant: "tableHeader",
    }),
    tablePart({
      exportName: "TableBody",
      htmlElement: "tbody",
      refType: "HTMLTableSectionElement",
      slot: "table-body",
      tag: "tbody",
      variant: "tableBody",
    }),
    tablePart({
      exportName: "TableFoot",
      htmlElement: "tfoot",
      refType: "HTMLTableSectionElement",
      slot: "table-foot",
      tag: "tfoot",
      variant: "tableFoot",
    }),
    tablePart({
      exportName: "TableRow",
      htmlElement: "tr",
      refType: "HTMLTableRowElement",
      slot: "table-row",
      tag: "tr",
      variant: "tableRow",
    }),
    tablePart({
      exportName: "TableHead",
      htmlElement: "th",
      refType: "HTMLTableCellElement",
      slot: "table-head",
      tag: "th",
      variant: "tableHead",
    }),
    tablePart({
      exportName: "TableCell",
      htmlElement: "td",
      refType: "HTMLTableCellElement",
      slot: "table-cell",
      tag: "td",
      variant: "tableCell",
    }),
    tablePart({
      exportName: "TableCaption",
      htmlElement: "caption",
      refType: "HTMLTableCaptionElement",
      slot: "table-caption",
      tag: "caption",
      variant: "tableCaption",
    }),
  ],
};
