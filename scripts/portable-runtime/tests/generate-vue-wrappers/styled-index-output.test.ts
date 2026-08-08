import { describe, expect, it } from "vitest";

import { badgeStyledContract } from "../../contracts/styled/components/badge.js";
import { buttonStyledContract } from "../../contracts/styled/components/button.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { renderIndex } from "../../renderers/framework-adapters/vue/styled/index-output.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

describe("Vue Styled index output", () => {
  it("names aggregate defaults without adding the private binding to named exports", () => {
    const source = renderIndex(projectStyledOutputComponentGroup(buttonStyledContract));

    expect(source).toContain("const ButtonParts = { Root: Button };");
    expect(source).toContain("export default ButtonParts;");
    expect(source).not.toMatch(/export default\s*{/);
    expect(source).not.toMatch(/export\s*{[^}]*\bButtonParts\b/);
  });

  it("keeps direct component defaults direct", () => {
    const source = renderIndex(projectStyledOutputComponentGroup(badgeStyledContract));

    expect(source).toContain("export default Badge;");
    expect(source).not.toContain("BadgeParts");
  });

  it("uses the model-owned collision suffix in target output", () => {
    const contract: StyledAdapterContract = {
      ...structuredClone(buttonStyledContract),
      constants: { ButtonParts: '"reserved"' },
    };
    const source = renderIndex(projectStyledOutputComponentGroup(contract));

    expect(source).toContain('const ButtonParts = "reserved";');
    expect(source).toContain("const ButtonParts2 = { Root: Button };");
    expect(source).toContain("export default ButtonParts2;");
    expect(source).not.toMatch(/export\s*{[^}]*\bButtonParts2\b/);
  });
});
