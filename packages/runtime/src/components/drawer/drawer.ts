import { assertHTMLElement, readBooleanAttribute } from "../../internal/dom";
import {
  createDialog,
  type DialogCloseCompleteDetails,
  type DialogInstance,
  type DialogOpenChangeDetails,
  type DialogOpenChangeReason,
  type DialogOptions,
  type DialogSetOpenOptions,
} from "../dialog";

export type DrawerCloseCompleteDetails = DialogCloseCompleteDetails;
export type DrawerOpenChangeDetails = DialogOpenChangeDetails;
export type DrawerOpenChangeReason = DialogOpenChangeReason;
export type DrawerSetOpenOptions = DialogSetOpenOptions;
export type DrawerInstance = DialogInstance;

export type DrawerOptions = Omit<DialogOptions, "role">;

const DRAWER_ROOT_ATTRIBUTE = "data-sw-drawer";
const DRAWER_POPUP_ATTRIBUTE = "data-sw-drawer-popup";
const DRAWER_TRIGGER_ATTRIBUTE = "data-sw-drawer-trigger";
const DRAWER_TARGET_ID_ATTRIBUTE = "data-sw-drawer-target-id";
const DRAWER_BACKDROP_ATTRIBUTE = "data-sw-drawer-backdrop";
const DRAWER_CLOSE_ATTRIBUTE = "data-sw-drawer-close";
const DRAWER_TITLE_ATTRIBUTE = "data-sw-drawer-title";
const DRAWER_DESCRIPTION_ATTRIBUTE = "data-sw-drawer-description";
const DIALOG_TRIGGER_ATTRIBUTE = "data-sw-dialog-trigger";
const DIALOG_TARGET_ID_ATTRIBUTE = "data-sw-dialog-target-id";
const DIALOG_BACKDROP_ATTRIBUTE = "data-sw-dialog-overlay";
const DIALOG_POPUP_ATTRIBUTE = "data-sw-dialog-content";
const DIALOG_CLOSE_ATTRIBUTE = "data-sw-dialog-close";
const DIALOG_TITLE_ATTRIBUTE = "data-sw-dialog-title";
const DIALOG_DESCRIPTION_ATTRIBUTE = "data-sw-dialog-description";

const instances = new WeakMap<HTMLElement, DrawerInstance>();

export function createDrawer(root: HTMLElement, options: DrawerOptions = {}): DrawerInstance {
  assertHTMLElement(root, "createDrawer root");

  const existing = instances.get(root);
  if (existing) return existing;

  normalizeDrawerMarkup(root);

  const { closeOnEscape, closeOnOutsideInteract, modal, ...dialogOptions } = options;

  const instance = createDialog(root, {
    closeOnEscape: closeOnEscape ?? readBooleanAttribute(root, "data-close-on-escape", true),
    closeOnOutsideInteract:
      closeOnOutsideInteract ?? readBooleanAttribute(root, "data-close-on-outside-interact", true),
    modal: modal ?? readBooleanAttribute(root, "data-modal", true),
    ...dialogOptions,
    role: "dialog",
  });
  const wrappedInstance = wrapDrawerInstance(root, instance);
  instances.set(root, wrappedInstance);

  return wrappedInstance;
}

function normalizeDrawerMarkup(root: HTMLElement): void {
  root.setAttribute(DRAWER_ROOT_ATTRIBUTE, "");

  root.querySelectorAll<HTMLElement>(`[${DRAWER_TRIGGER_ATTRIBUTE}]`).forEach((trigger) => {
    trigger.setAttribute(DIALOG_TRIGGER_ATTRIBUTE, "");
  });
  normalizeExternalDrawerTriggers(root);

  root.querySelectorAll<HTMLElement>(`[${DRAWER_BACKDROP_ATTRIBUTE}]`).forEach((backdrop) => {
    backdrop.setAttribute(DIALOG_BACKDROP_ATTRIBUTE, "");
  });

  root.querySelectorAll<HTMLElement>(`[${DRAWER_POPUP_ATTRIBUTE}]`).forEach((popup) => {
    popup.setAttribute(DIALOG_POPUP_ATTRIBUTE, "");
    popup.setAttribute("role", "dialog");
  });

  root.querySelectorAll<HTMLElement>(`[${DRAWER_CLOSE_ATTRIBUTE}]`).forEach((close) => {
    close.setAttribute(DIALOG_CLOSE_ATTRIBUTE, "");
  });

  root.querySelectorAll<HTMLElement>(`[${DRAWER_TITLE_ATTRIBUTE}]`).forEach((title) => {
    title.setAttribute(DIALOG_TITLE_ATTRIBUTE, "");
  });

  root.querySelectorAll<HTMLElement>(`[${DRAWER_DESCRIPTION_ATTRIBUTE}]`).forEach((description) => {
    description.setAttribute(DIALOG_DESCRIPTION_ATTRIBUTE, "");
  });
}

function normalizeExternalDrawerTriggers(root: HTMLElement): void {
  const rootId = root.id;
  if (!rootId) return;

  document
    .querySelectorAll<HTMLElement>(`[${DRAWER_TRIGGER_ATTRIBUTE}][${DRAWER_TARGET_ID_ATTRIBUTE}]`)
    .forEach((trigger) => {
      if (root.contains(trigger) || trigger.getAttribute(DRAWER_TARGET_ID_ATTRIBUTE) !== rootId) {
        return;
      }

      trigger.setAttribute(DIALOG_TRIGGER_ATTRIBUTE, "");
      trigger.setAttribute(DIALOG_TARGET_ID_ATTRIBUTE, rootId);
    });
}

function wrapDrawerInstance(root: HTMLElement, instance: DialogInstance): DrawerInstance {
  const originalDestroy = instance.destroy.bind(instance);

  return {
    root: instance.root,
    open: instance.open.bind(instance),
    close: instance.close.bind(instance),
    toggle: instance.toggle.bind(instance),
    setOpen: instance.setOpen.bind(instance),
    getOpen: instance.getOpen.bind(instance),
    subscribe: instance.subscribe.bind(instance),
    destroy() {
      originalDestroy();
      instances.delete(root);
    },
  };
}
