export type StyledFrameworkTarget = "astro" | "react";

export type FrameworkAvailabilityStatus =
  | "available"
  | "framework-native"
  | "not-yet-ported"
  | "planned"
  | "unsupported";

export type DocsPageStatus = "published" | "planned" | "missing";

export type ComponentGroupId =
  | "form-input"
  | "navigation"
  | "overlay-disclosure"
  | "feedback-status"
  | "layout-structure"
  | "content-media";

export type BehaviorFoundationType =
  | "direct-primitive"
  | "renamed-primitive"
  | "composite"
  | "mixed-conditional"
  | "styled-only";

export type DocsPageMetadata = {
  readonly status: DocsPageStatus;
  readonly path: string;
};

export type FrameworkAvailability = {
  readonly status: FrameworkAvailabilityStatus;
  readonly reason?: string;
};

export type RuntimeFactoryMetadata = {
  readonly primitiveId: string;
  readonly factory: string;
  readonly importSource: string;
};

export type RuntimeExportReferenceMetadata = {
  readonly exportName: string;
  readonly importSource: string;
  readonly signature: string;
  readonly docsPath: string;
};

export type RuntimeInitStarwindMetadata = RuntimeExportReferenceMetadata & {
  readonly cleanupMethod: "destroy()";
};

export type RuntimeFactoryReferenceMetadata = PrimitiveRuntimeMetadata & {
  readonly docsPath: string;
  readonly optionProps: readonly string[];
  readonly stateModels: readonly PrimitiveStateModelMetadata[];
  readonly events: readonly PrimitiveEventMetadata[];
  readonly setters: readonly PrimitiveSetterMetadata[];
};

export type RuntimeRawHtmlInitializerMetadata = {
  readonly cleanupOrder: number;
  readonly factory: string;
  readonly primitiveId?: string;
  readonly rootDiscoveryAttribute?: string;
  readonly selector: string;
  readonly once: boolean;
  readonly notes: readonly string[];
};

export type RuntimeAttributeConventionMetadata = {
  readonly prefix: string;
  readonly purpose: string;
  readonly examples: readonly string[];
};

export type RuntimeRawHtmlMetadata = {
  readonly docsPath: string;
  readonly initializers: readonly RuntimeRawHtmlInitializerMetadata[];
  readonly attributeConventions: readonly RuntimeAttributeConventionMetadata[];
  readonly adapterComparison: readonly {
    readonly surface: "Raw HTML" | "Astro Primitive adapters" | "React Primitive adapters";
    readonly importSource?: string;
    readonly responsibility: string;
  }[];
};

export type RuntimeThemeMetadata = {
  readonly docsPath: string;
  readonly helpers: readonly RuntimeExportReferenceMetadata[];
  readonly controlSelectors: readonly string[];
  readonly controlAttributes: readonly string[];
  readonly events: readonly {
    readonly name: string;
    readonly detailsType: string;
  }[];
};

export type RuntimeDocsMetadata = {
  readonly packageName: "@starwind-ui/runtime";
  readonly docsPage: DocsPageMetadata;
  readonly initStarwind: RuntimeInitStarwindMetadata;
  readonly rawHtml: RuntimeRawHtmlMetadata;
  readonly factories: readonly RuntimeFactoryReferenceMetadata[];
  readonly theme: RuntimeThemeMetadata;
};

export type StylingSectionId =
  | "theme-tokens"
  | "component-variants"
  | "state-styling"
  | "slots-anatomy"
  | "framework-style-layers"
  | "customization-recipes";

export type StylingSectionMetadata = {
  readonly id: StylingSectionId;
  readonly title: string;
  readonly docsPath: string;
  readonly summary?: string;
};

export type StylingTokenScope = "dark" | "root" | "theme" | "theme-inline";

export type StylingTokenMetadata = {
  readonly name: string;
  readonly value: string;
  readonly scope: StylingTokenScope;
  readonly description?: string;
};

