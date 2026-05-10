import { NextRequest, NextResponse } from "next/server";
import { getPlaylistDetails } from "@/lib/api/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing playlist ID parameter 'id'" }, { status: 400 });
    }

    const details = await getPlaylistDetails(id);
    return NextResponse.json(details);
  } catch (error: any) {
    console.error("Playlist API route error:", error);
    return NextResponse.json({ error: error.message || "An error occurred fetching playlist" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
