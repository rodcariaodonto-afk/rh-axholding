import { type Page, expect } from "@playwright/test";

/** Generate a unique email for each test run */
export function uniqueEmail(): string {
  return `test-${Date.now()}@orbrh-test.com`;
}

/** Fill the first-access setup form and submit */
export async function signUpFirstAccess(
  page: Page,
  email: string,
  password: string,
) {
  await page.locator("#setup-email").fill(email);
  await page.locator("#setup-password").fill(password);
  await page.locator("#setup-confirmPassword").fill(password);
  await page.getByRole("button", { name: "Criar Administrador" }).click();
}

/** Fill the normal signup form (Criar Conta tab) and submit */
export async function signUp(page: Page, email: string, password: string) {
  await page.getByRole("tab", { name: "Criar Conta" }).click();
  await page.locator("#signup-email").fill(email);
  await page.locator("#signup-password").fill(password);
  await page.locator("#signup-confirmPassword").fill(password);
  await page.getByRole("button", { name: "Criar Conta" }).click();
}

/** Fill the login form and submit */
export async function login(page: Page, email: string, password: string) {
  await page.locator("#login-email").fill(email);
  await page.locator("#login-password").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
}

/** Fill the onboarding form to create an organization */
export async function createOrganization(page: Page, name: string) {
  await page.locator("#name").fill(name);
  // slug is auto-generated from name
  await expect(page.locator("#slug")).not.toHaveValue("");
  await page.getByRole("button", { name: "Criar Organização" }).click();
}
