import type { RuntimeAdapterContract } from "../../../../contracts/primitive/types.js";
import type {
  PrimitiveEventCancellationStepMetadata,
  PrimitiveFrameworkBehaviorApiMetadata,
  PrimitiveFrameworkBehaviorMetadata,
  PrimitiveStateModelMetadata,
} from "../../types.js";
import { formatNaturalList } from "../shared.js";

const frameworkLabels = {
  astro: "Astro",
  react: "React",
  "raw-html": "Runtime / HTML",
} as const;

export const cancelableEventSequence: readonly PrimitiveEventCancellationStepMetadata[] = [
  { step: 1, action: "Check internal eligibility and intent." },
  { step: 2, action: "Create one details object for the proposal." },
  {
    step: 3,
    action: "Call the Runtime callback with the details object when the controller exposes one.",
  },
  {
    step: 4,
    action:
      "Dispatch the cancelable DOM event with the same details object, including when the callback canceled it.",
  },
  {
    step: 5,
    action: "Read details.isCanceled, including cancellation caused by preventDefault().",
  },
  { step: 6, action: "Apply the accepted state." },
  { step: 7, action: "Notify Runtime subscribers and other accepted-only observers." },
];

const getRelatedEvents = (
  contract: RuntimeAdapterContract,
  state: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
) => (contract.events ?? []).filter((event) => event.stateModel === state.name);

const toApiList = (
  values: ReadonlyArray<PrimitiveFrameworkBehaviorApiMetadata | undefined>,
): PrimitiveFrameworkBehaviorApiMetadata[] =>
  values.filter((value): value is PrimitiveFrameworkBehaviorApiMetadata => value !== undefined);

const formatApiNames = (apis: readonly PrimitiveFrameworkBehaviorApiMetadata[]) =>
  formatNaturalList(apis.map((api) => api.name));

const buildReactBehavior = (
  state: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
  relatedEvents: readonly NonNullable<RuntimeAdapterContract["events"]>[number][],
): PrimitiveFrameworkBehaviorMetadata => {
  const callbackEvent = relatedEvents.find((event) => event.callbackProp);
  const callback = callbackEvent?.callbackProp;
  const apis = toApiList([
    state.controlledProp ? { kind: "controlled-prop", name: state.controlledProp } : undefined,
    state.defaultProp ? { kind: "default-prop", name: state.defaultProp } : undefined,
    callback ? { kind: "callback", name: callback } : undefined,
  ]);
  const stateProps = apis.filter((api) => api.kind !== "callback");
  const stateSummary =
    state.controlledProp && state.defaultProp
      ? `Use ${state.controlledProp} for controlled state and ${state.defaultProp} for default state`
      : state.controlledProp
        ? `Use ${state.controlledProp} for controlled state`
        : state.defaultProp
          ? `Use ${state.defaultProp} for default state`
          : "The adapter coordinates this state without a dedicated state prop";
  const summary = callback
    ? `${stateSummary}, and ${callback} for ${callbackEvent.cancelable ? "change proposals" : "state changes"}.`
    : `${stateSummary}.`;

  return {
    target: "react",
    label: frameworkLabels.react,
    summary,
    apis: stateProps.length > 0 || callback ? apis : [],
  };
};

const buildAstroBehavior = (
  state: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
  relatedEvents: readonly NonNullable<RuntimeAdapterContract["events"]>[number][],
): PrimitiveFrameworkBehaviorMetadata => {
  const domEvents = relatedEvents.flatMap((event) => (event.domEvent ? [event.domEvent] : []));
  const apis = toApiList([
    state.controlledProp ? { kind: "initial-prop", name: state.controlledProp } : undefined,
    state.defaultProp ? { kind: "default-prop", name: state.defaultProp } : undefined,
    ...domEvents.map((name) => ({ kind: "dom-event" as const, name })),
    state.runtimeSetter ? { kind: "runtime-method", name: state.runtimeSetter } : undefined,
  ]);
  const initialProps = apis.filter(
    (api) => api.kind === "initial-prop" || api.kind === "default-prop",
  );
  const initialPropNames =
    state.controlledProp && state.defaultProp
      ? `${state.controlledProp} or ${state.defaultProp}`
      : formatApiNames(initialProps);
  const actions = [
    initialProps.length > 0 ? `Use ${initialPropNames} for initial state` : undefined,
    domEvents.length > 0 ? `listen for ${formatNaturalList(domEvents)}` : undefined,
    state.runtimeSetter ? `call ${state.runtimeSetter} for later updates` : undefined,
  ].filter((action): action is string => action !== undefined);

  return {
    target: "astro",
    label: frameworkLabels.astro,
    summary:
      actions.length > 0
        ? `${formatNaturalList(actions)}.`
        : "The adapter renders this state when the page loads.",
    apis,
  };
};

const buildRuntimeHtmlBehavior = (
  state: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
  relatedEvents: readonly NonNullable<RuntimeAdapterContract["events"]>[number][],
): PrimitiveFrameworkBehaviorMetadata => {
  const domEvents = relatedEvents.flatMap((event) => (event.domEvent ? [event.domEvent] : []));
  const apis = toApiList([
    state.initialAttribute
      ? { kind: "initial-attribute", name: state.initialAttribute }
      : undefined,
    ...domEvents.map((name) => ({ kind: "dom-event" as const, name })),
    state.runtimeSetter ? { kind: "runtime-method", name: state.runtimeSetter } : undefined,
  ]);
  const actions = [
    state.initialAttribute ? `Use ${state.initialAttribute} for initial state` : undefined,
    domEvents.length > 0 ? `listen for ${formatNaturalList(domEvents)}` : undefined,
    state.runtimeSetter ? `call ${state.runtimeSetter} for later updates` : undefined,
  ].filter((action): action is string => action !== undefined);

  return {
    target: "raw-html",
    label: frameworkLabels["raw-html"],
    summary:
      actions.length > 0
        ? `${formatNaturalList(actions)}.`
        : "The Runtime controller coordinates this state.",
    apis,
  };
};

export const buildPrimitiveStateFrameworkBehavior = (
  contract: RuntimeAdapterContract,
  state: NonNullable<RuntimeAdapterContract["stateModels"]>[number],
): readonly PrimitiveFrameworkBehaviorMetadata[] => {
  const relatedEvents = getRelatedEvents(contract, state);

  return [
    buildReactBehavior(state, relatedEvents),
    buildAstroBehavior(state, relatedEvents),
    buildRuntimeHtmlBehavior(state, relatedEvents),
  ];
};

export const findPrimitivePropStateModel = (contract: RuntimeAdapterContract, propName: string) =>
  (contract.stateModels ?? []).find((state) => {
    if (state.controlledProp === propName || state.defaultProp === propName) return true;
    return getRelatedEvents(contract, state).some((event) => event.callbackProp === propName);
  });

export const frameworkCoordinationSummary =
  "Astro and React share one semantic component API. React coordinates reactive state through controlled and default props plus callbacks. Astro renders initial state and coordinates later changes through DOM events and Runtime methods. Raw HTML uses Runtime attributes, DOM events, and imperative methods.";
