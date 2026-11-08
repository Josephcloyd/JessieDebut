import type { Metadata } from "next";
import { Invitation, NotReadyNotice } from "@/components/public/Invitation";
import { getPublishedInvitation } from "@/lib/data/invitation";

/** Safety net only. Admin saves refresh this page immediately. */
export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const data = await getPublishedInvitation();
  if (!data) return {};
  const title = `${data.settings.celebrant_name}: ${data.settings.event_title}`;
  const description = data.settings.hero_description;
  return { title, description, openGraph: { title, description, type: "website" }, twitter: { card: "summary_large_image", title, description } };
}

export default async function HomePage() {
  const data = await getPublishedInvitation();
  return data ? <Invitation data={data} /> : <NotReadyNotice />;
}
