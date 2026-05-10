import { create } from "zustand";
import { Song } from "@/types/music";

interface UIState {
  selectedArtistId: string | null;
  selectedAlbumId: string | null;
  selectedPlaylistId: string | null;
  songForPlaylistModal: Song | null;
  songForTogetherModal: Song | null;
  isRightPanelOpen: boolean;
  isMiniPlayerHidden: boolean;
  setSelectedArtistId: (id: string | null | undefined) => void;
  setSelectedAlbumId: (id: string | null | undefined) => void;
  setSelectedPlaylistId: (id: string | null | undefined) => void;
  setSongForPlaylistModal: (song: Song | null) => void;
  setSongForTogetherModal: (song: Song | null) => void;
  setRightPanelOpen: (open: boolean) => void;
  setMiniPlayerHidden: (hidden: boolean) => void;
  closeAllSheets: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  selectedArtistId: null,
  selectedAlbumId: null,
  selectedPlaylistId: null,
  songForPlaylistModal: null,
  songForTogetherModal: null,
  isRightPanelOpen: true,
  isMiniPlayerHidden: false,

  setSelectedArtistId: (id) => set({ selectedArtistId: id ?? null }),
  setSelectedAlbumId: (id) => set({ selectedAlbumId: id ?? null }),
  setSelectedPlaylistId: (id) => set({ selectedPlaylistId: id ?? null }),
  setSongForPlaylistModal: (song) => set({ songForPlaylistModal: song }),
  setSongForTogetherModal: (song) => set({ songForTogetherModal: song }),
  setRightPanelOpen: (open) => set({ isRightPanelOpen: open }),
  setMiniPlayerHidden: (hidden) => set({ isMiniPlayerHidden: hidden }),
  closeAllSheets: () => set({ 
    selectedArtistId: null, 
    selectedAlbumId: null, 
    selectedPlaylistId: null,
    songForPlaylistModal: null,
    songForTogetherModal: null
  }),
}));
