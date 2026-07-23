import { type RuntimeAdapterContract } from "../../../../contracts/primitive/types.js";
import {
  type PrimitiveDocsEnrichment,
  type PrimitiveEventMetadata,
  type PrimitivePartApiReferenceMetadata,
  type PrimitivePartDocsEnrichment,
  type PrimitivePropReferenceMetadata,
  type PrimitiveStateModelMetadata,
} from "../../types.js";
import { dedupeByName, toDisplayTitle, toPascalCase } from "../shared.js";
import { toPrimitiveSetterMetadata } from "./setters.js";
import {
  formatPrimitiveOptionSubject,
  formatPrimitivePropSubject,
  formatPrimitiveStateSubject,
  toDescriptionLabel,
} from "./subjects.js";

export const buildPrimitivePartApiReference = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
  enrichment: PrimitiveDocsEnrichment,
): PrimitivePartApiReferenceMetadata => {
  const partEnrichment = enrichment.parts?.[part.name];
  const presence = contract.presence
    ? getPrimitivePartPresenceReference(contract, part.name)
    : undefined;
  const form =
    contract.form &&
    (part.name === contract.runtime.rootPart || contract.form.hiddenInput?.part === part.name)
      ? getPrimitivePartFormReference(contract, part.name)
      : undefined;

  return {
    part: part.name,
    description: partEnrichment?.description ?? getPrimitivePartFallbackDescription(contract, part),
    descriptionSource: "authored",
    defaultElement: part.defaultElement,
    discoveryAttribute: part.discoveryAttribute,
    ...(part.role ? { role: part.role } : {}),
    props: contract.props
      .filter((prop) => isPrimitivePropTargetedAtPart(prop, part.name, contract.runtime.rootPart))
      .map((prop) => toPrimitivePropReference(contract, part, prop, enrichment, partEnrichment)),
    dataAttributes: buildPrimitivePartDataAttributes(part, enrichment, partEnrichment),
    stateModels: getPrimitivePartStateModels(contract, part).map((stateModel) =>
      copyPrimitiveStateModel(contract, stateModel, enrichment),
    ),
    events: (contract.events ?? [])
      .filter((event) => event.emitsFrom === part.name)
      .map((event) => toPrimitiveEventMetadata(contract, event, enrichment)),
    setters:
      part.name === contract.runtime.rootPart
        ? (contract.setters ?? []).map((setter) =>
            toPrimitiveSetterMetadata(contract, setter, enrichment),
          )
        : [],
    context:
      part.name === contract.runtime.rootPart
        ? (contract.context ?? []).map((context) => ({
            name: context.name,
            direction: context.direction,
            values: [...context.values],
          }))
        : [],
    refs: (contract.refs ?? [])
      .filter((ref) => ref.part === part.name)
      .map((ref) => ({
        part: ref.part,
        public: ref.public,
      })),
    asChild: (contract.asChild ?? [])
      .filter((asChild) => asChild.part === part.name)
      .map((asChild) => ({
        part: asChild.part,
        merges: [...asChild.merges],
      })),
    initialMarkup: (contract.initialMarkup ?? [])
      .filter((initialMarkup) => initialMarkup.part === part.name)
      .map((initialMarkup) => ({
        part: initialMarkup.part,
        attributes: [...initialMarkup.attributes],
        reason: initialMarkup.reason,
      })),
    ...(form ? { form } : {}),
    ...(presence ? { presence } : {}),
  };
};

const getPrimitivePartFallbackDescription = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
) => {
  const partLabel = toDisplayTitle(part.name);
  const description = commonPrimitivePartDescriptions[part.name];

  if (description) {
    return description({ contract, part, partLabel });
  }

  return `Provides the ${partLabel} part for ${contract.displayName}.`;
};

type PrimitivePartDescriptionContext = {
  readonly contract: RuntimeAdapterContract;
  readonly part: RuntimeAdapterContract["parts"][number];
  readonly partLabel: string;
};

type PrimitivePartDescriptionFactory = (context: PrimitivePartDescriptionContext) => string;

