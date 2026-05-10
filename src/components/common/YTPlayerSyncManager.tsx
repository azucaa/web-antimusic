"use client";

import { useEffect, useRef } from "react";
import { useSyncStore } from "@/store/useSyncStore";
import { usePlayerStore } from "@/store/usePlayerStore";

export default function YTPlayerSyncManager() {
  const { roomCode, role, isConnected, disconnectRoom, username, setParticipants } = useSyncStore();
  const { currentSong, isPlaying, currentTime, playSong, seekTo } = usePlayerStore();

  const isUpdatingRef = useRef<boolean>(false);
  const lastSongChangeTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!isConnected || !roomCode) return;

    const interval = setInterval(async () => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        const currentUsername = useSyncStore.getState().username || "User";

        if (role === "host") {
          // Host sends current player state and username heartbeat to the API
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              currentSong,
              isPlaying,
              currentTime,
              username: currentUsername,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            if (data.participants) {
              const names = data.participants.map((p: any) => p.username);
              setParticipants(names);
            }
          }
        } else if (role === "guest") {
          // Guest polls for the host's player state and updates heartbeat
          const res = await fetch(
            `/api/session?roomCode=${roomCode}&username=${encodeURIComponent(currentUsername)}`
          );
          
          if (res.ok) {
            const data = await res.json();

            // Sync participant list
            if (data.participants) {
              const names = data.participants.map((p: any) => p.username);
              setParticipants(names);
            }
            
            // 1. Sync active song track
            let trackChanged = false;
            if (data.currentSong) {
              const localSong = usePlayerStore.getState().currentSong;
              if (!localSong || localSong.id !== data.currentSong.id) {
                playSong(data.currentSong);
                lastSongChangeTimestamp.current = Date.now();
                trackChanged = true;
              }
            }

            // If we just loaded a new song, wait for it to buffer and settle before syncing positions
            const timeSinceChange = Date.now() - lastSongChangeTimestamp.current;
            const isWithinCooldown = timeSinceChange < 4500;
            const localIsBuffering = usePlayerStore.getState().isBuffering;

            if (!trackChanged && !isWithinCooldown && !localIsBuffering) {
              // 2. Sync play/pause controls
              const localIsPlaying = usePlayerStore.getState().isPlaying;
              if (data.isPlaying !== localIsPlaying) {
                const player = usePlayerStore.getState().playerInstance;
                if (player) {
                  if (data.isPlaying && typeof player.playVideo === "function") {
                    player.playVideo();
                    usePlayerStore.setState({ isPlaying: true });
                  } else if (!data.isPlaying && typeof player.pauseVideo === "function") {
                    player.pauseVideo();
                    usePlayerStore.setState({ isPlaying: false });
                  }
                } else {
                  usePlayerStore.setState({ isPlaying: data.isPlaying });
                }
              }

              // 3. Sync progress time (allow 4.0s jitter margin for stable sync)
              const localTime = usePlayerStore.getState().currentTime;
              if (Math.abs(data.currentTime - localTime) > 4.0) {
                seekTo(data.currentTime);
              }
            }
          } else if (res.status === 404) {
            // Room no longer exists or expired
            disconnectRoom();
          }
        }
      } catch (err) {
        console.error("Listening Together sync error:", err);
      } finally {
        isUpdatingRef.current = false;
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isConnected, roomCode, role, currentSong, isPlaying, currentTime, playSong, seekTo, disconnectRoom, username, setParticipants]);

  return null; // Silent synchronization manager
}
