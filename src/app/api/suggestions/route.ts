import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim() || "";

    if (!query) {
      return NextResponse.json([]);
    }

    // Call public YouTube suggestion API
    const response = await fetch(
      `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
        query
      )}`,
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch suggestions");
    }

    const data = await response.json();
    // Format is [original_query, [suggestion_list]]
    const suggestions = data[1] || [];

    return NextResponse.json(suggestions.slice(0, 7)); // Return top 7 autocompletes
  } catch (err: any) {
    console.error("Suggestions API error:", err);
    // Return empty list on failure rather than failing the search component
    return NextResponse.json([]);
  }
}
export const dynamic = "force-dynamic";
