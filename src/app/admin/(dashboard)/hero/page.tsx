import { HeroEditor } from "@/components/admin/HeroEditor";
import { getDraftSettings } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function HeroPage() {
  const { supabase } = await requireAdminPage();
  return <HeroEditor settings={await getDraftSettings(supabase)} />;
}
