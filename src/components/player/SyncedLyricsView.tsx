"use client";

import { useEffect, useState, useRef } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { LyricsLine, LyricsResult } from "@/types/lyrics";
import { Loader2, Music } from "lucide-react";

interface SyncedLyricsViewProps {
  title: string;
  artist: string;
  songId: string;
}

export default function SyncedLyricsView({ title, artist, songId }: SyncedLyricsViewProps) {
  const currentTime = usePlayerStore((state) => state.currentTime);
  const [lyrics, setLyrics] = useState<LyricsResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number>(-1);
  const linesContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef<(HTMLParagraphElement | null)[]>([]);

  // Fetch lyrics on song change
  useEffect(() => {
    let active = true;
    const fetchLyrics = async () => {
      setLoading(true);
      setLyrics(null);
      setActiveLineIndex(-1);
      try {
        const res = await fetch(
          `/api/lyrics?id=${songId}&title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`
        );
        if (!res.ok) throw new Error("Lyrics not found");
        const data = await res.json();
        if (active) {
          setLyrics(data);
        }
      } catch (err) {
        if (active) {
          setLyrics({
            songId,
            provider: "mock",
            synced: false,
            lines: [{ text: "Could not fetch lyrics for this song." }],
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      active = false;
    };
  }, [songId, title, artist]);

  // Sync active line index with player's currentTime
  useEffect(() => {
    if (!lyrics || !lyrics.synced || lyrics.lines.length === 0) return;

    const lines = lyrics.lines;
    let foundIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      const lineTime = lines[i].time ?? 0;
      if (currentTime >= lineTime) {
        foundIndex = i;
      } else {
        break;
      }
    }

    if (foundIndex !== activeLineIndex) {
      setActiveLineIndex(foundIndex);
    }
  }, [currentTime, lyrics, activeLineIndex]);

  // Scroll active line into center
  useEffect(() => {
    if (activeLineIndex === -1 || !lineRefs.current[activeLineIndex]) return;
    const activeEl = lineRefs.current[activeLineIndex];
    activeEl?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, [activeLineIndex]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-[#ff004f] select-none">
        <Loader2 className="animate-spin" size={32} />
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Retrieving real-time lyrics...</span>
      </div>
    );
  }

  if (!lyrics || lyrics.lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground select-none">
        <Music size={40} className="text-neutral-800 mb-3" />
        <span className="text-sm font-semibold">Lyrics are unavailable</span>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto px-6 py-16 scrollbar-none select-none" ref={linesContainerRef}>
      <div className="flex flex-col gap-6 text-left max-w-lg mx-auto pb-32">
        {lyrics.lines.map((line, index) => {
          const isSynced = lyrics.synced;
          const isActive = index === activeLineIndex;
          
          return (
            <p
              key={index}
              ref={(el) => {
                lineRefs.current[index] = el;
              }}
              className={`text-xl md:text-2xl font-black tracking-tight leading-relaxed transition-all duration-300 origin-left cursor-pointer ${
                isSynced
                  ? isActive
                    ? "text-white scale-105 filter drop-shadow-[0_0_10px_rgba(255,0,79,0.45)] opacity-100"
                    : index < activeLineIndex
                    ? "text-white/20 hover:text-white/40 font-bold"
                    : "text-white/40 hover:text-white/80 font-bold"
                  : "text-white/80 font-bold text-center"
              }`}
              onClick={() => {
                if (isSynced && line.time !== undefined) {
                  usePlayerStore.getState().seekTo(line.time);
                }
              }}
            >
              {line.text || "•••"}
            </p>
          );
        })}
      </div>
    </div>
  );
}