const commonPrimitivePartDescriptions: Record<string, PrimitivePartDescriptionFactory> = {
  root: ({ contract }) =>
    `The main element that owns the ${contract.displayName} Runtime instance.`,
  trigger: ({ contract }) =>
    `The control that opens, closes, or targets the ${contract.displayName} content.`,
  anchor: ({ contract }) => `The virtual anchor used to position ${contract.displayName} content.`,
  popup: ({ contract }) => `The floating content container for ${contract.displayName}.`,
  positioner: ({ contract }) =>
    `Positions the ${contract.displayName} content relative to its trigger.`,
  portal: ({ contract }) =>
    `Moves ${contract.displayName} overlay content to the document body when needed.`,
  backdrop: ({ contract }) => `The backdrop shown behind the ${contract.displayName} overlay.`,
  viewport: ({ contract }) => `The visible viewport for ${contract.displayName} content.`,
  item: ({ contract }) => `An interactive item inside the ${contract.displayName} collection.`,
  linkItem: ({ contract }) => `A link-style item inside the ${contract.displayName} collection.`,
  checkboxItem: ({ contract }) =>
    `A checkbox-style item inside the ${contract.displayName} collection.`,
  radioItem: ({ contract }) => `A radio-style item inside the ${contract.displayName} collection.`,
  checkboxItemIndicator: ({ contract }) =>
    `Shows the checked state for a ${contract.displayName} checkbox item.`,
  radioItemIndicator: ({ contract }) =>
    `Shows the selected state for a ${contract.displayName} radio item.`,
  radioGroup: ({ contract }) => `Groups related radio items inside ${contract.displayName}.`,
  submenuRoot: ({ contract }) => `Owns a nested submenu inside ${contract.displayName}.`,
  submenuTrigger: ({ contract }) => `Opens a nested submenu inside ${contract.displayName}.`,
  shortcut: ({ contract }) => `Displays keyboard shortcut text for a ${contract.displayName} item.`,
  panel: ({ contract }) => `The content panel controlled by ${contract.displayName}.`,
  content: ({ contract }) => `The content container rendered by ${contract.displayName}.`,
  container: ({ contract }) =>
    `Groups the scrolling or moving content for ${contract.displayName}.`,
  previous: ({ contract }) => `Moves ${contract.displayName} to the previous item or slide.`,
  next: ({ contract }) => `Moves ${contract.displayName} to the next item or slide.`,
  header: ({ contract }) => `The header container for a ${contract.displayName} item.`,
  title: ({ contract }) => `The accessible title for ${contract.displayName}.`,
  titleText: ({ contract }) => `Text content for the ${contract.displayName} title.`,
  description: ({ contract }) => `Supporting description text for ${contract.displayName}.`,
  close: ({ contract }) => `A control that closes ${contract.displayName}.`,
  action: ({ contract }) => `An optional action button shown inside ${contract.displayName}.`,
  indicator: ({ contract }) => `Visual state indicator rendered by ${contract.displayName}.`,
  input: ({ contract }) => `The native input synchronized by ${contract.displayName}.`,
  hiddenInput: ({ contract }) => `The hidden native input synchronized by ${contract.displayName}.`,
  uncheckedInput: ({ contract }) =>
    `The hidden native input used when ${contract.displayName} submits an unchecked value.`,
  inputGroup: ({ contract }) => `Groups the input controls for ${contract.displayName}.`,
  label: ({ contract }) => `Text label associated with ${contract.displayName}.`,
  legend: ({ contract }) => `Legend text for the ${contract.displayName} fieldset.`,
  group: ({ contract }) => `Groups related ${contract.displayName} items.`,
  groupLabel: ({ contract }) => `Labels a group of ${contract.displayName} items.`,
  separator: ({ contract }) => `Separates groups of ${contract.displayName} items.`,
  arrow: () => `The arrow element that visually points to the trigger.`,
  image: ({ contract }) => `The image element managed by ${contract.displayName}.`,
  fallback: ({ contract }) => `Fallback content shown when ${contract.displayName} cannot load.`,
  clear: ({ contract }) => `Clears the current ${contract.displayName} value.`,
  empty: ({ contract }) => `Content shown when ${contract.displayName} has no matching items.`,
  itemText: ({ contract }) => `Text content for a ${contract.displayName} item.`,
  itemIndicator: ({ contract }) => `Shows the selected state for a ${contract.displayName} item.`,
  thumb: ({ contract }) => `The draggable thumb for ${contract.displayName}.`,
  track: ({ contract }) => `The track that contains the ${contract.displayName} range.`,
  control: ({ contract }) => `Groups the interactive controls for ${contract.displayName}.`,
  corner: ({ contract }) => `The corner where ${contract.displayName} scrollbars meet.`,
  scrollbar: ({ contract }) => `A scrollbar used to scroll ${contract.displayName} content.`,
  range: ({ contract }) => `The filled range shown inside ${contract.displayName}.`,
  list: ({ contract }) => `The list of selectable ${contract.displayName} items.`,
  value: ({ contract }) => `Displays the current ${contract.displayName} value.`,
  icon: ({ contract }) => `Decorative icon rendered by ${contract.displayName}.`,
  scrollUpArrow: ({ contract }) => `Scrolls ${contract.displayName} options upward.`,
  scrollDownArrow: ({ contract }) => `Scrolls ${contract.displayName} options downward.`,
  provider: ({ contract }) => `Provides shared ${contract.displayName} state to nested parts.`,
  sidebar: ({ contract }) => `The visible sidebar panel for ${contract.displayName}.`,
  rail: ({ contract }) => `A compact control for resizing or toggling ${contract.displayName}.`,
  menuButton: ({ contract }) => `A menu-style button rendered inside ${contract.displayName}.`,
  tab: ({ contract }) => `A selectable tab inside ${contract.displayName}.`,
  template: ({ contract }) => `Template markup used to create ${contract.displayName} items.`,
  slot: ({ contract }) => `A character slot inside ${contract.displayName}.`,
  slotChar: ({ contract }) => `The visible character rendered in a ${contract.displayName} slot.`,
  slotCaret: ({ contract }) => `The caret shown inside the active ${contract.displayName} slot.`,
  validity: ({ contract }) => `Validation state container for ${contract.displayName}.`,
  error: ({ contract }) => `Error message content for ${contract.displayName}.`,
  "error-summary": ({ contract }) => `Summary of validation errors for ${contract.displayName}.`,
  filesList: ({ contract }) => `Lists the selected files for ${contract.displayName}.`,
  loadingIndicator: ({ contract }) => `Loading indicator shown by ${contract.displayName}.`,
  uploadIndicator: ({ contract }) => `Upload progress indicator shown by ${contract.displayName}.`,
} satisfies Record<string, PrimitivePartDescriptionFactory>;

