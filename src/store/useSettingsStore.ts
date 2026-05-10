import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Settings } from "@/types/settings";

interface SettingsState extends Settings {
  setTheme: (theme: Settings["theme"]) => void;
  setPrivateSession: (active: boolean) => void;
  setAntiAlgorithmMode: (active: boolean) => void;
  setStreamQuality: (quality: Settings["streamQuality"]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: "dark",
      privateSession: false,
      antiAlgorithmMode: false,
      streamQuality: "medium",

      setTheme: (theme) => set({ theme }),
      setPrivateSession: (privateSession) => set({ privateSession }),
      setAntiAlgorithmMode: (antiAlgorithmMode) => set({ antiAlgorithmMode }),
      setStreamQuality: (streamQuality) => set({ streamQuality }),
    }),
    {
      name: "antimusic-settings-store",
    }
  )
);
