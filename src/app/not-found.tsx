import Link from "next/link";

export default function NotFound() {
  return (
    <main className="linen flex min-h-svh items-center justify-center px-6 text-center">
      <div>
        <p className="font-script text-5xl">We couldn&apos;t find that page</p>
        <p className="mt-4 text-soft-ink">Your invitation link may be incomplete. Please check it and try again.</p>
        <Link href="/" className="btn btn-line mt-8">Go to the Invitation</Link>
      </div>
    </main>
  );
}
