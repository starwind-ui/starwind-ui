import assert from "node:assert/strict";

const GATES = {
  "legacy-switch": [
    "legacy-switch-ordinary-rtl-checked-inline-end",
    "legacy-switch-nested-rtl-checked-inline-end",
  ],
  "legacy-progress": [
    "legacy-progress-ordinary-rtl-fill-inline-start",
    "legacy-progress-nested-rtl-fill-inline-start",
  ],
  "surface-slider": ["slider-rtl-ten-percent-pointer"],
};

export function addStageGates(cases, expectations) {
  const staged = cases.map((item) => {
    const names = GATES[item.id];
    if (!names) return item;
    return {
      ...item,
      fixtures: Object.fromEntries(
        Object.entries(item.fixtures).map(([target, fixture]) => [
          target,
          { ...fixture, assertions: [...fixture.assertions, ...names] },
        ]),
      ),
    };
  });
  const stagedExpectations = expectations.map((expectation) => {
    const names = GATES[expectation.id];
    if (!names) return expectation;
    return {
      ...expectation,
      async run(page, target, ctx) {
        await expectation.run(page, target, ctx);
        for (const name of names)
          await ctx.check(name, async () => {
            const evidence =
              expectation.id === "surface-slider"
                ? await measureSliderPointer(page)
                : await measureLegacyEdge(
                    page,
                    expectation.id,
                    name.includes("nested") ? "nested-rtl-in-ltr" : "ordinary-rtl",
                  );
            ctx.observe(name, evidence);
            if (expectation.id === "surface-slider")
              assert(
                Math.abs(evidence.value - 10) <= 2,
                `RTL physical right 10% pointer gives value 10, got ${evidence.value}`,
              );
            else assert.equal(evidence.actual, evidence.expected, `${name} desired physical edge`);
          });
      },
    };
  });
  return { cases: staged, expectations: stagedExpectations };
}

async function measureLegacyEdge(page, id, scopeId) {
  return page.locator(`[data-legacy-scope="${scopeId}"]`).evaluate(
    (scope, componentId) => {
      const host = scope.querySelector(`[data-legacy-component="${componentId}"]`);
      if (!host) throw new Error(`${componentId} legacy host is missing`);
      if (componentId === "switch") {
        const track = host.querySelector('[role="switch"]');
        const thumb = track?.querySelector('[data-slot="switch-toggle"]');
        if (!track || !thumb) throw new Error("Checked switch track or thumb is missing");
        const a = track.getBoundingClientRect(),
          b = thumb.getBoundingClientRect();
        const actual =
          b.left + b.width / 2 < a.left + a.width / 2 ? "physical-left" : "physical-right";
        return {
          scope: scope.getAttribute("data-legacy-scope"),
          checked: track.getAttribute("aria-checked"),
          track: { x: a.x, width: a.width },
          thumb: { x: b.x, width: b.width },
          actual,
          expected: "physical-left",
        };
      }
      const track = host.querySelector('[role="progressbar"]');
      const fill = track?.firstElementChild;
      if (!track || !fill) throw new Error("Progress track or fill is missing");
      const a = track.getBoundingClientRect(),
        b = fill.getBoundingClientRect();
      const left = Math.max(a.left, b.left),
        right = Math.min(a.right, b.right);
      const actual =
        left <= a.left + 1 ? "physical-left" : right >= a.right - 1 ? "physical-right" : "interior";
      return {
        scope: scope.getAttribute("data-legacy-scope"),
        value: track.getAttribute("aria-valuenow"),
        track: { x: a.x, width: a.width },
        fill: { x: b.x, width: b.width },
        actual,
        expected: "physical-right",
      };
    },
    id.replace(/^legacy-/, ""),
  );
}

async function measureSliderPointer(page) {
  const slider = page
    .locator('[data-direction-scope="ordinary-rtl"]')
    .getByRole("slider", { name: "Volume" });
  const track = slider
    .locator('xpath=ancestor::*[@data-slot="slider"][1]')
    .locator('[data-slot="slider-track"]');
  const box = await track.boundingBox();
  assert(box && box.width > 10, "RTL Slider has visible pointer bounds");
  const point = { x: box.x + box.width * 0.9, y: box.y + box.height / 2 };
  await page.mouse.click(point.x, point.y);
  const value = Number(await slider.getAttribute("aria-valuenow"));
  return { point, bounds: box, value, expected: 10 };
}
