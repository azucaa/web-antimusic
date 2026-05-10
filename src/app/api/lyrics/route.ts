import { NextRequest, NextResponse } from "next/server";
import { LyricsLine, LyricsResult } from "@/types/lyrics";

// Clean titles/artists to guarantee a highly accurate matching index on LRCLIB
function cleanQueryTerm(term: string): string {
  if (!term) return "";
  let cleaned = term;
  
  // 1. Remove parenthetical or bracketed additions: (Official Video), (feat. Daniel Caesar), [Lyrics]
  cleaned = cleaned.replace(/\s*[\(\[][^\]\)]*[\)\]]/gi, "");
  
  // 2. Remove featured artist tags (ft., feat, featuring)
  cleaned = cleaned.replace(/\s*(?:feat|ft|featuring)\.?\s+.*$/gi, "");
  
  // 3. Remove YouTube Music auto-generated " - Topic" artists
  cleaned = cleaned.replace(/\s*-\s*topic/gi, "");
  
  // 4. Remove common video suffix tags
  cleaned = cleaned.replace(/\s*(?:official video|official music video|official audio|lyrics|lyric video|HD|4K|1080p|clip)/gi, "");
  
  // 5. Trim quotes and multiple spaces
  cleaned = cleaned.replace(/["']/g, "").replace(/\s+/g, " ");

  return cleaned.trim();
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id") || "";
    const rawTitle = searchParams.get("title") || "";
    const rawArtist = searchParams.get("artist") || "";

    const title = cleanQueryTerm(rawTitle);
    const artist = cleanQueryTerm(rawArtist);

    if (!title || !artist) {
      return NextResponse.json({ error: "Missing title or artist parameters" }, { status: 400 });
    }

    // Call LRCLIB API with cleaned terms
    const url = `https://lrclib.net/api/get?artist=${encodeURIComponent(artist)}&title=${encodeURIComponent(title)}`;
    let response = await fetch(url, {
      headers: {
        "User-Agent": "AntiMusicWebLite/1.0 (https://github.com/vfsfitvnm/ViMusic inspired)"
      }
    });

    let data: any = null;
    if (response.ok) {
      data = await response.json();
    } else {
      // Fallback: Query the LRCLIB Search endpoint with artist + title to be more resilient
      const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(artist + " " + title)}`;
      const searchRes = await fetch(searchUrl, {
        headers: {
          "User-Agent": "AntiMusicWebLite/1.0 (https://github.com/vfsfitvnm/ViMusic inspired)"
        }
      });
      if (searchRes.ok) {
        const results = await searchRes.json();
        if (results && results.length > 0) {
          data = results[0]; // Grab the best match
        }
      }
    }

    if (!data) {
      return NextResponse.json(getPlaceholderLyrics(id));
    }

    const lines: LyricsLine[] = [];
    let synced = false;

    if (data.syncedLyrics) {
      synced = true;
      const lrcLines = data.syncedLyrics.split("\n");
      for (const line of lrcLines) {
        // Parse format e.g. [01:23.45] Hello World or [01:23] Hello World (with optional fractional seconds)
        const match = line.match(/\[(\d+):(\d+)(?:\.(\d+))?\](.*)/);
        if (match) {
          const minutes = parseInt(match[1], 10);
          const seconds = parseInt(match[2], 10);
          const fractionStr = match[3] || "0";
          const fractionalSeconds = parseFloat("0." + fractionStr);
          const time = minutes * 60 + seconds + fractionalSeconds;
          const text = match[4].trim();
          lines.push({ time, text });
        }
      }
    } else if (data.plainLyrics) {
      const plainLines = data.plainLyrics.split("\n");
      for (const line of plainLines) {
        lines.push({ text: line.trim() });
      }
    }

    if (lines.length === 0) {
      return NextResponse.json(getPlaceholderLyrics(id));
    }

    const result: LyricsResult = {
      songId: id,
      provider: "lrclib",
      synced,
      lines,
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Lyrics API route error:", error);
    return NextResponse.json({ error: error.message || "An error occurred fetching lyrics" }, { status: 500 });
  }
}

function getPlaceholderLyrics(songId: string): LyricsResult {
  return {
    songId,
    provider: "mock",
    synced: false,
    lines: [
      { text: "No lyrics found for this song." },
      { text: "Try playing another track, or verify spelling in search tags." },
    ]
  };
}

export const dynamic = 'force-dynamic';
