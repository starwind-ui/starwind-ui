import type { StyledOutputComponent, StyledOutputTypeParameter } from "./types.js";

/** Returns the component type parameters, or undefined when the component declares none. */
export function getStyledOutputTypeParameters(
  component: Pick<StyledOutputComponent, "typeParameters">,
): readonly StyledOutputTypeParameter[] | undefined {
  return component.typeParameters?.length ? component.typeParameters : undefined;
}

/** Prints a type parameter declaration list such as `T extends object = {}, D = unknown`. */
export function renderStyledTypeParameterDeclarations(
  typeParameters: readonly StyledOutputTypeParameter[],
): string {
  return typeParameters
    .map(
      (parameter) =>
        `${parameter.name}${parameter.constraint ? ` extends ${parameter.constraint}` : ""}${
          parameter.default ? ` = ${parameter.default}` : ""
        }`,
    )
    .join(", ");
}

/** Prints a type argument list such as `T, D`. */
export function renderStyledTypeParameterArguments(
  typeParameters: readonly StyledOutputTypeParameter[],
): string {
  return typeParameters.map((parameter) => parameter.name).join(", ");
}
