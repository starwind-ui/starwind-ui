export type DialogOwnedPortal = {
  requestOwnerClose(): void;
  resumeOwnerPlacement(): void;
  suspendOwnerPlacement(): void;
};

type DialogPortalOwnerState = {
  closing: boolean;
  placementReady: boolean;
  requested: WeakSet<DialogOwnedPortal>;
  portals: Set<DialogOwnedPortal>;
};

const owners = new WeakMap<HTMLDialogElement, DialogPortalOwnerState>();

export function registerDialogOwnedPortal(
  owner: HTMLDialogElement,
  portal: DialogOwnedPortal,
): () => void {
  const state = getOwnerState(owner);
  state.portals.add(portal);
  if (!state.placementReady) portal.suspendOwnerPlacement();
  if (state.closing) requestOwnerClose(state, portal);

  return () => {
    state.portals.delete(portal);
    if (state.portals.size === 0 && !state.closing && state.placementReady) owners.delete(owner);
  };
}

export function requestDialogOwnedFloatingPortalClose(owner: HTMLDialogElement): void {
  const state = getOwnerState(owner);
  state.closing = true;
  for (const portal of [...state.portals]) requestOwnerClose(state, portal);
}

export function suspendDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  const state = getOwnerState(owner);
  state.placementReady = false;
  for (const portal of [...state.portals]) portal.suspendOwnerPlacement();
}

export function resumeDialogOwnedFloatingPortals(owner: HTMLDialogElement): void {
  const state = owners.get(owner);
  if (!state) return;

  state.closing = false;
  state.placementReady = true;
  state.requested = new WeakSet<DialogOwnedPortal>();
  for (const portal of [...state.portals]) portal.resumeOwnerPlacement();
  if (state.portals.size === 0) owners.delete(owner);
}

function getOwnerState(owner: HTMLDialogElement): DialogPortalOwnerState {
  const existing = owners.get(owner);
  if (existing) return existing;

  const state: DialogPortalOwnerState = {
    closing: false,
    placementReady: true,
    requested: new WeakSet<DialogOwnedPortal>(),
    portals: new Set<DialogOwnedPortal>(),
  };
  owners.set(owner, state);
  return state;
}

function requestOwnerClose(state: DialogPortalOwnerState, portal: DialogOwnedPortal): void {
  if (state.requested.has(portal)) return;
  state.requested.add(portal);
  portal.requestOwnerClose();
}