export type StylingTailwindIntegrationMetadata = {
  readonly imports: readonly string[];
  readonly plugins: readonly string[];
  readonly customVariants: readonly {
    readonly name: string;
    readonly selector: string;
  }[];
};

export type StylingThemeMetadata = {
  readonly sourceFile: string;
  readonly docsPath: string;
  readonly tailwindIntegration: StylingTailwindIntegrationMetadata;
  readonly tokens: readonly StylingTokenMetadata[];
  readonly darkModeSelector: ".dark";
  readonly baseLayer: boolean;
  readonly tokenNamingConventions: readonly string[];
};

export type StylingVariantOptionMetadata = {
  readonly name: string;
  readonly values: readonly string[];
  readonly defaultValue?: string;
};

export type StylingVariantCollectionMetadata = {
  readonly name: string;
  readonly exportName?: string;
  readonly baseClassCount: number;
  readonly options: readonly StylingVariantOptionMetadata[];
  readonly compoundVariantCount: number;
};

export type StylingStateSelectorMetadata = {
  readonly attribute: string;
  readonly value?: string;
  readonly selector: string;
  readonly source: "local-style" | "render-attribute" | "variant-class";
};

export type StylingLocalStylesMetadata = {
  readonly fileName?: string;
  readonly importFrom: readonly string[];
  readonly selectorCount: number;
};

export type StylingComponentMetadata = {
  readonly id: string;
  readonly title: string;
  readonly docsPath?: string;
  readonly primitiveDocsPaths: readonly string[];
  readonly publicExports: readonly string[];
  readonly frameworkAvailability: Readonly<Record<StyledFrameworkTarget, FrameworkAvailability>>;
  readonly variantCollections: readonly StylingVariantCollectionMetadata[];
  readonly slots: readonly string[];
  readonly stateSelectors: readonly StylingStateSelectorMetadata[];
  readonly localStyles?: StylingLocalStylesMetadata;
};

export type StylingRecipeMetadata = {
  readonly id:
    | "class-overrides"
    | "primitive-composition"
    | "styled-wrapper-edits"
    | "variant-extension";
  readonly title: string;
  readonly summary: string;
  readonly docsPath?: string;
};

export type StylingDocsMetadata = {
  readonly docsPage: DocsPageMetadata;
  readonly sections: readonly StylingSectionMetadata[];
  readonly theme: StylingThemeMetadata;
  readonly components: readonly StylingComponentMetadata[];
  readonly recipes: readonly StylingRecipeMetadata[];
};

export type PrimitiveRuntimeOptionLifecycle =
  | "attribute-observed"
  | "constructor-only"
  | "refresh-required"
  | "setter-backed";

export type PrimitiveRuntimeMetadata = RuntimeFactoryMetadata & {
  readonly rootPart: string;
  readonly optionProps: readonly string[];
  readonly optionPropLifecycles?: Readonly<Record<string, PrimitiveRuntimeOptionLifecycle>>;
  readonly destroys: true;
};

export type BehaviorFoundationMetadata = {
  readonly type: BehaviorFoundationType;
  readonly label: string;
  readonly reason?: string;
};

export type ComponentGroupMetadata = {
  readonly id: ComponentGroupId;
  readonly title: string;
  readonly description: string;
  readonly order: number;
  readonly aliases?: readonly string[];
};

export type PrimitivePartMetadata = {
  readonly name: string;
  readonly discoveryAttribute: string;
  readonly defaultElement: string;
  readonly role?: string;
  readonly forwardsRef?: boolean;
  readonly ownsRuntime?: boolean;
  readonly requiresContext?: readonly string[];
  readonly initialAttributes?: readonly PrimitiveAttributeMetadata[];
};

export type PrimitiveAttributeMetadata = {
  readonly name: string;
  readonly source: "constant" | "prop" | "state" | "runtime";
  readonly value?: string;
};

