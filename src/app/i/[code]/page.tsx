import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Invitation, NotReadyNotice } from "@/components/public/Invitation";
import { getGuestOnlyAlbums, getInvitedGuest, getPublishedInvitation } from "@/lib/data/invitation";

interface PersonalPageProps {
  params: Promise<{ code: string }>;
}

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: "no-referrer" };

/** Guest details, RSVP answers and signed photo links must never be served from a cache. */
export const dynamic = "force-dynamic";

export default async function PersonalInvitationPage({ params }: PersonalPageProps) {
  const { code } = await params;
  const guest = await getInvitedGuest(code);
  if (!guest) notFound();

  const [data, guestAlbums] = await Promise.all([getPublishedInvitation(), getGuestOnlyAlbums()]);
  return data ? <Invitation data={data} guest={guest} guestAlbums={guestAlbums} /> : <NotReadyNotice />;
}
