import assert from "node:assert/strict";

export async function verifyAvatarGroupCases({ page }) {
  const failures = [];
  for (const [size, dimension] of [
    ["sm", 32],
    ["md", 40],
    ["lg", 48],
  ]) {
    const group = page.locator(`[data-avatar-group-test="${size}"]`);
    await group.scrollIntoViewIfNeeded();
    await page.waitForFunction((size) => {
      const roots = [
        ...document.querySelectorAll(`[data-avatar-group-test="${size}"] [data-slot="avatar"]`),
      ];
      return (
        roots.length === 3 && roots.every((root) => root.dataset.imageLoadingStatus === "loaded")
      );
    }, size);
    for (const direction of ["ltr", "rtl"]) {
      for (const constrained of [false, true]) {
        await group.evaluate(
          (root, { direction, constrained }) => {
            root.dir = direction;
            root.style.width = constrained ? "88px" : "240px";
          },
          { direction, constrained },
        );
        const state = await group.evaluate((root) => {
          const avatars = [...root.querySelectorAll('[data-slot="avatar"]')];
          const rects = avatars.map((avatar) => avatar.getBoundingClientRect());
          const count = root
            .querySelector('[data-slot="avatar-group-count"]')
            .getBoundingClientRect();
          const rtl = root.dir === "rtl";
          const second = rects[1];
          // The later avatar's border must paint over the preceding avatar's image.
          const borderHit = document.elementFromPoint(
            rtl ? second.right - 1 : second.left + 1,
            second.top + second.height / 2,
          );
          return {
            dimensions: [...rects, count].map(({ width, height }) => [width, height]),
            steps: [
              rects[1].left - rects[0].left,
              rects[2].left - rects[1].left,
              count.left - rects[2].left,
            ],
            borderOwner: borderHit === avatars[1],
            imageZIndices: avatars.map(
              (avatar) => getComputedStyle(avatar.querySelector("img")).zIndex,
            ),
            fallbackHidden: avatars.every(
              (avatar) => avatar.querySelector('[data-slot="avatar-fallback"]').hidden,
            ),
          };
        });
        try {
          assert.deepEqual(
            state.dimensions,
            Array.from({ length: 4 }, () => [dimension, dimension]),
          );
          assert.deepEqual(
            state.steps,
            Array(3).fill(dimension * 0.75 * (direction === "rtl" ? -1 : 1)),
          );
          assert.equal(state.borderOwner, true);
          assert.deepEqual(state.imageZIndices, ["auto", "auto", "auto"]);
          assert.equal(state.fallbackHidden, true);
        } catch {
          failures.push({ size, direction, constrained, state });
        }
      }
    }
    await group.evaluate((root) => {
      root.removeAttribute("dir");
      root.style.removeProperty("width");
    });
  }
  assert.deepEqual(
    failures,
    [],
    `Avatar Group dimensions, overlap, or image stacking failed: ${JSON.stringify(failures)}`,
  );
}
