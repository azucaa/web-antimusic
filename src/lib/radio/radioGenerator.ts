import { Song } from "@/types/music";
import { RadioSeed, RadioSession } from "@/types/radio";

// Simple ID deduplication for Songs
export function dedupeSongs(songs: Song[]): Song[] {
  const seen = new Set<string>();
  return songs.filter((song) => {
    const key = song.id || `${song.title.trim().toLowerCase()}-${song.artist.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Global list of beautiful backup songs in case external APIs fail or return sparse lists
const DEFAULT_FALLBACK_SONGS: Song[] = [
  {
    id: "jfKfPfyJRdk",
    title: "Chilled Cow - Lofi Study Beats",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    duration: "2:50",
    durationSeconds: 170,
    source: "youtube",
    type: "song"
  },
  {
    id: "tNkZsMC7_1A",
    title: "Late Night Drive - Chill Lofi",
    artist: "Lofi Vibes",
    thumbnail: "https://i.ytimg.com/vi/tNkZsMC7_1A/hqdefault.jpg",
    duration: "3:15",
    durationSeconds: 195,
    source: "youtube",
    type: "song"
  },
  {
    id: "5qap5aO4i9A",
    title: "Lofi Hip Hop Radio - Beats to Study/Relax to",
    artist: "Lofi Girl",
    thumbnail: "https://i.ytimg.com/vi/5qap5aO4i9A/hqdefault.jpg",
    duration: "4:02",
    durationSeconds: 242,
    source: "youtube",
    type: "song"
  },
  {
    id: "DWcJYXZfrOI",
    title: "Always With Me - Spirited Away Lofi",
    artist: "Chillhop Music",
    thumbnail: "https://i.ytimg.com/vi/DWcJYXZfrOI/hqdefault.jpg",
    duration: "3:40",
    durationSeconds: 220,
    source: "youtube",
    type: "song"
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Despacito - Ambient Spanish Guitar",
    artist: "Luis Fonsi (Acoustic)",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    duration: "3:48",
    durationSeconds: 228,
    source: "youtube",
    type: "song"
  }
];

export async function generateRadioTracks(
  seed: RadioSeed,
  mode: RadioSession["mode"],
  localHistory: Song[] = [],
  localFavorites: Song[] = []
): Promise<Song[]> {
  let tracks: Song[] = [];

  // Helper to fetch search results from our API
  const fetchSearch = async (query: string): Promise<Song[]> => {
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.songs || [];
    } catch {
      return [];
    }
  };

  // 1. Gather potential source items based on seed type
  if (seed.type === "song") {
    // Song Radio
    const songTitle = seed.title;
    const songArtist = seed.artist || "";
    
    const [relatedSearch, artistSearch] = await Promise.all([
      fetchSearch(`${songTitle} ${songArtist} related mix`),
      fetchSearch(`${songArtist} best tracks`)
    ]);

    tracks = [...relatedSearch, ...artistSearch];
  } else if (seed.type === "artist") {
    // Artist Radio
    const artistName = seed.title;
    const [primaryTracks, mixTracks] = await Promise.all([
      fetchSearch(`${artistName} best songs`),
      fetchSearch(`${artistName} mix hits`)
    ]);

    tracks = [...primaryTracks, ...mixTracks];
  } else if (seed.type === "album") {
    // Album Radio
    const albumName = seed.title;
    const artistName = seed.artist || "";
    const [albumTracks, relatedTracks] = await Promise.all([
      fetchSearch(`${albumName} ${artistName} full album`),
      fetchSearch(`${artistName} radio mix`)
    ]);

    tracks = [...albumTracks, ...relatedTracks];
  } else if (seed.type === "playlist") {
    // Playlist Radio
    const query = seed.title;
    const [playlistTracks, matchingVibes] = await Promise.all([
      fetchSearch(`${query} playlist tracks`),
      fetchSearch(`${query} mix hits`)
    ]);

    tracks = [...playlistTracks, ...matchingVibes];
  } else if (seed.type === "mood" || seed.type === "genre") {
    // Mood/Genre Radio
    const moodQuery = seed.title.toLowerCase();
    let searchTerm = `${moodQuery} music`;

    if (moodQuery.includes("chill") || moodQuery.includes("santai")) {
      searchTerm = "acoustic chill cafe sunset relax";
    } else if (moodQuery.includes("focus") || moodQuery.includes("fokus") || moodQuery.includes("study")) {
      searchTerm = "lofi study coding focus study beats";
    } else if (moodQuery.includes("sad") || moodQuery.includes("sedih")) {
      searchTerm = "sad aesthetic crying depression emotional ballad";
    } else if (moodQuery.includes("energy") || moodQuery.includes("olahraga") || moodQuery.includes("workout")) {
      searchTerm = "gym phonk workout bass boost energetic electropop";
    } else if (moodQuery.includes("indonesia") || moodQuery.includes("indo")) {
      searchTerm = "pop indonesia viral hits terbaru 2026";
    } else if (moodQuery.includes("night") || moodQuery.includes("malam")) {
      searchTerm = "synthwave vaporwave late night drive slow r&b";
    }

    const moodTracks = await fetchSearch(searchTerm);
    tracks = [...moodTracks];
  } else if (seed.type === "history") {
    // History Radio
    tracks = [...localHistory, ...localFavorites];
  }

  // 2. Adjust list depending on selected Algorithmic Mode
  if (mode === "balanced") {
    // Balanced: Blend online results with matching local history and favorites
    const matchesLocal = [...localHistory, ...localFavorites].filter(
      (s) =>
        s.artist.toLowerCase().includes(seed.artist?.toLowerCase() || "___non-existent___") ||
        s.title.toLowerCase().includes(seed.title.toLowerCase())
    );
    tracks = [...matchesLocal.slice(0, 8), ...tracks];
  } else if (mode === "discovery") {
    // Discovery: Exclude local history entirely to force new music recommendations
    const historyIds = new Set(localHistory.map((s) => s.id));
    tracks = tracks.filter((s) => !historyIds.has(s.id));
  } else if (mode === "familiar") {
    // Familiar: Boost local history and favorites significantly
    const matchingArtistFavorites = localFavorites.filter(
      (s) => s.artist.toLowerCase() === seed.artist?.toLowerCase()
    );
    const matchingArtistHistory = localHistory.filter(
      (s) => s.artist.toLowerCase() === seed.artist?.toLowerCase()
    );
    tracks = [...matchingArtistFavorites, ...matchingArtistHistory, ...tracks];
  } else if (mode === "anti_algorithm") {
    // Anti-Algorithm: Strict local experience. Eliminate all online scraped search API results
    tracks = [...localFavorites, ...localHistory];
    if (seed.artist) {
      tracks = tracks.filter((s) => s.artist.toLowerCase() === seed.artist?.toLowerCase());
    }
  }

  // 3. Clean up the generated tracks
  tracks = dedupeSongs(tracks);

  // 4. Fallback safeguard: If sparse, append high-quality fallback tracks to hit target size (25-50)
  if (tracks.length < 25) {
    const backupTracks = DEFAULT_FALLBACK_SONGS.filter(
      (backup) => !tracks.some((s) => s.id === backup.id)
    );
    tracks = [...tracks, ...backupTracks];
  }

  // Limit radio size to a beautiful 40-song tracklist
  return tracks.slice(0, 40);
}
