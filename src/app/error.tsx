"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="linen flex min-h-svh items-center justify-center px-6 text-center">
      <div>
        <p className="font-script text-5xl">One moment, please</p>
        <p className="mt-4 text-soft-ink">Something didn&apos;t load as it should.</p>
        <button type="button" onClick={reset} className="btn btn-line mt-8">Try Again</button>
      </div>
    </main>
  );
}
