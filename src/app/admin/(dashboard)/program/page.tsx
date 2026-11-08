import { ProgramManager } from "@/components/admin/ProgramManager";
import { getProgram } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export default async function ProgramPage() {
  const { supabase } = await requireAdminPage();
  return <ProgramManager items={await getProgram(supabase)} />;
}
