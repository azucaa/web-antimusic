"use client";

import { useEffect, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useSyncStore } from "@/store/useSyncStore";

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void;
    YT?: any;
  }
}


export default function YTPlayerManager() {
  const {
    currentSong,
    isPlaying,
    volume,
    isMuted,
    setPlayerInstance,
    setIsPlaying,
    setIsBuffering,
    setCurrentTime,
    setDuration,
  } = usePlayerStore();

  const { nextSong } = useQueueStore();
  const { addToHistory } = useLibraryStore();

  const playerRef = useRef<any>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT) {
      initPlayer();
      return;
    }

    // Load tag
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = () => {
      initPlayer();
    };

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // Sync isPlaying state with YouTube Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player || typeof player.getPlayerState !== "function") return;

    try {
      const state = player.getPlayerState();
      if (isPlaying && state !== window.YT.PlayerState.PLAYING) {
        player.playVideo();
      } else if (!isPlaying && state === window.YT.PlayerState.PLAYING) {
        player.pauseVideo();
      }
    } catch (err) {
      console.error("Error syncing isPlaying state:", err);
    }
  }, [isPlaying]);

  // Sync volume with YouTube Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player || typeof player.setVolume !== "function") return;
    try {
      player.setVolume(volume);
    } catch (err) {
      console.error("Error syncing volume:", err);
    }
  }, [volume]);

  // Sync mute state with YouTube Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player || typeof player.mute !== "function") return;
    try {
      if (isMuted) {
        player.mute();
      } else {
        player.unMute();
      }
    } catch (err) {
      console.error("Error syncing mute state:", err);
    }
  }, [isMuted]);

  // Handle manual song changes
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentSong) return;

    try {
      player.loadVideoById({
        videoId: currentSong.id,
        suggestedQuality: "small",
      });
      setIsPlaying(true);
      setIsBuffering(true);
    } catch (err) {
      console.error("Error loading video:", err);
    }
  }, [currentSong]);

  const initPlayer = () => {
    if (!window.YT || !window.YT.Player) return;

    const shouldAutoplay = currentSong && usePlayerStore.getState().isPlaying;

    playerRef.current = new window.YT.Player("yt-hidden-player", {
      height: "200",
      width: "200",
      videoId: currentSong?.id || "",
      playerVars: {
        autoplay: shouldAutoplay ? 1 : 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        iv_load_policy: 3,
      },
      events: {
        onReady: (event: any) => {
          setPlayerInstance(event.target);
          // Set initial configs
          event.target.setVolume(volume);
          if (isMuted) event.target.mute();

          if (shouldAutoplay) {
            event.target.playVideo();
          }
        },
        onStateChange: (event: any) => {
          const state = event.data;

          // YT.PlayerState.PLAYING = 1
          // YT.PlayerState.PAUSED = 2
          // YT.PlayerState.BUFFERING = 3
          // YT.PlayerState.ENDED = 0

          if (state === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
            setIsBuffering(false);
            
            // Get duration
            const dur = event.target.getDuration();
            if (dur) setDuration(dur);

            // Start progress tracking
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
              if (playerRef.current && typeof playerRef.current.getCurrentTime === "function") {
                const time = playerRef.current.getCurrentTime();
                setCurrentTime(time);
              }
            }, 500);

          } else if (state === window.YT.PlayerState.PAUSED) {
            setIsPlaying(false);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }
          } else if (state === window.YT.PlayerState.BUFFERING) {
            setIsBuffering(true);
          } else if (state === window.YT.PlayerState.ENDED) {
            setIsPlaying(false);
            if (progressIntervalRef.current) {
              clearInterval(progressIntervalRef.current);
            }

            // Save to listening history upon successful completion
            if (currentSong) {
              addToHistory(currentSong);
            }

            // Play next track in queue ONLY if NOT a connected Guest
            const isGuest = useSyncStore.getState().isConnected && useSyncStore.getState().role === "guest";
            if (!isGuest) {
              nextSong();
            }
          }
        },
        onError: (event: any) => {
          console.error("YouTube Player error:", event.data);
          setIsBuffering(false);
          // Skip on error ONLY if NOT a connected Guest
          const isGuest = useSyncStore.getState().isConnected && useSyncStore.getState().role === "guest";
          if (!isGuest) {
            nextSong();
          }
        },
      },
    });
  };

  return (
    <div className="fixed top-[-9999px] left-[-9999px] w-[200px] h-[200px] pointer-events-none overflow-hidden select-none z-[-9999]">
      <div id="yt-hidden-player" />
    </div>
  );
}
