import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import AlertDialog from "../../../apps/react-demo/src/components/starwind-runtime/alert-dialog";

describe("Styled AlertDialog server markup", () => {
  it.each([
    ["Action", AlertDialog.Action, "alert-dialog-action"],
    ["Cancel", AlertDialog.Cancel, "alert-dialog-cancel"],
  ] as const)("keeps the default %s control as the direct button root", (_name, Control, slot) => {
    const markup = renderToStaticMarkup(<Control data-control>{slot}</Control>);

    expect(markup).toMatch(/^<button\b/);
    expect(markup.match(/<button\b/g) ?? []).toHaveLength(1);
    expect(markup).not.toContain("<div");
    expect(markup).not.toContain("data-as-child");
    expect(markup).toContain(`data-slot="${slot}"`);
    expect(markup).toContain('data-sw-alert-dialog-close="true"');
    expect(markup).toMatch(new RegExp(`>${slot}</button>$`));
  });
});
