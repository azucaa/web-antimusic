import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Song } from "@/types/music";
import { usePlayerStore } from "./usePlayerStore";

interface QueueState {
  queue: Song[];
  currentIndex: number;

  // Actions
  setQueue: (songs: Song[], startIndex?: number) => void;
  addToQueue: (song: Song) => void;
  addToQueueNext: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  playFromQueue: (index: number) => void;
  nextSong: () => void;
  prevSong: () => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      currentIndex: -1,

      setQueue: (queue, startIndex = 0) => {
        set({ queue, currentIndex: startIndex });
        if (queue.length > 0 && startIndex >= 0 && startIndex < queue.length) {
          usePlayerStore.getState().playSong(queue[startIndex]);
        }
      },

      addToQueue: (song) => {
        const { queue, currentIndex } = get();
        // Check if already in queue to avoid duplicates
        const alreadyExists = queue.some((item) => item.id === song.id);
        if (alreadyExists) return;

        const newQueue = [...queue, song];
        set({ queue: newQueue });

        // If nothing was playing, play this song
        if (currentIndex === -1) {
          set({ currentIndex: 0 });
          usePlayerStore.getState().playSong(song);
        }
      },

      addToQueueNext: (song) => {
        const { queue, currentIndex } = get();
        const filteredQueue = queue.filter((item) => item.id !== song.id);
        
        let newIndex = currentIndex;
        const insertAt = currentIndex + 1;
        
        const newQueue = [...filteredQueue];
        newQueue.splice(insertAt, 0, song);

        if (currentIndex === -1) {
          newIndex = 0;
          set({ queue: newQueue, currentIndex: newIndex });
          usePlayerStore.getState().playSong(song);
        } else {
          // Adjust index if item was filtered out before current
          const oldIndexInQueue = queue.findIndex(item => item.id === song.id);
          if (oldIndexInQueue !== -1 && oldIndexInQueue < currentIndex) {
            newIndex--;
          }
          set({ queue: newQueue, currentIndex: newIndex });
        }
      },

      removeFromQueue: (index) => {
        const { queue, currentIndex } = get();
        if (index < 0 || index >= queue.length) return;

        const newQueue = queue.filter((_, i) => i !== index);
        let newIndex = currentIndex;

        if (currentIndex === index) {
          // Playing song is removed. Go to next, or previous, or clear
          if (newQueue.length === 0) {
            newIndex = -1;
            usePlayerStore.getState().setCurrentSong(null);
            usePlayerStore.getState().setIsPlaying(false);
          } else {
            // Cap at end of queue
            newIndex = index >= newQueue.length ? newQueue.length - 1 : index;
            usePlayerStore.getState().playSong(newQueue[newIndex]);
          }
        } else if (currentIndex > index) {
          newIndex = currentIndex - 1;
        }

        set({ queue: newQueue, currentIndex: newIndex });
      },

      clearQueue: () => {
        set({ queue: [], currentIndex: -1 });
        usePlayerStore.getState().setCurrentSong(null);
        usePlayerStore.getState().setIsPlaying(false);
      },

      reorderQueue: (startIndex, endIndex) => {
        const { queue, currentIndex } = get();
        const result = [...queue];
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        let newIndex = currentIndex;
        if (currentIndex === startIndex) {
          newIndex = endIndex;
        } else if (currentIndex > startIndex && currentIndex <= endIndex) {
          newIndex--;
        } else if (currentIndex < startIndex && currentIndex >= endIndex) {
          newIndex++;
        }

        set({ queue: result, currentIndex: newIndex });
      },

      playFromQueue: (index) => {
        const { queue } = get();
        if (index >= 0 && index < queue.length) {
          set({ currentIndex: index });
          usePlayerStore.getState().playSong(queue[index]);
        }
      },

      nextSong: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;
        const nextIndex = (currentIndex + 1) % queue.length;
        set({ currentIndex: nextIndex });
        usePlayerStore.getState().playSong(queue[nextIndex]);
      },

      prevSong: () => {
        const { queue, currentIndex } = get();
        if (queue.length === 0) return;
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = queue.length - 1;
        set({ currentIndex: prevIndex });
        usePlayerStore.getState().playSong(queue[prevIndex]);
      },
    }),
    {
      name: "antimusic-queue-store",
    }
  )
);
