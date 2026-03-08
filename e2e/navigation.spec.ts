import { test, expect } from "@playwright/test";
import { login, uniqueEmail } from "./helpers/auth";

/**
 * Navigation tests — assume a user and org already exist.
 * These use the same credentials from the auth spec.
 * If running standalone, ensure the DB has a valid user.
 */

const TEST_EMAIL = process.env.E2E_EMAIL ?? "admin@orbrh-test.com";
const TEST_PASSWORD = process.env.E2E_PASSWORD ?? "Test@12345";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth");
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    // Wait until we leave the auth page
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test("sidebar loads with menu items", async ({ page }) => {
    // Sidebar should show at least the main menu group
    await expect(page.getByText("GESTÃO DE PESSOAS")).toBeVisible({
      timeout: 10_000,
    });
    await expect(
      page.getByRole("link", { name: "Colaboradores" }),
    ).toBeVisible();
  });

  test("admin sees full menu including settings", async ({ page }) => {
    await expect(page.getByText("ADMINISTRAÇÃO")).toBeVisible({
      timeout: 10_000,
    });
    await expect(page.getByRole("link", { name: "Empresa" })).toBeVisible();
  });

  test("clicking Colaboradores navigates to /employees", async ({ page }) => {
    await page
      .getByRole("link", { name: "Colaboradores" })
      .click();

    await expect(page).toHaveURL(/\/employees/, { timeout: 10_000 });
  });
});
