import { expect, test } from "@playwright/test";

const ready = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.E2E_LEARNER_EMAIL && process.env.E2E_LEARNER_PASSWORD && process.env.AI_API_BASE_URL);

test("authenticated foundation renders both protected M1.5 mock responses", async ({ page }) => {
  test.skip(!ready, "Supabase credentials and M1.5 mock runtime are required");
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.E2E_LEARNER_EMAIL!);
  await page.getByLabel("Mật khẩu").fill(process.env.E2E_LEARNER_PASSWORD!);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await page.getByRole("button", { name: "Chạy kiểm tra mock" }).click();
  await expect(page.getByText("Hoạt động")).toHaveCount(2);
  await expect(page.getByText("true")).toHaveCount(2);
  await expect(page.getByText(/mock-srs-v1/)).toBeVisible();
  await expect(page.getByText(/Could you tell me the check-in date/)).toBeVisible();
});
