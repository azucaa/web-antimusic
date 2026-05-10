"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SafeImage as Image } from "@/components/common/SafeImage";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useUIStore } from "@/store/useUIStore";
import { useToastStore } from "@/store/useToastStore";
import { Song } from "@/types/music";
import { 
  Play, Clock, Disc, Sparkles, Loader2, Music2, Flame, Library, 
  MoreVertical, Search, User, ArrowRight, Compass, Heart, Plus
} from "lucide-react";
import GreetingHeader from "@/components/home/GreetingHeader";
import AntiMusicFlowSection from "@/components/home/AntiMusicFlowSection";
import ContextMenu from "@/components/common/ContextMenu";

interface CategoryPill {
  id: string;
  label: string;
  query: string;
  icon: any;
  color: string;
}

const CATEGORIES: CategoryPill[] = [
  { id: "all", label: "Pilihan Utama", query: "trending indonesian hits 2026", icon: Sparkles, color: "from-[#ff004f] to-purple-600" },
  { id: "energize", label: "Penuh Energi", query: "edm electropop festival", icon: Flame, color: "from-amber-500 to-red-500" },
  { id: "relax", label: "Santai", query: "acoustic chill cafe sunset", icon: Disc, color: "from-green-500 to-teal-500" },
  { id: "focus", label: "Fokus", query: "lofi hip hop study beat coding", icon: Disc, color: "from-indigo-500 to-blue-500" },
];

const MOCK_POPULAR_ARTISTS = [
  { id: "art-1", title: "Tulus", thumbnail: "https://lh3.googleusercontent.com/a-/ALV-UHV1gYyvY_pB7q8P_6X1zY6-b4o4a7w6a7w6a7w" },
  { id: "art-2", title: "Coldplay", thumbnail: "https://lh3.googleusercontent.com/a-/ALV-UHV1gYyvY_pB7q8P_6X1zY6-b4o4a7w6a7w6a7w" },
  { id: "art-3", title: "Hindia", thumbnail: "https://lh3.googleusercontent.com/a-/ALV-UHV1gYyvY_pB7q8P_6X1zY6-b4o4a7w6a7w6a7w" },
  { id: "art-4", title: "Nadin Amizah", thumbnail: "https://lh3.googleusercontent.com/a-/ALV-UHV1gYyvY_pB7q8P_6X1zY6-b4o4a7w6a7w6a7w" },
];

