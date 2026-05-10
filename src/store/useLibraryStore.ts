import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song, Album, Artist } from "@/types/music";
import { useSettingsStore } from "./useSettingsStore";

export interface LocalPlaylist {
  id: string;
  title: string;
  songs: Song[];
  createdAt: string;
}

export interface HistoryItem {
  song: Song;
  playedAt: string;
}

interface LibraryState {
  playlists: LocalPlaylist[];
  history: HistoryItem[];
  savedArtists: Artist[];
  savedAlbums: Album[];

  // Playlist Actions
  createPlaylist: (title: string) => void;
  renamePlaylist: (id: string, newTitle: string) => void;
  deletePlaylist: (id: string) => void;
  addSongToPlaylist: (playlistId: string, song: Song) => void;
  removeSongFromPlaylist: (playlistId: string, songId: string) => void;
  reorderSongInPlaylist: (playlistId: string, startIndex: number, endIndex: number) => void;
  clearPlaylists: () => void;

  // History Actions
  addToHistory: (song: Song) => void;
  clearHistory: () => void;

  // Artist Actions
  saveArtist: (artist: Artist) => void;
  unsaveArtist: (artistId: string) => void;

  // Album Actions
  saveAlbum: (album: Album) => void;
  unsaveAlbum: (albumId: string) => void;

  // Favorite Actions
  toggleFavorite: (song: Song) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set, get) => ({
      playlists: [],
      history: [],
      savedArtists: [],
      savedAlbums: [],

      // PLAYLIST ACTIONS
      createPlaylist: (title) => {
        const { playlists } = get();
        const newPlaylist: LocalPlaylist = {
          id: `local-playlist-${Date.now()}`,
          title: title.trim() || `My Playlist #${playlists.length + 1}`,
          songs: [],
          createdAt: new Date().toISOString(),
        };
        set({ playlists: [newPlaylist, ...playlists] });
      },

      renamePlaylist: (id, newTitle) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) =>
            p.id === id ? { ...p, title: newTitle.trim() || p.title } : p
          ),
        });
      },

      deletePlaylist: (id) => {
        const { playlists } = get();
        set({ playlists: playlists.filter((p) => p.id !== id) });
      },

      addSongToPlaylist: (playlistId, song) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const exists = p.songs.some((s) => s.id === song.id);
            if (exists) return p;
            return { ...p, songs: [...p.songs, song] };
          }),
        });
      },

      removeSongFromPlaylist: (playlistId, songId) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) =>
            p.id === playlistId ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p
          ),
        });
      },

      reorderSongInPlaylist: (playlistId, startIndex, endIndex) => {
        const { playlists } = get();
        set({
          playlists: playlists.map((p) => {
            if (p.id !== playlistId) return p;
            const result = [...p.songs];
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...p, songs: result };
          }),
        });
      },

      clearPlaylists: () => set({ playlists: [], savedArtists: [], savedAlbums: [] }),

      // HISTORY ACTIONS
      addToHistory: (song) => {
        const isPrivate = useSettingsStore.getState().privateSession;
        if (isPrivate) return;

        const { history } = get();
        const filtered = history.filter((item) => item.song.id !== song.id);
        const newItem: HistoryItem = {
          song,
          playedAt: new Date().toISOString(),
        };

        set({ history: [newItem, ...filtered].slice(0, 1000) });
      },

      clearHistory: () => set({ history: [] }),

      // ARTIST ACTIONS
      saveArtist: (artist) => {
        const { savedArtists } = get();
        if (savedArtists.some(a => a.id === artist.id)) return;
        set({ savedArtists: [artist, ...savedArtists] });
      },

      unsaveArtist: (artistId) => {
        const { savedArtists } = get();
        set({ savedArtists: savedArtists.filter(a => a.id !== artistId) });
      },

      // ALBUM ACTIONS
      saveAlbum: (album) => {
        const { savedAlbums } = get();
        if (savedAlbums.some(a => a.id === album.id)) return;
        set({ savedAlbums: [album, ...savedAlbums] });
      },

      unsaveAlbum: (albumId) => {
        const { savedAlbums } = get();
        set({ savedAlbums: savedAlbums.filter(a => a.id !== albumId) });
      },

      toggleFavorite: (song) => {
        const { playlists } = get();
        const likedPlaylist = playlists.find((p) => p.id === "liked");
        
        if (!likedPlaylist) {
          const newLikedPlaylist = {
            id: "liked",
            title: "Lagu Favorit",
            songs: [song],
            createdAt: new Date().toISOString(),
          };
          set({ playlists: [newLikedPlaylist, ...playlists] });
        } else {
          const songExists = likedPlaylist.songs.some((s) => s.id === song.id);
          const updatedSongs = songExists
            ? likedPlaylist.songs.filter((s) => s.id !== song.id)
            : [...likedPlaylist.songs, song];
            
          set({
            playlists: playlists.map((p) =>
              p.id === "liked" ? { ...p, songs: updatedSongs } : p
            ),
          });
        }
      },
    }),
    {
      name: "antimusic-library-store",
    }
  )
);
