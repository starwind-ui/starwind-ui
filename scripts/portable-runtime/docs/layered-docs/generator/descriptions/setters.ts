import { type RuntimeAdapterContract } from "../../../../contracts/primitive/types.js";
import { type PrimitiveDocsEnrichment, type PrimitiveSetterMetadata } from "../../types.js";
import { formatNaturalList } from "../shared.js";
import { formatPrimitiveOptionSubject, formatPrimitiveStateSubject } from "./subjects.js";

export const toPrimitiveSetterMetadata = (
  contract: RuntimeAdapterContract,
  setter: NonNullable<RuntimeAdapterContract["setters"]>[number],
  enrichment: PrimitiveDocsEnrichment | undefined,
): PrimitiveSetterMetadata => {
  const base = {
    method: setter.method,
    ...(setter.options ? { options: { ...setter.options } } : {}),
    ...(setter.suppressesEmit !== undefined ? { suppressesEmit: setter.suppressesEmit } : {}),
    description:
      enrichment?.setters?.[setter.method] ??
      getPrimitiveSetterFallbackDescription(contract, setter),
    descriptionSource: "authored" as const,
  };

  if ("stateModel" in setter && setter.stateModel) {
    return { ...base, stateModel: setter.stateModel };
  }

  if ("prop" in setter && setter.prop) {
    return { ...base, prop: setter.prop };
  }

  if ("props" in setter && setter.props) {
    return { ...base, props: [...setter.props] };
  }

  throw new Error(`Primitive setter ${setter.method} is missing a target.`);
};

const getPrimitiveSetterFallbackDescription = (
  contract: RuntimeAdapterContract,
  setter: NonNullable<RuntimeAdapterContract["setters"]>[number],
) => {
  const description = commonPrimitiveSetterDescriptions[setter.method];

  if (description) {
    return description({ contract, setter });
  }

  if ("stateModel" in setter && setter.stateModel) {
    return `Updates the ${contract.displayName} ${formatPrimitiveStateSubject(
      setter.stateModel,
    )} from Runtime code.`;
  }

  if ("prop" in setter && setter.prop) {
    return `Updates the ${contract.displayName} ${formatPrimitiveOptionSubject(
      setter.prop,
    )} from Runtime code.`;
  }

  if ("props" in setter && setter.props) {
    return `Updates the ${contract.displayName} ${formatNaturalList(
      setter.props.map(formatPrimitiveOptionSubject),
    )} from Runtime code.`;
  }

  return "Updates Runtime options after initialization.";
};

type PrimitiveSetterDescriptionContext = {
  readonly contract: RuntimeAdapterContract;
  readonly setter: NonNullable<RuntimeAdapterContract["setters"]>[number];
};

type PrimitiveSetterDescriptionFactory = (context: PrimitiveSetterDescriptionContext) => string;

const commonPrimitiveSetterDescriptions: Record<string, PrimitiveSetterDescriptionFactory> = {
  setOpen: ({ contract }) => `Opens or closes ${contract.displayName} from Runtime code.`,
  setValue: ({ contract }) =>
    `Updates the current ${contract.displayName} value from Runtime code.`,
  setChecked: ({ contract }) =>
    `Updates whether ${contract.displayName} is checked from Runtime code.`,
  setDisabled: ({ contract }) =>
    `Updates whether ${contract.displayName} is disabled from Runtime code.`,
  setName: ({ contract }) =>
    `Updates the ${contract.displayName} form field name from Runtime code.`,
  setFormOptions: ({ contract }) =>
    `Updates ${contract.displayName} form-related options from Runtime code.`,
  setReadOnly: ({ contract }) =>
    `Updates whether ${contract.displayName} is read-only from Runtime code.`,
  setOrientation: ({ contract }) =>
    `Updates the ${contract.displayName} orientation from Runtime code.`,
  setIndeterminate: ({ contract }) =>
    `Updates whether ${contract.displayName} is in a mixed state from Runtime code.`,
  setInputValue: ({ contract }) =>
    `Updates the ${contract.displayName} text input value from Runtime code.`,
  setUploading: ({ contract }) =>
    `Updates whether ${contract.displayName} is uploading files from Runtime code.`,
  setDirty: ({ contract }) => `Updates whether ${contract.displayName} is dirty from Runtime code.`,
  setInvalid: ({ contract }) =>
    `Updates whether ${contract.displayName} is invalid from Runtime code.`,
  setTouched: ({ contract }) =>
    `Updates whether ${contract.displayName} is touched from Runtime code.`,
  setFormatOptions: ({ contract }) =>
    `Updates ${contract.displayName} formatting options from Runtime code.`,
  setRequired: ({ contract }) =>
    `Updates whether ${contract.displayName} is required from Runtime code.`,
  setMobileOpen: ({ contract }) =>
    `Opens or closes the mobile ${contract.displayName} panel from Runtime code.`,
  setOptions: () => "Updates Runtime options after initialization.",
  setPressed: ({ contract }) =>
    `Updates whether ${contract.displayName} is pressed from Runtime code.`,
  setLoopFocus: ({ contract }) =>
    `Updates ${contract.displayName} keyboard focus wrapping from Runtime code.`,
  setMultiple: ({ contract }) =>
    `Updates whether ${contract.displayName} allows multiple values from Runtime code.`,
} satisfies Record<string, PrimitiveSetterDescriptionFactory>;
