import { expect, test } from "@playwright/test";

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const hasCredentials = Boolean(process.env.E2E_LEARNER_EMAIL && process.env.E2E_LEARNER_PASSWORD);
const hasRegistrationCredentials = Boolean(process.env.E2E_REGISTER_EMAIL && process.env.E2E_REGISTER_PASSWORD);

test("signed-out learner is redirected without a loop", async ({ page }) => {
  test.skip(!hasSupabase, "Supabase test environment is not configured");
  const response = await page.goto("/foundation");
  expect(response?.status()).toBeLessThan(400);
  await expect(page).toHaveURL(/\/login\?next=%2Ffoundation$/);
});

test("live login persists across reload and logout clears the session", async ({ page, context }) => {
  test.skip(!hasSupabase || !hasCredentials, "Dedicated Supabase E2E credentials are not configured");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_LEARNER_EMAIL!);
  await page.getByLabel("Mật khẩu").fill(process.env.E2E_LEARNER_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/foundation$/);
  await page.reload();
  await expect(page).toHaveURL(/\/foundation$/);
  const cookies = await context.cookies();
  const authCookies = cookies.filter((cookie) => cookie.name.startsWith("sb-"));
  expect(authCookies.length).toBeGreaterThan(0);
  expect(authCookies.every((cookie) => cookie.httpOnly && cookie.sameSite === "Lax")).toBe(true);
  await page.getByRole("button", { name: "Đăng xuất" }).click();
  await expect(page).toHaveURL(/\/login$/);
});

test("invalid credentials show a localized recoverable error", async ({ page }) => {
  test.skip(!hasSupabase, "Supabase test environment is not configured");
  await page.goto("/login");
  await page.getByLabel("Email").fill("invalid@example.com");
  await page.getByLabel("Mật khẩu").fill("invalid-password");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page.getByText("Email hoặc mật khẩu chưa đúng.", { exact: true })).toBeVisible();
});

test("registration creates a learner without exposing a browser token", async ({ page }) => {
  test.skip(!hasSupabase || !hasRegistrationCredentials, "Dedicated Supabase registration credentials are not configured");
  await page.goto("/register");
  await page.getByLabel("Email").fill(process.env.E2E_REGISTER_EMAIL!);
  await page.getByLabel("Mật khẩu").fill(process.env.E2E_REGISTER_PASSWORD!);
  await page.getByRole("button", { name: "Đăng ký" }).click();
  await expect(page).toHaveURL(/\/(foundation|login)(\?.*)?$/);
  const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage) }));
  expect(storage.local.filter((key) => key.startsWith("sb-")).length).toBe(0);
  expect(storage.session.filter((key) => key.startsWith("sb-")).length).toBe(0);
});
