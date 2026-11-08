import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { getControls } from "@/lib/data/admin";
import { requireAdminPage } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { supabase, user } = await requireAdminPage();
  const controls = await getControls(supabase);
  return <AdminShell email={user.email ?? ""} hasUnpublishedChanges={controls.has_unpublished_changes}>{children}</AdminShell>;
}
