import type {
  AttributeContract,
  CommentContract,
  DestructurePropContract,
  FrameworkTarget,
  ImportContract,
  LocalVariableContract,
  PropExtendContract,
  PropFieldContract,
  RenderNode,
  StyledAdapterContract,
  StyledComponentContract,
  ValueExpression,
} from "../../contracts/styled/types.js";
import type {
  StyledOutputAttribute,
  StyledOutputComment,
  StyledOutputComponent,
  StyledOutputComponentGroup,
  StyledOutputDestructureProp,
  StyledOutputImport,
  StyledOutputModel,
  StyledOutputPropExtend,
  StyledOutputPropField,
  StyledOutputRenderNode,
  StyledOutputTargetScope,
  StyledOutputValueExpression,
  StyledOutputVariable,
} from "./types.js";

export * from "./analysis.js";
export type * from "./types.js";

export function createStyledOutputModelSkeleton(
  contracts: readonly Pick<StyledAdapterContract, "component">[],
): StyledOutputModel {
  return {
    componentGroups: contracts.map((contract) => ({
      component: contract.component,
      components: [],
      constants: [],
      defaultExport: {
        members: [],
        mode: "parts",
      },
      dependencies: {
        styledComponents: [],
      },
      publicExports: [],
      variantAliases: [],
      variants: [],
    })),
  };
}

export function projectStyledOutputModel(
  contracts: readonly StyledAdapterContract[],
): StyledOutputModel {
  return {
    componentGroups: contracts.map(projectStyledOutputComponentGroup),
  };
}

export function projectStyledOutputComponentGroup(
  contract: StyledAdapterContract,
): StyledOutputComponentGroup {
  return {
    component: contract.component,
    components: contract.components.map(projectStyledOutputComponent),
    constants: Object.entries(contract.constants ?? {}).map(([name, value]) => ({ name, value })),
    defaultExport: {
      members: Object.entries(contract.defaultExport).map(([exportName, localName]) => ({
        exportName,
        localName,
      })),
      mode: contract.defaultExportMode ?? "parts",
    },
    dependencies: {
      styledComponents: [...(contract.dependencies?.styledComponents ?? [])],
    },
    publicExports: [...contract.publicExports],
    styles: contract.styles
      ? {
          content: [...contract.styles.content],
          importFrom: [...contract.styles.importFrom],
          sourceFileName: contract.styles.fileName,
        }
      : undefined,
    targetScopes: projectTargetScopes(contract.frameworks),
    variantAliases: Object.entries(contract.variantAliases ?? {}).map(([name, alias]) => ({
      defaultVariants: alias.defaultVariants ? { ...alias.defaultVariants } : undefined,
      importName: alias.importName,
      localName: alias.localName,
      name,
      source: alias.source,
    })),
    variantCollectionName: contract.variantCollectionName,
    variants: Object.entries(contract.variants ?? {}).map(([name, definition]) => ({
      definition,
      name,
    })),
  };
}

export function toStyledAdapterContract(group: StyledOutputComponentGroup): StyledAdapterContract {
  return {
    component: group.component,
    components: group.components.map(toStyledComponentContract),
    constants:
      group.constants.length > 0
        ? Object.fromEntries(group.constants.map((constant) => [constant.name, constant.value]))
        : undefined,
    defaultExport: Object.fromEntries(
      group.defaultExport.members.map((member) => [member.exportName, member.localName]),
    ),
    defaultExportMode: group.defaultExport.mode === "parts" ? undefined : group.defaultExport.mode,
    dependencies:
      (group.dependencies?.styledComponents ?? []).length > 0
        ? { styledComponents: [...(group.dependencies?.styledComponents ?? [])] }
        : undefined,
    frameworks: toFrameworkTargets(group.targetScopes),
    publicExports: [...group.publicExports],
    styles: group.styles
      ? {
          content: [...group.styles.content],
          fileName: group.styles.sourceFileName,
          importFrom: [...group.styles.importFrom],
        }
      : undefined,
    variantCollectionName: group.variantCollectionName,
    variantAliases:
      (group.variantAliases ?? []).length > 0
        ? Object.fromEntries(
            (group.variantAliases ?? []).map((alias) => [
              alias.name,
              {
                defaultVariants: alias.defaultVariants ? { ...alias.defaultVariants } : undefined,
                importName: alias.importName,
                localName: alias.localName,
                source: alias.source,
              },
            ]),
          )
        : undefined,
    variants:
      group.variants.length > 0
        ? Object.fromEntries(group.variants.map((variant) => [variant.name, variant.definition]))
        : undefined,
  };
}

