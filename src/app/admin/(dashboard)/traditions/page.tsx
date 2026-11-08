import { TraditionsManager } from "@/components/admin/TraditionsManager";
import { getDraftSettings, getParticipants } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function TraditionsPage() {
  const { supabase } = await requireAdminPage();
  const [settings, participants] = await Promise.all([getDraftSettings(supabase), getParticipants(supabase)]);
  return <TraditionsManager config={settings.traditions} participants={participants} />;
}
