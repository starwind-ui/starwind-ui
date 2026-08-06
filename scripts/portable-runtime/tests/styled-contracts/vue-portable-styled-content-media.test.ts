import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type {
  AttributeContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
} from "../../contracts/styled/types.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { supportsVueScope } from "../../renderers/framework-adapters/vue/styled.js";

const GROUPS = ["breadcrumb", "card", "item", "prose", "table", "video"] as const;

// This map records semantic DOM roots from the contract render tree. It is the
// shared ref oracle. The React prop assertions below only protect the existing
// React surface; they do not define the portable contract fact.
export const EXPECTED_ELEMENT_TARGETS = {
  breadcrumb: {
    Breadcrumb: "HTMLElement",
    BreadcrumbEllipsis: "HTMLSpanElement",
    BreadcrumbItem: "HTMLLIElement",
    BreadcrumbLink: "HTMLAnchorElement",
    BreadcrumbList: "HTMLOListElement",
    BreadcrumbPage: "HTMLSpanElement",
    BreadcrumbSeparator: "HTMLLIElement",
  },
  card: {
    Card: "HTMLDivElement",
    CardAction: "HTMLDivElement",
    CardContent: "HTMLDivElement",
    CardDescription: "HTMLDivElement",
    CardFooter: "HTMLDivElement",
    CardHeader: "HTMLDivElement",
    CardTitle: "HTMLDivElement",
  },
  item: {
    Item: "HTMLElement",
    ItemActions: "HTMLDivElement",
    ItemContent: "HTMLDivElement",
    ItemDescription: "HTMLParagraphElement",
    ItemFooter: "HTMLDivElement",
    ItemGroup: "HTMLDivElement",
    ItemHeader: "HTMLDivElement",
    ItemMedia: "HTMLDivElement",
    ItemSeparator: null,
    ItemTitle: "HTMLDivElement",
  },
  prose: { Prose: "HTMLDivElement" },
  table: {
    Table: "HTMLTableElement",
    TableBody: "HTMLTableSectionElement",
    TableCaption: "HTMLTableCaptionElement",
    TableCell: "HTMLTableCellElement",
    TableFoot: "HTMLTableSectionElement",
    TableHead: "HTMLTableCellElement",
    TableHeader: "HTMLTableSectionElement",
    TableRow: "HTMLTableRowElement",
  },
  video: { Video: "HTMLVideoElement | HTMLIFrameElement" },
} as const;