const getPrimitivePartPresenceReference = (contract: RuntimeAdapterContract, partName: string) => {
  if (!contract.presence) {
    return undefined;
  }

  const keepMountedProp = contract.presence.keepMountedProp;
  const keepMountedTargets = keepMountedProp
    ? contract.props.find((prop) => prop.name === keepMountedProp)?.targets
    : undefined;
  const isPresencePart =
    contract.presence.initialHiddenParts.includes(partName) ||
    contract.presence.initialVisibility?.some((visibility) => visibility.part === partName) ||
    (keepMountedTargets
      ? keepMountedTargets.includes(partName)
      : partName === contract.runtime.rootPart);

  if (!isPresencePart) {
    return undefined;
  }

  return {
    ...(keepMountedProp && (!keepMountedTargets || keepMountedTargets.includes(partName))
      ? { keepMountedProp }
      : {}),
    initialHidden: contract.presence.initialHiddenParts.includes(partName),
    unmountPolicy: contract.presence.unmountPolicy,
  };
};

const getPrimitivePartFormReference = (contract: RuntimeAdapterContract, partName: string) => {
  if (!contract.form) {
    return undefined;
  }

  return {
    ...(contract.form.hiddenInput
      ? {
          hiddenInput:
            contract.form.hiddenInput.part === partName
              ? { ...contract.form.hiddenInput }
              : {
                  part: contract.form.hiddenInput.part,
                  type: contract.form.hiddenInput.type,
                },
        }
      : {}),
    props: [...contract.form.props],
  };
};

const buildPrimitivePartDataAttributes = (
  part: RuntimeAdapterContract["parts"][number],
  enrichment: PrimitiveDocsEnrichment,
  partEnrichment: PrimitivePartDocsEnrichment | undefined,
) => {
  const descriptions = {
    ...enrichment.dataAttributes,
    ...partEnrichment?.dataAttributes,
  };

  return dedupeByName([
    {
      name: part.discoveryAttribute,
      source: "runtime" as const,
      description:
        descriptions[part.discoveryAttribute] ??
        getPrimitiveDataAttributeFallbackDescription(part, {
          name: part.discoveryAttribute,
          source: "runtime",
        }),
      descriptionSource: "authored" as const,
    },
    ...(part.initialAttributes ?? [])
      .filter((attribute) => attribute.name.startsWith("data-"))
      .map((attribute) => ({
        name: attribute.name,
        source: attribute.source,
        ...(attribute.value !== undefined ? { value: attribute.value } : {}),
        description:
          descriptions[attribute.name] ??
          getPrimitiveDataAttributeFallbackDescription(part, attribute),
        descriptionSource: "authored" as const,
      })),
  ]);
};

