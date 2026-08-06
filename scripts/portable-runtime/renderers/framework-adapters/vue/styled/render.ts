import type {
  StyledOutputAttribute,
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputIconNode,
  StyledOutputPropExtend,
  StyledOutputRenderNode,
  StyledOutputValueExpression,
} from "../../../styled-output-model/index.js";
import { renderVueComputedExpression, renderVueExpression } from "./expressions.js";
import { renderVueImports } from "./imports.js";
import { projectVueStyledComponent } from "./projection.js";
import { getVueNativeAttributesType } from "./public-contracts.js";
import { renderVuePropKey } from "./props.js";
import { renderExposedRef } from "./ref-bridges.js";
import { escapeVueAttribute, toVueAttributeName } from "./render-tree.js";
import { supportsVueScope } from "./scope.js";
import { serializeVueSfc, type VueSfcSections } from "./serialization.js";
import type {
  RenderVueComponentOptions,
  VuePropsProjection,
  VueStyledComponentProjection,
} from "./types.js";

export type { RenderVueComponentOptions } from "./types.js";

export function renderVueComponent(
  group: StyledOutputComponentGroup,
  component: StyledOutputComponent,
  options: RenderVueComponentOptions,
): string {
  const projection = projectVueStyledComponent(group, component, options);
  if (projection.specialization.kind === "alert-dialog-as-child") {
    return serializeVueSfc(projectAlertDialogAsChildSfc(projection));
  }
  if (projection.specialization.kind === "dialog-as-child") {
    return serializeVueSfc(projectDialogAsChildSfc(projection));
  }
  if (projection.specialization.kind === "select-trigger") {
    return serializeVueSfc(projectSelectTriggerSfc(projection));
  }
  if (projection.specialization.kind === "select-value") {
    return serializeVueSfc(projectSelectValueSfc(projection));
  }

  validateRootBindings(projection);
  const template = renderNodes(projection.render, 1, projection.imports.primitiveAliases);
  const imports = renderVueImports(projection.imports);
  const props = renderProps(projection.props);
  const exposedRefs = projection.exposedRefs.map(renderExposedRef);
  const setup = `${renderSetup(projection)}${
    exposedRefs.length ? `\n${exposedRefs.join("\n\n")}` : ""
  }${projection.setup.length ? `\n\n${projection.setup.join("\n\n")}` : ""}`;
  const optionsDeclaration = projection.manuallyForwardsAttrs
    ? "defineOptions({ inheritAttrs: false });\n\n"
    : "";
  return serializeVueSfc({ imports, options: optionsDeclaration, props, setup, template });
}

function projectAlertDialogAsChildSfc(projection: VueStyledComponentProjection): VueSfcSections {
  if (projection.specialization.kind !== "alert-dialog-as-child") {
    throw new TypeError("Alert Dialog asChild serialization requires its typed specialization.");
  }
  const { part } = projection.specialization;
  const exposedRef = projection.exposedRefs[0];
  if (exposedRef?.bridge !== "specialized" || !exposedRef.elementTypes[0]) {
    throw new TypeError(`Alert Dialog ${part} requires its projected exposed element ref.`);
  }
  if (!projection.rootBindings.some(({ attribute }) => attribute === "ref")) {
    throw new TypeError(`Alert Dialog ${part} requires its projected root ref binding.`);
  }

  const isTrigger = part === "Trigger";
  const primitiveSource = projection.imports.primitiveSources["alert-dialog"];
  if (isTrigger && !primitiveSource) {
    throw new TypeError("Alert Dialog Trigger requires its Primitive import.");
  }
  const baseImports = renderVueImports(projection.imports, { includeFramework: false });
  const componentName = `AlertDialog${part}`;
  const props = isTrigger
    ? `const {
  asChild = false,
  targetId,
  class: className,
} = defineProps<${projection.props.declared.name}>();`
    : `const {
  asChild = false,
  variant = ${part === "Action" ? '"default"' : '"outline"'},
  size = "md",
  class: className,
} = defineProps<${projection.props.declared.name}>();`;
  const imports = `import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  mergeProps,
  nextTick,
  ref,
  useAttrs,
  type VNode,
} from "vue";
${baseImports}`;
  const classExpression = isTrigger
    ? "className"
    : `alertDialog${part}AsChild({ variant: variant as never, size: size as never, class: className })`;
  const protectedProps = isTrigger
    ? `        "data-slot": "alert-dialog-trigger",
        "data-sw-alert-dialog-target-id": targetId,
        "data-sw-alert-dialog-trigger": "",
        "data-sw-part": "trigger",`
    : `        "data-slot": "alert-dialog-${part.toLowerCase()}",
        "data-sw-alert-dialog-close": "",
        "data-sw-part": "close",`;
  const normalTemplate = isTrigger
    ? `<AlertDialogPrimitive.AlertDialogTrigger
    v-else
    :ref="setElement"
    :class="mergedClass as import('vue').ClassValue"
    :target-id="targetId"
    v-bind="forwardedAttrs"
    data-slot="alert-dialog-trigger"
  >
    <slot />
  </AlertDialogPrimitive.AlertDialogTrigger>`
    : `<Button
    v-else
    :ref="setElement"
    :variant="variant"
    :size="size"
    :class="alertDialog${part}({ class: className }) as never"
    v-bind="forwardedAttrs"
    data-slot="alert-dialog-${part.toLowerCase()}"
    data-sw-alert-dialog-close
  >
    <slot />
  </Button>`;
  const setup = `${props}
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const forwardedAttrs = computed(() => ({ ...attrs, class: undefined }));
const element = ref<HTMLElement | null>(null);
const mergedClass = computed(() => ${classExpression});
let pendingComponentRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;

${projection.setup.join("\n")}

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingComponentRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingComponentRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingComponentRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}

const AsChild${part} = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError(
          "${componentName} asChild requires exactly one native element VNode.",
        );
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
${protectedProps}
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});`;

  return {
    imports,
    options: "defineOptions({ inheritAttrs: false });\n\n",
    props: renderProps(projection.props),
    setup,
    template: `  <AsChild${part} v-if="asChild" />
  ${normalTemplate}`,
  };
}

