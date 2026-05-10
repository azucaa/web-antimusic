import { Song, SearchResult, Album, Artist, Playlist } from "@/types/music";

const YTM_API_URL = "https://music.youtube.com/youtubei/v1";
const USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

interface InnerTubeContext {
  context: {
    client: {
      clientName: string;
      clientVersion: string;
      hl: string;
      gl: string;
    };
  };
}

function getContextPayload(): InnerTubeContext {
  return {
    context: {
      client: {
        clientName: "WEB_REMIX",
        clientVersion: "1.20240101.01.00",
        hl: "en",
        gl: "US",
      },
    },
  };
}

async function postInnerTube(endpoint: string, payload: any) {
  const url = `${YTM_API_URL}/${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": USER_AGENT,
      "X-Goog-Api-Format-Version": "1",
      "X-YouTube-Client-Name": "67",
      "X-YouTube-Client-Version": "1.20240101.01.00",
      "Origin": "https://music.youtube.com",
      "Referer": "https://music.youtube.com/",
    },
    body: JSON.stringify({
      ...getContextPayload(),
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`InnerTube request failed: ${response.statusText}`);
  }

  return response.json();
}

// Helpers to extract text and links safely from InnerTube's complex JSON
function getRunsText(runsObj: any): string {
  if (!runsObj || !Array.isArray(runsObj)) return "";
  return runsObj.map((r: any) => r.text || "").join("");
}

function getThumbnail(thumbnailRenderer: any): string {
  const thumbnails = thumbnailRenderer?.thumbnail?.thumbnails || thumbnailRenderer?.thumbnails || [];
  if (thumbnails.length === 0) return "/placeholder-music.jpg";
  // Grab the highest resolution available
  const highest = thumbnails[thumbnails.length - 1];
  return highest.url || "/placeholder-music.jpg";
}

function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;
  const parts = durationStr.split(":").map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  return 0;
}

// Map musicResponsiveListItemRenderer to Song or specific types
function parseResponsiveListItem(renderer: any): any {
  if (!renderer) return null;

  const flexColumns = renderer.flexColumns || [];
  const titleColumn = flexColumns[0]?.musicResponsiveListItemFlexColumnRenderer;
  const subtitleColumn = flexColumns[1]?.musicResponsiveListItemFlexColumnRenderer;

  const title = getRunsText(titleColumn?.text?.runs);
  const subtitleRuns = subtitleColumn?.text?.runs || [];

  // Parse details from subtitle runs
  // Format is usually: [Type] • [Artist 1] & [Artist 2] • [Album] • [Duration]
  // Or: [Artist] • [Album] • [Duration]
  let itemType = "song";
  const pageType = renderer.navigationEndpoint?.browseEndpoint?.pageType;
  if (pageType === "MUSIC_PAGE_TYPE_ARTIST") {
    itemType = "artist";
  } else if (pageType === "MUSIC_PAGE_TYPE_ALBUM") {
    itemType = "album";
  } else if (pageType === "MUSIC_PAGE_TYPE_PLAYLIST") {
    itemType = "playlist";
  }

  const id = renderer.playlistItemData?.videoId || 
             renderer.navigationEndpoint?.watchEndpoint?.videoId ||
             renderer.navigationEndpoint?.browseEndpoint?.browseId ||
             "";

  const thumbnail = getThumbnail(renderer.thumbnail?.musicThumbnailRenderer);

  // If we have an artist
  if (itemType === "artist") {
    return {
      id,
      title,
      artist: "Artist",
      thumbnail,
      source: "youtube" as const,
      type: "artist" as const,
    };
  }

  // Parse subtitle runs to extract artists, album, and duration
  const artists: { name: string; id?: string }[] = [];
  let albumName = "";
  let albumId = "";
  let durationStr = "";

  // Split runs by the " • " separator
  const sections: any[][] = [[]];
  for (const run of subtitleRuns) {
    if (run.text === " • ") {
      sections.push([]);
    } else {
      sections[sections.length - 1].push(run);
    }
  }

  // First section is usually Artists (or Type if first run is like "Song" or "Video")
  let artistSection = sections[0] || [];
  let albumSection = sections[1] || [];
  let durationSection = sections[sections.length - 1] || [];

  // If there's a type like "Song" or "Video" in first section, shift sections
  const firstText = artistSection[0]?.text || "";
  if (["Song", "Video", "Album", "Playlist", "Single", "EP"].includes(firstText)) {
    if (firstText === "Album" || firstText === "EP" || firstText === "Single") {
      itemType = "album";
    } else if (firstText === "Playlist") {
      itemType = "playlist";
    }
    artistSection = sections[1] || [];
    albumSection = sections[2] || [];
  }

  // Extract artists
  for (const run of artistSection) {
    if (run.text && run.text !== " & " && run.text !== ", ") {
      artists.push({
        name: run.text,
        id: run.navigationEndpoint?.browseEndpoint?.browseId,
      });
    }
  }

  // Extract album
  const albumRun = albumSection.find((r: any) => r.navigationEndpoint?.browseEndpoint?.pageType === "MUSIC_PAGE_TYPE_ALBUM");
  if (albumRun) {
    albumName = albumRun.text;
    albumId = albumRun.navigationEndpoint?.browseEndpoint?.browseId || "";
  }

  // Extract duration
  const timeRun = durationSection.find((r: any) => /^\d+:\d+(:\d+)?$/.test(r.text || ""));
  if (timeRun) {
    durationStr = timeRun.text;
  }

  const artistNames = artists.map(a => a.name).join(", ") || "Unknown Artist";

  if (itemType === "album") {
    return {
      id,
      title,
      artist: artistNames,
      thumbnail,
      year: parseInt(durationStr) || undefined,
      source: "youtube" as const,
      type: "album" as const,
    };
  }

  if (itemType === "playlist") {
    return {
      id,
      title,
      artist: artistNames,
      thumbnail,
      songCount: durationStr,
      source: "youtube" as const,
      type: "playlist" as const,
    };
  }

  // Default to song
  return {
    id,
    title,
    artist: artistNames,
    artistsList: artists,
    album: albumName ? { name: albumName, id: albumId } : undefined,
    thumbnail,
    duration: durationStr,
    durationSeconds: parseDuration(durationStr),
    source: "youtube" as const,
    type: "song" as const,
  };
}

function parseTwoRowItem(renderer: any): any {
  if (!renderer) return null;

  const id = renderer.navigationEndpoint?.browseEndpoint?.browseId || 
             renderer.navigationEndpoint?.watchEndpoint?.videoId || "";
  const title = getRunsText(renderer.title?.runs);
  const subtitleRuns = renderer.subtitle?.runs || [];
  const thumbnail = getThumbnail(renderer.thumbnailRenderer?.musicThumbnailRenderer || renderer.thumbnailRenderer);

  let type = "album";
  const pageType = renderer.navigationEndpoint?.browseEndpoint?.pageType;
  if (pageType === "MUSIC_PAGE_TYPE_ARTIST") {
    type = "artist";
  } else if (pageType === "MUSIC_PAGE_TYPE_PLAYLIST") {
    type = "playlist";
  }

  const subtitleText = getRunsText(subtitleRuns);
  let artist = subtitleText;
  if (type === "album") {
    // Subtitle usually formatted as "Album • Artist" or "Artist • Year"
    const parts = subtitleText.split(" • ");
    artist = parts[0] || "Unknown Artist";
  }

  return {
    id,
    title,
    artist,
    thumbnail,
    source: "youtube" as const,
    type: type as any,
  };
}

// EXPORTED FUNCTIONS FOR API ROUTES

const FILTER_PARAMS: Record<string, string> = {
  songs: "EgWKAQIIAWoKEAkQBRAKEAMQBA%3D%3D",
  videos: "EgWKAQIQAWoKEAkQChAFEAMQBA%3D%3D",
  albums: "EgWKAQIYAWoKEAkQChAFEAMQBA%3D%3D",
  artists: "EgWKAQIgAWoKEAkQChAFEAMQBA%3D%3D",
  playlists: "EgeKAQQoAEABagoQAxAEEAoQCRAF",
};

export async function searchMusic(query: string, filter?: string): Promise<SearchResult> {
  const payload: any = { query };
  if (filter && FILTER_PARAMS[filter]) {
    payload.params = FILTER_PARAMS[filter];
  }

  const data = await postInnerTube("search", payload);
  
  const results: SearchResult = {
    songs: [],
    videos: [],
    albums: [],
    artists: [],
    playlists: [],
  };

  // Traverse YouTube Music's response to find lists of results
  const tab = data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer;
  const sectionList = tab?.content?.sectionListRenderer?.contents || [];

  for (const section of sectionList) {
    const shelf = section.musicShelfRenderer;
    const cardShelf = section.musicCardShelfRenderer;

    if (shelf) {
      const shelfTitle = getRunsText(shelf.title?.runs).toLowerCase();
      const items = shelf.contents || [];

      for (const rawItem of items) {
        const item = parseResponsiveListItem(rawItem.musicResponsiveListItemRenderer);
        if (!item) continue;

        if (item.type === "song") {
          results.songs.push(item);
        } else if (item.type === "album") {
          results.albums.push(item);
        } else if (item.type === "artist") {
          results.artists.push(item);
        } else if (item.type === "playlist") {
          results.playlists.push(item);
        }
      }
    } else if (cardShelf) {
      // Top result card
      const title = getRunsText(cardShelf.header?.musicCardShelfHeaderBasicRenderer?.title?.runs) || "Top Result";
      const thumbnail = getThumbnail(cardShelf.thumbnail?.musicThumbnailRenderer);
      const mainId = cardShelf.onTap?.watchEndpoint?.videoId || cardShelf.onTap?.browseEndpoint?.browseId || "";
      const subtitle = getRunsText(cardShelf.subtitle?.runs);

      const pageType = cardShelf.onTap?.browseEndpoint?.pageType;
      let topItemType: "song" | "artist" | "album" | "playlist" = "song";
      if (pageType === "MUSIC_PAGE_TYPE_ARTIST") topItemType = "artist";
      else if (pageType === "MUSIC_PAGE_TYPE_ALBUM") topItemType = "album";
      else if (pageType === "MUSIC_PAGE_TYPE_PLAYLIST") topItemType = "playlist";

      const topItem = {
        id: mainId,
        title: getRunsText(cardShelf.title?.runs),
        artist: subtitle || "Top Result",
        thumbnail,
        source: "youtube" as const,
        type: topItemType,
        isTopResult: true,
      };

      if (topItemType === "song") results.songs.unshift(topItem as any);
      else if (topItemType === "artist") results.artists.unshift(topItem as any);
      else if (topItemType === "album") results.albums.unshift(topItem as any);
      else if (topItemType === "playlist") results.playlists.unshift(topItem as any);

      // Card shelf can also contain minor responsive items
      const minorItems = cardShelf.contents || [];
      for (const rawItem of minorItems) {
        const item = parseResponsiveListItem(rawItem.musicResponsiveListItemRenderer);
        if (item && item.type === "song") {
          results.songs.push(item);
        }
      }
    }
  }

  // Deduplicate results
  results.songs = deduplicate(results.songs);
  results.albums = deduplicate(results.albums);
  results.artists = deduplicate(results.artists);
  results.playlists = deduplicate(results.playlists);

  return results;
}

function deduplicate<T extends { id: string }>(arr: T[]): T[] {
  const seen = new Set();
  return arr.filter(item => {
    if (!item.id || seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export async function getAlbumDetails(browseId: string) {
  const data = await postInnerTube("browse", { browseId });
  
  const header = data.header?.musicDetailHeaderRenderer || 
                 data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]?.musicResponsiveHeaderRenderer;

  const title = getRunsText(header?.title?.runs) || "Unknown Album";
  const thumbnail = getThumbnail(header?.thumbnail?.musicThumbnailRenderer || header?.thumbnail);
  const artistName = getRunsText(header?.subtitle?.runs?.slice(0, 2)) || "Unknown Artist";
  
  // Find tracklist
  let tracksRaw: any[] = [];
  const tabContent = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content ||
                     data.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents?.[0];
  
  const shelf = tabContent?.musicPlaylistShelfRenderer || tabContent?.musicShelfRenderer;
  if (shelf) {
    tracksRaw = shelf.contents || [];
  } else {
    // Check fallback in section list
    const sections = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const section of sections) {
      if (section.musicShelfRenderer) {
        tracksRaw = section.musicShelfRenderer.contents || [];
        break;
      }
    }
  }

  const songs: Song[] = tracksRaw.map((raw: any) => {
    const r = raw.musicResponsiveListItemRenderer;
    if (!r) return null;
    const item = parseResponsiveListItem(r);
    // Inherit thumbnail & artist from album if missing
    if (item) {
      if (!item.thumbnail || item.thumbnail.includes("placeholder")) item.thumbnail = thumbnail;
      if (item.artist === "Unknown Artist") item.artist = artistName;
    }
    return item;
  }).filter(Boolean);

  return {
    id: browseId,
    title,
    artist: artistName,
    thumbnail,
    songs,
  };
}

export async function getArtistDetails(browseId: string) {
  const data = await postInnerTube("browse", { browseId });

  const header = data.header?.musicImmersiveHeaderRenderer || 
                 data.header?.musicVisualHeaderRenderer || 
                 data.header?.musicHeaderRenderer;

  const title = getRunsText(header?.title?.runs) || "Unknown Artist";
  const thumbnail = getThumbnail(header?.thumbnail?.musicThumbnailRenderer || header?.foregroundThumbnail?.musicThumbnailRenderer);
  const description = getRunsText(header?.description?.runs) || "";

  const songs: Song[] = [];
  const albums: Album[] = [];

  const tab = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer;
  const sections = tab?.content?.sectionListRenderer?.contents || [];

  for (const section of sections) {
    const shelf = section.musicShelfRenderer;
    const carousel = section.musicCarouselShelfRenderer;

    if (shelf) {
      const title = getRunsText(shelf.title?.runs).toLowerCase();
      if (title.includes("songs") || title.includes("top tracks")) {
        const items = shelf.contents || [];
        for (const raw of items) {
          const item = parseResponsiveListItem(raw.musicResponsiveListItemRenderer);
          if (item && item.type === "song") {
            songs.push(item);
          }
        }
      }
    } else if (carousel) {
      const title = getRunsText(carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs).toLowerCase();
      if (title.includes("albums") || title.includes("singles") || title.includes("releases")) {
        const items = carousel.contents || [];
        for (const raw of items) {
          const item = parseTwoRowItem(raw.musicTwoRowItemRenderer);
          if (item && item.type === "album") {
            albums.push(item);
          }
        }
      }
    }
  }

  return {
    id: browseId,
    title,
    thumbnail,
    description,
    songs: songs.slice(0, 10), // Take top 10 songs
    albums: albums.slice(0, 10), // Take top 10 albums
  };
}

export async function getPlaylistDetails(playlistId: string) {
  // Playlist browse ID starts with VL internally
  const browseId = playlistId.startsWith("VL") ? playlistId : `VL${playlistId}`;
  const data = await postInnerTube("browse", { browseId });

  const base = data.contents?.twoColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0];
  const header = base?.musicResponsiveHeaderRenderer || base?.musicEditablePlaylistDetailHeaderRenderer?.header?.musicResponsiveHeaderRenderer;

  const title = getRunsText(header?.title?.runs) || "Local Playlist";
  const thumbnail = getThumbnail(header?.thumbnail?.musicThumbnailRenderer);
  const author = getRunsText(header?.straplineTextOne?.runs) || "YouTube Music";

  let tracksRaw: any[] = [];
  const secondaryContents = data.contents?.twoColumnBrowseResultsRenderer?.secondaryContents?.sectionListRenderer?.contents || [];
  for (const c of secondaryContents) {
    if (c.musicPlaylistShelfRenderer) {
      tracksRaw = c.musicPlaylistShelfRenderer.contents || [];
      break;
    }
  }

  if (tracksRaw.length === 0) {
    // Try main contents
    const mainContents = data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];
    for (const c of mainContents) {
      if (c.musicPlaylistShelfRenderer) {
        tracksRaw = c.musicPlaylistShelfRenderer.contents || [];
        break;
      }
    }
  }

  const songs: Song[] = tracksRaw.map((raw: any) => {
    return parseResponsiveListItem(raw.musicResponsiveListItemRenderer);
  }).filter(Boolean);

  return {
    id: playlistId,
    title,
    artist: author,
    thumbnail,
    songs,
  };
}