export default function Home() {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [loadingQuickPicks, setLoadingQuickPicks] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const { history, playlists, savedArtists } = useLibraryStore();
  const { setQueue, addToQueue } = useQueueStore();
  const { setSelectedArtistId, setSelectedAlbumId } = useUIStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fetch Quick Picks whenever Category changes
  useEffect(() => {
    const fetchQuickPicks = async () => {
      setLoadingQuickPicks(true);
      const cat = CATEGORIES.find(c => c.id === activeCategoryId) || CATEGORIES[0];
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(cat.query)}`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setQuickPicks((json.songs || []).slice(0, 6));
      } catch (err) {
        console.error("Failed loading Quick Picks", err);
      } finally {
        setLoadingQuickPicks(false);
      }
    };

    if (isMounted) {
      fetchQuickPicks();
    }
  }, [activeCategoryId, isMounted]);

  const handlePlaySong = (song: Song, index: number, shelfSongs: Song[]) => {
    playSong(song);
    setQueue(shelfSongs, index);
    addToast(`Memutar "${song.title}"`, "success");
  };

  const handlePlaySingle = (song: Song) => {
    playSong(song);
    setQueue([song], 0);
    addToast(`Memutar "${song.title}"`, "success");
  };

  const handlePlayMidnightDrive = async () => {
    addToast("Menyiapkan Midnight Drive Mix...", "info");
    try {
      const res = await fetch(`/api/search?q=synthwave+retro+lofi+night+drive`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const songs = json.songs || [];
      if (songs.length > 0) {
        playSong(songs[0]);
        setQueue(songs, 0);
        addToast("Midnight Drive Mix Diputar!", "success");
      }
    } catch {
      addToast("Gagal memuat Midnight Drive Mix.", "error");
    }
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#ff004f]">
        <Loader2 size={40} className="animate-spin text-[#ff004f]" />
      </div>
    );
  }

  const recentTracks = history.slice(0, 4);

  return (
    <div className="space-y-8 py-2 select-none pb-24 font-sans text-white">
      
      {/* 1. TOP BAR */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="space-y-0.5">
          <h1 className="text-lg font-black tracking-wider uppercase text-white flex items-center gap-2">
            <span>Beranda</span>
            <span className="text-[10px] font-bold text-[#ff004f] bg-[#ff004f]/10 border border-[#ff004f]/20 px-2 py-0.5 rounded-md uppercase tracking-widest">
              Sovereign Flow
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-400 shadow-md">
            <User size={14} />
          </div>
        </div>
      </div>

      {/* 2. GREETING HERO CARD WITH INTEGRATED SEARCH */}
      <GreetingHeader />

      {/* 2. CURATED MIDNIGHT DRIVE HERO CARD */}
      <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-violet-950 via-[#0a0a0f] to-zinc-950 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        {/* Abstract futuristic background vector */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-pink-500/10 to-transparent opacity-60 pointer-events-none" />
        <div className="absolute left-0 bottom-0 w-1/3 h-1/2 bg-gradient-to-tr from-[#ff004f]/10 to-transparent opacity-40 pointer-events-none" />

        <div className="space-y-4 max-w-lg z-10 relative">
          <div className="flex items-center gap-2 text-[#ff004f] bg-[#ff004f]/10 border border-[#ff004f]/20 px-3 py-1 rounded-full w-fit">
            <Sparkles size={11} className="animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-wider">Curated Experience</span>
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">Midnight Drive Mix</h1>
            <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
              Kompilasi retro synthwave, lofi beats, dan neon vibes teratas untuk menemani perjalanan malam atau fokus coding Anda.
            </p>
          </div>

          <div className="flex items-center gap-3.5 pt-1">
            <button
              onClick={handlePlayMidnightDrive}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] text-white text-xs font-black uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shadow-[#ff004f]/20 active:scale-95"
            >
              <Play size={12} fill="white" />
              <span>Putar Campuran</span>
            </button>
            <button
              onClick={() => router.push("/search?q=synthwave")}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold rounded-2xl transition-all cursor-pointer"
            >
              <Compass size={12} />
              <span>Eksplorasi</span>
            </button>
          </div>
        </div>

        {/* Hero Artwork Graphic */}
        <div className="relative w-44 h-44 sm:w-48 sm:h-48 rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-2xl z-10 rotate-2 hover:rotate-0 transition-transform duration-500">
          <Image
            src="https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600"
            alt="Midnight Drive Graphic"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#ff004f]">Neon Ride</p>
            <p className="text-[9px] text-zinc-400 mt-0.5">AntiAlgo Selection</p>
          </div>
        </div>
      </div>

      {/* 3. CATEGORY PILLS */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 scrollbar-none shrink-0 -mx-4 px-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-all shrink-0 border select-none ${
                isActive
                  ? "bg-white text-black border-white shadow-lg scale-105"
                  : "bg-zinc-900/40 border-white/5 text-zinc-400 hover:bg-zinc-800/60 hover:text-white hover:border-white/10"
              }`}
            >
              <Icon size={12} className={isActive ? "text-[#ff004f]" : "text-zinc-500"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. ANTIDALGO MOOD RADIO STATIONS */}
      <AntiMusicFlowSection />

      {/* 5. QUICK PICKS (PILIHAN CEPAT) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-2">
              <Flame size={13} />
              <span>Pilihan Cepat</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-semibold">Disesuaikan dengan kategori aktif Anda saat ini</p>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
            Scraped Live
          </span>
        </div>

        {loadingQuickPicks ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex items-center gap-3.5 p-2 bg-white/5 border border-white/5 rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-lg bg-white/5 shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                  <div className="h-2 w-1/3 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : quickPicks.length === 0 ? (
          <div className="py-8 text-center text-xs text-zinc-500 italic border border-dashed border-zinc-800 rounded-xl">
            Gagal mengambil pilihan lagu. Periksa koneksi internet Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {quickPicks.map((song, index) => (
              <ContextMenu key={song.id} song={song} className="w-full">
                <div
                  className="flex items-center justify-between p-2 rounded-2xl bg-zinc-900/10 hover:bg-zinc-900/40 border border-white/5 hover:border-white/10 group transition-all duration-250 cursor-pointer"
                  onClick={() => handlePlaySong(song, index, quickPicks)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-900 shadow">
                      <Image 
                        src={song.thumbnail} 
                        alt={song.title} 
                        fill 
                        sizes="(max-width: 48px) 100vw"
                        className="object-cover transition-transform group-hover:scale-105" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Play size={10} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[#ff004f] transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-zinc-500 truncate mt-0.5 font-bold">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-zinc-500 px-2 font-bold">
                      {song.duration}
                    </span>
                    <div onClick={(e) => e.stopPropagation()}>
                      <ContextMenu song={song} triggerType="click" />
                    </div>
                  </div>
                </div>
              </ContextMenu>
            ))}
          </div>
        )}
      </div>

      {/* 6. COMPACT RECENTLY PLAYED ROWS (PUTAR LAGI) */}
      {recentTracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Clock size={13} className="text-zinc-500" />
                <span>Putar Lagi</span>
              </h2>
              <p className="text-[10px] text-zinc-500 font-semibold font-sans">Lagu yang baru-baru ini diputar</p>
            </div>
            <Link href="/library" className="text-[10px] font-black uppercase tracking-widest text-[#ff004f] hover:underline">
              Lihat Riwayat
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentTracks.map((item, idx) => (
              <ContextMenu key={`${item.song.id}-${idx}`} song={item.song} className="w-full text-left">
                <div
                  onClick={() => handlePlaySingle(item.song)}
                  className="flex items-center gap-4 p-3 bg-zinc-900/10 hover:bg-zinc-900/30 border border-white/5 rounded-2xl group transition-all duration-300 relative cursor-pointer"
                >
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/5 bg-zinc-900">
                    <Image
                      src={item.song.thumbnail}
                      alt={item.song.title}
                      fill
                      sizes="(max-width: 48px) 100vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-[#ff004f] transition-colors">
                      {item.song.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5 truncate font-bold">
                      {item.song.artist}
                    </p>
                  </div>
                  <div className="p-2 bg-white/5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play size={12} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>
              </ContextMenu>
            ))}
          </div>
        </div>
      )}

      {/* 7. POPULAR ARTISTS CIRCULAR CARDS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Compass size={13} className="text-[#ff004f]" />
              <span>Artis Populer</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-semibold">Rekomendasi artis untuk Anda dengarkan</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          {(savedArtists.length > 0 ? savedArtists.slice(0, 4) : MOCK_POPULAR_ARTISTS).map((art) => (
            <div
              key={art.id}
              onClick={() => setSelectedArtistId(art.id)}
              className="flex flex-col items-center gap-3 p-3 rounded-2xl hover:bg-zinc-900/10 transition-all duration-350 cursor-pointer text-center group"
            >
              <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border border-white/10 shadow-lg shrink-0 bg-zinc-900">
                <Image 
                  src={art.thumbnail} 
                  alt={art.title || "Artist"} 
                  fill 
                  sizes="(max-width: 80px) 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              <div className="truncate w-full">
                <h4 className="text-[11px] font-black text-white truncate group-hover:text-[#ff004f] transition-colors">
                  {art.title}
                </h4>
                <p className="text-[8px] uppercase tracking-wider font-extrabold text-zinc-500 mt-0.5">
                  Popular Artist
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