export type PrimitivePropMetadata = {
  readonly defaultValue?: string;
  readonly unsupportedTargets?: readonly string[];
  readonly name: string;
  readonly kind: "attribute" | "callback" | "children" | "control" | "option" | "rendering";
  readonly required?: boolean;
  readonly targets?: readonly string[];
  readonly type: string;
};

export type PrimitiveStateModelMetadata = {
  readonly name: string;
  readonly controlledProp?: string;
  readonly defaultProp?: string;
  readonly initialAttribute?: string;
  readonly valueType: string;
  readonly runtimeGetter?: string;
  readonly runtimeSetter?: string;
  readonly controlledStateSync?: "unsupported" | "custom-event" | "imperative";
  readonly description?: string;
  readonly descriptionSource?: "authored" | "generated";
};

export type PrimitiveEventMetadata = {
  readonly callbackTiming?: "after-state-commit" | "before-state-commit";
  readonly cancelable?: boolean;
  readonly name: string;
  readonly callbackProp: string;
  readonly detailsType?: string;
  readonly domEvent?: string;
  readonly emitsFrom: string;
  readonly valueProperty?: string;
  readonly valueType?: string;
  readonly description?: string;
  readonly descriptionSource?: "authored" | "generated";
};

export type PrimitiveSetterMetadata =
  | {
      readonly method: string;
      readonly options?: Readonly<Record<string, boolean | number | string>>;
      readonly stateModel: string;
      readonly suppressesEmit?: boolean;
      readonly description?: string;
      readonly descriptionSource?: "authored" | "generated";
    }
  | {
      readonly method: string;
      readonly options?: Readonly<Record<string, boolean | number | string>>;
      readonly prop: string;
      readonly suppressesEmit?: boolean;
      readonly description?: string;
      readonly descriptionSource?: "authored" | "generated";
    }
  | {
      readonly method: string;
      readonly options?: Readonly<Record<string, boolean | number | string>>;
      readonly props: readonly [string, ...string[]];
      readonly suppressesEmit?: boolean;
      readonly description?: string;
      readonly descriptionSource?: "authored" | "generated";
    };

export type PrimitiveContextMetadata = {
  readonly name: string;
  readonly direction: "provides" | "consumes";
  readonly values: readonly string[];
};

export type PrimitiveFormMetadata = {
  readonly hiddenInput?: {
    readonly part: string;
    readonly type: "checkbox" | "file" | "hidden" | "radio" | "range" | "text";
  };
  readonly fieldIntegration?: boolean;
  readonly props: readonly string[];
};

export type PrimitivePresenceMetadata = {
  readonly keepMountedProp?: string;
  readonly initialHiddenParts: readonly string[];
  readonly initialVisibility?: readonly PrimitiveInitialVisibilityMetadata[];
  readonly unmountPolicy: "runtime-owned" | "runtime-owned-visibility" | "framework-owned" | "none";
};

export type PrimitiveInitialVisibilityMetadata = {
  readonly condition?: string;
  readonly delivery: "markup" | "ref-initializer" | "runtime-measurement";
  readonly hidden: boolean;
  readonly part: string;
  readonly targets: readonly string[];
};

export type PrimitiveFloatingMetadata = {
  readonly anchorPart: string;
  readonly positionerPart: string;
  readonly popupPart: string;
  readonly portalPart?: string;
  readonly optionProps: readonly string[];
};

export type PrimitiveRefMetadata = {
  readonly part: string;
  readonly public: boolean;
};

export type PrimitiveAsChildMetadata = {
  readonly part: string;
  readonly merges: readonly ("aria" | "className" | "data" | "events" | "ref" | "style")[];
};

export type PrimitiveInitialMarkupMetadata = {
  readonly part: string;
  readonly attributes: readonly string[];
  readonly reason: string;
};

export type PrimitiveDocsFrameworkTarget =
  | "raw-html"
  | "astro"
  | "react"
  | "solid"
  | "svelte"
  | "vue";

export type PrimitiveDocsUsageGuidelineMetadata = {
  readonly title: string;
  readonly description: string;
};

export type PrimitiveDocsSectionMetadata = {
  readonly title: string;
  readonly content: string;
};