const EXPECTED_GROUPS = {
  breadcrumb: {
    exports: [
      "Breadcrumb",
      "BreadcrumbEllipsis",
      "BreadcrumbItem",
      "BreadcrumbLink",
      "BreadcrumbList",
      "BreadcrumbPage",
      "BreadcrumbSeparator",
    ],
    slots: {
      Breadcrumb: ["default"],
      BreadcrumbEllipsis: ["default", "icon"],
      BreadcrumbItem: ["default"],
      BreadcrumbLink: ["default"],
      BreadcrumbList: ["default"],
      BreadcrumbPage: ["default"],
      BreadcrumbSeparator: ["default"],
    },
    variants: [
      "breadcrumbEllipsis",
      "breadcrumbItem",
      "breadcrumbLink",
      "breadcrumbList",
      "breadcrumbPage",
      "breadcrumbSeparator",
    ],
  },
  card: {
    exports: [
      "Card",
      "CardAction",
      "CardContent",
      "CardDescription",
      "CardFooter",
      "CardHeader",
      "CardTitle",
    ],
    slots: {
      Card: ["default"],
      CardAction: ["default"],
      CardContent: ["default"],
      CardDescription: ["default"],
      CardFooter: ["default"],
      CardHeader: ["default"],
      CardTitle: ["default"],
    },
    variants: [
      "card",
      "cardAction",
      "cardContent",
      "cardDescription",
      "cardFooter",
      "cardHeader",
      "cardTitle",
    ],
  },
  item: {
    exports: [
      "Item",
      "ItemActions",
      "ItemContent",
      "ItemDescription",
      "ItemFooter",
      "ItemGroup",
      "ItemHeader",
      "ItemMedia",
      "ItemSeparator",
      "ItemTitle",
    ],
    slots: {
      Item: ["default"],
      ItemActions: ["default"],
      ItemContent: ["default"],
      ItemDescription: ["default"],
      ItemFooter: ["default"],
      ItemGroup: ["default"],
      ItemHeader: ["default"],
      ItemMedia: ["default"],
      ItemSeparator: [],
      ItemTitle: ["default"],
    },
    variants: [
      "item",
      "itemActions",
      "itemContent",
      "itemDescription",
      "itemFooter",
      "itemGroup",
      "itemHeader",
      "itemMedia",
      "itemSeparator",
      "itemTitle",
    ],
  },
  prose: {
    exports: ["Prose"],
    slots: { Prose: ["default"] },
    variants: ["prose"],
  },
  table: {
    exports: [
      "Table",
      "TableBody",
      "TableCaption",
      "TableCell",
      "TableFoot",
      "TableHead",
      "TableHeader",
      "TableRow",
    ],
    slots: {
      Table: ["default"],
      TableBody: ["default"],
      TableCaption: ["default"],
      TableCell: ["default"],
      TableFoot: ["default"],
      TableHead: ["default"],
      TableHeader: ["default"],
      TableRow: ["default"],
    },
    variants: [
      "table",
      "tableBody",
      "tableCaption",
      "tableCell",
      "tableFoot",
      "tableHead",
      "tableHeader",
      "tableRow",
    ],
  },
  video: {
    exports: ["Video"],
    slots: { Video: [] },
    variants: ["video"],
  },
} as const;

const EXPECTED_DATA_SLOTS = {
  breadcrumb: {
    Breadcrumb: ["breadcrumb"],
    BreadcrumbEllipsis: ["breadcrumb-ellipsis"],
    BreadcrumbItem: ["breadcrumb-item"],
    BreadcrumbLink: ["breadcrumb-link"],
    BreadcrumbList: ["breadcrumb-list"],
    BreadcrumbPage: ["breadcrumb-page"],
    BreadcrumbSeparator: ["breadcrumb-separator"],
  },
  card: {
    Card: ["card"],
    CardAction: ["card-action"],
    CardContent: ["card-content"],
    CardDescription: ["card-description"],
    CardFooter: ["card-footer"],
    CardHeader: ["card-header"],
    CardTitle: ["card-title"],
  },
  item: {
    Item: ["item"],
    ItemActions: ["item-actions"],
    ItemContent: ["item-content"],
    ItemDescription: ["item-description"],
    ItemFooter: ["item-footer"],
    ItemGroup: ["item-group"],
    ItemHeader: ["item-header"],
    ItemMedia: ["item-media"],
    ItemSeparator: ["item-separator"],
    ItemTitle: ["item-title"],
  },
  prose: { Prose: ["prose"] },
  table: {
    Table: ["table-container", "table"],
    TableBody: ["table-body"],
    TableCaption: ["table-caption"],
    TableCell: ["table-cell"],
    TableFoot: ["table-foot"],
    TableHead: ["table-head"],
    TableHeader: ["table-header"],
    TableRow: ["table-row"],
  },
  video: { Video: ["video"] },
} as const;

