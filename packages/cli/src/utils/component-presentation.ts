type ComponentPresentationEntry = {
  framework?: string;
  name: string;
  registry?: string;
};

type ComponentPresentationIdentity = string | readonly string[] | undefined;

export function compareComponentPresentation(
  left: ComponentPresentationEntry,
  right: ComponentPresentationEntry,
): number {
  return compareComponentPresentationValues(
    left.name,
    right.name,
    [left.framework ?? "", left.registry ?? ""],
    [right.framework ?? "", right.registry ?? ""],
  );
}

export function sortComponentPresentation<T extends ComponentPresentationEntry>(
  items: readonly T[],
): T[] {
  return [...items].sort(compareComponentPresentation);
}

export function sortComponentPresentationByName<T>(
  items: readonly T[],
  getName: (item: T) => string,
  getIdentity: (item: T) => ComponentPresentationIdentity = () => undefined,
): T[] {
  return [...items].sort((left, right) =>
    compareComponentPresentationValues(
      getName(left),
      getName(right),
      getIdentity(left),
      getIdentity(right),
    ),
  );
}

export function sortComponentNames(names: readonly string[]): string[] {
  return sortComponentPresentationByName(names, (name) => name);
}

function compareComponentPresentationValues(
  leftName: string,
  rightName: string,
  leftIdentity: ComponentPresentationIdentity,
  rightIdentity: ComponentPresentationIdentity,
): number {
  const primary = leftName
    .toLocaleLowerCase("en")
    .localeCompare(rightName.toLocaleLowerCase("en"), "en");
  if (primary !== 0) return primary;

  const nameTie = compareCodePoints(leftName, rightName);
  if (nameTie !== 0) return nameTie;

  return toIdentityParts(leftIdentity)
    .join("\u0000")
    .localeCompare(toIdentityParts(rightIdentity).join("\u0000"), "en");
}

function toIdentityParts(identity: ComponentPresentationIdentity): readonly string[] {
  if (identity === undefined) return [];
  return typeof identity === "string" ? [identity] : identity;
}

function compareCodePoints(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? -1 : 1;
}