export type PrimitiveDocsExampleMetadata = {
  readonly id: string;
  readonly title: string;
  readonly framework: PrimitiveDocsFrameworkTarget;
  readonly summary?: string;
  readonly description?: string;
  readonly language?: string;
  readonly code?: string;
  readonly status?: "available" | "planned";
  readonly source?: string;
  readonly href?: string;
};

export type PrimitiveDocsAuthoredExampleFrameworkMetadata = {
  readonly framework: Extract<PrimitiveDocsFrameworkTarget, "astro" | "react" | "raw-html">;
  readonly language: "astro" | "tsx" | "html";
  readonly source: string;
  readonly code: string;
};

export type PrimitiveDocsAuthoredExampleMetadata = {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly draft?: boolean;
  readonly frameworks: readonly PrimitiveDocsAuthoredExampleFrameworkMetadata[];
};

export type PrimitiveDocsExampleRegistryEntry = {
  readonly title: string;
  readonly summary: string;
  readonly language?: string;
  readonly code?: string;
  readonly status?: "available" | "planned";
  readonly source?: string;
  readonly href?: string;
};

export type PrimitiveDocsExampleRegistry = Readonly<
  Record<
    string,
    Readonly<
      Record<
        string,
        Readonly<Partial<Record<PrimitiveDocsFrameworkTarget, PrimitiveDocsExampleRegistryEntry>>>
      >
    >
  >
>;

export type PrimitiveDocsExampleCoveragePolicy = {
  readonly requiredTargets: readonly PrimitiveDocsFrameworkTarget[];
  readonly allowedMissingTargets?: Readonly<
    Record<string, readonly PrimitiveDocsFrameworkTarget[]>
  >;
};

export type PrimitiveDocsExampleCoverageMetadata = {
  readonly requiredTargets: readonly PrimitiveDocsFrameworkTarget[];
  readonly missingTargets: readonly PrimitiveDocsFrameworkTarget[];
  readonly allowedMissingTargets: readonly PrimitiveDocsFrameworkTarget[];
};

export type PrimitivePartDocsEnrichment = {
  readonly description?: string;
  readonly props?: Readonly<Record<string, string>>;
  readonly dataAttributes?: Readonly<Record<string, string>>;
};

export type PrimitiveDocsEnrichment = {
  readonly summary?: string;
  readonly behaviorNotes?: readonly string[];
  readonly frameworkNotes?: Readonly<
    Partial<Record<PrimitiveDocsFrameworkTarget, readonly string[]>>
  >;
  readonly usageGuidelines?: readonly PrimitiveDocsUsageGuidelineMetadata[];
  readonly sections?: readonly PrimitiveDocsSectionMetadata[];
  readonly examples?: readonly PrimitiveDocsExampleMetadata[];
  readonly authoredExamples?: readonly PrimitiveDocsAuthoredExampleMetadata[];
  readonly parts?: Readonly<Record<string, PrimitivePartDocsEnrichment>>;
  readonly props?: Readonly<Record<string, string>>;
  readonly dataAttributes?: Readonly<Record<string, string>>;
  readonly stateModels?: Readonly<Record<string, string>>;
  readonly events?: Readonly<Record<string, string>>;
  readonly setters?: Readonly<Record<string, string>>;
};

export type PrimitivePropReferenceMetadata = PrimitivePropMetadata & {
  readonly description?: string;
  readonly descriptionSource?: "authored" | "generated";
  readonly displayType?: string;
};

export type PrimitiveDataAttributeReferenceMetadata = PrimitiveAttributeMetadata & {
  readonly description?: string;
  readonly descriptionSource?: "authored" | "generated";
};