type PrimitivePartInitialAttribute = NonNullable<
  RuntimeAdapterContract["parts"][number]["initialAttributes"]
>[number];

const getPrimitiveDataAttributeFallbackDescription = (
  part: RuntimeAdapterContract["parts"][number],
  attribute: Pick<PrimitivePartInitialAttribute, "name" | "source">,
) => {
  const partLabel = toDisplayTitle(part.name);
  const attributeSubject = attribute.name.replace(/^data-/, "").replace(/^is-/, "");

  switch (attribute.source) {
    case "runtime":
      return `Marks the ${partLabel} part so Starwind Runtime can find it.`;
    case "state":
      return `Reflects the ${formatPrimitiveStateSubject(attributeSubject)} on the ${partLabel} part.`;
    case "prop":
      return `Reflects the ${formatPrimitivePropSubject(attributeSubject)} on the ${partLabel} part.`;
    case "constant":
      return `Identifies ${partLabel} metadata for styling and selectors.`;
  }
};

const getPrimitivePropFallbackDescription = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
  prop: RuntimeAdapterContract["props"][number],
) => {
  const commonDescription = getCommonPrimitivePropDescription(contract, part, prop);
  const propLabel = toDescriptionLabel(prop.name);
  const partLabel = toDisplayTitle(part.name);

  if (commonDescription) {
    return commonDescription;
  }

  switch (prop.kind) {
    case "attribute":
      return `Sets the ${propLabel} attribute on the ${partLabel} part.`;
    case "callback":
      return `Runs when ${propLabel} changes for ${contract.displayName}.`;
    case "children":
      return `Provides child content for the ${partLabel} part.`;
    case "control":
      return `Controls the ${formatPrimitiveControlSubject(prop.name)} for ${contract.displayName}.`;
    case "option":
      return `Configures the ${formatPrimitiveOptionSubject(prop.name)} for the ${partLabel} part.`;
    case "rendering":
      return `Changes how the ${partLabel} part is rendered.`;
  }
};

type PrimitivePropDescriptionContext = {
  readonly contract: RuntimeAdapterContract;
  readonly part: RuntimeAdapterContract["parts"][number];
  readonly partLabel: string;
  readonly prop: RuntimeAdapterContract["props"][number];
};

type PrimitivePropDescriptionFactory = (context: PrimitivePropDescriptionContext) => string;

const getCommonPrimitivePropDescription = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
  prop: RuntimeAdapterContract["props"][number],
) => {
  const description = commonPrimitivePropDescriptions[prop.name];

  return description?.({ contract, part, partLabel: toDisplayTitle(part.name), prop });
};

