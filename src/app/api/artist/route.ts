import { NextRequest, NextResponse } from "next/server";
import { getArtistDetails } from "@/lib/api/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing artist ID parameter 'id'" }, { status: 400 });
    }

    const details = await getArtistDetails(id);
    return NextResponse.json(details);
  } catch (error: any) {
    console.error("Artist API route error:", error);
    return NextResponse.json({ error: error.message || "An error occurred fetching artist" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
