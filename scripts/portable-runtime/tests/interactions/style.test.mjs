import { readFileSync } from "node:fs";
import { chromium } from "playwright";
import { expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("../../runtime-performance/interactions/fixtures/style.css", import.meta.url),
  "utf8",
);

it("removes hidden items from layout and restores their 32-pixel flex rows when shown", async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.setContent(`
      <style>${stylesheet}</style>
      <div class="popup" role="listbox">
        <div id="before" class="item" role="option">Item 040</div>
        <div id="filtered" class="item" role="option" hidden data-filtered>Item 001</div>
        <div id="after" class="item" role="option">Item 042</div>
      </div>
    `);
    const measure = () =>
      page.evaluate(() =>
        Object.fromEntries(
          ["before", "filtered", "after"].map((id) => {
            const item = document.getElementById(id);
            const box = item.getBoundingClientRect();
            const style = getComputedStyle(item);
            return [
              id,
              {
                display: style.display,
                alignItems: style.alignItems,
                height: box.height,
                y: box.y,
                rectCount: item.getClientRects().length,
              },
            ];
          }),
        ),
      );

    const hidden = await measure();
    expect(hidden.filtered).toMatchObject({ display: "none", height: 0, rectCount: 0 });
    for (const row of [hidden.before, hidden.after])
      expect(row).toMatchObject({
        display: "flex",
        alignItems: "center",
        height: 32,
        rectCount: 1,
      });
    expect(hidden.after.y - hidden.before.y).toBe(32);

    await page.evaluate(() => {
      document.getElementById("filtered").hidden = false;
    });
    const shown = await measure();
    expect(shown.filtered).toMatchObject({
      display: "flex",
      alignItems: "center",
      height: 32,
      rectCount: 1,
    });
    expect(shown.after.y - shown.before.y).toBe(64);

    await page.evaluate(() => {
      document.getElementById("filtered").hidden = true;
    });
    const filteredAgain = await measure();
    expect(filteredAgain.filtered).toMatchObject({ display: "none", height: 0, rectCount: 0 });
    expect(filteredAgain.after.y - filteredAgain.before.y).toBe(32);
  } finally {
    await browser.close();
  }
});
