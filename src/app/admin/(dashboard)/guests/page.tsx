import { GuestManager } from "@/components/admin/GuestManager";
import { getControls, getGuestsWithRsvps } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function GuestsPage() {
  const { supabase } = await requireAdminPage();
  const [guests, controls] = await Promise.all([getGuestsWithRsvps(supabase), getControls(supabase)]);
  return <GuestManager guests={guests} controls={controls} />;
}
