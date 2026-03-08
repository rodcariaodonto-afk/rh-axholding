import { test, expect } from "@playwright/test";
import {
  uniqueEmail,
  signUpFirstAccess,
  login,
  createOrganization,
} from "./helpers/auth";

/**
 * Auth flow tests — serial because they depend on shared state:
 * signup creates the user, then logout, then login reuses it.
 *
 * NOTE: The "first access" test expects a clean Supabase database.
 * If the DB already has users, test #1 and #2 will see the normal
 * login form instead of "Configuração Inicial".
 */

const TEST_EMAIL = uniqueEmail();
const TEST_PASSWORD = "Test@12345";
const ORG_NAME = "Empresa Teste E2E";

test.describe.serial("Authentication flow", () => {
  test("first access shows setup form", async ({ page }) => {
    await page.goto("/auth");
    // If this is a clean DB, the first-access setup form is shown
    await expect(
      page.getByText("Configuração Inicial"),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("signup first user as admin", async ({ page }) => {
    await page.goto("/auth");
    await expect(
      page.getByText("Configuração Inicial"),
    ).toBeVisible({ timeout: 15_000 });

    await signUpFirstAccess(page, TEST_EMAIL, TEST_PASSWORD);

    // Should redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test("create organization via onboarding", async ({ page }) => {
    // Login first (we have a user now)
    await page.goto("/auth");
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 15_000 });

    await createOrganization(page, ORG_NAME);

    // Should redirect away from onboarding to a protected route
    await expect(page).not.toHaveURL(/\/onboarding/, { timeout: 15_000 });
  });

  test("logout redirects to auth", async ({ page }) => {
    // Login
    await page.goto("/auth");
    await login(page, TEST_EMAIL, TEST_PASSWORD);
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 15_000 });

    // Open org dropdown and click Sair
    await page.getByRole("button", { name: "Sair" }).click();

    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });

  test("login with valid credentials", async ({ page }) => {
    await page.goto("/auth");

    await login(page, TEST_EMAIL, TEST_PASSWORD);

    // Should redirect to people-analytics (or another protected route)
    await expect(page).toHaveURL(/\/people-analytics|\/setup/, {
      timeout: 15_000,
    });
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/auth");

    await login(page, "wrong@email.com", "wrongpassword");

    // Should stay on auth and show an error toast
    await expect(page).toHaveURL(/\/auth/);
    const toast = page.locator("[data-sonner-toast]");
    await expect(toast).toBeVisible({ timeout: 10_000 });
  });

  test("protected route without auth redirects to /auth", async ({ page }) => {
    // Clear any session by navigating directly without login
    await page.context().clearCookies();
    await page.goto("/employees");

    await expect(page).toHaveURL(/\/auth/, { timeout: 15_000 });
  });
});