export type PrimitivePartApiReferenceMetadata = {
  readonly part: string;
  readonly description?: string;
  readonly descriptionSource?: "authored" | "generated";
  readonly defaultElement: string;
  readonly discoveryAttribute: string;
  readonly role?: string;
  readonly props: readonly PrimitivePropReferenceMetadata[];
  readonly dataAttributes: readonly PrimitiveDataAttributeReferenceMetadata[];
  readonly stateModels: readonly PrimitiveStateModelMetadata[];
  readonly events: readonly PrimitiveEventMetadata[];
  readonly setters: readonly PrimitiveSetterMetadata[];
  readonly context: readonly PrimitiveContextMetadata[];
  readonly refs: readonly PrimitiveRefMetadata[];
  readonly asChild: readonly PrimitiveAsChildMetadata[];
  readonly initialMarkup: readonly PrimitiveInitialMarkupMetadata[];
  readonly form?: {
    readonly hiddenInput?: PrimitiveFormMetadata["hiddenInput"];
    readonly props: readonly string[];
  };
  readonly presence?: {
    readonly keepMountedProp?: string;
    readonly initialHidden: boolean;
    readonly unmountPolicy: PrimitivePresenceMetadata["unmountPolicy"];
  };
};

export type PrimitiveExportGroupMetadata = {
  readonly label: string;
  readonly importSource: string;
  readonly exports: readonly string[];
};

export type PrimitiveCanonicalNameMetadata = {
  readonly kind: "namespace" | "runtime-factory" | "part";
  readonly name: string;
};

export type PrimitiveRelatedStyledComponentMetadata = {
  readonly id: string;
  readonly title: string;
  readonly docsPath: string;
  readonly foundationType: BehaviorFoundationType;
};

export type PrimitiveDocsReferenceMetadata = {
  readonly summary: string;
  readonly frameworkTargets: readonly PrimitiveDocsFrameworkTarget[];
  readonly behaviorNotes: readonly string[];
  readonly usageGuidelines: readonly PrimitiveDocsUsageGuidelineMetadata[];
  readonly sections: readonly PrimitiveDocsSectionMetadata[];
  readonly examples: readonly PrimitiveDocsExampleMetadata[];
  readonly authoredExamples: readonly PrimitiveDocsAuthoredExampleMetadata[];
  readonly exampleCoverage: PrimitiveDocsExampleCoverageMetadata;
  readonly anatomy: {
    readonly importSource: string;
    readonly namespace: string;
    readonly parts: readonly string[];
    readonly code: string;
  };
  readonly apiReference: {
    readonly runtimeFactory: RuntimeFactoryMetadata & {
      readonly docsPath: string;
    };
    readonly parts: readonly PrimitivePartApiReferenceMetadata[];
    readonly exportGroups: readonly PrimitiveExportGroupMetadata[];
    readonly canonicalNames: readonly PrimitiveCanonicalNameMetadata[];
    readonly relatedStyledComponents: readonly PrimitiveRelatedStyledComponentMetadata[];
  };
};

export type PrimitiveDocsMetadata = {
  readonly id: string;
  readonly displayName: string;
  readonly category: string;
  readonly runtime: PrimitiveRuntimeMetadata;
  readonly parts: readonly PrimitivePartMetadata[];
  readonly props: readonly PrimitivePropMetadata[];
  readonly stateModels: readonly PrimitiveStateModelMetadata[];
  readonly events: readonly PrimitiveEventMetadata[];
  readonly setters: readonly PrimitiveSetterMetadata[];
  readonly context: readonly PrimitiveContextMetadata[];
  readonly refs: readonly PrimitiveRefMetadata[];
  readonly asChild: readonly PrimitiveAsChildMetadata[];
  readonly initialMarkup: readonly PrimitiveInitialMarkupMetadata[];
  readonly form?: PrimitiveFormMetadata;
  readonly presence?: PrimitivePresenceMetadata;
  readonly floating?: PrimitiveFloatingMetadata;
  readonly frameworkNotes?: Readonly<Partial<Record<string, readonly string[]>>>;
  readonly docsReference: PrimitiveDocsReferenceMetadata;
  readonly docsPage: DocsPageMetadata;
  readonly aliases: readonly string[];
};