const commonPrimitivePropDescriptions: Record<string, PrimitivePropDescriptionFactory> = {
  "data-error-visibility": () =>
    "Selects whether semantic change, blur, submit, or manual validation reveals errors; defaults to submit.",
  "data-revalidation-timing": () =>
    "Replaces validationTiming after a Form submission attempt with semantic change, blur, submit, or manual validation; defaults to change.",
  "data-validation-timing": () =>
    "Selects semantic change, blur, submit, or manual validation before a Form submission attempt; defaults to submit.",
  disabled: ({ partLabel }) => `Disables the ${partLabel} part.`,
  focusableWhenDisabled: ({ partLabel }) =>
    `Keeps the ${partLabel} part focusable even when it is disabled.`,
  value: ({ contract }) => `Controls the current ${contract.displayName} value.`,
  defaultValue: ({ contract }) =>
    `Sets the initial ${contract.displayName} value for uncontrolled usage.`,
  onValueChange: ({ contract }) => `Runs when the ${contract.displayName} value changes.`,
  open: ({ contract }) => `Controls whether ${contract.displayName} is open.`,
  defaultOpen: ({ contract }) => `Sets whether ${contract.displayName} starts open.`,
  onOpenChange: ({ contract }) => `Runs when ${contract.displayName} opens or closes.`,
  checked: ({ contract }) => `Controls whether ${contract.displayName} is checked.`,
  defaultChecked: ({ contract }) =>
    `Sets whether ${contract.displayName} starts checked for uncontrolled usage.`,
  onCheckedChange: ({ contract }) => `Runs when the ${contract.displayName} checked state changes.`,
  name: () => "Sets the submitted form field name.",
  form: () => "Associates the control with a form element.",
  id: () => "Sets the id used by the associated native control.",
  required: () => "Marks the form control as required.",
  readOnly: () => "Marks the control as read-only.",
  invalid: () => "Marks the field as invalid for validation styling and state.",
  touched: () => "Marks whether the field has been visited.",
  dirty: () => "Marks whether the field value has changed.",
  errorVisibility: () =>
    "Selects whether semantic change, blur, submit, or manual validation reveals errors; defaults to submit.",
  revalidationTiming: () =>
    "Replaces validationTiming after a Form submission attempt with semantic change, blur, submit, or manual validation; defaults to change.",
  type: ({ partLabel }) => `Sets the native type for the ${partLabel} part.`,
  validationTiming: () =>
    "Selects semantic change, blur, submit, or manual validation before a Form submission attempt; defaults to submit.",
  asChild: ({ partLabel }) =>
    `Merges behavior onto your child element instead of rendering the default ${partLabel} element.`,
  nativeButton: () => "Renders the control as a native button element.",
  keepMounted: ({ partLabel }) => `Keeps the ${partLabel} part in the DOM when hidden.`,
  targetId: () => "Targets a specific root element by id.",
  closeOnEscape: ({ contract }) => `Closes ${contract.displayName} when Escape is pressed.`,
  closeOnOutsideInteract: ({ contract }) =>
    `Closes ${contract.displayName} when the user interacts outside it.`,
  closeOnClick: ({ contract }) => `Closes ${contract.displayName} after the item is clicked.`,
  closeDelay: ({ contract }) => `Sets how long ${contract.displayName} waits before closing.`,
  openDelay: ({ contract }) => `Sets how long ${contract.displayName} waits before opening.`,
  onCloseComplete: ({ contract }) => `Runs after ${contract.displayName} has finished closing.`,
  modal: ({ contract }) => `Makes ${contract.displayName} behave as a modal overlay.`,
  orientation: ({ contract }) => `Sets the ${contract.displayName} orientation.`,
  side: ({ contract }) => `Sets the preferred side for ${contract.displayName} content.`,
  align: ({ contract }) => `Sets how ${contract.displayName} content aligns to its trigger.`,
  sideOffset: ({ contract }) =>
    `Sets the distance between ${contract.displayName} content and its trigger.`,
  alignOffset: ({ contract }) =>
    `Adjusts the cross-axis alignment offset for ${contract.displayName} content.`,
  avoidCollisions: ({ contract }) =>
    `Allows ${contract.displayName} content to shift or flip to stay visible.`,
  loopFocus: ({ contract }) => `Lets keyboard focus wrap around the ${contract.displayName} items.`,
  highlightItemOnHover: ({ contract }) =>
    `Highlights ${contract.displayName} items when the pointer moves over them.`,
  multiple: ({ contract }) => `Allows multiple ${contract.displayName} values to be selected.`,
  match: ({ contract }) => `Controls how ${contract.displayName} filters matching items.`,
  locale: ({ contract }) => `Sets the locale used by ${contract.displayName}.`,
  autoComplete: () => "Sets the native autocomplete behavior.",
  alt: () => "Provides accessible alternative text for the image.",
  src: () => "Sets the image source.",
  image: () => "Provides image loading state to the avatar image part.",
  delay: () => "Sets how long to wait before showing fallback content.",
  isUploading: ({ contract }) => `Controls whether ${contract.displayName} is uploading.`,
  files: ({ contract }) => `Controls the selected files for ${contract.displayName}.`,
  onFilesChange: ({ contract }) => `Runs when selected files change for ${contract.displayName}.`,
  accept: () => "Limits which file types can be selected.",
  maxFiles: () => "Sets the maximum number of files that can be selected.",
  maxSize: () => "Sets the maximum allowed file size.",
  minSize: () => "Sets the minimum allowed file size.",
  noClick: () => "Prevents opening the file picker from pointer clicks.",
  noKeyboard: () => "Prevents opening the file picker from keyboard interaction.",
  noDrag: () => "Disables drag-and-drop file selection.",
  opts: () => "Passes options to the underlying carousel engine.",
  plugins: () => "Passes plugins to the underlying carousel engine.",
  setApi: () => "Receives the carousel API instance when it is ready.",
  autoInit: () => "Initializes the carousel automatically when the page loads.",
  collapsible: ({ contract }) => `Allows all ${contract.displayName} items to be collapsed.`,
  indeterminate: ({ contract }) => `Controls the mixed state for ${contract.displayName}.`,
  uncheckedValue: () => "Sets the value submitted when the checkbox is unchecked.",
  variant: ({ partLabel }) => `Selects the visual variant for the ${partLabel} part.`,
} satisfies Record<string, PrimitivePropDescriptionFactory>;