describe("Vue portable Styled content and media contracts", () => {
  const contracts = GROUPS.map(findContract);

  it("makes every selected group applicable to Vue", () => {
    expect(
      contracts.map((contract) => [contract.component, supportsVueScope(contract.frameworks)]),
    ).toEqual(GROUPS.map((group) => [group, true]));
  });

  it("keeps the public-export, variant, slot, and data-slot inventories in the contract model", () => {
    for (const contract of contracts) {
      const expected = EXPECTED_GROUPS[contract.component as keyof typeof EXPECTED_GROUPS];
      const output = projectStyledOutputComponentGroup(contract);

      expect(contract.publicExports).toEqual(expected.exports);
      expect(contract.components.map(({ exportName }) => exportName).sort()).toEqual(
        [...expected.exports].sort(),
      );
      expect(Object.keys(contract.variants ?? {}).sort()).toEqual([...expected.variants].sort());
      expect(output.publicExports).toEqual(expected.exports);
      expect(output.components.map(({ exportName }) => exportName).sort()).toEqual(
        [...expected.exports].sort(),
      );
      expect(output.variants.map(({ name }) => name).sort()).toEqual([...expected.variants].sort());

      for (const component of contract.components) {
        expect([...new Set(collectSlotNames(component.render))].sort()).toEqual(
          [...expected.slots[component.exportName as keyof typeof expected.slots]].sort(),
        );
        expect([...new Set(collectDataSlots(component.render))]).toEqual(
          EXPECTED_DATA_SLOTS[contract.component as keyof typeof EXPECTED_DATA_SLOTS][
            component.exportName as keyof (typeof EXPECTED_DATA_SLOTS)[keyof typeof EXPECTED_DATA_SLOTS]
          ],
        );
      }
    }
  });

  it("keeps assets, styles, and composed render roots structured in the shared model", () => {
    const breadcrumb = findContract("breadcrumb");
    expect(findComponent(breadcrumb, "BreadcrumbSeparator").imports).toEqual([
      {
        importName: "ChevronRight",
        source: "@tabler/icons/outline/chevron-right.svg",
        type: "default",
      },
    ]);
    expect(findComponent(breadcrumb, "BreadcrumbEllipsis").imports).toEqual([
      { importName: "Dots", source: "@tabler/icons/outline/dots.svg", type: "default" },
    ]);

    const prose = findContract("prose");
    expect(prose.styles?.importFrom).toEqual(["Prose"]);
    expect(projectStyledOutputComponentGroup(prose).styles?.sourceFileName).toBeUndefined();

    const breadcrumbLink = findConditional(findComponent(breadcrumb, "BreadcrumbLink").render);
    expect(breadcrumbLink.then).toEqual([{ type: "slot" }]);
    expect(findElement(breadcrumbLink.else, "a")).toBeDefined();

    const itemSeparator = findComponent(findContract("item"), "ItemSeparator").render[0];
    expect(itemSeparator).toMatchObject({
      component: "separator",
      exportName: "Separator",
      selfClosing: true,
      type: "component",
    });

    const tableRoot = requireFirstElement(
      findComponent(findContract("table"), "Table").render,
      "Table render root",
    );
    expect(tableRoot).toMatchObject({ tag: "div", type: "element" });
    expect(findElement(requireChildren(tableRoot, "Table wrapper"), "table")).toBeDefined();
  });

  it("keeps representative semantic attributes with their owning render roots", () => {
    expect(attributeNames(findComponent(findContract("breadcrumb"), "Breadcrumb").render)).toEqual([
      "data-sw-breadcrumb",
      "aria-label",
      "class",
      "spread",
      "ref",
      "data-slot",
    ]);
    expect(attributeNames(findComponent(findContract("card"), "Card").render)).toEqual([
      "data-sw-card",
      "class",
      "spread",
      "data-size",
      "ref",
      "data-slot",
    ]);
    expect(attributeNames(findComponent(findContract("item"), "Item").render)).toEqual([
      "data-sw-item",
      "class",
      "spread",
      "ref",
      "data-slot",
    ]);
    expect(attributeNames(findComponent(findContract("prose"), "Prose").render)).toEqual([
      "data-sw-prose",
      "class",
      "spread",
      "ref",
      "data-slot",
    ]);
    expect(attributeNames(findComponent(findContract("table"), "Table").render)).toEqual([
      "data-slot",
      "class",
      "class",
      "spread",
      "ref",
      "data-slot",
    ]);
  });

  it("uses the target-neutral semantic root map for exposed element facts", () => {
    expect(collectForwardRefTargets(contracts)).toEqual(EXPECTED_ELEMENT_TARGETS);
  });

  it("retains the established React ref fields as a separate compatibility surface", () => {
    expect(collectReactRefFieldTypes(contracts)).toEqual(
      Object.fromEntries(
        Object.entries(EXPECTED_ELEMENT_TARGETS).map(([group, targets]) => [
          group,
          Object.fromEntries(
            Object.entries(targets).map(([exportName, target]) => [
              exportName,
              target ? `React.Ref<${target}>` : null,
            ]),
          ),
        ]),
      ),
    );
  });

  it("places Video native and iframe facts on their own structured branches", () => {
    const video = findComponent(findContract("video"), "Video");
    const branch = findConditional(video.render);
    const native = findElement(branch.then, "video");
    const iframe = findElement(branch.else, "iframe");
    const nativeAttributes = requireAttributes(native, "Video native branch");
    const iframeAttributes = requireAttributes(iframe, "Video iframe branch");
    const track = findElement(requireChildren(native, "Video native branch"), "track");
    const trackAttributes = requireAttributes(track, "Video track");

    expect(branch.condition).toBe('videoType === "native" || !embedUrl');
    expect(attributeNamesForVue(nativeAttributes)).toEqual([
      "data-sw-video",
      "class",
      "src",
      "autoplay",
      "muted",
      "loop",
      "controls",
      "poster",
      "spread",
      "data-slot",
    ]);
    expect(attributeNamesForVue(iframeAttributes)).toEqual([
      "data-sw-video",
      "class",
      "src",
      "srcdoc",
      "title",
      "allow",
      "referrerpolicy",
      "allowfullscreen",
      "data-video-type",
      "spread",
      "data-slot",
    ]);
    expect(track).toMatchObject({
      selfClosing: true,
      tag: "track",
    });
    expect(attributeNamesForVue(trackAttributes)).toEqual(["kind"]);
    expect(getAttribute(nativeAttributes, "data-slot")?.value).toEqual({
      type: "literal",
      value: "video",
    });
    expect(getAttribute(iframeAttributes, "data-slot")?.value).toEqual({
      type: "literal",
      value: "video",
    });
  });
});

