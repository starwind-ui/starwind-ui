import { describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import { selectVueStyledContracts } from "../../renderers/framework-adapters/vue/styled.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const FOUNDATIONAL_GROUPS = [
  "alert",
  "aspect-ratio",
  "badge",
  "kbd",
  "label",
  "separator",
  "skeleton",
  "spinner",
] as const;

const ALERT_ROLE_EXPRESSION =
  'role ?? (variant === "error" || variant === "warning" ? "alert" : "status")';

const EXPECTED_NATIVE_REF_TARGETS = [
  { component: "Alert", group: "alert", targetType: "HTMLDivElement" },
  { component: "AlertDescription", group: "alert", targetType: "HTMLParagraphElement" },
  { component: "AlertTitle", group: "alert", targetType: "HTMLHeadingElement" },
  { component: "Kbd", group: "kbd", targetType: "HTMLElement" },
  { component: "KbdGroup", group: "kbd", targetType: "HTMLElement" },
  { component: "Label", group: "label", targetType: "HTMLLabelElement" },
  { component: "Separator", group: "separator", targetType: "HTMLDivElement" },
  { component: "Skeleton", group: "skeleton", targetType: "HTMLDivElement" },
] as const;

describe("Vue portable foundational Styled contracts", () => {
  it("selects all eight contracts through the generic Vue Styled scope", () => {
    const selected = selectVueStyledContracts(starwindStyledContracts, FOUNDATIONAL_GROUPS);

    expect(selected.map(({ component }) => component)).toEqual([...FOUNDATIONAL_GROUPS].sort());
    expect(() => validateStyledAdapterContracts(selected)).not.toThrow();
  });

  it.each(FOUNDATIONAL_GROUPS)("projects %s through the shared Styled Output Model", (group) => {
    const contract = starwindStyledContracts.find(({ component }) => component === group);
    expect(contract).toBeDefined();

    const output = projectStyledOutputComponentGroup(contract!);
    expect(output.component).toBe(group);
    expect(output.components.map(({ exportName }) => exportName).sort()).toEqual(
      [...contract!.publicExports].sort(),
    );
    expect(output.components.flatMap(({ render }) => collectDataSlots(render))).not.toContain(
      undefined,
    );
  });

  it.each([
    { expected: "log", role: "log", variant: "error" },
    { expected: "alert", role: undefined, variant: "error" },
    { expected: "alert", role: undefined, variant: "warning" },
    { expected: "status", role: undefined, variant: "default" },
  ])("locks Alert role semantics for $variant with role $role", ({ expected, role, variant }) => {
    const contract = starwindStyledContracts.find(({ component }) => component === "alert");
    expect(contract).toBeDefined();
    const variable = contract!.components[0]?.variables?.find(
      ({ name }) => name === "inferredRole",
    );
    expect(variable?.value).toEqual({ type: "raw", code: ALERT_ROLE_EXPRESSION });

    const output = projectStyledOutputComponentGroup(contract!);
    const projectedVariable = output.components[0]?.variables.find(
      ({ name }) => name === "inferredRole",
    );
    expect(projectedVariable?.value).toEqual({ type: "raw", code: ALERT_ROLE_EXPRESSION });

    const evaluate = Function("role", "variant", `return ${ALERT_ROLE_EXPRESSION};`) as (
      role: string | undefined,
      variant: string | undefined,
    ) => string;
    expect(evaluate(role, variant)).toBe(expected);
  });

  it("keeps the foundation cohort's Vue source facts in their contracts", () => {
    const aspectRatio = findContract("aspect-ratio").components[0];
    const badge = findContract("badge").components[0];

    expect(aspectRatio?.props?.fields).toContainEqual({
      frameworks: ["vue"],
      name: "as",
      optional: true,
      type: "string",
    });
    expect(aspectRatio?.variables).toContainEqual({
      frameworks: ["vue"],
      name: "wrapperStyle",
      value: { type: "raw", code: "{ paddingBottom: `${100 / ratio}%` }" },
    });
    expect(aspectRatio?.render[0]).toMatchObject({
      children: [{ tag: "Tag", tagBinding: true, type: "element" }],
      type: "element",
    });
    expect(badge?.variables).toContainEqual({
      frameworks: ["vue"],
      name: "rest",
      value: { type: "raw", code: "rest" },
    });
    expect(badge?.render[0]).toMatchObject({ tag: "Tag", tagBinding: true, type: "element" });
  });

  it("scopes direct native ref targets to Vue and preserves them through projection", () => {
    for (const { component, group, targetType } of EXPECTED_NATIVE_REF_TARGETS) {
      const contractComponent = findContract(group).components.find(
        ({ exportName }) => exportName === component,
      );
      expect(contractComponent?.forwardRef).toEqual({ frameworks: ["vue"], targetType });

      const outputComponent = projectStyledOutputComponentGroup(
        findContract(group),
      ).components.find(({ exportName }) => exportName === component);
      expect(outputComponent?.forwardRef).toEqual({ targetScopes: ["vue"], targetType });
    }
  });
});

function findContract(component: string) {
  const contract = starwindStyledContracts.find((candidate) => candidate.component === component);
  if (!contract) throw new TypeError(`Missing ${component} contract.`);
  return contract;
}

function collectDataSlots(
  nodes: ReturnType<typeof projectStyledOutputComponentGroup>["components"][number]["render"],
): Array<string | undefined> {
  return nodes.flatMap((node): Array<string | undefined> => {
    if (!("attrs" in node)) {
      return "children" in node && node.children ? collectDataSlots(node.children) : [];
    }
    const slots =
      node.attrs
        ?.filter((attribute) => attribute.name === "data-slot")
        .map((attribute) =>
          attribute.value?.type === "literal" && typeof attribute.value.value === "string"
            ? attribute.value.value
            : attribute.value?.type === "variable"
              ? attribute.value.name
              : undefined,
        ) ?? [];
    return [
      ...slots,
      ...("children" in node && node.children ? collectDataSlots(node.children) : []),
    ];
  });
}
