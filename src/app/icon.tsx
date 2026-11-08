import { ImageResponse } from "next/og";
import { getCardDetails, loadCardFonts } from "@/lib/server/card-art";

export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Icon() {
  const [details, fonts] = await Promise.all([getCardDetails(), loadCardFonts()]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 32, background: "#FFD2D7", border: "3px solid #C58B95", color: "#4D2C32", fontFamily: "Cormorant", fontSize: 40 }}>
        {details.monogram}
      </div>
    ),
    { ...size, fonts },
  );
}