function projectDialogAsChildSfc(projection: VueStyledComponentProjection): VueSfcSections {
  if (projection.specialization.kind !== "dialog-as-child") {
    throw new TypeError("Dialog asChild serialization requires its typed specialization.");
  }
  const { family, part } = projection.specialization;
  const primitiveComponent = family === "Dialog" ? "dialog" : "drawer";
  const dataPrefix = family === "Dialog" ? "dialog" : "drawer";
  const slotPrefix = family.toLowerCase();
  const exposedRef = projection.exposedRefs[0];
  if (exposedRef?.bridge !== "specialized" || !exposedRef.elementTypes[0]) {
    throw new TypeError(`${family} ${part} requires its projected exposed element ref.`);
  }
  if (!projection.rootBindings.some(({ attribute }) => attribute === "ref")) {
    throw new TypeError(`${family} ${part} requires its projected root ref binding.`);
  }
  const primitiveSource = projection.imports.primitiveSources[primitiveComponent];
  if (!primitiveSource) throw new TypeError(`${family} ${part} requires its Primitive import.`);

  const baseImports = renderVueImports(projection.imports, { includeFramework: false });
  const componentName = `${family}${part}`;
  const primitivePartName = `${family === "Dialog" ? "Dialog" : "Drawer"}${part}`;
  const props =
    part === "Trigger"
      ? `const {
  asChild = false,
  targetId,
  class: className,
} = defineProps<${projection.props.declared.name}>();`
      : `const { asChild = false, class: className } =
  defineProps<${projection.props.declared.name}>();`;
  const targetProp =
    part === "Trigger" ? `\n        "data-sw-${dataPrefix}-target-id": targetId,` : "";
  const primitiveTarget = part === "Trigger" ? `\n    :target-id="targetId"` : "";
  const fallback = part === "Close" ? " Close " : "";

  const imports = `import {
  type ButtonHTMLAttributes,
  type ComponentPublicInstance,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  mergeProps,
  nextTick,
  ref,
  useAttrs,
  type VNode,
} from "vue";
${baseImports}`;
  const setup = `${props}
const slots = defineSlots<{ default?: () => VNode[] }>();
const attrs = useAttrs();
const element = ref<HTMLElement | null>(null);
const mergedClass = computed(() => className);
let pendingPrimitiveRef: ({ element?: HTMLElement | null } & ComponentPublicInstance) | null = null;

${projection.setup.join("\n")}

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof HTMLElement) {
    pendingPrimitiveRef = null;
    element.value = value;
    return;
  }
  const exposed = value as ({ element?: HTMLElement | null } & ComponentPublicInstance) | null;
  pendingPrimitiveRef = exposed;
  element.value = exposed?.element instanceof HTMLElement ? exposed.element : null;
  if (!exposed || element.value) return;

  void nextTick(() => {
    if (pendingPrimitiveRef !== exposed) return;
    element.value = exposed.element instanceof HTMLElement ? exposed.element : null;
  });
}

const AsChild${part} = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError(
          "${componentName} asChild requires exactly one native element VNode.",
        );
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: mergedClass.value });
      const protectedProps = {
        "data-slot": "${slotPrefix}-${part.toLowerCase()}",
        "data-sw-${dataPrefix}-${part.toLowerCase()}": "",${targetProp}
        "data-sw-part": "${part.toLowerCase()}",
        ref: setElement,
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});`;
  const template = `  <AsChild${part} v-if="asChild" />
  <${family}Primitive.${primitivePartName}
    v-else
    :ref="setElement"
    :class="mergedClass as import('vue').ClassValue"${primitiveTarget}
    v-bind="attrs"
    data-slot="${slotPrefix}-${part.toLowerCase()}"
  >
    <slot>${fallback}</slot>
  </${family}Primitive.${primitivePartName}>`;

  return {
    imports,
    options: "defineOptions({ inheritAttrs: false });\n\n",
    props: renderProps(projection.props),
    setup,
    template,
  };
}

