import { expect, test } from "@playwright/test";

test("dropdown submenu works", async ({ page }) => {
  await page.goto("http://localhost:4321/");

  // Find the sub-menu demo button
  // It's the third button in the Dropdown section
  const subMenuButton = page.getByRole("button", { name: "Sub-menu Demo" });
  await subMenuButton.click();

  // Check if main dropdown is open
  const mainContent = page.getByRole("menu");
  await expect(mainContent).toBeVisible();

  // Find "Invite users" sub-trigger
  const inviteUsers = page.getByText("Invite users");
  await expect(inviteUsers).toBeVisible();

  // Hover over "Invite users" to open sub-menu
  await inviteUsers.hover();

  // Check if sub-menu content is visible
  const emailItem = page.getByText("Email");
  await expect(emailItem).toBeVisible();

  // Capture screenshot of open sub-menu
  await page.screenshot({
    path: "/home/jules/verification/dropdown-submenu-fix-verified.png",
    fullPage: true,
  });

  // Click on "Email" and check if everything closes
  await emailItem.click();

  // Wait for animation
  await page.waitForTimeout(500);

  // Both should be hidden
  await expect(mainContent).not.toBeVisible();
  await expect(emailItem).not.toBeVisible();
});
