import type {
  StyledOutputAttribute,
  StyledOutputComponent,
  StyledOutputComponentGroup,
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

  return `export type ${props.public.name} = ${type};\ntype ${props.declared.name} = {\n${declaredFields}\n} & /* @vue-ignore */ ${props.public.name};`;
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
  const { props, usesAttrs } = projection;
  const slotLines = projection.slots.map(
    (slot) => `  ${JSON.stringify(slot.name)}?: ${slot.signature};`,
  );
  const slots = `defineSlots<{\n${slotLines.join("\n")}\n}>();`;
  const destructuredNames = new Set(props.destructure.map((prop) => prop.name));
  const destructureProps = [
    ...props.destructure,
    ...projection.models
      .filter((model) => !destructuredNames.has(model.name))
      .map((model) => ({
        alias: undefined,
        defaultValue: model.type === "boolean" ? "undefined" : undefined,
        name: model.name,
      })),
  ].map((prop) => {
    const key = renderVuePropKey(prop.name);
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
    emits,
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
        `${primitiveAliases[node.component]}.${toPascalCase(node.component)}${node.part}`,
        node.attrs,
        node.children,
        level,
        primitiveAliases,
      );
    case "element":
      return renderTag(node.tag, node.attrs, node.children, level, primitiveAliases);
    case "fragment":
      return renderNodes(node.children, level, primitiveAliases);
    case "icon":
      return renderIcon(node.importName, node.attrs, level);
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
      return `${pad}<template v-for="${binding} in ${node.each}">\n${renderNodes(
        node.children,
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
    return `v-bind="${expression}"`;
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

function renderIcon(
  importName: string,
  attrs: readonly StyledOutputAttribute[],
  level: number,
): string {
  if (importName === "Sun" || importName === "Moon") {
    return renderThemeIcon(importName, attrs, level);
  }
  const pathData = importName === "ChevronDown" ? "M6 9l6 6l6 -6" : "M5 12l5 5l10 -10";
  const pad = "  ".repeat(level);
  const renderedAttrs = attrs.filter(isForVue).map(renderAttribute);
  return `${pad}<svg\n${[
    'xmlns="http://www.w3.org/2000/svg"',
    'viewBox="0 0 24 24"',
    'fill="none"',
    'stroke="currentColor"',
    'stroke-width="2"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    'aria-hidden="true"',
    ...renderedAttrs,
  ]
    .map((attr) => `${pad}  ${attr}`)
    .join(
      "\n",
    )}\n${pad}>\n${pad}  <path stroke="none" d="M0 0h24v24H0z" fill="none" />\n${pad}  <path d="${pathData}" />\n${pad}</svg>`;
}

function renderThemeIcon(
  importName: "Moon" | "Sun",
  attrs: readonly StyledOutputAttribute[],
  level: number,
): string {
  const pad = "  ".repeat(level);
  const renderedAttrs = attrs.filter(isForVue).map(renderAttribute);
  const paths =
    importName === "Sun"
      ? [
          '<path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />',
          '<path d="M4 12h.01M12 4v.01M20 12h.01M12 20v.01M6.31 6.31l-.01 -.01M17.7 6.3l-.01 .01M17.7 17.7l-.01 -.01M6.3 17.7l.01 -.01" />',
        ]
      : [
          '<path d="M12 3c.132 0 .263 0 .393 .008a7.5 7.5 0 0 0 7.92 12.446a9 9 0 1 1 -8.313 -12.454z" />',
        ];
  return `${pad}<svg\n${[
    'xmlns="http://www.w3.org/2000/svg"',
    'viewBox="0 0 24 24"',
    'fill="none"',
    'stroke="currentColor"',
    'stroke-width="2"',
    'stroke-linecap="round"',
    'stroke-linejoin="round"',
    ...renderedAttrs,
  ]
    .map((attr) => `${pad}  ${attr}`)
    .join("\n")}\n${pad}>\n${paths.map((path) => `${pad}  ${path}`).join("\n")}\n${pad}</svg>`;
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
${renderIcon("ChevronDown", [], 4)}
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
