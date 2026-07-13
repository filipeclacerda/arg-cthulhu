import { expect, test } from "@playwright/test";

test.describe("relay to desktop smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem("playwright-clean-case")) {
        localStorage.clear();
        sessionStorage.setItem("playwright-clean-case", "1");
      }
      Object.defineProperty(window, "indexedDB", { value: undefined });
    });
  });

  test("mounts the relay, boots the desktop, retains PT-BR and resumes its save", async ({ page }) => {
    await page.goto("/play");
    await expect(page.getByText("CHECKING LOCAL ARCHIVE...")).toBeVisible();
    const portuguese = page.getByRole("button", { name: /Português \(Brasil\)|PT-BR/i });
    await expect(portuguese).toBeEnabled();
    await portuguese.click();
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("arg-cthulhu-progress-v7") ?? "")).toContain('"locale":"pt-BR"');
    await page.goto("/desktop");
    await expect(page.locator("#desktop-root")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
    await page.reload();
    await expect(page.locator("#desktop-root")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator("html")).toHaveAttribute("lang", "pt-BR");
  });
});
