import type { PrimitiveEventContract } from "../../contracts/primitive/types.js";
import type { AdapterOutputModel } from "../framework-adapters/types.js";

/** Preserve accepted notification connections through family/spec output construction. */
export function withAcceptedModelPublications(
  model: AdapterOutputModel,
  events: readonly PrimitiveEventContract[],
  rootPart: string,
): AdapterOutputModel {
  const publications = events
    .filter((event) => event.acceptanceNotification === "controller-subscription")
    .map((event) => {
      if (
        !event.stateModel ||
        event.emitsFrom !== rootPart ||
        event.cancelable !== true ||
        event.callbackTiming !== "before-state-commit"
      ) {
        throw new TypeError(
          `${event.name} requires a cancelable root state proposal for accepted model publication.`,
        );
      }
      return {
        event: event.name,
        state: event.stateModel,
        notification: "controller-subscription" as const,
      };
    });
  if (publications.length === 0) return model;
  return {
    ...model,
    files: model.files.map((file) =>
      file.kind === "component" && file.component.family?.part === "root"
        ? { ...file, component: { ...file.component, acceptedModelPublications: publications } }
        : file,
    ),
  };
}
