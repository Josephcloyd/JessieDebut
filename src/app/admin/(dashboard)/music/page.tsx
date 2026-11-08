import { MusicManager } from "@/components/admin/MusicManager";
import { getControls } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function MusicPage() {
  const { supabase } = await requireAdminPage();
  return <MusicManager controls={await getControls(supabase)} />;
}
