"use client";

import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";

export default function YTPlayerSyncManager() {
  const { roomCode, role, isConnected, disconnectRoom, username, setRoom } = useRoomStore();
  const { currentSong, isPlaying, currentTime, playSong, seekTo } = usePlayerStore();
  const { queue } = useQueueStore();

  const isUpdatingRef = useRef<boolean>(false);
  const lastSongChangeTimestamp = useRef<number>(0);
  const lastHostStateRef = useRef<{ isPlaying: boolean; songId: string | null }>({
    isPlaying: false,
    songId: null,
  });

  // 1. FAST-PATH HOST BROADCAST
  // Whenever the Host performs a discrete action (play/pause or song change), 
  // they instantly notify the API to update the session.
  useEffect(() => {
    if (!isConnected || !roomCode || role !== "host") return;

    const currentSongId = currentSong?.id || null;
    const isPlayingChanged = lastHostStateRef.current.isPlaying !== isPlaying;
    const songIdChanged = lastHostStateRef.current.songId !== currentSongId;

    if (isPlayingChanged || songIdChanged) {
      lastHostStateRef.current = { isPlaying, songId: currentSongId };

      const broadcastState = async () => {
        try {
          const currentUsername = useRoomStore.getState().username || "User";
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "sync_playback",
              currentSong,
              isPlaying,
              currentTime,
              username: currentUsername,
              queue,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            setRoom(data);
          }
        } catch (err) {
          console.error("Listening Together instant host broadcast error:", err);
        }
      };

      broadcastState();
    }
  }, [isConnected, roomCode, role, isPlaying, currentSong, currentTime, queue, setRoom]);

  // 2. PERIODIC POLLING / HEARTBEAT INTERVAL
  // Runs every 1000ms for Guest, and 1500ms for Host.
  useEffect(() => {
    if (!isConnected || !roomCode) return;

    const intervalTime = role === "guest" ? 1000 : 1500;

    const interval = setInterval(async () => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        const currentUsername = useRoomStore.getState().username || "User";

        if (role === "host") {
          // Host reports active playback position and heartbeat to server
          const res = await fetch("/api/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              roomCode,
              action: "sync_playback",
              currentSong,
              isPlaying,
              currentTime,
              username: currentUsername,
              queue,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setRoom(data);
          }
        } else if (role === "guest") {
          // Guest polls for Host's exact playback state and reports heartbeat
          const res = await fetch(
            `/api/session?roomCode=${roomCode}&username=${encodeURIComponent(currentUsername)}`
          );

          if (res.ok) {
            const data = await res.json();
            setRoom(data);

            // A. Sync active track
            let trackChanged = false;
            if (data.currentTrack) {
              const localSong = usePlayerStore.getState().currentSong;
              if (!localSong || localSong.id !== data.currentTrack.id) {
                playSong(data.currentTrack);
                lastSongChangeTimestamp.current = Date.now();
                trackChanged = true;
              }
            } else {
              const localSong = usePlayerStore.getState().currentSong;
              if (localSong) {
                usePlayerStore.setState({ currentSong: null, isPlaying: false });
              }
            }

            // B. Sync local queue items
            if (data.queue) {
              const localQueue = useQueueStore.getState().queue;
              const queueDiffers =
                localQueue.length !== data.queue.length ||
                localQueue.some((item, idx) => item.id !== data.queue[idx]?.id);

              if (queueDiffers) {
                useQueueStore.setState({ queue: data.queue });
              }
            }

            // Cooldown and player states
            const timeSinceChange = Date.now() - lastSongChangeTimestamp.current;
            const isWithinCooldown = timeSinceChange < 4500;
            const localIsBuffering = usePlayerStore.getState().isBuffering;

            const targetPlayingState = data.playbackState?.status === "playing";
            const localIsPlaying = usePlayerStore.getState().isPlaying;

            // C. Sync Play/Pause Controls
            // Priority 1: Host is PAUSED -> Guest must pause immediately, bypassing cooldown!
            if (!targetPlayingState && localIsPlaying) {
              const player = usePlayerStore.getState().playerInstance;
              if (player && typeof player.pauseVideo === "function") {
                player.pauseVideo();
              }
              usePlayerStore.setState({ isPlaying: false });
            } 
            // Priority 2: Host is PLAYING -> Guest is paused -> Sync if guest is not buffering/cooldown-locked
            else if (targetPlayingState && !localIsPlaying && !isWithinCooldown && !localIsBuffering) {
              const player = usePlayerStore.getState().playerInstance;
              if (player && typeof player.playVideo === "function") {
                player.playVideo();
              }
              usePlayerStore.setState({ isPlaying: true });
            }

            // D. Sync Progress Time (with jitter buffer filter)
            // Allow 3.5s jitter margin for highly stable playback alignment
            if (!trackChanged && !isWithinCooldown && !localIsBuffering && targetPlayingState) {
              const localTime = usePlayerStore.getState().currentTime;
              const targetPosition = data.playbackState?.positionMs || 0;
              if (Math.abs(targetPosition - localTime) > 3.5) {
                seekTo(targetPosition);
              }
            }
          } else if (res.status === 404) {
            // Sesi kamar ditutup atau kadaluwarsa
            disconnectRoom();
          }
        }
      } catch (err) {
        console.error("Listening Together sync interval error:", err);
      } finally {
        isUpdatingRef.current = false;
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [isConnected, roomCode, role, currentSong, isPlaying, currentTime, queue, playSong, seekTo, disconnectRoom, setRoom]);

  return null; // Silent synchronizer manager
}
