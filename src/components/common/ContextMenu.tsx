"use client";

import React, { useState, useEffect, useRef } from "react";
import { Song } from "@/types/music";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useRadioStore } from "@/store/useRadioStore";
import { useRoomStore } from "@/store/useRoomStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useRouter } from "next/navigation";
import { 
  Play, Radio, Users, Plus, Star, Link2, Music, Check, MoreVertical
} from "lucide-react";

interface ContextMenuProps {
  song: Song;
  children?: React.ReactNode;
  triggerType?: "click" | "right-click" | "both";
  className?: string;
}

export default function ContextMenu({ 
  song, 
  children, 
  triggerType = "both",
  className = "" 
}: ContextMenuProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isCopied, setIsCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { playSong } = usePlayerStore();
  const { addToQueue, addToQueueNext } = useQueueStore();
  const { startRadio } = useRadioStore();
  const { isConnected, addTrackToRoomQueue } = useRoomStore();
  const { toggleFavorite, playlists } = useLibraryStore();

  const isLiked = playlists.find(p => p.id === "liked")?.songs.some(s => s.id === song.id) || false;

  // Handle outside clicks to close the context menu
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    if (triggerType === "click") return;
    e.preventDefault();
    setPosition({ x: e.clientX, y: e.clientY });
    setIsOpen(true);
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    if (triggerType === "right-click") return;
    e.stopPropagation();
    
    // Position menu below the trigger or at cursor
    const rect = e.currentTarget.getBoundingClientRect();
    // Offset slightly so it overlays nicely
    setPosition({ 
      x: Math.min(e.clientX, window.innerWidth - 220), 
      y: Math.min(rect.bottom + window.scrollY, window.innerHeight + window.scrollY - 300) 
    });
    setIsOpen(true);
  };

  const handlePlayNow = () => {
    playSong(song);
    addToQueue(song);
    setIsOpen(false);
  };

  const handlePlayNext = () => {
    addToQueueNext(song);
    setIsOpen(false);
  };

  const handleAddQueue = () => {
    addToQueue(song);
    setIsOpen(false);
  };

  const handleStartRadio = async () => {
    setIsOpen(false);
    const session = await startRadio({
      type: "song",
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
    });
    if (session) {
      router.push(`/radio/${session.id}`);
    }
  };

  const handleListenTogether = async () => {
    setIsOpen(false);
    // Add track first locally
    playSong(song);
    addToQueue(song);
    
    // Redirect to room creation
    router.push("/together?create_from_song=" + encodeURIComponent(song.id));
  };

  const handleToggleFavorite = () => {
    toggleFavorite(song);
    setIsOpen(false);
  };

  const handleShare = () => {
    const url = `${window.location.origin}/now-playing?songId=${song.id}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => {
      setIsCopied(false);
      setIsOpen(false);
    }, 1200);
  };

  return (
    <div 
      onContextMenu={handleContextMenu} 
      className={`relative inline-block ${className}`}
    >
      {children ? (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {children}
        </div>
      ) : (
        <button 
          onClick={handleTriggerClick}
          className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
        >
          <MoreVertical size={16} />
        </button>
      )}

      {isOpen && (
        <div
          ref={menuRef}
          style={{
            position: "fixed",
            left: `${Math.min(position.x, window.innerWidth - 230)}px`,
            top: `${Math.min(position.y, window.innerHeight - 340)}px`,
            zIndex: 9999,
          }}
          className="w-52 glass-panel shadow-2xl rounded-xl py-1.5 border border-white/10 text-white animate-zoom-in"
        >
          {/* Header context info */}
          <div className="px-3.5 py-2 border-b border-white/5 flex gap-2 items-center">
            <img 
              src={song.thumbnail} 
              alt={song.title} 
              className="w-8 h-8 rounded object-cover shadow-md"
            />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold truncate">{song.title}</p>
              <p className="text-[9px] text-white/50 truncate">{song.artist}</p>
            </div>
          </div>

          <div className="py-1 text-xs font-semibold">
            <button
              onClick={handlePlayNow}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Play size={14} className="text-[#ff004f]" />
              <span>Putar Sekarang</span>
            </button>

            <button
              onClick={handlePlayNext}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Plus size={14} className="text-[#ff004f]" />
              <span>Putar Berikutnya</span>
            </button>

            <button
              onClick={handleAddQueue}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Music size={14} className="text-[#ff004f]" />
              <span>Tambah ke Antrean</span>
            </button>

            <button
              onClick={handleStartRadio}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Radio size={14} className="text-[#ff004f]" />
              <span>Mulai Radio</span>
            </button>

            <button
              onClick={handleListenTogether}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Users size={14} className="text-[#ff004f]" />
              <span>Dengar Bersama</span>
            </button>

            {isConnected && (
              <button
                onClick={() => {
                  addTrackToRoomQueue(song);
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 bg-[#ff004f]/10 hover:bg-[#ff004f]/20 text-left cursor-pointer text-white/90 border-y border-[#ff004f]/10"
              >
                <Plus size={14} className="text-[#ff004f] animate-pulse" />
                <span>Kirim ke Room Queue</span>
              </button>
            )}

            <button
              onClick={handleToggleFavorite}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              <Star size={14} className={isLiked ? "text-amber-400 fill-amber-400" : "text-white/60"} />
              <span>{isLiked ? "Hapus Favorit" : "Tambah Favorit"}</span>
            </button>

            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 hover:bg-white/10 text-left cursor-pointer text-white/90"
            >
              {isCopied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400">Tersalin!</span>
                </>
              ) : (
                <>
                  <Link2 size={14} className="text-white/60" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