function findContract(component: (typeof GROUPS)[number]): StyledAdapterContract {
  const contract = starwindStyledContracts.find((candidate) => candidate.component === component);
  if (!contract) throw new TypeError(`Missing Styled contract ${component}.`);
  return contract;
}

function findComponent(
  contract: StyledAdapterContract,
  exportName: string,
): StyledComponentContract {
  const component = contract.components.find((candidate) => candidate.exportName === exportName);
  if (!component) throw new TypeError(`Missing ${contract.component}.${exportName}.`);
  return component;
}

function findConditional(
  nodes: readonly RenderNode[],
): Extract<RenderNode, { type: "conditional" }> {
  const node = nodes.find((candidate) => candidate.type === "conditional");
  if (!node || node.type !== "conditional")
    throw new TypeError("Missing conditional render branch.");
  return node;
}

function findElement(
  nodes: readonly RenderNode[],
  tag: string,
): Extract<RenderNode, { type: "element" }> {
  for (const node of nodes) {
    if (node.type === "element" && node.tag === tag) return node;
    if ("children" in node) {
      const child = findElementOrUndefined(node.children ?? [], tag);
      if (child) return child;
    }
    if (node.type === "conditional") {
      const child = findElementOrUndefined([...node.then, ...node.else], tag);
      if (child) return child;
    }
    if (node.type === "slot") {
      const child = findElementOrUndefined(node.fallback ?? [], tag);
      if (child) return child;
    }
  }
  throw new TypeError(`Missing ${tag} render element.`);
}

