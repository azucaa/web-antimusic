"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useUIStore } from "@/store/useUIStore";
import { Song } from "@/types/music";
import { 
  Play, Clock, Disc, Sparkles, Loader2, Music2, Flame, Library, MoreVertical, Users
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
  { id: "relax", label: "Santai", query: "acoustic chill cafe sunset", icon: WindIcon, color: "from-green-500 to-teal-500" },
  { id: "focus", label: "Fokus", query: "lofi hip hop study beat coding", icon: Disc, color: "from-indigo-500 to-blue-500" },
  { id: "commute", label: "Perjalanan", query: "indie folk roadtrip travel", icon: Music2, color: "from-cyan-500 to-sky-500" },
];

function WindIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
      <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
      <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
    </svg>
  );
}

export default function Home() {
  const router = useRouter();
  const [activeCategoryId, setActiveCategoryId] = useState("all");
  const [quickPicks, setQuickPicks] = useState<Song[]>([]);
  const [loadingQuickPicks, setLoadingQuickPicks] = useState(true);
  
  const [trendingAlbums, setTrendingAlbums] = useState<any[]>([]);
  const [loadingAlbums, setLoadingAlbums] = useState(true);

  const [isMounted, setIsMounted] = useState(false);
  const { currentSong, isPlaying, playSong } = usePlayerStore();
  const { history, playlists, savedArtists } = useLibraryStore();
  const { setQueue } = useQueueStore();
  const { setSelectedArtistId, setSelectedAlbumId } = useUIStore();

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
        setQuickPicks((json.songs || []).slice(0, 8));
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

  // Fetch popular search terms for albums
  useEffect(() => {
    const fetchTrendingAlbums = async () => {
      try {
        const res = await fetch(`/api/search?q=hit+album+viral`);
        if (!res.ok) throw new Error();
        const json = await res.json();
        setTrendingAlbums((json.albums || []).slice(0, 6));
      } catch (err) {
        console.error("Failed loading albums", err);
      } finally {
        setLoadingAlbums(false);
      }
    };

    if (isMounted) {
      fetchTrendingAlbums();
    }
  }, [isMounted]);

  const handlePlaySong = (song: Song, index: number, shelfSongs: Song[]) => {
    playSong(song);
    setQueue(shelfSongs, index);
  };

  const handlePlaySingle = (song: Song) => {
    playSong(song);
    setQueue([song], 0);
  };

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[#ff004f]">
        <Loader2 size={40} className="animate-spin text-[#ff004f]" />
      </div>
    );
  }

  const recentTracks = history.slice(0, 6);

  return (
    <div className="space-y-10 py-4 select-none pb-24 font-sans text-white">
      
      {/* 1. INTERACTIVE CATEGORY PILLS */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none shrink-0 -mx-4 px-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategoryId === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`flex items-center gap-2 px-4.5 py-2 rounded-full text-xs font-bold tracking-wide cursor-pointer transition-all shrink-0 border select-none ${
                isActive
                  ? "bg-white text-black border-white shadow-lg shadow-black/40 scale-105"
                  : "bg-[#18181c]/60 border-white/5 text-white hover:bg-[#24242c]/80 hover:border-white/10"
              }`}
            >
              <Icon size={14} className={isActive ? "text-[#ff004f]" : "text-muted-foreground"} />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. DYNAMIC GREETING PANEL */}
      <GreetingHeader />

      {/* 3. ANTIDALGO MOOD RADIO STATIONS */}
      <AntiMusicFlowSection />

      {/* 4. QUICK PICKS 4x2 GRID WITH GLOBAL CONTEXT MENUS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-2">
              <Flame size={13} />
              <span>Pilihan Cepat</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium">Lagu teratas yang sesuai dengan suasana hati aktif Anda</p>
          </div>
          <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/60 border border-white/5 bg-white/5 px-2.5 py-1 rounded-lg">
            Hasil Scraper Musik
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
          <div className="py-8 text-center text-xs text-muted-foreground italic border border-dashed border-neutral-800 rounded-xl">
            Gagal mengambil pilihan lagu. Periksa koneksi internet Anda.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
            {quickPicks.map((song, index) => (
              <ContextMenu key={song.id} song={song} className="w-full">
                <div
                  className="flex items-center justify-between p-2 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 group transition-all duration-250 cursor-pointer"
                  onClick={() => handlePlaySong(song, index, quickPicks)}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-white/5 shadow">
                      <Image 
                        src={song.thumbnail} 
                        alt={song.title} 
                        fill 
                        sizes="(max-width: 48px) 100vw"
                        className="object-cover transition-transform group-hover:scale-105" 
                      />
                      
                      {/* Tiny hover play trigger */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                        <Play size={10} fill="white" className="text-white" />
                      </div>
                    </div>
                    <div className="truncate flex-1 min-w-0">
                      <h4 className="text-xs font-black text-white truncate group-hover:text-[#ff004f] transition-colors">
                        {song.title}
                      </h4>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5 font-medium">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono text-muted-foreground px-2">
                      {song.duration}
                    </span>
                    {/* Trigger local click context menu directly */}
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

      {/* 5. RECENTLY PLAYED SHELF (Listen Again) */}
      {recentTracks.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Clock size={13} className="text-muted-foreground" />
                <span>Putar Lagi</span>
              </h2>
              <p className="text-[10px] text-muted-foreground font-medium">Lagu yang baru-baru ini Anda dengarkan</p>
            </div>
            <Link href="/library" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-[#ff004f] transition-colors">
              Lihat Riwayat
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {recentTracks.map((item, idx) => (
              <ContextMenu key={`${item.song.id}-${idx}`} song={item.song} className="w-full text-left">
                <div
                  onClick={() => handlePlaySingle(item.song)}
                  className="p-3 bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 rounded-2xl group transition-all duration-300 relative cursor-pointer text-center sm:text-left h-full flex flex-col justify-between"
                >
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md border border-white/5 bg-zinc-900">
                    <Image
                      src={item.song.thumbnail}
                      alt={item.song.title}
                      fill
                      sizes="(max-width: 150px) 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Play circle trigger */}
                    <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                      <div className="w-9 h-9 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] hover:scale-105 active:scale-95 text-white flex items-center justify-center shadow-lg translate-y-2 group-hover:translate-y-0 transition-all">
                        <Play size={11} fill="white" className="ml-0.5 text-white" />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {item.song.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-medium">
                      {item.song.artist}
                    </p>
                  </div>
                </div>
              </ContextMenu>
            ))}
          </div>
        </div>
      )}

      {/* 6. RECOMMENDED ALBUMS SHELF */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-2">
          <div className="space-y-0.5">
            <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Library size={13} className="text-[#ff004f]" />
              <span>Rekomendasi Album</span>
            </h2>
            <p className="text-[10px] text-muted-foreground font-medium">Koleksi album populer untuk dieksplorasi</p>
          </div>
        </div>

        {loadingAlbums ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-2xl animate-pulse space-y-3">
                <div className="aspect-square w-full rounded-xl bg-white/5" />
                <div className="h-3 w-3/4 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
          </div>
        ) : trendingAlbums.length === 0 ? (
          <div className="py-6 text-center text-xs text-muted-foreground italic border border-dashed border-neutral-800 rounded-xl">
            Tidak ada album rekomendasi saat ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {trendingAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => setSelectedAlbumId(album.id)}
                className="p-3 bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 rounded-2xl group transition-all duration-300 relative cursor-pointer text-center sm:text-left"
              >
                <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-3 shadow-md border border-white/5 bg-zinc-950">
                  <Image
                    src={album.thumbnail}
                    alt={album.title}
                    fill
                    sizes="(max-width: 150px) 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                  {album.title}
                </h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-medium">
                  {album.artist}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 7. FEATURED ARTISTS SHELF */}
      {savedArtists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <div className="space-y-0.5">
              <h2 className="text-xs font-black uppercase tracking-widest text-white flex items-center gap-2">
                <Music2 size={13} className="text-purple-400" />
                <span>Artis Favorit Anda</span>
              </h2>
              <p className="text-[10px] text-muted-foreground font-medium">Profil artis tersimpan lokal</p>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
            {savedArtists.slice(0, 6).map((art) => (
              <div
                key={art.id}
                onClick={() => setSelectedArtistId(art.id)}
                className="flex flex-col items-center gap-3.5 p-3 rounded-2xl bg-white/[0.01] hover:bg-white/[0.05] border border-transparent hover:border-white/5 transition-all duration-350 cursor-pointer text-center group"
              >
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border border-white/10 shadow-lg shrink-0 bg-zinc-950">
                  <Image 
                    src={art.thumbnail} 
                    alt={art.title} 
                    fill 
                    sizes="(max-width: 96px) 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-108"
                  />
                </div>
                <div className="truncate w-full">
                  <h4 className="text-xs font-black text-white truncate group-hover:text-[#ff004f] transition-colors">
                    {art.title}
                  </h4>
                  <p className="text-[9px] uppercase tracking-wider font-extrabold text-muted-foreground mt-0.5">
                    Saved Artist
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
