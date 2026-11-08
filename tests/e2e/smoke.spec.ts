import { expect, test } from "@playwright/test";

test("guest opens the envelope and reaches the invitation", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("You Are Cordially Invited")).toBeVisible();

  await page.getByRole("button", { name: "Open Your Invitation" }).click();

  await expect(page.getByText("You Are Cordially Invited")).toBeHidden({ timeout: 8000 });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("timer").first()).toBeVisible();
});

test("her name writes itself between the envelope and the cover", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Open Your Invitation" }).click();

  const nameScreen = page.getByRole("status", { name: /invitation/i });
  await expect(nameScreen).toBeVisible({ timeout: 8000 });
  await expect(nameScreen).toBeHidden({ timeout: 8000 });
});

test("the cover appears only after the envelope is opened", async ({ page }) => {
  await page.goto("/");
  const masthead = page.locator(".masthead").locator("..");
  await expect(masthead).toHaveCSS("opacity", "0");

  await page.getByRole("button", { name: "Open Your Invitation" }).click();
  await expect(page.getByText("You Are Cordially Invited")).toBeHidden({ timeout: 8000 });

  await expect(masthead).toHaveCSS("opacity", "1", { timeout: 6000 });
});

test("visitors who prefer reduced motion can still open the invitation", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/");
  await page.getByRole("button", { name: "Open Your Invitation" }).click();
  await expect(page.getByText("You Are Cordially Invited")).toBeHidden({ timeout: 8000 });

  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await context.close();
});

test("the page never scrolls sideways on a phone", async ({ page }) => {
  await page.goto("/");
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
});

test("visitors without a session are sent to sign in", async ({ page }) => {
  for (const path of ["/admin", "/admin/guests", "/admin/preview"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
  }
});

test("there is no public admin registration", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  await expect(page.getByText(/sign up|register|create account/i)).toHaveCount(0);
});

test("the guest list export refuses anonymous requests", async ({ request }) => {
  const response = await request.get("/api/admin/guests-export", { maxRedirects: 0 });
  expect(response.status()).not.toBe(200);
});

test("the keep-alive job refuses requests without the secret", async ({ request }) => {
  const response = await request.get("/api/cron/keepalive");
  expect(response.status()).toBe(401);
});

test("an unknown invitation link shows a friendly page", async ({ page }) => {
  await page.goto("/i/NOSUCHCODE");
  await expect(page.getByText("We couldn't find that page")).toBeVisible();
});