function findElementOrUndefined(
  nodes: readonly RenderNode[],
  tag: string,
): Extract<RenderNode, { type: "element" }> | undefined {
  try {
    return findElement(nodes, tag);
  } catch {
    return undefined;
  }
}

function requireFirstElement(
  nodes: readonly RenderNode[],
  context: string,
): Extract<RenderNode, { type: "element" }> {
  const node = nodes[0];
  if (!node) throw new TypeError(`${context} is missing.`);
  if (node.type !== "element") throw new TypeError(`${context} must be an element.`);
  return node;
}

function requireAttributes(
  node: Extract<RenderNode, { type: "element" }>,
  context: string,
): AttributeContract[] {
  if (!node.attrs) throw new TypeError(`${context} is missing its attribute list.`);
  return node.attrs;
}

function requireChildren(node: RenderNode, context: string): RenderNode[] {
  if (!("children" in node) || !node.children) {
    throw new TypeError(`${context} is missing its child render nodes.`);
  }
  return node.children;
}

function collectSlotNames(nodes: readonly RenderNode[]): string[] {
  return nodes.flatMap((node) => {
    if (node.type === "slot") {
      return [node.name ?? "default", ...collectSlotNames(node.fallback ?? [])];
    }
    if ("children" in node) return collectSlotNames(node.children ?? []);
    if (node.type === "conditional") return collectSlotNames([...node.then, ...node.else]);
    return [];
  });
}

function collectDataSlots(nodes: readonly RenderNode[]): string[] {
  return nodes.flatMap((node) => {
    const slot = "attrs" in node ? getAttribute(node.attrs ?? [], "data-slot") : undefined;
    const nested = "children" in node ? collectDataSlots(node.children ?? []) : [];
    const conditional =
      node.type === "conditional" ? collectDataSlots([...node.then, ...node.else]) : [];
    const fallback = node.type === "slot" ? collectDataSlots(node.fallback ?? []) : [];
    return [
      ...(slot?.value?.type === "literal" && typeof slot.value.value === "string"
        ? [slot.value.value]
        : []),
      ...nested,
      ...conditional,
      ...fallback,
    ];
  });
}

function getAttribute(
  attributes: readonly AttributeContract[],
  name: string,
): AttributeContract | undefined {
  return attributes.find((attribute) => attribute.name === name);
}

function attributeNamesForVue(attributes: readonly AttributeContract[]): string[] {
  return attributes
    .filter((attribute) => !attribute.frameworks || attribute.frameworks.includes("vue"))
    .map((attribute) => attribute.name);
}

function attributeNames(nodes: readonly RenderNode[]): string[] {
  return nodes.flatMap((node) => {
    const attributes =
      "attrs" in node ? (node.attrs?.map((attribute) => attribute.name) ?? []) : [];
    const children = "children" in node ? attributeNames(node.children ?? []) : [];
    const conditional =
      node.type === "conditional" ? attributeNames([...node.then, ...node.else]) : [];
    const fallback = node.type === "slot" ? attributeNames(node.fallback ?? []) : [];
    return [...attributes, ...children, ...conditional, ...fallback];
  });
}

function collectForwardRefTargets(contracts: readonly StyledAdapterContract[]) {
  return Object.fromEntries(
    contracts.map((contract) => [
      contract.component,
      Object.fromEntries(
        contract.components.map((component) => [
          component.exportName,
          component.forwardRef?.targetType ?? null,
        ]),
      ),
    ]),
  );
}

function collectReactRefFieldTypes(contracts: readonly StyledAdapterContract[]) {
  return Object.fromEntries(
    contracts.map((contract) => [
      contract.component,
      Object.fromEntries(
        contract.components.map((component) => [
          component.exportName,
          component.props?.fields?.find(
            (field) => field.name === "ref" && field.frameworks?.includes("react"),
          )?.type ?? null,
        ]),
      ),
    ]),
  );
}
