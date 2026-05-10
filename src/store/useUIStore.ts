import { create } from "zustand";

interface UIState {
  selectedArtistId: string | null;
  selectedAlbumId: string | null;
  selectedPlaylistId: string | null;
  setSelectedArtistId: (id: string | null | undefined) => void;
  setSelectedAlbumId: (id: string | null | undefined) => void;
  setSelectedPlaylistId: (id: string | null | undefined) => void;
  closeAllSheets: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedArtistId: null,
  selectedAlbumId: null,
  selectedPlaylistId: null,

  setSelectedArtistId: (id) => set({ selectedArtistId: id ?? null }),
  setSelectedAlbumId: (id) => set({ selectedAlbumId: id ?? null }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id ?? null }),
  closeAllSheets: () => set({ selectedArtistId: null, selectedAlbumId: null, selectedPlaylistId: null }),
}));