function projectStyledOutputComponent(component: StyledComponentContract): StyledOutputComponent {
  return {
    client: component.client
      ? {
          effectDependencies: component.client.reactEffectDependencies,
          effects: [...(component.client.reactEffect ?? [])],
          setup: [...(component.client.astroScript ?? [])],
        }
      : undefined,
    destructure: component.destructure
      ? {
          props: component.destructure.props.map(projectDestructureProp),
          rest: component.destructure.rest,
        }
      : undefined,
    exportName: component.exportName,
    forwardRef: component.forwardRef ? { ...component.forwardRef } : undefined,
    imports: (component.imports ?? []).map(projectImport),
    primitiveAliases: Object.entries(component.primitiveAliases ?? {}).map(
      ([primitiveComponent, alias]) => ({
        alias,
        component: primitiveComponent,
      }),
    ),
    props: component.props
      ? {
          declaration: component.props.declaration,
          extends: (component.props.extends ?? []).map(projectPropExtend),
          fields: (component.props.fields ?? []).map(projectPropField),
        }
      : undefined,
    render: component.render.map(projectRenderNode),
    sourceFileName: component.fileName,
    variables: (component.variables ?? []).map(projectVariable),
  };
}

function toStyledComponentContract(component: StyledOutputComponent): StyledComponentContract {
  return {
    client: component.client
      ? {
          astroScript: component.client.setup.length > 0 ? [...component.client.setup] : undefined,
          reactEffect:
            component.client.effects.length > 0 ? [...component.client.effects] : undefined,
          reactEffectDependencies: component.client.effectDependencies,
        }
      : undefined,
    destructure: component.destructure
      ? {
          props: component.destructure.props.map(toDestructureProp),
          rest: component.destructure.rest,
        }
      : undefined,
    exportName: component.exportName,
    fileName: component.sourceFileName,
    forwardRef: component.forwardRef ? { ...component.forwardRef } : undefined,
    imports: component.imports.map(toImport),
    primitiveAliases:
      component.primitiveAliases.length > 0
        ? Object.fromEntries(
            component.primitiveAliases.map((alias) => [alias.component, alias.alias]),
          )
        : undefined,
    props: component.props
      ? {
          declaration: component.props.declaration,
          extends: component.props.extends.map(toPropExtend),
          fields: component.props.fields.map(toPropField),
        }
      : undefined,
    render: component.render.map(toRenderNode),
    variables: component.variables.map(toVariable),
  };
}

function projectPropExtend(propExtend: PropExtendContract): StyledOutputPropExtend {
  const targetScopes = projectTargetScopes(propExtend.frameworks);

  switch (propExtend.type) {
    case "htmlAttributes":
      return {
        element: propExtend.element,
        kind: "element-attributes",
        targetScopes,
      };
    case "omitHtmlAttributes":
      return {
        element: propExtend.element,
        keys: [...propExtend.keys],
        kind: "omit-element-attributes",
        targetScopes,
      };
    case "raw":
      return {
        code: propExtend.code,
        kind: "raw",
        targetScopes,
      };
    case "componentProps":
      return {
        component: propExtend.component,
        exportName: propExtend.exportName,
        keys: [...(propExtend.keys ?? [])],
        kind: "component-props",
        localName: propExtend.localName,
        targetScopes,
      };
    case "variantProps":
      return {
        kind: "variant-props",
        omit: [...(propExtend.omit ?? [])],
        targetScopes,
        variant: propExtend.variant,
      };
  }
}

function toPropExtend(propExtend: StyledOutputPropExtend): PropExtendContract {
  const frameworks = toFrameworkTargets(propExtend.targetScopes);

  switch (propExtend.kind) {
    case "element-attributes":
      return {
        element: propExtend.element,
        frameworks,
        type: "htmlAttributes",
      };
    case "omit-element-attributes":
      return {
        element: propExtend.element,
        frameworks,
        keys: [...propExtend.keys],
        type: "omitHtmlAttributes",
      };
    case "raw":
      return {
        code: propExtend.code,
        frameworks,
        type: "raw",
      };
    case "component-props":
      return {
        component: propExtend.component,
        exportName: propExtend.exportName,
        frameworks,
        keys: propExtend.keys.length > 0 ? [...propExtend.keys] : undefined,
        localName: propExtend.localName,
        type: "componentProps",
      };
    case "variant-props":
      return {
        frameworks,
        omit: (propExtend.omit ?? []).length > 0 ? [...(propExtend.omit ?? [])] : undefined,
        type: "variantProps",
        variant: propExtend.variant,
      };
  }
}

