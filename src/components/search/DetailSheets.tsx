"use client";

import { useEffect, useState } from "react";
import { SafeImage as Image } from "@/components/common/SafeImage";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { useLibraryStore } from "@/store/useLibraryStore";
import { Song, Album } from "@/types/music";
import { X, Play, Plus, Loader2, Music, Check, Heart, ShieldAlert, Award } from "lucide-react";

interface SheetProps {
  id: string;
  onClose: () => void;
}

// 1. ALBUM DETAIL OVERLAY SHEET (Centered Floating Premium Modal)
export function AlbumDetailSheet({ id, onClose }: SheetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();
  const { setQueue } = useQueueStore();
  const { 
    playlists, addSongToPlaylist, 
    savedAlbums, saveAlbum, unsaveAlbum 
  } = useLibraryStore();
  const [addedSongs, setAddedSongs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchAlbum = async () => {
      try {
        const res = await fetch(`/api/album?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch album");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlbum();
  }, [id]);

  const handlePlayTrack = (track: Song, index: number) => {
    if (!data) return;
    playSong(track);
    setQueue(data.songs, index);
  };

  const handlePlayAll = () => {
    if (!data || data.songs.length === 0) return;
    playSong(data.songs[0]);
    setQueue(data.songs, 0);
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Song) => {
    addSongToPlaylist(playlistId, track);
    const key = `${playlistId}-${track.id}`;
    setAddedSongs(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setAddedSongs(prev => ({ ...prev, [key]: false }));
    }, 1500);
  };

  const isSaved = savedAlbums.some(a => a.id === id);

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div 
        className="w-full max-w-2xl h-[80vh] max-h-[720px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.85)] relative text-white font-sans overflow-hidden animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <span className="text-xs font-black uppercase tracking-widest text-[#ff004f]">Detail Album</span>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer border border-white/5">
            <X size={16} />
          </button>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#ff004f]">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Scraping tracklist...</span>
          </div>
        ) : !data ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <X size={32} className="text-neutral-800 mb-2" />
            <span className="text-sm font-semibold">Detail album tidak tersedia</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            {/* Header metadata */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left border-b border-white/5 pb-6">
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 shrink-0">
                <Image src={data.thumbnail} alt={data.title} fill className="object-cover" />
              </div>
              <div className="space-y-4 flex-1">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-white">{data.title}</h2>
                  <p className="text-[#ff004f] font-bold text-sm mt-1">{data.artist}</p>
                </div>
                
                <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                  <button 
                    onClick={handlePlayAll}
                    className="px-5 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg cursor-pointer flex items-center gap-1.5 select-none transition-all hover:scale-105 active:scale-95"
                  >
                    <Play size={11} fill="white" />
                    Putar Semua
                  </button>
                  <button 
                    onClick={() => isSaved ? unsaveAlbum(id) : saveAlbum({ id, title: data.title, artist: data.artist, thumbnail: data.thumbnail, source: "youtube", type: "album" })}
                    className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer select-none flex items-center gap-1.5 ${
                      isSaved 
                        ? "bg-[#ff004f]/15 border-[#ff004f] text-[#ff004f]" 
                        : "bg-transparent border-neutral-800 text-muted-foreground hover:border-[#ff004f]/50 hover:text-white"
                    }`}
                  >
                    <Heart size={12} fill={isSaved ? "currentColor" : "none"} />
                    {isSaved ? "Tersimpan" : "Simpan"}
                  </button>
                </div>
              </div>
            </div>

            {/* Tracklist */}
            <div className="space-y-1.5 pb-12">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Daftar Lagu</h3>
              {data.songs.map((track: Song, idx: number) => (
                <div 
                  key={track.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 transition-all group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer" onClick={() => handlePlayTrack(track, idx)}>
                    <span className="text-xs font-mono text-muted-foreground w-4 text-center">{idx + 1}</span>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">{track.title}</h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground">{track.duration}</span>
                    
                    {playlists.length > 0 && (
                      <div className="relative group/menu">
                        <button className="p-1.5 rounded-lg hover:bg-white/5 text-muted-foreground hover:text-white transition-all cursor-pointer">
                          <Plus size={14} />
                        </button>
                        
                        <div className="absolute right-0 bottom-full mb-1 w-44 bg-[#0f0f0f] border border-neutral-800 rounded-xl p-1.5 shadow-xl hidden group-hover/menu:block z-50">
                          <div className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground px-2 py-1 border-b border-neutral-800 mb-1">
                            Simpan ke Playlist
                          </div>
                          {playlists.map(p => {
                            const isAdded = addedSongs[`${p.id}-${track.id}`];
                            return (
                              <button
                                key={p.id}
                                onClick={() => handleAddTrackToPlaylist(p.id, track)}
                                className="w-full text-left px-2 py-1.5 text-[10px] font-bold text-white hover:bg-white/5 rounded-lg flex items-center justify-between cursor-pointer"
                              >
                                <span className="truncate">{p.title}</span>
                                {isAdded && <Check size={10} className="text-[#ff004f] shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 2. ARTIST DETAIL OVERLAY SHEET (Centered Floating Premium Modal with Hero Card)
export function ArtistDetailSheet({ id, onClose }: SheetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();
  const { setQueue } = useQueueStore();
  const { savedArtists, saveArtist, unsaveArtist } = useLibraryStore();
  const [albumSheetId, setAlbumSheetId] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtist = async () => {
      try {
        const res = await fetch(`/api/artist?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch artist");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchArtist();
  }, [id]);

  const handlePlayTrack = (track: Song, index: number) => {
    if (!data) return;
    playSong(track);
    setQueue(data.songs, index);
  };

  const handlePlayPopularAll = () => {
    if (!data || data.songs.length === 0) return;
    playSong(data.songs[0]);
    setQueue(data.songs, 0);
  };

  const isSaved = savedArtists.some(a => a.id === id);

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div 
          className="w-full max-w-2xl h-[80vh] max-h-[720px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.85)] relative text-white font-sans overflow-hidden animate-zoom-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-black/55 hover:bg-black/80 text-white transition-all cursor-pointer border border-white/10"
          >
            <X size={15} />
          </button>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#ff004f]">
              <Loader2 className="animate-spin" size={32} />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Memuat Profil Artis...</span>
            </div>
          ) : !data ? (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <X size={32} className="text-neutral-800 mb-2" />
              <span className="text-sm font-semibold">Profil artis tidak tersedia</span>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-none">
              
              {/* BRANDED ARTIST HERO BANNER */}
              <div className="relative h-[240px] md:h-[280px] w-full flex items-end overflow-hidden shrink-0">
                {/* Background Banner Image */}
                <div className="absolute inset-0 z-0">
                  <Image 
                    src={data.thumbnail} 
                    alt={data.title} 
                    fill 
                    priority
                    className="object-cover object-center scale-105 filter brightness-[0.6] blur-[0.5px]" 
                  />
                  {/* Heavy dark fade overlay at the bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0e] via-[#0c0c0e]/60 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0c0c0e]/80 via-transparent to-transparent" />
                </div>

                {/* Overlaid Banner Metadata */}
                <div className="relative z-10 p-6 md:p-8 space-y-2 select-none w-full">
                  <div className="flex items-center gap-1.5 text-[10px] md:text-xs font-black uppercase tracking-widest text-[#ff004f] bg-[#ff004f]/10 border border-[#ff004f]/20 px-3 py-1 rounded-full w-max">
                    <Award size={12} className="text-[#ff004f]" />
                    <span>Artis Terverifikasi</span>
                  </div>

                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white uppercase break-words drop-shadow-md leading-tight">
                    {data.title}
                  </h1>

                  <p className="text-[10px] md:text-xs font-semibold text-white/80 tracking-wide">
                    84.192.204 Pendengar Aktif
                  </p>
                </div>
              </div>

              {/* ACTION BAR (Play button, follow state) */}
              <div className="flex items-center gap-4 px-6 md:px-8 py-4 border-b border-white/5 bg-[#0c0c0e] relative z-15">
                <button 
                  onClick={handlePlayPopularAll}
                  disabled={data.songs.length === 0}
                  className="w-12 h-12 rounded-full bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 text-white flex items-center justify-center cursor-pointer shadow-lg active:scale-95 hover:scale-105 transition-all shrink-0"
                >
                  <Play size={18} fill="white" className="ml-0.5" />
                </button>

                <button 
                  onClick={() => isSaved ? unsaveArtist(id) : saveArtist({ id, title: data.title, thumbnail: data.thumbnail, source: "youtube", type: "artist" })}
                  className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-wider border transition-all cursor-pointer select-none ${
                    isSaved 
                      ? "bg-transparent border-white/30 text-white hover:border-white" 
                      : "bg-white text-black border-transparent hover:bg-white/90"
                  }`}
                >
                  {isSaved ? "Diikuti" : "Ikuti"}
                </button>
              </div>

              {/* DETAIL BODY WRAPPER */}
              <div className="p-6 md:p-8 space-y-8 bg-[#0c0c0e]">
                
                {/* POPULAR SONGS SHELF */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#ff004f] flex items-center gap-1.5">
                    <span>Lagu Populer</span>
                  </h3>

                  {data.songs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Tidak ada lagu ditemukan.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {data.songs.map((track: Song, idx: number) => (
                        <div 
                          key={track.id}
                          onClick={() => handlePlayTrack(track, idx)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 transition-all group cursor-pointer"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <span className="text-xs font-mono font-bold text-muted-foreground/60 w-4 text-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-white/5 shadow">
                              <Image src={track.thumbnail} alt={track.title} fill className="object-cover" />
                            </div>
                            <div className="truncate">
                              <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">
                                {track.title}
                              </h4>
                              {track.album && (
                                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                                  {track.album.name}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 shrink-0">
                            <span className="text-xs font-mono text-muted-foreground">{track.duration}</span>
                            <button className="w-7 h-7 rounded-full bg-[#ff004f] text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all shadow-md active:scale-90 shrink-0">
                              <Play size={10} fill="white" className="ml-0.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ALBUMS GRID SHELF */}
                {data.albums && data.albums.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/80">
                      Album & Single
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {data.albums.map((album: Album) => (
                        <div 
                          key={album.id}
                          onClick={() => setAlbumSheetId(album.id)}
                          className="p-3 bg-[#16161a]/60 hover:bg-[#202026]/70 border border-white/5 hover:border-white/10 rounded-2xl cursor-pointer group transition-all text-center sm:text-left"
                        >
                          <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-neutral-800 shadow">
                            <Image src={album.thumbnail} alt={album.title} fill className="object-cover" />
                          </div>
                          <h4 className="text-xs font-extrabold text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                            {album.title}
                          </h4>
                          <p className="text-[9px] font-semibold text-muted-foreground mt-1 uppercase tracking-wide">
                            {album.type || "Album"} • {album.year || "Unknown"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ARTIST BIOGRAPHY */}
                {data.bio && (
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#ff004f]">Tentang Artis</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                      {data.bio}
                    </p>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Embedded Album Sheet Layer if clicked inside Artist sheet */}
      {albumSheetId && (
        <AlbumDetailSheet id={albumSheetId} onClose={() => setAlbumSheetId(null)} />
      )}
    </>
  );
}

// 3. PLAYLIST DETAIL OVERLAY SHEET (Centered Floating Premium Modal)
export function PlaylistDetailSheet({ id, onClose }: SheetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { playSong } = usePlayerStore();
  const { setQueue } = useQueueStore();

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        const res = await fetch(`/api/playlist?id=${id}`);
        if (!res.ok) throw new Error("Failed to fetch playlist");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
  }, [id]);

  const handlePlayTrack = (track: Song, index: number) => {
    if (!data) return;
    playSong(track);
    setQueue(data.songs, index);
  };

  const handlePlayAll = () => {
    if (!data || data.songs.length === 0) return;
    playSong(data.songs[0]);
    setQueue(data.songs, 0);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
      <div 
        className="w-full max-w-2xl h-[80vh] max-h-[720px] bg-[#0c0c0e]/95 backdrop-blur-3xl border border-white/10 rounded-[28px] flex flex-col shadow-[0_32px_64px_rgba(0,0,0,0.85)] relative text-white font-sans overflow-hidden animate-zoom-in"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-6 py-5 border-b border-white/5 shrink-0">
          <span className="text-xs font-black uppercase tracking-widest text-[#ff004f]">Detail Playlist</span>
          <button onClick={onClose} className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer border border-white/5">
            <X size={16} />
          </button>
        </header>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-[#ff004f]">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Memparsing lagu playlist...</span>
          </div>
        ) : !data ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
            <X size={32} className="text-neutral-800 mb-2" />
            <span className="text-sm font-semibold">Detail playlist tidak tersedia</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-none">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left border-b border-white/5 pb-6">
              <div className="relative w-36 h-36 rounded-2xl overflow-hidden shadow-2xl border border-neutral-800 bg-white/5 flex shrink-0">
                {data.thumbnail ? (
                  <Image src={data.thumbnail} alt={data.title} fill className="object-cover" />
                ) : (
                  <Music className="text-[#ff004f] m-auto" size={48} />
                )}
              </div>
              <div className="space-y-3 flex-1">
                <h2 className="text-xl md:text-2xl font-black text-white">{data.title}</h2>
                <p className="text-[#ff004f] font-bold text-sm">Pembuat: {data.artist}</p>
                
                <button 
                  onClick={handlePlayAll}
                  className="px-6 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg cursor-pointer flex items-center gap-2 mx-auto sm:mx-0 select-none transition-all hover:scale-105 active:scale-95"
                >
                  <Play size={12} fill="white" />
                  Putar Playlist
                </button>
              </div>
            </div>

            <div className="space-y-1.5 pb-12">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground/60 mb-3">Daftar Lagu</h3>
              {data.songs.length === 0 ? (
                <p className="text-xs text-muted-foreground">Playlist ini masih kosong.</p>
              ) : (
                data.songs.map((track: Song, idx: number) => (
                  <div 
                    key={track.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 transition-all group cursor-pointer"
                    onClick={() => handlePlayTrack(track, idx)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-white/5">
                        <Image src={track.thumbnail} alt={track.title} fill className="object-cover" />
                      </div>
                      <div className="truncate">
                        <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">{track.title}</h4>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{track.artist}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground shrink-0">{track.duration}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
