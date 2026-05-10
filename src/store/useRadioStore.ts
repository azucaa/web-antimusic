import { create } from "zustand";
import { RadioSeed, RadioSession, SavedRadio } from "@/types/radio";
import { generateRadioTracks } from "@/lib/radio/radioGenerator";
import { radioStorage } from "@/lib/radio/radioStorage";
import { useLibraryStore } from "./useLibraryStore";
import { useQueueStore } from "./useQueueStore";

interface RadioState {
  currentRadioSession: RadioSession | null;
  savedRadios: SavedRadio[];
  isGenerating: boolean;

  // Actions
  loadSavedRadios: () => void;
  startRadio: (seed: RadioSeed, mode?: RadioSession["mode"]) => Promise<RadioSession | null>;
  changeRadioMode: (mode: RadioSession["mode"]) => Promise<RadioSession | null>;
  saveCurrentRadio: () => void;
  unsaveRadio: (id: string) => void;
  playRadioSession: (session: RadioSession) => void;
}

export const useRadioStore = create<RadioState>((set, get) => ({
  currentRadioSession: null,
  savedRadios: [],
  isGenerating: false,

  loadSavedRadios: () => {
    set({ savedRadios: radioStorage.getSavedRadios() });
  },

  startRadio: async (seed, mode = "balanced") => {
    set({ isGenerating: true });
    try {
      // Fetch local history and favorites for algorithm tailoring
      const history = useLibraryStore.getState().history || [];
      const historySongs = history.map(item => item.song);
      const favorites = useLibraryStore.getState().playlists.find(p => p.id === "liked")?.songs || [];

      // Create descriptive title
      let title = `Radio ${seed.title}`;
      if (seed.artist) {
        title = `${seed.title} Radio Mix`;
      } else if (seed.type === "mood" || seed.type === "genre") {
        title = `Vibe: ${seed.title}`;
      }

      const tracks = await generateRadioTracks(seed, mode, historySongs, favorites);

      const session: RadioSession = {
        id: `radio-${seed.type}-${seed.id}`,
        seed,
        title,
        description: `Stasiun radio kustom berbasis ${seed.type} "${seed.title}" (${mode.replace("_", " ")} mode).`,
        tracks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        mode,
      };

      set({ currentRadioSession: session, isGenerating: false });
      return session;
    } catch (err) {
      console.error("Error generating radio tracks:", err);
      set({ isGenerating: false });
      return null;
    }
  },

  changeRadioMode: async (mode) => {
    const session = get().currentRadioSession;
    if (!session) return null;
    return get().startRadio(session.seed, mode);
  },

  saveCurrentRadio: () => {
    const session = get().currentRadioSession;
    if (!session) return;

    const saved: SavedRadio = {
      id: session.id,
      seed: session.seed,
      title: session.title,
      tracks: session.tracks,
      mode: session.mode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    radioStorage.saveRadio(saved);
    set({ savedRadios: radioStorage.getSavedRadios() });
  },

  unsaveRadio: (id) => {
    radioStorage.removeRadio(id);
    set({ savedRadios: radioStorage.getSavedRadios() });
  },

  playRadioSession: (session) => {
    if (session.tracks.length > 0) {
      useQueueStore.getState().setQueue(session.tracks, 0);
    }
  },
}));
