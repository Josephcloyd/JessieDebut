"use client";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="border border-beige bg-white p-8 text-center">
      <h1 className="font-editorial text-2xl">This page couldn&apos;t load</h1>
      <p className="mt-2 text-sm text-soft-ink">Please check your connection and try again.</p>
      <button type="button" onClick={reset} className="btn btn-line mt-5">Try Again</button>
    </div>
  );
}