const formatPrimitiveControlSubject = (value: string) => {
  const label = toDescriptionLabel(value);

  if (label === "value" || label.endsWith(" value")) {
    return label;
  }

  return formatPrimitiveStateSubject(value);
};

const toPrimitivePropReference = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
  prop: RuntimeAdapterContract["props"][number],
  enrichment: PrimitiveDocsEnrichment,
  partEnrichment: PrimitivePartDocsEnrichment | undefined,
): PrimitivePropReferenceMetadata => {
  const description = partEnrichment?.props?.[prop.name] ?? enrichment.props?.[prop.name];
  const displayType = getPrimitivePropDisplayType(contract, prop);

  return {
    ...(prop.defaultValue !== undefined ? { defaultValue: prop.defaultValue } : {}),
    ...(prop.unsupportedTargets ? { unsupportedTargets: [...prop.unsupportedTargets] } : {}),
    name: prop.name,
    kind: prop.kind,
    ...(prop.required !== undefined ? { required: prop.required } : {}),
    ...(prop.targets ? { targets: [...prop.targets] } : {}),
    type: prop.type,
    ...(displayType ? { displayType } : {}),
    description: description ?? getPrimitivePropFallbackDescription(contract, part, prop),
    descriptionSource: "authored",
  };
};

const primitivePropDisplayTypes: Readonly<Record<string, string>> = {
  FormValidationTiming: '"blur" | "change" | "manual" | "submit"',
};

const getPrimitivePropDisplayType = (
  contract: RuntimeAdapterContract,
  prop: RuntimeAdapterContract["props"][number],
) => {
  const expandedType = primitivePropDisplayTypes[prop.type];
  if (expandedType) {
    return expandedType;
  }

  if (prop.kind !== "callback") {
    return undefined;
  }

  const event = contract.events?.find((candidate) => candidate.callbackProp === prop.name);
  if (!event) {
    return prop.type;
  }

  const valueName = event.valueProperty ?? "value";
  const valueType = event.valueType ?? "unknown";
  const detailsType = event.detailsType ?? prop.type;

  return `(${valueName}: ${valueType}, details: ${detailsType}) => void`;
};

const getPrimitivePartStateModels = (
  contract: RuntimeAdapterContract,
  part: RuntimeAdapterContract["parts"][number],
) => {
  const partAttributeNames = new Set(
    (part.initialAttributes ?? []).map((attribute) => attribute.name),
  );

  return (contract.stateModels ?? []).filter(
    (stateModel) =>
      part.name === contract.runtime.rootPart ||
      (stateModel.initialAttribute ? partAttributeNames.has(stateModel.initialAttribute) : false),
  );
};

export const copyPrimitiveStateModel = (
  contract: RuntimeAdapterContract,
  stateModel: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
  enrichment: PrimitiveDocsEnrichment | undefined,
): PrimitiveStateModelMetadata => ({
  name: stateModel.name,
  ...(stateModel.controlledProp ? { controlledProp: stateModel.controlledProp } : {}),
  ...(stateModel.defaultProp ? { defaultProp: stateModel.defaultProp } : {}),
  ...(stateModel.initialAttribute ? { initialAttribute: stateModel.initialAttribute } : {}),
  valueType: stateModel.valueType,
  ...(stateModel.runtimeGetter ? { runtimeGetter: stateModel.runtimeGetter } : {}),
  ...(stateModel.runtimeSetter ? { runtimeSetter: stateModel.runtimeSetter } : {}),
  ...(stateModel.controlledStateSync
    ? { controlledStateSync: stateModel.controlledStateSync }
    : {}),
  description:
    enrichment?.stateModels?.[stateModel.name] ??
    getPrimitiveStateFallbackDescription(contract, stateModel),
  descriptionSource: "authored",
});

