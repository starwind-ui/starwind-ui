import semver from "semver";

declare const validatedPackageNameBrand: unique symbol;
declare const validatedPackageSpecBrand: unique symbol;

export type ValidatedPackageName = string & {
  readonly [validatedPackageNameBrand]: true;
};

export type ValidatedPackageSpec = string & {
  readonly [validatedPackageSpecBrand]: true;
};

const MAX_PACKAGE_NAME_LENGTH = 214;
const PACKAGE_NAME_SEGMENT = /^[a-z0-9](?:[a-z0-9._~-]*[a-z0-9])?$/;
const DIST_TAG = /^[a-z][a-z0-9._-]{0,127}$/;
const CONTROL_CHARACTER = /[\u0000-\u001f\u007f]/;
const PACKAGE_NAME_WHITESPACE_OR_CONTROL = /[\s\u0000-\u001f\u007f]/;

function invalidPackageValue(field: string, expected: string): Error {
  return new Error(`Invalid ${field}: ${expected}.`);
}

export function parsePackageName(
  value: string,
  field = "registry package name",
): ValidatedPackageName {
  if (
    value.length === 0 ||
    value.length > MAX_PACKAGE_NAME_LENGTH ||
    PACKAGE_NAME_WHITESPACE_OR_CONTROL.test(value) ||
    value.startsWith("-")
  ) {
    throw invalidPackageValue(field, "expected a lowercase npm registry package name");
  }

  if (value.startsWith("@")) {
    const scopedMatch = /^@([^/]+)\/([^/]+)$/.exec(value);
    if (
      !scopedMatch ||
      !PACKAGE_NAME_SEGMENT.test(scopedMatch[1]!) ||
      !PACKAGE_NAME_SEGMENT.test(scopedMatch[2]!)
    ) {
      throw invalidPackageValue(field, "expected a lowercase scoped npm registry package name");
    }
  } else if (!PACKAGE_NAME_SEGMENT.test(value)) {
    throw invalidPackageValue(field, "expected a lowercase npm registry package name");
  }

  return value as ValidatedPackageName;
}

export function parsePackageSpec(
  value: string,
  field = "registry package dependency",
): ValidatedPackageSpec {
  if (value.length === 0 || value.trim() !== value || CONTROL_CHARACTER.test(value)) {
    throw invalidPackageValue(
      field,
      "expected an npm registry package name with an optional semver range or dist-tag",
    );
  }

  let packageName = value;
  let selector: string | undefined;
  const selectorSeparator = value.lastIndexOf("@");
  const scopedNameSlash = value.startsWith("@") ? value.indexOf("/") : -1;
  const hasSelector = value.startsWith("@")
    ? selectorSeparator > scopedNameSlash
    : selectorSeparator > 0;

  if (hasSelector) {
    packageName = value.slice(0, selectorSeparator);
    selector = value.slice(selectorSeparator + 1);
  }

  parsePackageName(packageName, field);

  if (
    selector !== undefined &&
    (selector.length === 0 ||
      (semver.valid(selector) === null &&
        semver.validRange(selector) === null &&
        !DIST_TAG.test(selector)))
  ) {
    throw invalidPackageValue(
      field,
      "expected an npm registry package name with an optional semver range or dist-tag",
    );
  }

  return value as ValidatedPackageSpec;
}
