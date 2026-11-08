import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { getInvitedGuest } from "@/lib/data/invitation";
import { CardArt, getCardDetails, loadCardFonts } from "@/lib/server/card-art";

export const runtime = "nodejs";

const CARD_WIDTH = 1080;
const CARD_HEIGHT = 1500;

export async function GET(request: NextRequest): Promise<Response> {
  const code = request.nextUrl.searchParams.get("code");
  const [details, fonts, guest] = await Promise.all([getCardDetails(), loadCardFonts(), code ? getInvitedGuest(code) : null]);

  return new ImageResponse(<CardArt details={details} guestName={guest?.name} />, {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    fonts,
    headers: { "Content-Disposition": 'attachment; filename="debut-invitation.png"', "Cache-Control": "private, no-store" },
  });
}
