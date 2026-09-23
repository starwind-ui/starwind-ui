import type { AdapterComponentFile } from "../types.js";

/** Resolve build-time acceptance wiring before a Vue printer can publish a model. */
export function getVueAcceptedModelEvent(file: AdapterComponentFile, state: string): string {
  const publication = file.component.acceptedModelPublications?.find(
    (entry) => entry.state === state,
  );
  if (publication?.notification !== "controller-subscription" || !publication.event) {
    throw new TypeError(
      `Vue ${file.component.name} model ${state} requires an accepted controller subscription.`,
    );
  }
  return publication.event;
}
