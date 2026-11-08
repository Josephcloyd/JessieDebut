import { ImageResponse } from "next/og";
import { CardArt, getCardDetails, loadCardFonts } from "@/lib/server/card-art";

export const runtime = "nodejs";
export const alt = "An invitation to The Grand Debut";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 300;

const LANDSCAPE_SCALE = 0.62;

export default async function OpenGraphImage() {
  const [details, fonts] = await Promise.all([getCardDetails(), loadCardFonts()]);
  return new ImageResponse(<CardArt details={details} scale={LANDSCAPE_SCALE} />, { ...size, fonts });
}
