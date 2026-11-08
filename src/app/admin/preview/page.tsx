import type { Metadata } from "next";
import { Invitation, NotReadyNotice } from "@/components/public/Invitation";
import { getDraftInvitation } from "@/lib/data/invitation";
import { requireAdminPage } from "@/lib/server/admin";

export const metadata: Metadata = { title: "Preview", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function DraftPreviewPage() {
  await requireAdminPage();
  const data = await getDraftInvitation();
  return data ? <Invitation data={data} isPreview /> : <NotReadyNotice />;
}
