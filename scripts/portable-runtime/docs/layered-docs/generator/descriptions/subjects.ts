import { toDisplayTitle } from "../shared.js";

export const toDescriptionLabel = (value: string) => toDisplayTitle(value).toLowerCase();

export const formatPrimitiveStateSubject = (value: string) => {
  const label = toDescriptionLabel(value);

  if (label === "state") return "current state";
  if (label.endsWith(" state")) return label;
  return `${label} state`;
};

export const formatPrimitivePropSubject = (value: string) => {
  const label = toDescriptionLabel(value);

  if (label === "prop") return "prop value";
  if (label.endsWith(" prop")) return label;
  return `${label} prop`;
};

export const formatPrimitiveOptionSubject = (value: string) => {
  const label = toDescriptionLabel(value);

  if (label === "option") return "option value";
  if (label.endsWith(" option")) return label;
  return `${label} option`;
};
