import { NextResponse } from "next/server";
import QRCode from "qrcode";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const qrDataUrl = await QRCode.toDataURL(url, {
      width:  300,
      margin: 2,
      color: {
        dark:  "#7c3aed",
        light: "#ffffff",
      },
    });

    return NextResponse.json({ qr: qrDataUrl }, { status: 200 });
  } catch (error) {
    console.error("QR error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}