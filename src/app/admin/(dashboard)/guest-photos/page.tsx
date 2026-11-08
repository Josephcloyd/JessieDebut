import { GuestPhotosManager } from "@/components/admin/ModerationManagers";
import { getControls, getGuestUploads } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";
import { createServiceClient } from "@/lib/supabase/clients.server";

const PREVIEW_LINK_SECONDS = 3600;

export default async function GuestPhotosPage() {
  const { supabase } = await requireAdminPage();
  const [uploads, controls] = await Promise.all([getGuestUploads(supabase), getControls(supabase)]);
  const paths = uploads.filter((upload) => upload.status === "pending").map((upload) => upload.storage_path);
  const signed = paths.length ? (await createServiceClient().storage.from("private-media").createSignedUrls(paths, PREVIEW_LINK_SECONDS)).data ?? [] : [];
  const previews = Object.fromEntries(signed.map((item) => [item.path ?? "", item.signedUrl ?? ""]));
  return <GuestPhotosManager uploads={uploads} previews={previews} controls={controls} />;
}
