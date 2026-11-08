"use client";

import { BookHeart, CalendarDays, Camera, Eye, Flower2, Image as ImageIcon, LayoutDashboard, ListOrdered, LogOut, Menu, Music, Sparkles, Users, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { publishChanges } from "@/lib/actions/admin-settings";
import { signOut } from "@/lib/actions/auth";
import { FeedbackProvider, useActionRunner, useFeedback } from "./feedback";

const NAV = [
  ["/admin", "Overview", LayoutDashboard],
  ["/admin/event", "Event Information", CalendarDays],
  ["/admin/hero", "Hero Section", Sparkles],
  ["/admin/gallery", "Gallery", ImageIcon],
  ["/admin/traditions", "18 Traditions", Flower2],
  ["/admin/program", "Program", ListOrdered],
  ["/admin/music", "Music", Music],
  ["/admin/guests", "RSVP & Guests", Users],
  ["/admin/guestbook", "Guestbook", BookHeart],
  ["/admin/guest-photos", "Guest Photos", Camera],
] as const;

interface AdminShellProps {
  email: string;
  hasUnpublishedChanges: boolean;
  children: ReactNode;
}

export function AdminShell(props: AdminShellProps) {
  return (
    <FeedbackProvider>
      <ShellLayout {...props} />
    </FeedbackProvider>
  );
}

function ShellLayout({ email, hasUnpublishedChanges, children }: AdminShellProps) {
  const pathname = usePathname();
  const [isNavOpen, setIsNavOpen] = useState(false);

  return (
    <div className="min-h-svh bg-ivory lg:pl-64">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-umber text-ivory transition-transform lg:translate-x-0 ${isNavOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between px-5 py-5">
          <div>
            <p className="font-script text-3xl leading-none text-champagne">The Grand Debut</p>
            <p className="eyebrow mt-2 text-[0.55rem] text-beige">Dashboard</p>
          </div>
          <button type="button" onClick={() => setIsNavOpen(false)} aria-label="Close navigation" className="flex size-10 items-center justify-center lg:hidden"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3" aria-label="Dashboard">
          {NAV.map(([href, label, Icon]) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href} onClick={() => setIsNavOpen(false)} aria-current={isActive ? "page" : undefined} className={`mb-0.5 flex min-h-11 items-center gap-3 px-3 text-sm transition-colors ${isActive ? "bg-ivory/15 text-white" : "text-beige hover:bg-ivory/10"}`}>
                <Icon className="size-4" strokeWidth={1.4} /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-ivory/15 p-4">
          <p className="truncate text-xs text-beige">{email}</p>
          <form action={signOut}>
            <button type="submit" className="mt-2 inline-flex min-h-10 items-center gap-2 text-sm text-ivory hover:text-champagne"><LogOut className="size-4" strokeWidth={1.4} /> Log out</button>
          </form>
        </div>
      </aside>
      {isNavOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-30 bg-umber/40 lg:hidden" onClick={() => setIsNavOpen(false)} />}

      <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-beige bg-ivory/95 px-4 py-2 backdrop-blur-sm md:px-8">
        <button type="button" onClick={() => setIsNavOpen(true)} aria-label="Open navigation" className="flex size-10 items-center justify-center lg:hidden"><Menu className="size-5" /></button>
        {hasUnpublishedChanges && <p className="hidden text-xs text-soft-ink sm:block">You have changes guests can&apos;t see yet.</p>}
        <div className="ml-auto flex gap-2">
          <Link href="/admin/publish" className="btn btn-line !min-h-10 !px-3 !py-2"><Eye className="size-4" strokeWidth={1.4} /> <span className="hidden sm:inline">Preview Website</span><span className="sm:hidden">Preview</span></Link>
          <PublishButton hasChanges={hasUnpublishedChanges} />
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">{children}</main>
    </div>
  );
}

export function PublishButton({ hasChanges }: { hasChanges: boolean }) {
  const { confirm } = useFeedback();
  const { isBusy, run } = useActionRunner();

  const publish = async () => {
    const isConfirmed = await confirm({
      title: "Publish changes?",
      body: "Your saved edits to event details, the hero and traditions will become visible to every guest.",
      confirmLabel: "Publish",
    });
    if (isConfirmed) await run(publishChanges, "Your changes are live.");
  };

  return (
    <button type="button" onClick={publish} disabled={isBusy || !hasChanges} className="btn btn-solid !min-h-10 !px-3 !py-2">
      {isBusy ? "Publishing" : <><span className="hidden sm:inline">Publish Changes</span><span className="sm:hidden">Publish</span></>}
    </button>
  );
}
