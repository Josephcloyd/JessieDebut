import { GuestbookManager } from "@/components/admin/ModerationManagers";
import { getControls, getMessages } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function GuestbookPage() {
  const { supabase } = await requireAdminPage();
  const [messages, controls] = await Promise.all([getMessages(supabase), getControls(supabase)]);
  return <GuestbookManager messages={messages} controls={controls} />;
}
