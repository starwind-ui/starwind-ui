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

export type AlertDialogCloseCompleteDetails = DialogCloseCompleteDetails;
export type AlertDialogOpenChangeDetails = DialogOpenChangeDetails;
export type AlertDialogOpenChangeReason = DialogOpenChangeReason;
export type AlertDialogSetOpenOptions = DialogSetOpenOptions;
export type AlertDialogInstance = DialogInstance;

export type AlertDialogOptions = Omit<DialogOptions, "role">;

const ALERT_DIALOG_ROOT_ATTRIBUTE = "data-sw-alert-dialog";
const ALERT_DIALOG_POPUP_ATTRIBUTE = "data-sw-alert-dialog-popup";
const ALERT_DIALOG_TRIGGER_ATTRIBUTE = "data-sw-alert-dialog-trigger";
const ALERT_DIALOG_TARGET_ID_ATTRIBUTE = "data-sw-alert-dialog-target-id";
const ALERT_DIALOG_BACKDROP_ATTRIBUTE = "data-sw-alert-dialog-backdrop";
const ALERT_DIALOG_CLOSE_ATTRIBUTE = "data-sw-alert-dialog-close";
const ALERT_DIALOG_TITLE_ATTRIBUTE = "data-sw-alert-dialog-title";
const ALERT_DIALOG_DESCRIPTION_ATTRIBUTE = "data-sw-alert-dialog-description";
const DIALOG_TRIGGER_ATTRIBUTE = "data-sw-dialog-trigger";
const DIALOG_TARGET_ID_ATTRIBUTE = "data-sw-dialog-target-id";
const DIALOG_BACKDROP_ATTRIBUTE = "data-sw-dialog-overlay";
const DIALOG_POPUP_ATTRIBUTE = "data-sw-dialog-content";
const DIALOG_CLOSE_ATTRIBUTE = "data-sw-dialog-close";
const DIALOG_TITLE_ATTRIBUTE = "data-sw-dialog-title";
const DIALOG_DESCRIPTION_ATTRIBUTE = "data-sw-dialog-description";

const instances = new WeakMap<HTMLElement, AlertDialogInstance>();

export function createAlertDialog(
  root: HTMLElement,
  options: AlertDialogOptions = {},
): AlertDialogInstance {
  assertHTMLElement(root, "createAlertDialog root");

  const existing = instances.get(root);
  if (existing) return existing;

  normalizeAlertDialogMarkup(root);

  const { closeOnEscape, closeOnOutsideInteract, modal, ...dialogOptions } = options;

  const instance = createDialog(root, {
    closeOnEscape: closeOnEscape ?? readBooleanAttribute(root, "data-close-on-escape", true),
    closeOnOutsideInteract:
      closeOnOutsideInteract ?? readBooleanAttribute(root, "data-close-on-outside-interact", false),
    modal: modal ?? readBooleanAttribute(root, "data-modal", true),
    ...dialogOptions,
    role: "alertdialog",
  });
  const wrappedInstance = wrapAlertDialogInstance(root, instance);
  instances.set(root, wrappedInstance);

  return wrappedInstance;
}

function normalizeAlertDialogMarkup(root: HTMLElement): void {
  root.setAttribute(ALERT_DIALOG_ROOT_ATTRIBUTE, "");

  root.querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_TRIGGER_ATTRIBUTE}]`).forEach((trigger) => {
    trigger.setAttribute(DIALOG_TRIGGER_ATTRIBUTE, "");
  });
  normalizeExternalAlertDialogTriggers(root);

  root.querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_BACKDROP_ATTRIBUTE}]`).forEach((backdrop) => {
    backdrop.setAttribute(DIALOG_BACKDROP_ATTRIBUTE, "");
  });

  root.querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_POPUP_ATTRIBUTE}]`).forEach((popup) => {
    popup.setAttribute(DIALOG_POPUP_ATTRIBUTE, "");
    popup.setAttribute("role", "alertdialog");
  });

  root.querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_CLOSE_ATTRIBUTE}]`).forEach((close) => {
    close.setAttribute(DIALOG_CLOSE_ATTRIBUTE, "");
  });

  root.querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_TITLE_ATTRIBUTE}]`).forEach((title) => {
    title.setAttribute(DIALOG_TITLE_ATTRIBUTE, "");
  });

  root
    .querySelectorAll<HTMLElement>(`[${ALERT_DIALOG_DESCRIPTION_ATTRIBUTE}]`)
    .forEach((description) => {
      description.setAttribute(DIALOG_DESCRIPTION_ATTRIBUTE, "");
    });
}

function normalizeExternalAlertDialogTriggers(root: HTMLElement): void {
  const rootId = root.id;
  if (!rootId) return;

  document
    .querySelectorAll<HTMLElement>(
      `[${ALERT_DIALOG_TRIGGER_ATTRIBUTE}][${ALERT_DIALOG_TARGET_ID_ATTRIBUTE}]`,
    )
    .forEach((trigger) => {
      if (
        root.contains(trigger) ||
        trigger.getAttribute(ALERT_DIALOG_TARGET_ID_ATTRIBUTE) !== rootId
      ) {
        return;
      }

      trigger.setAttribute(DIALOG_TRIGGER_ATTRIBUTE, "");
      trigger.setAttribute(DIALOG_TARGET_ID_ATTRIBUTE, rootId);
    });
}

function wrapAlertDialogInstance(root: HTMLElement, instance: DialogInstance): AlertDialogInstance {
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
