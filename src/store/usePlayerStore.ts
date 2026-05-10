import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types/music";

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  currentTime: number;
  duration: number;
  isBuffering: boolean;
  playerInstance: any | null; // YouTube Player object
  
  // Actions
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setIsBuffering: (buffering: boolean) => void;
  setPlayerInstance: (instance: any) => void;
  
  // Controls
  playSong: (song: Song) => void;
  togglePlay: () => void;
  seekTo: (seconds: number) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      volume: 80,
      isMuted: false,
      currentTime: 0,
      duration: 0,
      isBuffering: false,
      playerInstance: null,

      setCurrentSong: (currentSong) => {
        set({ currentSong, currentTime: 0, duration: 0, isBuffering: true });
      },
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      setVolume: (volume) => {
        set({ volume });
        const player = get().playerInstance;
        if (player && typeof player.setVolume === "function") {
          player.setVolume(volume);
        }
      },
      setIsMuted: (isMuted) => {
        set({ isMuted });
        const player = get().playerInstance;
        if (player && typeof player.mute === "function") {
          if (isMuted) player.mute();
          else player.unMute();
        }
      },
      setCurrentTime: (currentTime) => set({ currentTime }),
      setDuration: (duration) => set({ duration }),
      setIsBuffering: (isBuffering) => set({ isBuffering }),
      setPlayerInstance: (playerInstance) => set({ playerInstance }),

      playSong: (song) => {
        get().setCurrentSong(song);
        set({ isPlaying: true });
        const player = get().playerInstance;
        if (player && typeof player.loadVideoById === "function") {
          player.loadVideoById(song.id);
        }
      },

      togglePlay: () => {
        const isPlaying = get().isPlaying;
        const player = get().playerInstance;
        if (player) {
          if (isPlaying && typeof player.pauseVideo === "function") {
            player.pauseVideo();
            set({ isPlaying: false });
          } else if (!isPlaying && typeof player.playVideo === "function") {
            player.playVideo();
            set({ isPlaying: true });
          }
        } else {
          set({ isPlaying: !isPlaying });
        }
      },

      seekTo: (seconds) => {
        const player = get().playerInstance;
        if (player && typeof player.seekTo === "function") {
          player.seekTo(seconds, true);
          set({ currentTime: seconds });
        }
      },
    }),
    {
      name: "antimusic-player-store",
      partialize: (state) => ({
        currentSong: state.currentSong,
        volume: state.volume,
        isMuted: state.isMuted,
      }),
    }
  )
);
