import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/clients.server";

export const dynamic = "force-dynamic";

const GUEST_UPLOAD_FOLDER = "guest-uploads";
const ORPHAN_AGE_MS = 24 * 60 * 60 * 1000;
const LIST_LIMIT = 1000;

/** Deletes uploads a visitor started but never confirmed, so they can't fill storage. */
async function removeAbandonedUploads(service: SupabaseClient): Promise<number> {
  const storage = service.storage.from("private-media");
  const { data: files, error } = await storage.list(GUEST_UPLOAD_FOLDER, { limit: LIST_LIMIT });
  if (error) throw error;

  const cutoff = Date.now() - ORPHAN_AGE_MS;
  const oldPaths = (files ?? [])
    .filter((file) => file.created_at && Date.parse(file.created_at) < cutoff)
    .map((file) => `${GUEST_UPLOAD_FOLDER}/${file.name}`);
  if (oldPaths.length === 0) return 0;

  const { data: known } = await service.from("guest_uploads").select("storage_path").in("storage_path", oldPaths).throwOnError();
  const confirmed = new Set((known ?? []).map((row) => row.storage_path));
  const abandoned = oldPaths.filter((path) => !confirmed.has(path));
  if (abandoned.length > 0) {
    const { error: removeError } = await storage.remove(abandoned);
    if (removeError) throw removeError;
  }
  return abandoned.length;
}

/** Runs daily. The query also stops a free Supabase project from pausing for inactivity. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const service = createServiceClient();
    await service.from("site_controls").select("id").eq("id", 1).single().throwOnError();
    const removed = await removeAbandonedUploads(service);
    return NextResponse.json({ success: true, data: { removed } });
  } catch (error) {
    console.error("[keepalive]", error);
    return NextResponse.json({ success: false, error: "Maintenance failed" }, { status: 500 });
  }
}
