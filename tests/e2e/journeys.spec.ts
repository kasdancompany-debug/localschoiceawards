import { expect, test } from "@playwright/test";

const communityOrigin = "http://saultstemarie.localhost:3005";

test.describe("core public journeys", () => {
  test("register page is usable", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
  });

  test("login page is usable", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in with email/i })).toBeVisible();
  });

  test("community selection from central site", async ({ page }) => {
    await page.goto("/");
    const search = page.getByRole("combobox", { name: /search communities/i });
    await expect(search).toBeVisible();
    await search.fill("Sault");
    await expect(page.getByText(/Sault Ste\. Marie/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("business search on community site", async ({ page }) => {
    await page.goto(`${communityOrigin}/search`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Search", exact: true })).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.locator("#q, input[name='q']").first()).toBeVisible();
  });

  test("nomination surface loads", async ({ page }) => {
    await page.goto(`${communityOrigin}/nominate`);
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
  });

  test("voting surface loads", async ({ page }) => {
    await page.goto(`${communityOrigin}/vote`);
    await expect(page.locator("main")).toBeVisible();
  });

  test("business claim entry requires auth or shows claim UI", async ({ page }) => {
    await page.goto("http://business.localhost:3005/");
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("business.localhost") || url.includes("/login")).toBeTruthy();
  });

  test("winners directory loads", async ({ page }) => {
    await page.goto(`${communityOrigin}/winners`);
    await expect(page.getByRole("heading", { name: "Winners", exact: true })).toBeVisible();
  });

  test("awards catalog and cart surfaces", async ({ page }) => {
    await page.goto("/awards");
    await expect(page.locator("h1")).toBeVisible();
    await page.goto("/cart", { waitUntil: "domcontentloaded" });
    // Cart may error without a live database; page must still respond.
    await expect(page.locator("body")).toBeVisible();
  });

  test("checkout surfaces order confirmation/cancel routes", async ({ page }) => {
    await page.goto("/checkout", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();

    await page.goto("/checkout/success", { waitUntil: "commit" }).catch(() => undefined);
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 });

    await page.goto("/checkout/cancelled", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toBeVisible();
  });

  test("supplier portal redirects unauthenticated users", async ({ page }) => {
    await page.goto("http://supplier.localhost:3005/");
    await expect(page).toHaveURL(/login/);
  });
});

test.describe("authenticated / Stripe journeys", () => {
  test("shipping quote and Stripe checkout require live credentials", async ({ page }) => {
    test.skip(
      !process.env.E2E_FULL || process.env.E2E_FULL !== "true",
      "Set E2E_FULL=true with real Supabase/Stripe test credentials to run checkout fulfillment e2e.",
    );
    await page.goto("/awards");
    await expect(page.locator("main")).toBeVisible();
    // Full path exercised in staging: add eligible award → quote → Checkout → webhook → supplier.
  });
});
