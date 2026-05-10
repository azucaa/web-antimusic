import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ListeningRoom, RoomChatMessage, RoomReaction, RoomSettings } from "@/types/room";
import { Song } from "@/types/music";
import { usePlayerStore } from "./usePlayerStore";
import { useQueueStore } from "./useQueueStore";

interface RoomState {
  room: ListeningRoom | null;
  roomCode: string | null;
  role: "host" | "guest" | null;
  isConnected: boolean;
  username: string | null;
  statusMessage: string;

  // Client triggers
  setUsername: (name: string) => void;
  createRoom: (roomName?: string, initialSettings?: Partial<RoomSettings>) => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  disconnectRoom: () => void;
  
  // Communications & Queue mutations
  sendChat: (text: string) => Promise<void>;
  sendReaction: (emoji: string) => Promise<void>;
  addTrackToRoomQueue: (song: Song) => Promise<void>;
  removeTrackFromRoomQueue: (videoId: string) => Promise<void>;
  voteSkipRoom: () => Promise<void>;
  updateSettings: (settings: Partial<RoomSettings>) => Promise<void>;
  
  // Internal store synchronizer
  setRoom: (room: ListeningRoom | null) => void;
  setStatusMessage: (msg: string) => void;
}

export const useRoomStore = create<RoomState>()(
  persist(
    (set, get) => ({
      room: null,
      roomCode: null,
      role: null,
      isConnected: false,
      username: null,
      statusMessage: "Disconnected",

      setUsername: (username) => set({ username: username.trim() }),

      createRoom: async (roomName, initialSettings) => {
        const username = get().username;
        if (!username) {
          set({ statusMessage: "Gagal: Username dibutuhkan." });
          return null;
        }

        // Generate a clean random 6-character room code
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        try {
          const currentSong = usePlayerStore.getState().currentSong;
          const currentQueue = useQueueStore.getState().queue;

          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode: code,
              isCreate: true,
              username,
              roomName: roomName || `${username}'s Lounge`,
              initialQueue: currentQueue,
              currentTrack: currentSong,
              settings: initialSettings,
            }),
          });

          if (!res.ok) throw new Error("Gagal mendaftarkan ruang di server.");

          const data = await res.json();
          set({
            room: data,
            roomCode: code,
            role: "host",
            isConnected: true,
            statusMessage: `Berhasil hosting kamar ${code}!`,
          });
          return code;
        } catch (err: any) {
          console.error(err);
          set({ statusMessage: `Gagal membuat kamar: ${err.message}` });
          return null;
        }
      },

      joinRoom: async (code) => {
        const uppercaseCode = code.trim().toUpperCase();
        const username = get().username;

        if (!username) {
          set({ statusMessage: "Gagal: Username dibutuhkan." });
          return false;
        }

        if (uppercaseCode.length !== 6) {
          set({ statusMessage: "Gagal: Kode ruang harus 6 karakter." });
          return false;
        }

        try {
          set({ statusMessage: "Menghubungkan ke kamar..." });
          const res = await fetch(
            `/api/session?roomCode=${uppercaseCode}&username=${encodeURIComponent(username)}`
          );

          if (!res.ok) {
            if (res.status === 404) {
              set({ statusMessage: "Gagal: Kode kamar tidak ditemukan." });
            } else {
              set({ statusMessage: "Gagal terhubung dengan server." });
            }
            return false;
          }

          const roomData = await res.json();
          set({
            room: roomData,
            roomCode: uppercaseCode,
            role: "guest",
            isConnected: true,
            statusMessage: `Berhasil bergabung dengan kamar ${uppercaseCode}!`,
          });
          return true;
        } catch (err: any) {
          console.error(err);
          set({ statusMessage: `Koneksi error: ${err.message}` });
          return false;
        }
      },

      disconnectRoom: () => {
        set({
          room: null,
          roomCode: null,
          role: null,
          isConnected: false,
          statusMessage: "Disconnected",
        });
      },

      sendChat: async (text) => {
        const { roomCode, username, isConnected } = get();
        if (!isConnected || !roomCode || !username) return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "chat",
              username,
              text,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ room: data });
          }
        } catch (err) {
          console.error("Gagal mengirim pesan chat:", err);
        }
      },

      sendReaction: async (emoji) => {
        const { roomCode, username, isConnected } = get();
        if (!isConnected || !roomCode || !username) return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "reaction",
              username,
              emoji,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ room: data });
          }
        } catch (err) {
          console.error("Gagal mengirim reaksi emoji:", err);
        }
      },

      addTrackToRoomQueue: async (song) => {
        const { roomCode, username, isConnected } = get();
        if (!isConnected || !roomCode || !username) return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "add_to_queue",
              username,
              song,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ room: data });
          }
        } catch (err) {
          console.error("Gagal menambah lagu ke antrean kamar:", err);
        }
      },

      removeTrackFromRoomQueue: async (videoId) => {
        const { roomCode, username, isConnected } = get();
        if (!isConnected || !roomCode || !username) return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "remove_from_queue",
              username,
              videoId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ room: data });
          }
        } catch (err) {
          console.error("Gagal menghapus lagu dari antrean kamar:", err);
        }
      },

      voteSkipRoom: async () => {
        const { roomCode, username, isConnected } = get();
        if (!isConnected || !roomCode || !username) return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "vote_skip",
              username,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            
            if (data.triggerSkip) {
              // Skip criteria was met! Force play next track if host
              if (get().role === "host") {
                useQueueStore.getState().nextSong();
              }
              set({ room: data });
            } else {
              set({ room: data });
            }
          }
        } catch (err) {
          console.error("Gagal mengirim voting skip:", err);
        }
      },

      updateSettings: async (settings) => {
        const { roomCode, username, isConnected, role } = get();
        if (!isConnected || !roomCode || !username || role !== "host") return;

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "update_settings",
              username,
              settings,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            set({ room: data });
          }
        } catch (err) {
          console.error("Gagal menyimpan pengaturan kamar:", err);
        }
      },

      setRoom: (room) => set({ room }),
      setStatusMessage: (statusMessage) => set({ statusMessage }),
    }),
    {
      name: "antimusic-room-store",
      partialize: (state) => ({ username: state.username }), // Only persist username
    }
  )
);
