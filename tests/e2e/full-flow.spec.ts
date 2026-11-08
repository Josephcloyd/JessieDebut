import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * The nine-step acceptance flow. It needs a real Supabase project and writes
 * to it, then removes what it created. Do not point it at live guest data.
 */
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const isConfigured = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD && SUPABASE_URL && SERVICE_KEY);

const RUN_ID = Date.now().toString(36);
const GUEST_NAME = `Test Guest ${RUN_ID}`;
const VENUE_NAME = `The Test Manor ${RUN_ID}`;
const WISH_TEXT = `A test wish ${RUN_ID}`;
const TEST_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAIAAAACUFjqAAAAEklEQVR4nGP4z8CAB+GTG8HSALfKb5GqVVbxAAAAAElFTkSuQmCC",
  "base64",
);

async function openInvitation(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await page.getByRole("button", { name: "Open Your Invitation" }).click();
  await expect(page.getByText("You Are Cordially Invited")).toBeHidden({ timeout: 8000 });
}

async function signIn(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL as string);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD as string);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
}

async function publish(page: Page): Promise<void> {
  await page.getByRole("button", { name: /^Publish/ }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: "Publish" }).click();
  await expect(page.getByText("Your changes are live.")).toBeVisible();
}

test.describe("administrator and guest journey", () => {
  test.skip(!isConfigured, "Set E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD and the Supabase variables to run this.");

  test.afterAll(async () => {
    if (!isConfigured) return;
    const db = createClient(SUPABASE_URL as string, SERVICE_KEY as string, { auth: { persistSession: false } });
    await db.from("guests").delete().eq("full_name", GUEST_NAME);
    await db.from("guest_messages").delete().eq("message", WISH_TEXT);
    const { data } = await db.from("gallery_photos").select("id, bucket, storage_path").eq("caption", RUN_ID);
    for (const photo of data ?? []) {
      await db.storage.from(photo.bucket).remove([photo.storage_path]);
      await db.from("gallery_photos").delete().eq("id", photo.id);
    }
  });

  test("runs from sign-in through publishing a wish", async ({ page, browser }) => {
    // 1. Administrator logs in.
    await signIn(page);

    // 2. Administrator uploads a new photo.
    await page.goto("/admin/gallery");
    await page.locator('input[type="file"][multiple]').setInputFiles({ name: "test.png", mimeType: "image/png", buffer: TEST_PNG });
    await expect(page.getByText("Photo added.")).toBeVisible({ timeout: 30_000 });
    const caption = page.getByLabel("Caption").last();
    await caption.fill(RUN_ID);
    await caption.blur();
    await expect(page.getByText("Caption saved.")).toBeVisible();

    // 3. The new photo appears in the public slideshow.
    const guestContext = await browser.newContext();
    const guestPage = await guestContext.newPage();
    await openInvitation(guestPage, "/");
    await guestPage.locator("#gallery").scrollIntoViewIfNeeded();
    await expect(guestPage.locator("#gallery img").first()).toBeVisible();

    // 4. Administrator changes event details.
    await page.goto("/admin/event");
    await page.getByLabel("Venue name").fill(VENUE_NAME);
    await page.getByRole("button", { name: "Save Changes" }).click();
    await expect(page.getByText(/^Saved\./)).toBeVisible();
    await publish(page);

    // 5. The public invitation displays the updated information.
    await openInvitation(guestPage, "/");
    await expect(guestPage.locator("#details")).toContainText(VENUE_NAME);

    // 6. A guest submits an RSVP.
    await page.goto("/admin/guests");
    await page.getByRole("button", { name: "Add Guest" }).click();
    await page.getByRole("dialog").getByLabel("Full name").fill(GUEST_NAME);
    await page.getByRole("dialog").getByRole("button", { name: "Save" }).click();
    await expect(page.getByText("Guest added.")).toBeVisible();
    const row = page.getByRole("listitem").filter({ hasText: GUEST_NAME });
    const code = (await row.getByText(/^Code /).innerText()).replace("Code ", "");

    await openInvitation(guestPage, `/i/${code}`);
    await guestPage.locator("#rsvp").scrollIntoViewIfNeeded();
    await guestPage.getByText("Attending", { exact: true }).click();
    await guestPage.getByRole("button", { name: "Send My RSVP" }).click();
    await expect(guestPage.getByText(/Thank you for being part of/)).toBeVisible();

    // 7. The RSVP appears in the dashboard.
    await page.reload();
    await expect(page.getByRole("listitem").filter({ hasText: GUEST_NAME })).toContainText("Confirmed");

    // 8. Administrator exports the guest list.
    const csv = await page.request.get("/api/admin/guests-export");
    expect(csv.status()).toBe(200);
    expect(await csv.text()).toContain(GUEST_NAME);

    // 9. Administrator publishes an approved guest message.
    await guestPage.getByLabel("Your Wish").fill(WISH_TEXT);
    await guestPage.getByRole("button", { name: "Leave a Wish" }).click();
    await expect(guestPage.getByText(/once it has been reviewed/)).toBeVisible();
    await openInvitation(guestPage, "/");
    await expect(guestPage.locator("#wishes")).not.toContainText(WISH_TEXT);

    await page.goto("/admin/guestbook");
    await page.getByRole("listitem").filter({ hasText: WISH_TEXT }).getByRole("button", { name: /^Approve/ }).click();
    await expect(page.getByText("Message published.")).toBeVisible();

    await openInvitation(guestPage, "/");
    await expect(guestPage.locator("#wishes")).toContainText(WISH_TEXT);
    await guestContext.close();
  });
});
