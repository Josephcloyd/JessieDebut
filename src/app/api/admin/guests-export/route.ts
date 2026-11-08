import { NextResponse } from "next/server";
import { getGuestsWithRsvps } from "@/lib/data/admin";
import { toCsv } from "@/lib/domain/csv";
import { formatSubmittedAt } from "@/lib/domain/time";
import { getAdminContext } from "@/lib/server/admin";
import { SITE_URL } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const HEADERS = ["Name", "Status", "Companions", "Allowed companions", "Email", "Phone", "Dietary", "Message", "Submitted", "Invitation code", "Invitation link", "Notes"];
const STATUS_LABEL = { attending: "Confirmed", declined: "Declined" };

export async function GET(): Promise<Response> {
  const admin = await getAdminContext();
  if (!admin) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

  try {
    const guests = await getGuestsWithRsvps(admin.supabase);
    const rows = guests.map((guest) => [
      guest.rsvp?.full_name ?? guest.full_name,
      guest.rsvp ? STATUS_LABEL[guest.rsvp.status] : "Pending",
      guest.rsvp?.companions ?? 0,
      guest.max_companions,
      guest.rsvp?.email ?? guest.email,
      guest.rsvp?.phone ?? guest.phone,
      guest.rsvp?.dietary,
      guest.rsvp?.message,
      guest.rsvp ? formatSubmittedAt(guest.rsvp.submitted_at) : "",
      guest.invite_code,
      `${SITE_URL}/i/${guest.invite_code}`,
      guest.notes,
    ]);
    return new Response(toCsv(HEADERS, rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="debut-guest-list.csv"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[guests-export]", error);
    return NextResponse.json({ success: false, error: "Export failed" }, { status: 500 });
  }
}
