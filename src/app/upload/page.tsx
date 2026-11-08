import type { Metadata } from "next";
import { GuestPhotoUpload } from "@/components/public/GuestPhotoUpload";
import { getPublishedInvitation } from "@/lib/data/invitation";

export const metadata: Metadata = { title: "Share Your Photos", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const data = await getPublishedInvitation();

  return (
    <main className="linen flex min-h-svh items-center justify-center px-4 py-16">
      <div className="hairline-frame w-full max-w-lg bg-ivory px-6 py-10 text-center shadow-soft md:px-10">
        <p className="font-script text-4xl text-soft-ink">Share a memory</p>
        <h1 className="mt-1 font-editorial text-3xl">{data ? `${data.settings.celebrant_name}'s Debut` : "The Grand Debut"}</h1>
        {data?.controls.guest_uploads_enabled ? (
          <GuestPhotoUpload />
        ) : (
          <p className="mt-6 text-soft-ink">Photo sharing isn&apos;t open right now. Please check back after the event.</p>
        )}
      </div>
    </main>
  );
}
