"use client";

import { useEffect, useState } from "react";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { SafeImage as Image } from "@/components/common/SafeImage";
import Link from "next/link";
import { 
  ArrowLeft, Play, Pause, SkipForward, SkipBack, Volume2, Music, Loader2, Disc, Heart, Repeat, Shuffle 
} from "lucide-react";
import SyncedLyricsView from "@/components/player/SyncedLyricsView";

export default function NowPlayingPage() {
  const { 
    currentSong, isPlaying, currentTime, duration, 
    togglePlay, seekTo, volume, setVolume
  } = usePlayerStore();

  const { nextSong, prevSong } = useQueueStore();
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const toggleShuffle = () => setIsShuffle(!isShuffle);
  const toggleRepeat = () => setIsRepeat(!isRepeat);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    seekTo(time);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] text-white">
        <Loader2 className="animate-spin text-[#ff004f]" size={40} />
      </div>
    );
  }

  if (!currentSong) {
    return (
      <div className="max-w-md mx-auto py-24 text-center space-y-6 text-white font-sans px-4">
        <div className="w-20 h-20 rounded-full bg-zinc-950/40 border border-white/5 flex items-center justify-center mx-auto text-zinc-500 shadow-xl shadow-black/20 animate-breathe">
          <Music size={36} />
        </div>
        <div className="space-y-2">
          <h1 className="text-lg font-black uppercase tracking-wider">Pustaka Kosong</h1>
          <p className="text-xs text-zinc-400 font-semibold leading-relaxed">
            Tidak ada lagu yang sedang diputar saat ini. Temukan lagu-lagu hits terbaik di Beranda atau melalui Pencarian!
          </p>
        </div>
        <Link 
          href="/" 
          className="inline-block px-6 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-[#ff004f]/15"
        >
          Mulai Cari Lagu
        </Link>
      </div>
    );
  }

  return (
    <div className="relative min-h-[85vh] -mx-4 px-4 overflow-hidden py-6 select-none font-sans text-white pb-24">
      
      {/* 1. DYNAMIC AMBIENT BLURRED BACKDROP */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div className="absolute inset-0 bg-black/60 z-10" />
        <Image
          src={currentSong.thumbnail}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover blur-[100px] scale-155 opacity-40 select-none pointer-events-none"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto space-y-6">
        
        {/* Back Link */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Kembali ke Beranda</span>
        </Link>

        {/* 2. SPLIT VIEWPORT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* LEFT: ARTWORK AND CONTROLS (5 Columns) */}
          <div className="lg:col-span-5 flex flex-col justify-between p-6 md:p-8 rounded-3xl bg-black/35 border border-white/5 backdrop-blur-xl min-h-[460px] shadow-2xl relative overflow-hidden">
            <div className="absolute top-[-30%] right-[-20%] w-60 h-60 bg-[#ff004f]/10 rounded-full blur-3xl pointer-events-none" />

            {/* Premium cover box */}
            <div className="relative aspect-square w-full max-w-[300px] mx-auto rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-zinc-950 flex-shrink-0">
              <Image
                src={currentSong.thumbnail}
                alt={currentSong.title}
                fill
                priority
                sizes="(max-width: 300px) 100vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
            </div>

            {/* Metadata Text */}
            <div className="text-center space-y-1.5 mt-6">
              <h2 className="text-lg font-black text-white tracking-tight leading-tight line-clamp-1">{currentSong.title}</h2>
              <p className="text-xs text-zinc-400 font-semibold truncate">{currentSong.artist}</p>
            </div>

            {/* Slider bar */}
            <div className="space-y-2 mt-6">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime || 0}
                onChange={handleProgressChange}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#ff004f] focus:outline-none"
              />
              <div className="flex justify-between text-[10px] font-mono text-zinc-400 font-semibold">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control buttons strip */}
            <div className="flex items-center justify-between mt-6 max-w-[280px] mx-auto w-full">
              {/* Shuffle button */}
              <button 
                onClick={toggleShuffle}
                className={`p-2 transition-all cursor-pointer ${isShuffle ? "text-[#ff004f]" : "text-zinc-500 hover:text-white"}`}
                title="Shuffle"
              >
                <Shuffle size={16} />
              </button>

              {/* Prev */}
              <button 
                onClick={prevSong}
                className="p-2 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-90"
              >
                <SkipBack size={20} fill="currentColor" />
              </button>

              {/* Play Pause */}
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] text-white flex items-center justify-center shadow-lg shadow-[#ff004f]/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
              >
                {isPlaying ? <Pause size={20} fill="white" /> : <Play size={20} fill="white" className="ml-0.5" />}
              </button>

              {/* Next */}
              <button 
                onClick={nextSong}
                className="p-2 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-90"
              >
                <SkipForward size={20} fill="currentColor" />
              </button>

              {/* Repeat button */}
              <button 
                onClick={toggleRepeat}
                className={`p-2 transition-all cursor-pointer ${isRepeat ? "text-[#ff004f]" : "text-zinc-500 hover:text-white"}`}
                title="Repeat"
              >
                <Repeat size={16} />
              </button>
            </div>

            {/* Volume strip */}
            <div className="flex items-center gap-2.5 mt-6 max-w-[220px] mx-auto w-full">
              <Volume2 size={13} className="text-zinc-500" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value))}
                className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#ff004f]"
              />
            </div>

          </div>

          {/* RIGHT: REAL-TIME SYNCED LYRICS VIEW (7 Columns) */}
          <div className="lg:col-span-7 rounded-3xl bg-black/35 border border-white/5 backdrop-blur-xl h-[460px] lg:h-auto min-h-[460px] relative overflow-hidden shadow-2xl flex flex-col justify-between">
            {/* Lyrics Section */}
            <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/20 to-transparent pointer-events-none z-10" />
            
            <div className="flex-grow overflow-hidden relative">
              <SyncedLyricsView 
                title={currentSong.title} 
                artist={currentSong.artist} 
                songId={currentSong.id} 
              />
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-black/40 to-transparent pointer-events-none z-10" />
          </div>

        </div>

      </div>
    </div>
  );
}
