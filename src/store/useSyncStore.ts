import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SyncState {
  roomCode: string | null;
  role: "host" | "guest" | null;
  isConnected: boolean;
  statusMessage: string;
  username: string | null;
  participants: string[];
  
  // Actions
  setUsername: (name: string) => void;
  setParticipants: (list: string[]) => void;
  createRoom: () => Promise<string | null>;
  joinRoom: (code: string) => Promise<boolean>;
  disconnectRoom: () => void;
  setStatusMessage: (msg: string) => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      roomCode: null,
      role: null,
      isConnected: false,
      statusMessage: "Disconnected",
      username: null,
      participants: [],

      setUsername: (username) => set({ username: username.trim() }),
      setParticipants: (participants) => set({ participants }),

      createRoom: async () => {
        const username = get().username;
        if (!username) {
          set({ statusMessage: "Username required to host a room." });
          return null;
        }

        // Generate a random 6-character room code (uppercase alphanumeric)
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No ambiguous chars
        let code = "";
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        try {
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              roomCode: code, 
              isCreate: true,
              username: username
            }),
          });

          if (!res.ok) throw new Error("Gagal membuat sesi di server");

          set({
            roomCode: code,
            role: "host",
            isConnected: true,
            participants: [username],
            statusMessage: `Hosting room ${code} successfully!`,
          });
          return code;
        } catch (err: any) {
          console.error(err);
          set({ statusMessage: `Error: ${err.message}` });
          return null;
        }
      },

      joinRoom: async (code: string) => {
        const uppercaseCode = code.trim().toUpperCase();
        const username = get().username;

        if (!username) {
          set({ statusMessage: "Username required to join a room." });
          return false;
        }

        if (uppercaseCode.length !== 6) {
          set({ statusMessage: "Room code must be exactly 6 characters." });
          return false;
        }

        try {
          set({ statusMessage: "Connecting to room..." });
          const res = await fetch(`/api/session?roomCode=${uppercaseCode}&username=${encodeURIComponent(username)}`);
          if (!res.ok) {
            if (res.status === 404) {
              set({ statusMessage: "Room code not found or expired." });
            } else {
              set({ statusMessage: "Failed to connect to session server." });
            }
            return false;
          }

          const data = await res.json();
          const pList = data.participants ? data.participants.map((p: any) => p.username) : [username];

          set({
            roomCode: uppercaseCode,
            role: "guest",
            isConnected: true,
            participants: pList,
            statusMessage: `Joined room ${uppercaseCode} successfully!`,
          });
          return true;
        } catch (err: any) {
          console.error(err);
          set({ statusMessage: `Connection error: ${err.message}` });
          return false;
        }
      },

      disconnectRoom: () => {
        set({
          roomCode: null,
          role: null,
          isConnected: false,
          participants: [],
          statusMessage: "Disconnected",
        });
      },

      setStatusMessage: (msg) => set({ statusMessage: msg }),
    }),
    {
      name: "antimusic-sync-store",
      partialize: (state) => ({ username: state.username }), // Only persist username
    }
  )
);
