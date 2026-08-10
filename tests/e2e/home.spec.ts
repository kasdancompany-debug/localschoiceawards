import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("central site home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Locals Choice Awards" })).toBeVisible();
  await expect(
    page.getByText("Celebrating the businesses communities love."),
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: /search communities/i }),
  ).toBeVisible();
});

test("marketing pages are reachable", async ({ page }) => {
  for (const path of [
    "/communities",
    "/about",
    "/how-it-works",
    "/partners",
    "/launch-a-community",
    "/contact",
    "/privacy",
    "/terms",
    "/promotion-rules",
  ]) {
    await page.goto(path);
    await expect(page.locator("h1")).toBeVisible();
  }
});

test("home page has no serious accessibility violations", async ({ page }) => {
  await page.goto("/");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(serious).toEqual([]);
});

test("unauthenticated account visits redirect to login", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("login page exposes password and magic-link options", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("button", { name: "Sign in with email" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Email me a magic link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("saultstemarie subdomain resolves to Sault Ste. Marie", async ({ page }) => {
  await page.goto("http://saultstemarie.localhost:3005/");
  await expect(page.getByRole("heading", { name: "Sault Ste. Marie" })).toBeVisible();
  await expect(page.getByRole("main").getByText("Locals Choice Awards")).toBeVisible();
});

test("detroit subdomain resolves to a different community than sudbury", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto("http://detroit.localhost:3005/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Detroit" })).toBeVisible();

  await page.goto("http://sudbury.localhost:3005/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Greater Sudbury" })).toBeVisible();
});

test("unknown community host shows not-available", async ({ page }) => {
  await page.goto("http://notacommunity.localhost:3005/");
  await expect(page.getByRole("heading", { name: "Community not found" })).toBeVisible();
});

test("admin subdomain rewrites to admin surface", async ({ page }) => {
  await page.goto("http://admin.localhost:3005/");
  await expect(page).toHaveURL(/admin\.localhost:3005\/login/);
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("community home has no serious accessibility violations", async ({ page }) => {
  await page.goto("http://saultstemarie.localhost:3005/");
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? ""),
  );
  expect(serious).toEqual([]);
});