const getPrimitiveStateFallbackDescription = (
  contract: RuntimeAdapterContract,
  stateModel: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
) => {
  const description = commonPrimitiveStateDescriptions[stateModel.name];

  if (description) {
    return description({ contract, stateModel });
  }

  return `Tracks the ${formatPrimitiveStateSubject(stateModel.name)} for ${contract.displayName}.`;
};

type PrimitiveStateDescriptionContext = {
  readonly contract: RuntimeAdapterContract;
  readonly stateModel: NonNullable<RuntimeAdapterContract["stateModels"]>[number];
};

type PrimitiveStateDescriptionFactory = (context: PrimitiveStateDescriptionContext) => string;

const commonPrimitiveStateDescriptions: Record<string, PrimitiveStateDescriptionFactory> = {
  open: ({ contract }) => `Tracks whether ${contract.displayName} is open.`,
  value: ({ contract }) => `Tracks the current ${contract.displayName} value.`,
  checked: ({ contract }) => `Tracks whether ${contract.displayName} is checked.`,
  radioValue: ({ contract }) => `Tracks the selected radio value for ${contract.displayName}.`,
  inputValue: ({ contract }) => `Tracks the current text input value for ${contract.displayName}.`,
  imageLoadingStatus: ({ contract }) =>
    `Tracks whether the ${contract.displayName} image is loading, loaded, or failed.`,
  uploading: ({ contract }) => `Tracks whether ${contract.displayName} is uploading files.`,
  indeterminate: ({ contract }) => `Tracks whether ${contract.displayName} is in a mixed state.`,
  dirty: ({ contract }) => `Tracks whether the ${contract.displayName} value has changed.`,
  touched: ({ contract }) => `Tracks whether ${contract.displayName} has been visited.`,
  mobileOpen: ({ contract }) => `Tracks whether the mobile ${contract.displayName} panel is open.`,
  pressed: ({ contract }) => `Tracks whether ${contract.displayName} is pressed.`,
} satisfies Record<string, PrimitiveStateDescriptionFactory>;

export const toPrimitiveEventMetadata = (
  contract: RuntimeAdapterContract,
  event: NonNullable<RuntimeAdapterContract["events"]>[number],
  enrichment: PrimitiveDocsEnrichment | undefined,
): PrimitiveEventMetadata => ({
  ...(event.callbackTiming ? { callbackTiming: event.callbackTiming } : {}),
  ...(event.cancelable !== undefined ? { cancelable: event.cancelable } : {}),
  name: event.name,
  callbackProp: event.callbackProp,
  ...(event.detailsType ? { detailsType: event.detailsType } : {}),
  ...(event.domEvent ? { domEvent: event.domEvent } : {}),
  emitsFrom: event.emitsFrom,
  ...(event.valueProperty ? { valueProperty: event.valueProperty } : {}),
  ...(event.valueType ? { valueType: event.valueType } : {}),
  description:
    enrichment?.events?.[event.name] ?? getPrimitiveEventFallbackDescription(contract, event),
  descriptionSource: "authored",
});

const getPrimitiveEventFallbackDescription = (
  contract: RuntimeAdapterContract,
  event: NonNullable<RuntimeAdapterContract["events"]>[number],
) => {
  const description = commonPrimitiveEventDescriptions[event.name];

  if (description) {
    return description({ contract, event });
  }

  const subject = formatPrimitiveEventSubject(event);

  return `Fires when the ${subject} changes for ${contract.displayName}.`;
};

type PrimitiveEventDescriptionContext = {
  readonly contract: RuntimeAdapterContract;
  readonly event: NonNullable<RuntimeAdapterContract["events"]>[number];
};

type PrimitiveEventDescriptionFactory = (context: PrimitiveEventDescriptionContext) => string;

