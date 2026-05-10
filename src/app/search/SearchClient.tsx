"use client";

import { useEffect, useState } from "react";
import { SafeImage as Image } from "@/components/common/SafeImage";
import { useSearchParams, useRouter } from "next/navigation";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useUIStore } from "@/store/useUIStore";
import { Song, SearchResult } from "@/types/music";
import { Search, Loader2, Music, List, Plus, Disc, User, Play } from "lucide-react";

const SUGGESTIONS = [
  "Indonesian Pop Hits",
  "Lofi Chill coding",
  "Phonk Gym Bass",
  "Synthwave retro",
  "Viral TikTok Remix",
  "Acoustic Folk Roadtrip"
];

const TABS = [
  { id: "all", label: "Semua" },
  { id: "songs", label: "Lagu" },
  { id: "artists", label: "Artis" },
  { id: "albums", label: "Album" },
  { id: "playlists", label: "Playlist" },
];

export default function SearchClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const { playSong } = usePlayerStore();
  const { setQueue, addToQueue } = useQueueStore();
  const { setSelectedArtistId, setSelectedAlbumId, setSelectedPlaylistId } = useUIStore();

  useEffect(() => {
    setInputVal(queryParam);
    if (!queryParam.trim()) {
      setResults(null);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(queryParam)}`);
        if (!res.ok) throw new Error("Scraper returned an error state");
        const json = await res.json();
        setResults(json);
      } catch (err) {
        console.error(err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputVal.trim()) {
      router.push(`/search?q=${encodeURIComponent(inputVal.trim())}`);
    }
  };

  const handleSuggestionClick = (term: string) => {
    setInputVal(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handlePlaySong = (song: Song, songsList: Song[], index: number) => {
    playSong(song);
    setQueue(songsList, index);
  };

  return (
    <div className="space-y-8 select-none py-4 text-white font-sans">
      {/* Search Header Container */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <Search className="text-[#ff004f]" size={24} />
            <span>Cari Lagu</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Telusuri jutaan lagu, album, dan artis secara instan.</p>
        </div>

        {/* Input box */}
        <form onSubmit={handleSearchSubmit} className="flex max-w-md w-full items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <input
              type="text"
              placeholder="Artis, lagu, album, playlist..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full bg-[#0e0e11] hover:bg-[#15151a] focus:bg-[#1a1a22] border border-[#23232c] focus:border-[#ff004f] rounded-2xl pl-12 pr-4 py-3 text-xs text-white placeholder-muted-foreground outline-none transition-all focus:ring-1 focus:ring-[#ff004f]"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] text-white rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer select-none active:scale-95 transition-all shadow-lg"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Empty Search / Suggestions Screen */}
      {!queryParam.trim() && (
        <div className="space-y-6 max-w-xl py-12">
          <div className="space-y-2">
            <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f]">Rekomendasi Tema</h2>
            <p className="text-xs text-muted-foreground">Pilih tema musik untuk memulai pencarian cepat Anda:</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestionClick(s)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-neutral-800 hover:border-[#ff004f]/40 rounded-xl text-xs text-white font-bold transition-all cursor-pointer"
              >
                # {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      {queryParam.trim() && (
        <div className="flex bg-white/5 p-1.5 rounded-2xl w-max border border-white/5 gap-1 pb-1.5 scrollbar-none">
          {TABS.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setResults(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-[#ff004f] text-white shadow-lg font-black"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      )}

      {/* LOADING SPINNER */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-[#ff004f]">
          <Loader2 className="animate-spin text-[#ff004f]" size={32} />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Mencari katalog lagu...</span>
        </div>
      )}

      {/* ERROR CARD */}
      {error && !loading && (
        <div className="p-6 rounded-2xl bg-red-950/10 border border-red-900/30 text-center max-w-md mx-auto space-y-3">
          <Music className="text-red-500 mx-auto" size={32} />
          <h3 className="font-bold text-sm text-white">Scraping Terganggu</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Koneksi ke server musik terputus. Silakan ganti kata kunci pencarian Anda.
          </p>
        </div>
      )}

      {/* RESULTS DISPLAY */}
      {results && !loading && !error && (
        <div className="space-y-10">
          {/* A. SONGS/VIDEOS DISPLAY */}
          {(activeTab === "all" || activeTab === "songs") && results.songs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5">
                <Music size={12} />
                <span>Lagu</span>
              </h2>
              <div className="space-y-1.5">
                {results.songs.slice(0, activeTab === "all" ? 5 : 40).map((song, idx, arr) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 group transition-all duration-200"
                  >
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handlePlaySong(song, arr, idx)}
                    >
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-white/5">
                        <Image src={song.thumbnail} alt={song.title} fill className="object-cover" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">
                          {song.title}
                        </h4>
                        
                        {/* Interactive Clickable Artist & Album Subtitles */}
                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          {song.artistsList && song.artistsList.length > 0 ? (
                            song.artistsList.map((art, aIdx) => (
                              <span key={aIdx} className="inline-flex items-center">
                                {art.id ? (
                                  <span
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedArtistId(art.id);
                                    }}
                                    className="hover:text-[#ff004f] hover:underline cursor-pointer transition-all font-semibold"
                                  >
                                    {art.name}
                                  </span>
                                ) : (
                                  <span>{art.name}</span>
                                )}
                                {aIdx < song.artistsList!.length - 1 && <span className="mx-1 text-white/20">&</span>}
                              </span>
                            ))
                          ) : (
                            <span>{song.artist}</span>
                          )}

                          {song.album && song.album.id && (
                            <>
                              <span className="mx-1 text-white/15">•</span>
                              <span
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedAlbumId(song.album?.id);
                                }}
                                className="hover:text-[#ff004f] hover:underline cursor-pointer transition-all font-medium"
                              >
                                {song.album.name}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {song.duration && <span className="text-xs font-mono text-muted-foreground">{song.duration}</span>}
                      
                      <button
                        onClick={() => addToQueue(song)}
                        className="w-8 h-8 rounded-full bg-white/5 hover:bg-[#ff004f] text-white hover:text-white border border-neutral-800 hover:border-transparent flex items-center justify-center cursor-pointer transition-all active:scale-90"
                        title="Tambah ke Antrean"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* B. ARTISTS DISPLAY */}
          {(activeTab === "all" || activeTab === "artists") && results.artists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5">
                <User size={12} />
                <span>Artis</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {results.artists.slice(0, activeTab === "all" ? 4 : 24).map((artist) => (
                  <div
                    key={artist.id}
                    className="p-4 rounded-2xl bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer text-center group transition-all duration-300"
                    onClick={() => setSelectedArtistId(artist.id)}
                  >
                    <div className="relative w-24 h-24 rounded-full overflow-hidden mx-auto mb-3 border border-neutral-800 shadow-lg">
                      <Image src={artist.thumbnail} alt={artist.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {artist.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground mt-1.5 block font-medium">Artis</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* C. ALBUMS DISPLAY */}
          {(activeTab === "all" || activeTab === "albums") && results.albums.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5">
                <Disc size={12} />
                <span>Album</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {results.albums.slice(0, activeTab === "all" ? 4 : 24).map((album) => (
                  <div
                    key={album.id}
                    className="p-3 bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer group transition-all duration-300 relative"
                    onClick={() => setSelectedAlbumId(album.id)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-neutral-800 shadow-lg">
                      <Image src={album.thumbnail} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {album.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate font-medium">{album.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* D. PLAYLISTS DISPLAY */}
          {(activeTab === "all" || activeTab === "playlists") && results.playlists.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5">
                <List size={12} />
                <span>Playlist</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {results.playlists.slice(0, activeTab === "all" ? 4 : 24).map((playlist) => (
                  <div
                    key={playlist.id}
                    className="p-3 bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer group transition-all duration-300 relative"
                    onClick={() => setSelectedPlaylistId(playlist.id)}
                  >
                    <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-neutral-800 shadow-lg flex bg-white/5">
                      {playlist.thumbnail ? (
                        <Image src={playlist.thumbnail} alt={playlist.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <Music className="text-[#ff004f] m-auto" size={24} />
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {playlist.title}
                    </h4>
                    <p className="text-[10px] text-muted-foreground mt-1 truncate font-medium">{playlist.artist}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