export type StyledComponentDocsMetadata = {
  readonly id: string;
  readonly title: string;
  readonly groupId: ComponentGroupId;
  readonly docsPage: DocsPageMetadata;
  readonly foundation: BehaviorFoundationMetadata;
  readonly frameworkAvailability: Readonly<Record<StyledFrameworkTarget, FrameworkAvailability>>;
  readonly primitiveIds: readonly string[];
  readonly runtimeFactories: readonly RuntimeFactoryMetadata[];
  readonly publicExports: readonly string[];
  readonly defaultExport?: Readonly<Record<string, string>>;
  readonly variantCollectionName?: string;
  readonly variantNames: readonly string[];
  readonly slots: readonly string[];
  readonly aliases: readonly string[];
  readonly styledApi: Readonly<Record<StyledFrameworkTarget, StyledApiTargetMetadata>>;
};

export type StyledApiPropClassification = "primitive-override" | "variant" | "wrapper";

export type StyledApiPrimitiveReference = {
  readonly primitiveId: string;
  readonly part: string;
  readonly propName: string;
};

export type StyledApiDeprecationMetadata = {
  readonly reason: string;
  readonly replacement?: string;
};

export type StyledApiPropMetadata = {
  readonly name: string;
  readonly type: string;
  readonly required: boolean;
  readonly classification: StyledApiPropClassification;
  readonly defaultValue?: string;
  readonly values?: readonly string[];
  readonly description?: string;
  readonly descriptionSource?: "annotation" | "catalog";
  readonly deprecated?: StyledApiDeprecationMetadata;
  readonly primitive?: StyledApiPrimitiveReference;
};

export type StyledApiInheritanceKind =
  | "component-props"
  | "element-attributes"
  | "primitive-props"
  | "raw";

export type StyledApiInheritanceMetadata = {
  readonly key: string;
  readonly kind: StyledApiInheritanceKind;
  readonly displayName: string;
  readonly omittedProps: readonly string[];
  readonly description?: string;
  readonly element?: string;
  readonly componentId?: string;
  readonly exportName?: string;
  readonly primitiveId?: string;
  readonly part?: string;
};

export type StyledApiExportMetadata = {
  readonly exportName: string;
  readonly description?: string;
  readonly props: readonly StyledApiPropMetadata[];
  readonly inheritance: readonly StyledApiInheritanceMetadata[];
};

export type StyledApiTargetMetadata = {
  readonly framework: StyledFrameworkTarget;
  readonly exports: readonly StyledApiExportMetadata[];
};

export type LayeredDocsMetadata = {
  readonly version: 1;
  readonly runtime: RuntimeDocsMetadata;
  readonly styling: StylingDocsMetadata;
  readonly groups: readonly ComponentGroupMetadata[];
  readonly styledComponents: readonly StyledComponentDocsMetadata[];
  readonly primitives: readonly PrimitiveDocsMetadata[];
};

export type StyledDocsAnnotation = {
  readonly groupId: ComponentGroupId;
  readonly docsPage: DocsPageMetadata;
  readonly foundation: {
    readonly type: BehaviorFoundationType;
    readonly reason?: string;
  };
  readonly frameworkAvailability?: Partial<Record<StyledFrameworkTarget, FrameworkAvailability>>;
  readonly aliases?: readonly string[];
  readonly styledApi?: Readonly<Record<string, StyledApiExportAnnotation>>;
};

export type StyledApiExportAnnotation = {
  readonly description?: string;
  readonly inheritance?: Readonly<Record<string, StyledApiInheritanceAnnotation>>;
  readonly props?: Readonly<Record<string, StyledApiPropAnnotation>>;
};

export type StyledApiInheritanceAnnotation = {
  readonly description?: string;
};

export type StyledApiPropAnnotation = {
  readonly classification?: StyledApiPropClassification;
  readonly defaultValue?: string;
  readonly deprecated?: StyledApiDeprecationMetadata;
  readonly description?: string;
  readonly include?: boolean;
  readonly type?: string;
};