function projectPropField(field: PropFieldContract): StyledOutputPropField {
  return {
    name: field.name,
    optional: Boolean(field.optional),
    targetScopes: projectTargetScopes(field.frameworks),
    type: field.type,
  };
}

function toPropField(field: StyledOutputPropField): PropFieldContract {
  return {
    frameworks: toFrameworkTargets(field.targetScopes),
    name: field.name,
    optional: field.optional || undefined,
    type: field.type,
  };
}

function projectDestructureProp(prop: DestructurePropContract): StyledOutputDestructureProp {
  return {
    alias: prop.alias,
    defaultValue: prop.defaultValue,
    name: prop.name,
    targetScopes: projectTargetScopes(prop.frameworks),
  };
}

function toDestructureProp(prop: StyledOutputDestructureProp): DestructurePropContract {
  return {
    alias: prop.alias,
    defaultValue: prop.defaultValue,
    frameworks: toFrameworkTargets(prop.targetScopes),
    name: prop.name,
  };
}

function projectVariable(variable: LocalVariableContract): StyledOutputVariable {
  return {
    name: variable.name,
    targetScopes: projectTargetScopes(variable.frameworks),
    value: projectValueExpression(variable.value),
  };
}

function toVariable(variable: StyledOutputVariable): LocalVariableContract {
  return {
    frameworks: toFrameworkTargets(variable.targetScopes),
    name: variable.name,
    value: toValueExpression(variable.value),
  };
}

function projectImport(importContract: ImportContract): StyledOutputImport {
  return {
    importName: importContract.importName,
    kind: importContract.type,
    localName: importContract.type === "named" ? importContract.localName : undefined,
    source: importContract.source,
    targetScopes: projectTargetScopes(importContract.frameworks),
  };
}

function toImport(importContract: StyledOutputImport): ImportContract {
  if (importContract.kind === "default") {
    return {
      frameworks: toFrameworkTargets(importContract.targetScopes),
      importName: importContract.importName,
      source: importContract.source,
      type: "default",
    };
  }

  return {
    frameworks: toFrameworkTargets(importContract.targetScopes),
    importName: importContract.importName,
    localName: importContract.localName,
    source: importContract.source,
    type: "named",
  };
}

function projectRenderNode(node: RenderNode): StyledOutputRenderNode {
  switch (node.type) {
    case "component":
      return {
        attrs: (node.attrs ?? []).map(projectAttribute),
        children: (node.children ?? []).map(projectRenderNode),
        component: node.component,
        exportName: node.exportName,
        localName: node.localName,
        selfClosing: Boolean(node.selfClosing),
        type: "component",
      };
    case "conditional":
      return {
        condition: node.condition,
        else: node.else.map(projectRenderNode),
        then: node.then.map(projectRenderNode),
        type: "condition",
      };
    case "element":
      return {
        attrs: (node.attrs ?? []).map(projectAttribute),
        children: (node.children ?? []).map(projectRenderNode),
        comments: (node.leadingComments ?? []).map(projectComment),
        selfClosing: Boolean(node.selfClosing),
        tag: node.tag,
        type: "element",
      };
    case "fragment":
      return {
        children: node.children.map(projectRenderNode),
        type: "fragment",
      };
    case "icon":
      return {
        attrs: (node.attrs ?? []).map(projectAttribute),
        importName: node.importName,
        type: "icon",
      };
    case "primitive":
      return {
        attrs: (node.attrs ?? []).map(projectAttribute),
        children: (node.children ?? []).map(projectRenderNode),
        component: node.component,
        part: node.part,
        selfClosing: Boolean(node.selfClosing),
        type: "primitive",
      };
    case "repeat":
      return {
        children: node.children.map(projectRenderNode),
        each: node.each,
        index: node.index,
        item: node.item,
        type: "repeat",
      };
    case "slot":
      return {
        fallback: (node.fallback ?? []).map(projectRenderNode),
        name: node.name,
        type: "slot",
      };
    case "text":
      return {
        type: "text",
        value: node.value,
      };
  }
}

