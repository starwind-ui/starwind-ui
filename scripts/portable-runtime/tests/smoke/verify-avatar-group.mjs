import { chromium } from "playwright";
import { verifyAvatarGroupCases } from "./shared/avatar-group.mjs";

const urls = process.argv.slice(2);
if (!urls.length) throw new Error("Pass one or more demo URLs.");
const browser = await chromium.launch({ headless: true });
try {
  for (const url of urls) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(url);
    await verifyAvatarGroupCases({ page });
    console.log(`Avatar Group passed: ${url}`);
    await page.close();
  }
} finally {
  await browser.close();
}
