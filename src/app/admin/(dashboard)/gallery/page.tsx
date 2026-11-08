import { GalleryManager } from "@/components/admin/GalleryManager";
import { getAlbumsWithPhotos, getControls } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";
import { createServiceClient } from "@/lib/supabase/clients.server";
import { publicStorageUrl } from "@/lib/supabase/env";

const PREVIEW_LINK_SECONDS = 3600;

export default async function GalleryPage() {
  const { supabase } = await requireAdminPage();
  const [{ albums, photos }, controls] = await Promise.all([getAlbumsWithPhotos(supabase), getControls(supabase)]);

  const privatePaths = photos.filter((photo) => photo.bucket === "private-media").map((photo) => photo.storage_path);
  const signed = privatePaths.length
    ? (await createServiceClient().storage.from("private-media").createSignedUrls(privatePaths, PREVIEW_LINK_SECONDS)).data ?? []
    : [];
  const signedByPath = new Map(signed.map((item) => [item.path, item.signedUrl]));
  const photoUrls = Object.fromEntries(
    photos.map((photo) => [
      photo.id,
      photo.bucket === "public-media" ? publicStorageUrl(photo.bucket, photo.storage_path) : signedByPath.get(photo.storage_path) ?? "",
    ]),
  );

  return <GalleryManager albums={albums} photos={photos} photoUrls={photoUrls} controls={controls} />;
}