function toRenderNode(node: StyledOutputRenderNode): RenderNode {
  switch (node.type) {
    case "component":
      return {
        attrs: node.attrs.map(toAttribute),
        children: node.children.map(toRenderNode),
        component: node.component,
        exportName: node.exportName,
        localName: node.localName,
        selfClosing: node.selfClosing || undefined,
        type: "component",
      };
    case "condition":
      return {
        condition: node.condition,
        else: node.else.map(toRenderNode),
        then: node.then.map(toRenderNode),
        type: "conditional",
      };
    case "element":
      return {
        attrs: node.attrs.map(toAttribute),
        children: node.children.map(toRenderNode),
        leadingComments: node.comments.map(toComment),
        selfClosing: node.selfClosing || undefined,
        tag: node.tag,
        type: "element",
      };
    case "fragment":
      return {
        children: node.children.map(toRenderNode),
        type: "fragment",
      };
    case "icon":
      return {
        attrs: node.attrs.map(toAttribute),
        importName: node.importName,
        type: "icon",
      };
    case "primitive":
      return {
        attrs: node.attrs.map(toAttribute),
        children: node.children.map(toRenderNode),
        component: node.component,
        part: node.part,
        selfClosing: node.selfClosing || undefined,
        type: "primitive",
      };
    case "repeat":
      return {
        children: node.children.map(toRenderNode),
        each: node.each,
        index: node.index,
        item: node.item,
        type: "repeat",
      };
    case "slot":
      return {
        fallback: node.fallback.map(toRenderNode),
        name: node.name,
        type: "slot",
      };
    case "text":
      return {
        type: "text",
        value: node.value,
      };
  }
}

function projectAttribute(attribute: AttributeContract): StyledOutputAttribute {
  return {
    name: attribute.name,
    targetScopes: projectTargetScopes(attribute.frameworks),
    value: attribute.value ? projectValueExpression(attribute.value) : undefined,
  } as StyledOutputAttribute;
}

function toAttribute(attribute: StyledOutputAttribute): AttributeContract {
  return {
    frameworks: toFrameworkTargets(attribute.targetScopes),
    name: attribute.name,
    value: attribute.value ? toValueExpression(attribute.value) : undefined,
  } as AttributeContract;
}

function projectComment(comment: CommentContract): StyledOutputComment {
  return {
    targetScopes: projectTargetScopes(comment.frameworks),
    value: comment.value,
  };
}

function toComment(comment: StyledOutputComment): CommentContract {
  return {
    frameworks: toFrameworkTargets(comment.targetScopes),
    value: comment.value,
  };
}

function projectValueExpression(value: ValueExpression): StyledOutputValueExpression {
  switch (value.type) {
    case "classJoin":
      return {
        items: value.items.map(projectValueExpression),
        type: "class-join",
      };
    case "classVariant":
      return {
        args: value.args ? { ...value.args } : undefined,
        type: "class-variant",
        variant: value.variant,
      };
    case "literal":
      return {
        type: "literal",
        value: value.value,
      };
    case "object":
      return {
        entries: Object.fromEntries(
          Object.entries(value.entries).map(([key, entry]) => [key, projectValueExpression(entry)]),
        ),
        type: "object",
      };
    case "raw":
      return {
        code: value.code,
        type: "raw",
      };
    case "template":
      return {
        parts: value.parts.map((part) =>
          typeof part === "string" ? part : projectValueExpression(part),
        ),
        type: "template",
      };
    case "variable":
      return {
        name: value.name,
        type: "variable",
      };
  }
}

function toValueExpression(value: StyledOutputValueExpression): ValueExpression {
  switch (value.type) {
    case "class-join":
      return {
        items: value.items.map(toValueExpression),
        type: "classJoin",
      };
    case "class-variant":
      return {
        args: value.args ? { ...value.args } : undefined,
        type: "classVariant",
        variant: value.variant,
      };
    case "literal":
      return {
        type: "literal",
        value: value.value,
      };
    case "object":
      return {
        entries: Object.fromEntries(
          Object.entries(value.entries).map(([key, entry]) => [key, toValueExpression(entry)]),
        ),
        type: "object",
      };
    case "raw":
      return {
        code: value.code,
        type: "raw",
      };
    case "template":
      return {
        parts: value.parts.map((part) =>
          typeof part === "string" ? part : toValueExpression(part),
        ),
        type: "template",
      };
    case "variable":
      return {
        name: value.name,
        type: "variable",
      };
  }
}

function projectTargetScopes(
  frameworks: readonly FrameworkTarget[] | undefined,
): StyledOutputTargetScope[] | undefined {
  return frameworks ? [...frameworks] : undefined;
}

function toFrameworkTargets(
  targetScopes: readonly StyledOutputTargetScope[] | undefined,
): FrameworkTarget[] | undefined {
  return targetScopes ? (targetScopes as FrameworkTarget[]) : undefined;
}
