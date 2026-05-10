import { NextRequest, NextResponse } from "next/server";
import { searchMusic } from "@/lib/api/youtube";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const filter = searchParams.get("filter") || undefined; // e.g., 'songs', 'albums', 'artists', 'playlists'

    if (!query) {
      return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 });
    }

    const results = await searchMusic(query, filter);
    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search API route error:", error);
    return NextResponse.json({ error: error.message || "An error occurred during search" }, { status: 500 });
  }
}
export const dynamic = 'force-dynamic';
