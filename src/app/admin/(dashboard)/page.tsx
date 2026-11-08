import { Overview } from "@/components/admin/Overview";
import { getStats } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";
import type { RsvpRow } from "@/lib/types";

type RecentRsvp = Pick<RsvpRow, "full_name" | "status" | "companions" | "submitted_at">;

export default async function OverviewPage() {
  const { supabase } = await requireAdminPage();
  const [stats, rsvps] = await Promise.all([
    getStats(supabase),
    supabase.from("rsvps").select("full_name, status, companions, submitted_at").order("submitted_at", { ascending: false }).throwOnError(),
  ]);
  return <Overview stats={stats} rsvps={(rsvps.data ?? []) as RecentRsvp[]} />;
}
