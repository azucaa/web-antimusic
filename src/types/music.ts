export interface Song {
  id: string;
  title: string;
  artist: string;
  artistsList?: { name: string; id?: string }[];
  album?: { name: string; id?: string };
  thumbnail: string;
  duration?: string;
  durationSeconds?: number;
  source: "youtube" | "local" | "mock";
  type: "song";
  isTopResult?: boolean;
}

export interface Album {
  id: string;
  title: string;
  artist: string;
  thumbnail: string;
  year?: number;
  source: "youtube" | "local" | "mock";
  type: "album";
  songs?: Song[];
}

export interface Artist {
  id: string;
  title: string;
  thumbnail: string;
  description?: string;
  songs?: Song[];
  albums?: Album[];
  source: "youtube" | "local" | "mock";
  type: "artist";
}

export interface Playlist {
  id: string;
  title: string;
  artist: string; // creator / author name
  thumbnail: string;
  songCount?: string;
  songs?: Song[];
  source: "youtube" | "local" | "mock";
  type: "playlist";
}

export interface SearchResult {
  songs: Song[];
  videos: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}
