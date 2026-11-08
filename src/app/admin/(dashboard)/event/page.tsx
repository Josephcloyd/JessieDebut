import { EventEditor } from "@/components/admin/EventEditor";
import { getDraftSettings } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function EventPage() {
  const { supabase } = await requireAdminPage();
  return <EventEditor settings={await getDraftSettings(supabase)} />;
}
