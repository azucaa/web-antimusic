"use client";

import { useEffect, useRef } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";

export default function YTPlayerSyncManager() {
  const { roomCode, role, isConnected, disconnectRoom, username, setRoom } = useRoomStore();
  const { currentSong, isPlaying, currentTime, playSong, seekTo } = usePlayerStore();
  const { queue, setQueue } = useQueueStore();

  const isUpdatingRef = useRef<boolean>(false);
  const lastSongChangeTimestamp = useRef<number>(0);

  useEffect(() => {
    if (!isConnected || !roomCode) return;

    const interval = setInterval(async () => {
      if (isUpdatingRef.current) return;
      isUpdatingRef.current = true;

      try {
        const currentUsername = useRoomStore.getState().username || "User";

        if (role === "host") {
          // Host sends current player state and username heartbeat to the API
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
              queue, // Keep room's queue in sync with Host's queue
            }),
          });

          if (res.ok) {
            const data = await res.json();
            setRoom(data); // Sync room context in store
          }
        } else if (role === "guest") {
          // Guest polls for the host's player state and updates heartbeat
          const res = await fetch(
            `/api/session?roomCode=${roomCode}&username=${encodeURIComponent(currentUsername)}`
          );
          
          if (res.ok) {
            const data = await res.json();
            setRoom(data); // Sync room context in store

            // 1. Sync active song track
            let trackChanged = false;
            if (data.currentTrack) {
              const localSong = usePlayerStore.getState().currentSong;
              if (!localSong || localSong.id !== data.currentTrack.id) {
                playSong(data.currentTrack);
                lastSongChangeTimestamp.current = Date.now();
                trackChanged = true;
              }
            } else {
              // No track is playing on Host
              const localSong = usePlayerStore.getState().currentSong;
              if (localSong) {
                usePlayerStore.setState({ currentSong: null, isPlaying: false });
              }
            }

            // 2. Sync Local Queue with Room Queue
            if (data.queue) {
              const localQueue = useQueueStore.getState().queue;
              const queueDiffers =
                localQueue.length !== data.queue.length ||
                localQueue.some((item, idx) => item.id !== data.queue[idx]?.id);

              if (queueDiffers) {
                // Silently update the local queue items without triggering playSong
                useQueueStore.setState({ queue: data.queue });
              }
            }

            // If we just loaded a new song, wait for it to buffer and settle before syncing positions
            const timeSinceChange = Date.now() - lastSongChangeTimestamp.current;
            const isWithinCooldown = timeSinceChange < 4500;
            const localIsBuffering = usePlayerStore.getState().isBuffering;

            if (!trackChanged && !isWithinCooldown && !localIsBuffering) {
              const targetPlayingState = data.playbackState?.status === "playing";

              // 3. Sync play/pause controls
              const localIsPlaying = usePlayerStore.getState().isPlaying;
              if (targetPlayingState !== localIsPlaying) {
                const player = usePlayerStore.getState().playerInstance;
                if (player) {
                  if (targetPlayingState && typeof player.playVideo === "function") {
                    player.playVideo();
                    usePlayerStore.setState({ isPlaying: true });
                  } else if (!targetPlayingState && typeof player.pauseVideo === "function") {
                    player.pauseVideo();
                    usePlayerStore.setState({ isPlaying: false });
                  }
                } else {
                  usePlayerStore.setState({ isPlaying: targetPlayingState });
                }
              }

              // 4. Sync progress time (allow 4.5s jitter margin for stable sync)
              const localTime = usePlayerStore.getState().currentTime;
              const targetPosition = data.playbackState?.positionMs || 0;
              if (Math.abs(targetPosition - localTime) > 4.5) {
                seekTo(targetPosition);
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
  }, [isConnected, roomCode, role, currentSong, isPlaying, currentTime, queue, playSong, seekTo, disconnectRoom, username, setRoom, setQueue]);

  return null; // Silent synchronization manager
}