function renderProps(props: VuePropsProjection): string {
  const ownedKeys = [...new Set(props.public.fields.map((field) => field.name))].sort();
  const extendsParts = props.public.extends.map((propExtend) =>
    renderPropExtend(propExtend, ownedKeys),
  );
  const fields = props.public.fields.map(
    (field) => `  ${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`,
  );
  const body = fields.length ? `{\n${fields.join("\n")}\n}` : "{}";
  const type = [...extendsParts, body].filter((part) => part !== "{}").join(" & ") || "{}";
  const declaredFields = props.declared.fields
    .map((field) => `  ${JSON.stringify(field.name)}${field.optional ? "?" : ""}: ${field.type};`)
    .join("\n");

  const publicExtensionType = props.declared.replacedPublicSourceFields.length
    ? `Omit<${props.public.name}, ${props.declared.replacedPublicSourceFields
        .map((name) => JSON.stringify(name))
        .join(" | ")}>`
    : props.public.name;
  const publicExtension = props.declared.extendsPublic
    ? ` & /* @vue-ignore */ ${publicExtensionType}`
    : "";
  return `export type ${props.public.name} = ${type};\ntype ${props.declared.name} = {\n${declaredFields}\n}${publicExtension};`;
}

function renderPropExtend(
  propExtend: StyledOutputPropExtend,
  ownedKeys: readonly string[],
): string {
  switch (propExtend.kind) {
    case "element-attributes":
      return renderOmit(getVueNativeAttributesType(propExtend.element), ownedKeys);
    case "omit-element-attributes":
      return renderOmit(
        getVueNativeAttributesType(propExtend.element),
        [...new Set([...ownedKeys, ...propExtend.keys])].sort(),
      );
    case "component-props": {
      const name = propExtend.localName ?? propExtend.exportName;
      const base = `InstanceType<typeof ${name}>["$props"]`;
      return propExtend.keys.length
        ? `Omit<${base}, ${propExtend.keys.map((key) => JSON.stringify(key)).join(" | ")}>`
        : base;
    }
    case "raw":
      return propExtend.code;
    case "variant-props": {
      const base = `VariantProps<typeof ${propExtend.variant}>`;
      return propExtend.omit?.length
        ? `Omit<${base}, ${propExtend.omit.map((key) => JSON.stringify(key)).join(" | ")}>`
        : base;
    }
  }
}

function renderOmit(type: string, keys: readonly string[]): string {
  return keys.length
    ? `Omit<${type}, ${keys.map((key) => JSON.stringify(key)).join(" | ")}>`
    : type;
}