const commonPrimitiveEventDescriptions: Record<string, PrimitiveEventDescriptionFactory> = {
  openChange: ({ contract }) => `Fires when ${contract.displayName} opens or closes.`,
  valueChange: ({ contract }) => `Fires when the value changes for ${contract.displayName}.`,
  checkedChange: ({ contract }) =>
    `Fires when the checked state changes for ${contract.displayName}.`,
  closeComplete: ({ contract }) => `Fires after ${contract.displayName} has finished closing.`,
  loadingStatusChange: ({ contract }) =>
    `Fires when the image loading status changes for ${contract.displayName}.`,
  inputValueChange: ({ contract }) =>
    `Fires when the text input value changes for ${contract.displayName}.`,
  filesChange: ({ contract }) => `Fires when selected files change for ${contract.displayName}.`,
  mobileOpenChange: ({ contract }) =>
    `Fires when the mobile panel opens or closes for ${contract.displayName}.`,
  valueCommitted: ({ contract }) =>
    `Fires when the user commits the value for ${contract.displayName}.`,
  pressedChange: ({ contract }) =>
    `Fires when the pressed state changes for ${contract.displayName}.`,
} satisfies Record<string, PrimitiveEventDescriptionFactory>;

const formatPrimitiveEventSubject = (
  event: NonNullable<RuntimeAdapterContract["events"]>[number],
) => {
  const rawSubject = event.valueProperty ?? event.name.replace(/Change$/, "");
  const label = toDescriptionLabel(rawSubject);

  if (label === "value" || label.endsWith(" value")) {
    return label;
  }

  if (
    label === "active" ||
    label === "checked" ||
    label === "disabled" ||
    label === "expanded" ||
    label === "open" ||
    label === "pressed" ||
    label === "selected"
  ) {
    return `${label} state`;
  }

  return label;
};

export const isPrimitivePropTargetedAtPart = (
  prop: RuntimeAdapterContract["props"][number],
  partName: string,
  rootPart: string,
) => (prop.targets ? prop.targets.includes(partName) : partName === rootPart);

export const buildPrimitiveExportGroups = (
  contract: RuntimeAdapterContract,
  publicAdapterParts: readonly RuntimeAdapterContract["parts"][number][],
) => {
  const adapterExports = [
    contract.displayName,
    ...publicAdapterParts.map((part) => `${contract.displayName}${toPascalCase(part.name)}`),
  ];

  return [
    {
      label: "Runtime",
      importSource: contract.runtime.importSource,
      exports: [contract.runtime.factory],
    },
    {
      label: "Astro Primitive",
      importSource: `@starwind-ui/astro/${contract.component}`,
      exports: adapterExports,
    },
    {
      label: "React Primitive",
      importSource: `@starwind-ui/react/${contract.component}`,
      exports: adapterExports,
    },
  ];
};

export const buildPrimitiveCanonicalNames = (
  contract: RuntimeAdapterContract,
  publicAdapterParts: readonly RuntimeAdapterContract["parts"][number][],
) => [
  { kind: "namespace" as const, name: getPrimitiveNamespace(contract) },
  { kind: "runtime-factory" as const, name: contract.runtime.factory },
  ...publicAdapterParts.map((part) => ({
    kind: "part" as const,
    name: `${getPrimitiveNamespace(contract)}.${toPascalCase(part.name)}`,
  })),
];

export const getPublicPrimitiveAdapterParts = (contract: RuntimeAdapterContract) =>
  contract.parts.filter((part) => part.name === contract.runtime.rootPart || part.forwardsRef);

export const renderPrimitiveAnatomyCode = (
  contract: RuntimeAdapterContract,
  publicAdapterParts: readonly RuntimeAdapterContract["parts"][number][],
) => {
  const namespace = getPrimitiveNamespace(contract);
  const rootPart =
    publicAdapterParts.find((part) => part.name === contract.runtime.rootPart) ??
    publicAdapterParts[0];

  if (!rootPart) {
    return `import { ${namespace} } from "@starwind-ui/react/${contract.component}";`;
  }

  const rootName = `${namespace}.${toPascalCase(rootPart.name)}`;
  const childParts = publicAdapterParts.filter((part) => part.name !== rootPart.name);

  if (childParts.length === 0) {
    return [
      `import { ${namespace} } from "@starwind-ui/react/${contract.component}";`,
      "",
      `<${rootName} />`,
    ].join("\n");
  }

  return [
    `import { ${namespace} } from "@starwind-ui/react/${contract.component}";`,
    "",
    `<${rootName}>`,
    ...childParts.map((part) => `  <${namespace}.${toPascalCase(part.name)} />`),
    `</${rootName}>`,
  ].join("\n");
};

export const getPrimitiveNamespace = (contract: RuntimeAdapterContract) =>
  toPascalCase(contract.component);
