import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

import { selectStyledContract } from "../contracts/styled/components/select.js";

type TailwindVariantsFactory = (config: unknown) => (props?: Record<string, unknown>) => string;

const demoRequire = createRequire(new URL("../../../apps/demo/package.json", import.meta.url));
const { tv } = demoRequire("tailwind-variants") as { tv: TailwindVariantsFactory };
const selectItemDefinition = selectStyledContract.variants?.selectItem;

if (!selectItemDefinition) {
  throw new Error("Select styled contract is missing its selectItem variant definition.");
}

const selectItem = tv(selectItemDefinition);

function classList(value: string) {
  return value.split(/\s+/).filter(Boolean);
}

// tailwind-merge 3.7.0 is the first release that resolves px-* against ps-* and pe-*.
// Tailwind writes ps-* and pe-* after px-*, so an older tailwind-merge keeps both and the
// user's px-* override loses in the browser.
describe("Styled logical padding overrides", () => {
  it("lets a user px-* class replace the base ps-* and pe-* classes", () => {
    const classes = classList(selectItem({ class: "px-4" }));

    expect(classes).toContain("px-4");
    expect(classes).not.toContain("ps-2");
    expect(classes).not.toContain("pe-8");
  });

  it("lets a user px-* class replace the inset ps-* class", () => {
    const classes = classList(selectItem({ inset: true, class: "px-4" }));

    expect(classes).toContain("px-4");
    expect(classes).not.toContain("ps-8");
    expect(classes).not.toContain("pe-8");
  });
});