function renderSetup(projection: VueStyledComponentProjection): string {
  const { filtersComponentAttrs, props, usesAttrs } = projection;
  const slotLines = projection.slots.map(
    (slot) => `  ${JSON.stringify(slot.name)}?: ${slot.signature};`,
  );
  const slots = `defineSlots<{\n${slotLines.join("\n")}\n}>();`;
  const destructuredNames = new Set(props.destructure.map((prop) => prop.name));
  const projectedDestructureProps = [
    ...props.destructure.map((prop) => {
      const model = projection.models.find((candidate) => candidate.name === prop.name);
      return model?.type === "boolean" && prop.defaultValue === undefined
        ? { ...prop, defaultValue: "undefined" }
        : prop;
    }),
    ...projection.models
      .filter((model) => !destructuredNames.has(model.name))
      .map((model) => ({
        alias: undefined,
        defaultValue: model.type === "boolean" ? "undefined" : undefined,
        name: model.name,
      })),
  ];
  const propBindings = new Set(projectedDestructureProps.map((prop) => prop.alias ?? prop.name));
  const dependentBindings = new Set(
    projectedDestructureProps
      .filter((prop) => prop.defaultValue !== undefined && propBindings.has(prop.defaultValue))
      .map((prop) => prop.alias ?? prop.name),
  );
  const dependentDefaults = projectedDestructureProps.flatMap((prop, index) => {
    const binding = prop.alias ?? prop.name;
    if (!prop.defaultValue || !dependentBindings.has(binding)) return [];
    const source = dependentBindings.has(prop.defaultValue)
      ? `${prop.defaultValue}.value`
      : prop.defaultValue;
    return [
      {
        binding,
        declaration: `const ${binding} = computed(() => __vueDependentProp${index} === undefined ? ${source} : __vueDependentProp${index});`,
        index,
      },
    ];
  });
  const dependentDefaultsByBinding = new Map(
    dependentDefaults.map((entry) => [entry.binding, entry]),
  );
  const destructureProps = projectedDestructureProps.map((prop) => {
    const key = renderVuePropKey(prop.name);
    const binding = prop.alias ?? prop.name;
    const dependentDefault = dependentDefaultsByBinding.get(binding);
    if (dependentDefault) {
      return `  ${key}: __vueDependentProp${dependentDefault.index},`;
    }
    const alias = prop.alias && prop.alias !== prop.name ? `: ${prop.alias}` : "";
    return `  ${key}${alias}${prop.defaultValue ? ` = ${prop.defaultValue}` : ""},`;
  });
  const propsDeclaration = destructureProps.length
    ? `const {\n${destructureProps.join("\n")}\n} = defineProps<${projection.props.declared.name}>();`
    : `defineProps<${projection.props.declared.name}>();`;
  const modelEmits = projection.models.map((model) => ({
    name: model.updateEvent,
    parameters: [{ name: "value", type: model.type }],
  }));
  const emits =
    projection.emits.length || modelEmits.length
      ? `const emit = defineEmits<{\n${[...projection.emits, ...modelEmits]
          .map(
            (event) =>
              `  ${JSON.stringify(event.name)}: [${event.parameters
                .map((parameter) => `${parameter.name}: ${parameter.type}`)
                .join(", ")}];`,
          )
          .join("\n")}\n}>();`
      : "";
  const eventHandlers = projection.emits
    .map(
      (event) =>
        `function ${event.handlerName}(${event.parameters
          .map((parameter) => `${parameter.name}: ${parameter.type}`)
          .join(", ")}): void {\n  emit(${JSON.stringify(event.name)}, ${event.parameters
          .map((parameter) => parameter.name)
          .join(", ")});\n}`,
    )
    .join("\n\n");
  const variables = projection.computed
    .map((variable) => {
      const expression = renderVueComputedExpression(variable.expression);
      return `const ${variable.name} = computed(() => ${expression});`;
    })
    .join("\n");

  return [
    propsDeclaration,
    slots,
    ...(usesAttrs ? ["const attrs = useAttrs();"] : []),
    ...(filtersComponentAttrs
      ? [
          `function omitForwardedAttrs(
  source: Readonly<Record<string, unknown>>,
  ownedNames: readonly string[],
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(source).filter(([name]) => !ownedNames.includes(name)),
  );
}`,
        ]
      : []),
    emits,
    ...dependentDefaults.map((entry) => entry.declaration),
    variables,
    eventHandlers,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderNodes(
  nodes: readonly StyledOutputRenderNode[],
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  return nodes.map((node) => renderNode(node, level, primitiveAliases)).join("\n");
}

function renderNode(
  node: StyledOutputRenderNode,
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const pad = "  ".repeat(level);
  switch (node.type) {
    case "component":
      return renderTag(
        node.localName ?? node.exportName,
        node.attrs,
        node.children,
        level,
        primitiveAliases,
      );
    case "primitive":
      return renderTag(
        `${primitiveAliases[node.component]}.${renderPrimitiveExportName(node.component, node.part)}`,
        node.attrs,
        node.children,
        level,
        primitiveAliases,
      );
    case "element":
      return node.tagBinding
        ? renderTag(
            "component",
            [
              {
                name: "is",
                value: { name: node.tag, type: "variable" },
              },
              ...node.attrs,
            ],
            node.children,
            level,
            primitiveAliases,
          )
        : renderTag(node.tag, node.attrs, node.children, level, primitiveAliases);
    case "fragment":
      return renderNodes(node.children, level, primitiveAliases);
    case "icon":
      return renderIcon(node, level);
    case "condition":
      return `${pad}<template v-if="${escapeVueAttribute(node.condition)}">\n${renderNodes(
        node.then,
        level + 1,
        primitiveAliases,
      )}\n${pad}</template>${
        node.else.length
          ? `\n${pad}<template v-else>\n${renderNodes(
              node.else,
              level + 1,
              primitiveAliases,
            )}\n${pad}</template>`
          : ""
      }`;
    case "repeat": {
      const binding = node.index ? `(${node.item}, ${node.index})` : node.item;
      const keyAttribute =
        node.children.length === 1 && "attrs" in node.children[0]!
          ? node.children[0]!.attrs.find(
              (attribute) => attribute.name === "key" && isForVue(attribute),
            )
          : undefined;
      const children = keyAttribute
        ? node.children.map((child) =>
            "attrs" in child
              ? { ...child, attrs: child.attrs.filter((attribute) => attribute !== keyAttribute) }
              : child,
          )
        : node.children;
      const key = keyAttribute ? ` ${renderAttribute(keyAttribute)}` : "";
      return `${pad}<template v-for="${binding} in ${node.each}"${key}>\n${renderNodes(
        children,
        level + 1,
        primitiveAliases,
      )}\n${pad}</template>`;
    }
    case "slot": {
      const name = node.name ? ` name="${node.name}"` : "";
      if (!node.fallback.length) return `${pad}<slot${name} />`;
      return `${pad}<slot${name}>\n${renderNodes(
        node.fallback,
        level + 1,
        primitiveAliases,
      )}\n${pad}</slot>`;
    }
    case "text":
      return `${pad}${renderText(node.value)}`;
  }
}

function renderPrimitiveExportName(component: string, part: string): string {
  if (component === "sidebar" && part === "Sidebar") return "SidebarComponent";
  return `${toPascalCase(component)}${part}`;
}

function renderTag(
  tag: string,
  attrs: readonly StyledOutputAttribute[],
  children: readonly StyledOutputRenderNode[],
  level: number,
  primitiveAliases: Record<string, string>,
): string {
  const pad = "  ".repeat(level);
  const renderedAttrs = attrs.filter(isForVue).map(renderAttribute);
  const open = renderedAttrs.length
    ? `${pad}<${tag}\n${renderedAttrs.map((attr) => `${pad}  ${attr}`).join("\n")}\n${pad}>`
    : `${pad}<${tag}>`;
  if (!children.length) return `${open.slice(0, -1)} />`;
  return `${open}\n${renderNodes(children, level + 1, primitiveAliases)}\n${pad}</${tag}>`;
}

function renderAttribute(attribute: StyledOutputAttribute): string {
  if (attribute.name === "spread") {
    if (!attribute.value) {
      throw new Error("Vue Styled spread attributes require a value expression.");
    }
    const expression =
      attribute.value.type === "variable" && attribute.value.name === "rest"
        ? "attrs"
        : renderVueExpression(attribute.value);
    return `v-bind="${escapeVueAttribute(expression)}"`;
  }
  if (!attribute.value) return attribute.name;
  if (attribute.name.startsWith("@")) {
    return `${attribute.name}="${escapeVueAttribute(renderValue(attribute.value))}"`;
  }
  const name = toVueAttributeName(attribute.name);
  if (attribute.value.type === "literal" && typeof attribute.value.value === "string") {
    return `${name}=${JSON.stringify(attribute.value.value)}`;
  }
  return `:${name}="${escapeVueAttribute(renderValue(attribute.value))}"`;
}

function renderValue(value: StyledOutputValueExpression): string {
  return renderVueExpression(value);
}

export function renderIcon(icon: StyledOutputIconNode, level: number): string {
  if (!icon.asset) {
    throw new TypeError(`Vue Styled icon ${icon.importName} requires a projected SVG asset.`);
  }
  const asset = icon.asset;
  const pad = "  ".repeat(level);
  const renderedAttrs = icon.attrs
    .filter((attribute) => !asset.omittedAttributes?.includes(attribute.name))
    .filter(isForVue)
    .map(renderAttribute);
  return `${pad}<svg\n${[...asset.attributes.map(renderSvgAttribute), ...renderedAttrs]
    .map((attr) => `${pad}  ${attr}`)
    .join("\n")}\n${pad}>\n${asset.children
    .map(
      (child) => `${pad}  <${child.tag} ${child.attributes.map(renderSvgAttribute).join(" ")} />`,
    )
    .join("\n")}\n${pad}</svg>`;
}

function renderSvgAttribute({ name, value }: { name: string; value: string }): string {
  return `${name}=${JSON.stringify(value)}`;
}

function projectSelectTriggerSfc(projection: VueStyledComponentProjection): VueSfcSections {
  if (projection.specialization.kind !== "select-trigger") {
    throw new TypeError("Select Trigger serialization requires its typed specialization.");
  }
  const exposedRef = projection.exposedRefs[0];
  if (exposedRef?.bridge !== "specialized" || !exposedRef.elementTypes[0]) {
    throw new TypeError("Select Trigger requires its projected exposed element ref.");
  }
  if (!projection.rootBindings.some(({ attribute }) => attribute === "ref")) {
    throw new TypeError("Select Trigger requires its projected root ref binding.");
  }
  const elementType = exposedRef.elementTypes[0];
  const icon = findProjectedIcon(projection.render);
  const baseImports = renderVueImports(projection.imports, { includeFramework: false });
  const primitiveSource = projection.imports.primitiveSources.select;
  if (!primitiveSource)
    throw new TypeError("Select Trigger requires its projected primitive import.");

  const imports = `import {
  type ButtonHTMLAttributes,
  cloneVNode,
  computed,
  defineComponent,
  isVNode,
  mergeProps,
  ref,
  useAttrs,
  type ComponentPublicInstance,
  type VNode,
} from "vue";
import { useSelectContext } from ${JSON.stringify(primitiveSource)};
${baseImports}`;
  const setup = `const {
  asChild = false,
  class: className,
  iconClass: iconClassName,
  placeholder,
  showIcon = true,
  size = "md",
  valueClass: valueClassName,
} = defineProps<${projection.props.declared.name}>();
const slots = defineSlots<{ ${projection.slots
    .map((slot) => `${slot.name}?: ${slot.signature};`)
    .join(" ")} }>();
const attrs = useAttrs();
const select = useSelectContext(${JSON.stringify(projection.specialization.contextName)});
const element = ref<${elementType} | null>(null);
const triggerClass = computed(() => selectTrigger({ size, class: className }));

${projection.setup.join("\n")}

function setElement(value: Element | ComponentPublicInstance | null): void {
  if (value instanceof ${elementType}) {
    element.value = value;
    return;
  }
  const exposed = (value as { element?: HTMLElement | null } | null)?.element;
  element.value = exposed instanceof ${elementType} ? exposed : null;
}

const AsChildTrigger = defineComponent({
  inheritAttrs: false,
  setup() {
    return () => {
      const children = slots.default?.() ?? [];
      const child = children[0];
      if (children.length !== 1 || !isVNode(child) || typeof child.type !== "string") {
        throw new TypeError(
          "SelectTrigger asChild requires exactly one native element VNode.",
        );
      }

      const defaultedProps =
        child.type === "button" && child.props?.type === undefined ? { type: "button" } : {};
      const consumerProps = mergeProps(attrs, { class: triggerClass.value });
      const protectedProps = {
        "aria-disabled": select.disabled.value ? "true" : undefined,
        "aria-expanded": select.open.value,
        "aria-haspopup": "listbox",
        "aria-readonly": select.readOnly.value,
        "aria-required": select.required.value,
        "data-disabled": select.disabled.value ? "" : undefined,
        "data-slot": "select-trigger",
        "data-state": select.open.value ? "open" : "closed",
        "data-sw-part": "trigger",
        "data-sw-select-trigger": "",
        disabled: child.type === "button" && select.disabled.value ? true : undefined,
        ref: setElement,
        role: "combobox",
      };
      return cloneVNode(child, mergeProps(defaultedProps, consumerProps, protectedProps), true);
    };
  },
});`;
  const template = `  <AsChildTrigger v-if="asChild" />
  <SelectPrimitive.SelectTrigger
    v-else
    :ref="setElement"
    v-bind="attrs"
    :class="triggerClass"
    data-slot="select-trigger"
  >
    <slot>
      <SelectPrimitive.SelectValue
        :class="selectValue({ class: valueClassName })"
        :placeholder="placeholder"
        data-slot="select-value"
      />
    </slot>
    <SelectPrimitive.SelectIcon
      v-if="showIcon"
      :class="['text-muted-foreground pointer-events-none size-4', iconClassName]
        .filter(Boolean)
        .join(' ')"
      data-slot="select-icon"
    >
      <slot name="icon">
${renderIcon(icon, 4)}
      </slot>
    </SelectPrimitive.SelectIcon>
  </SelectPrimitive.SelectTrigger>`;
  return {
    imports,
    options: "defineOptions({ inheritAttrs: false });\n\n",
    props: renderProps(projection.props),
    setup,
    template,
  };
}

function findProjectedIcon(nodes: readonly StyledOutputRenderNode[]): StyledOutputIconNode {
  for (const node of nodes) {
    if (node.type === "icon") return node;
    if (node.type === "condition") {
      try {
        return findProjectedIcon([...node.then, ...node.else]);
      } catch {
        continue;
      }
    }
    if (node.type === "slot") {
      try {
        return findProjectedIcon(node.fallback);
      } catch {
        continue;
      }
    }
    if ("children" in node) {
      try {
        return findProjectedIcon(node.children);
      } catch {
        continue;
      }
    }
  }
  throw new TypeError("Vue Styled specialization requires a projected SVG icon.");
}

function projectSelectValueSfc(projection: VueStyledComponentProjection): VueSfcSections {
  if (projection.specialization.kind !== "select-value") {
    throw new TypeError("Select Value serialization requires its typed specialization.");
  }
  const imports = renderVueImports(projection.imports);
  const defaultSlot = projection.slots[0];
  if (!defaultSlot) throw new TypeError("Select Value requires a projected default slot.");
  const setup = `const { class: className, placeholder } = defineProps<${projection.props.declared.name}>();
defineSlots<{
  ${defaultSlot.name}?: ${defaultSlot.signature};
}>();
const attrs = useAttrs();`;
  const template = `  <SelectPrimitive.SelectValue
    v-if="$slots.default"
    :class="selectValue({ class: className })"
    :placeholder="placeholder"
    v-bind="attrs"
    data-slot="select-value"
  >
    <template #default="slotProps">
      <slot v-bind="slotProps" />
    </template>
  </SelectPrimitive.SelectValue>
  <SelectPrimitive.SelectValue
    v-else
    :class="selectValue({ class: className })"
    :placeholder="placeholder"
    v-bind="attrs"
    data-slot="select-value"
  />`;
  return {
    imports,
    options: "defineOptions({ inheritAttrs: false });\n\n",
    props: renderProps(projection.props),
    setup,
    template,
  };
}

function renderText(value: string): string {
  const expression = /^\{(.+)\}$/.exec(value.trim())?.[1];
  return expression ? `{{ ${expression} }}` : value;
}

function validateRootBindings(projection: VueStyledComponentProjection): void {
  for (const binding of projection.rootBindings) {
    if (!nodesContainAttribute(projection.render, binding.attribute)) {
      throw new Error(
        `Vue Styled projection for ${projection.exportName} is missing ${binding.attribute} on ${binding.target}.`,
      );
    }
  }
}

function nodesContainAttribute(
  nodes: readonly StyledOutputRenderNode[],
  attributeName: string,
): boolean {
  return nodes.some((node) => {
    if ("attrs" in node && node.attrs.some((attribute) => attribute.name === attributeName)) {
      return true;
    }
    if ("children" in node && nodesContainAttribute(node.children, attributeName)) return true;
    if (node.type === "condition") {
      return (
        nodesContainAttribute(node.then, attributeName) ||
        nodesContainAttribute(node.else, attributeName)
      );
    }
    if (node.type === "slot") return nodesContainAttribute(node.fallback, attributeName);
    return false;
  });
}

function isForVue(value: { targetScopes?: readonly string[] }): boolean {
  return supportsVueScope(value.targetScopes);
}

function toPascalCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("");
}
