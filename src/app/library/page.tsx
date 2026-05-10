"use client";

import { useEffect, useState } from "react";
import { SafeImage as Image } from "@/components/common/SafeImage";
import { useLibraryStore } from "@/store/useLibraryStore";
import { usePlayerStore } from "@/store/usePlayerStore";
import { useQueueStore } from "@/store/useQueueStore";
import { 
  Library, Plus, Play, Shuffle, Trash2, Edit2, ChevronLeft, 
  Music, Calendar, Disc, X, Heart, User, Sparkles
} from "lucide-react";
import { Song, Artist, Album } from "@/types/music";
import { ArtistDetailSheet, AlbumDetailSheet } from "@/components/search/DetailSheets";

export default function LibraryPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { 
    playlists, savedArtists, savedAlbums,
    createPlaylist, renamePlaylist, deletePlaylist, removeSongFromPlaylist,
    unsaveArtist, unsaveAlbum
  } = useLibraryStore();
  
  const { playSong } = usePlayerStore();
  const { setQueue } = useQueueStore();

  const [activeTab, setActiveTab] = useState<"playlists" | "artists" | "albums">("playlists");
  const [activePlaylistId, setActivePlaylistId] = useState<string | null>(null);
  const [selectedArtistId, setSelectedArtistId] = useState<string | null>(null);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [playlistTitle, setPlaylistTitle] = useState("");
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-[#ff004f]">
        <Disc size={40} className="animate-spin text-[#ff004f]" />
      </div>
    );
  }

  const activePlaylist = playlists.find(p => p.id === activePlaylistId);

  const handleCreatePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistTitle.trim()) {
      createPlaylist(playlistTitle.trim());
      setPlaylistTitle("");
      setShowCreateModal(false);
    }
  };

  const handleRenamePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activePlaylistId && renameValue.trim()) {
      renamePlaylist(activePlaylistId, renameValue.trim());
      setRenameValue("");
      setShowRenameModal(false);
    }
  };

  const handleDeletePlaylist = (id: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus playlist ini?")) {
      deletePlaylist(id);
      setActivePlaylistId(null);
    }
  };

  const handlePlayTrack = (track: Song, songs: Song[], index: number) => {
    playSong(track);
    setQueue(songs, index);
  };

  const handlePlayPlaylist = (songs: Song[]) => {
    if (songs.length === 0) return;
    playSong(songs[0]);
    setQueue(songs, 0);
  };

  const handleShufflePlaylist = (songs: Song[]) => {
    if (songs.length === 0) return;
    const shuffled = [...songs].sort(() => Math.random() - 0.5);
    playSong(shuffled[0]);
    setQueue(shuffled, 0);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return "Baru saja";
    }
  };

  return (
    <div className="space-y-8 select-none py-4 text-white font-sans">
      {/* 1. HEADER SECTION (MAIN LIBRARY OR ACTIVE PLAYLIST HEADER) */}
      {!activePlaylistId ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Library className="text-[#ff004f]" size={24} />
                <span>Koleksi Musik Anda</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Kelola playlist offline, ikuti artis unggulan, dan simpan album kesayangan Anda.</p>
            </div>

            {activeTab === "playlists" && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-2xl text-xs font-black uppercase tracking-wider text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95 self-start sm:self-auto"
              >
                <Plus size={14} />
                Buat Playlist
              </button>
            )}
          </div>

          {/* TAB PILLS */}
          <div className="flex items-center gap-2.5 bg-white/5 p-1.5 rounded-2xl w-max border border-white/5 shadow-inner">
            {[
              { id: "playlists", label: `Playlist (${playlists.length})`, icon: Library },
              { id: "artists", label: `Artis (${savedArtists.length})`, icon: User },
              { id: "albums", label: `Album (${savedAlbums.length})`, icon: Disc },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id as any);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#ff004f] text-white shadow-lg shadow-[#ff004f]/10 font-black"
                      : "text-muted-foreground hover:text-white hover:bg-white/5"
                  }`}
                >
                  <TabIcon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="border-b border-white/5 pb-6">
          <button
            onClick={() => setActivePlaylistId(null)}
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff004f] hover:text-[#ff1a5f] transition-colors cursor-pointer mb-4"
          >
            <ChevronLeft size={16} />
            Kembali ke Koleksi
          </button>

          {activePlaylist && (
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between gap-6 text-center sm:text-left mt-2">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="relative w-32 h-32 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl flex bg-white/5 shrink-0">
                  {activePlaylist.songs.length > 0 ? (
                    <Image src={activePlaylist.songs[0].thumbnail} alt={activePlaylist.title} fill className="object-cover" />
                  ) : (
                    <Music className="text-[#ff004f]/50 m-auto" size={40} />
                  )}
                </div>
                <div>
                  <h2 className="text-2xl md:text-3xl font-black text-white">{activePlaylist.title}</h2>
                  <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-muted-foreground mt-2 font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Music size={12} className="text-[#ff004f]" />
                      {activePlaylist.songs.length} Lagu
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-[#ff004f]" />
                      Dibuat {formatDate(activePlaylist.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Playlist Operations */}
              <div className="flex flex-wrap gap-2 justify-center shrink-0">
                <button
                  onClick={() => handlePlayPlaylist(activePlaylist.songs)}
                  disabled={activePlaylist.songs.length === 0}
                  className="px-4 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 select-none"
                >
                  <Play size={12} fill="white" />
                  Putar
                </button>
                <button
                  onClick={() => handleShufflePlaylist(activePlaylist.songs)}
                  disabled={activePlaylist.songs.length === 0}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 disabled:opacity-50 rounded-xl text-xs font-black uppercase tracking-widest text-white border border-neutral-800 cursor-pointer disabled:cursor-not-allowed flex items-center gap-1.5 select-none"
                >
                  <Shuffle size={12} />
                  Acak
                </button>
                <button
                  onClick={() => {
                    setRenameValue(activePlaylist.title);
                    setShowRenameModal(true);
                  }}
                  className="p-2.5 rounded-xl bg-white/5 border border-neutral-850 hover:border-[#ff004f]/30 text-white cursor-pointer transition-all"
                  title="Ganti Nama Playlist"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDeletePlaylist(activePlaylist.id)}
                  className="p-2.5 rounded-xl bg-red-950/10 border border-red-900/15 hover:border-red-600/30 text-red-400 hover:text-red-300 cursor-pointer transition-all"
                  title="Hapus Playlist"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. TABBED METRICS LISTS */}
      {!activePlaylistId ? (
        <>
          {/* PLAYLISTS TAB */}
          {activeTab === "playlists" && (
            playlists.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-neutral-850 flex items-center justify-center mx-auto">
                  <Library size={28} className="text-[#ff004f]" />
                </div>
                <h3 className="font-extrabold text-sm text-white">Belum Ada Playlist Lokal</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Mulailah dengan membuat playlist baru. Anda dapat menambahkan lagu apa pun saat mencari musik di katalog!
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-5 py-2.5 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-xl text-xs font-black uppercase tracking-wider text-white shadow-lg cursor-pointer transition-all select-none"
                >
                  Buat Playlist Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {playlists.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setActivePlaylistId(p.id)}
                    className="p-4 rounded-2xl bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer flex flex-col group transition-all duration-300 animate-zoom-in"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-lg border border-neutral-800 flex bg-white/5 shrink-0">
                      {p.songs.length > 0 ? (
                        <Image src={p.songs[0].thumbnail} alt={p.title} fill className="object-cover" />
                      ) : (
                        <Music className="text-[#ff004f]/50 m-auto" size={32} />
                      )}
                    </div>
                    <h3 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {p.title}
                    </h3>
                    <span className="text-[10px] text-muted-foreground mt-1.5 font-bold uppercase tracking-wider">
                      {p.songs.length} Lagu
                    </span>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ARTISTS TAB */}
          {activeTab === "artists" && (
            savedArtists.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 border border-neutral-850 flex items-center justify-center mx-auto">
                  <User size={28} className="text-[#ff004f]" />
                </div>
                <h3 className="font-extrabold text-sm text-white">Belum Mengikuti Artis</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Cari artis favorit Anda di katalog pencarian, lalu ikuti profil mereka untuk mendapatkan akses cepat di sini!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {savedArtists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => setSelectedArtistId(artist.id)}
                    className="p-4 rounded-2xl bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer flex flex-col items-center text-center group transition-all duration-300 animate-zoom-in"
                  >
                    <div className="relative aspect-square w-32 rounded-full overflow-hidden mb-4 shadow-lg border border-neutral-800 shrink-0">
                      <Image src={artist.thumbnail} alt={artist.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h3 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {artist.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          unsaveArtist(artist.id);
                        }}
                        className="px-3 py-1 bg-white/5 hover:bg-red-950/20 text-muted-foreground hover:text-red-400 border border-neutral-850 rounded-lg text-[9px] uppercase font-bold transition-all"
                      >
                        Batal Ikuti
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* ALBUMS TAB */}
          {activeTab === "albums" && (
            savedAlbums.length === 0 ? (
              <div className="py-20 text-center max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-neutral-850 flex items-center justify-center mx-auto">
                  <Disc size={28} className="text-[#ff004f]" />
                </div>
                <h3 className="font-extrabold text-sm text-white">Belum Ada Album Tersimpan</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Simpan album dari hasil pencarian atau profil artis. Anda dapat mendengarkan koleksi lagu secara terorganisir di sini!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {savedAlbums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => setSelectedAlbumId(album.id)}
                    className="p-4 rounded-2xl bg-[#111113]/40 hover:bg-[#1a1a22]/50 border border-transparent hover:border-white/5 cursor-pointer flex flex-col group transition-all duration-300 animate-zoom-in"
                  >
                    <div className="relative aspect-square w-full rounded-xl overflow-hidden mb-4 shadow-lg border border-neutral-800 shrink-0">
                      <Image src={album.thumbnail} alt={album.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <h3 className="font-extrabold text-xs text-white line-clamp-1 group-hover:text-[#ff004f] transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-[9px] text-muted-foreground truncate mt-1 font-medium">{album.artist}</p>
                    <div className="flex items-center gap-1.5 mt-3">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          unsaveAlbum(album.id);
                        }}
                        className="px-3 py-1 bg-white/5 hover:bg-red-950/20 text-muted-foreground hover:text-red-400 border border-neutral-850 rounded-lg text-[9px] uppercase font-bold transition-all"
                      >
                        Hapus Album
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </>
      ) : (
        /* Playlist detailed tracklist view */
        activePlaylist && (
          activePlaylist.songs.length === 0 ? (
            <div className="py-20 text-center max-w-sm mx-auto space-y-3">
              <Disc size={40} className="text-muted-foreground/30 mx-auto animate-[spin_12s_linear_infinite]" />
              <h3 className="font-bold text-sm text-white">Playlist ini Kosong</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Tambahkan lagu ke playlist ini dengan mengklik tombol <span className="text-[#ff004f] font-bold">+</span> pada lagu apa saja saat Anda melakukan pencarian!
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {activePlaylist.songs.map((track, idx) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-transparent hover:bg-white/10 group transition-all duration-200"
                >
                  <div
                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => handlePlayTrack(track, activePlaylist.songs, idx)}
                  >
                    <span className="text-xs font-mono text-muted-foreground w-4 text-center">{idx + 1}</span>
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-neutral-800 bg-white/5">
                      <Image src={track.thumbnail} alt={track.title} fill className="object-cover" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#ff004f] transition-colors">
                        {track.title}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate mt-0.5 font-medium">{track.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {track.duration && <span className="text-xs font-mono text-muted-foreground">{track.duration}</span>}
                    <button
                      onClick={() => removeSongFromPlaylist(activePlaylist.id, track.id)}
                      className="p-2 rounded-lg hover:bg-red-950/20 text-muted-foreground hover:text-red-400 cursor-pointer transition-colors"
                      title="Hapus dari Playlist"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        )
      )}

      {/* 3. MODAL FOR CREATING PLAYLIST */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-[#0c0c0e] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative animate-zoom-in">
            <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4">Buat Playlist Baru</h3>
            <form onSubmit={handleCreatePlaylistSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Judul Playlist (misal: Lagu Santai)..."
                value={playlistTitle}
                onChange={(e) => setPlaylistTitle(e.target.value)}
                autoFocus
                className="w-full bg-[#16161a] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3 border border-neutral-800 hover:bg-white/5 rounded-xl text-xs font-bold text-muted-foreground cursor-pointer select-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-xl text-xs font-black text-white cursor-pointer select-none"
                >
                  Buat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. MODAL FOR RENAMING PLAYLIST */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md px-4">
          <div className="w-full max-w-sm bg-[#0c0c0e] border border-neutral-800 rounded-3xl p-6 shadow-2xl relative animate-zoom-in">
            <h3 className="text-xs font-black uppercase tracking-wider text-white mb-4">Ganti Nama Playlist</h3>
            <form onSubmit={handleRenamePlaylistSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Judul Playlist Baru..."
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                className="w-full bg-[#16161a] border border-neutral-800 rounded-xl px-4 py-3 text-xs text-white placeholder-muted-foreground outline-none focus:border-[#ff004f] focus:ring-1 focus:ring-[#ff004f] transition-colors"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="flex-1 py-3 border border-neutral-800 hover:bg-white/5 rounded-xl text-xs font-bold text-muted-foreground cursor-pointer select-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#ff004f] hover:bg-[#ff1a5f] rounded-xl text-xs font-black text-white cursor-pointer select-none"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. INTERACTIVE OVERLAY DETAILED SHEET MODALS */}
      {selectedArtistId && (
        <ArtistDetailSheet id={selectedArtistId} onClose={() => setSelectedArtistId(null)} />
      )}
      {selectedAlbumId && (
        <AlbumDetailSheet id={selectedAlbumId} onClose={() => setSelectedAlbumId(null)} />
      )}
    </div>
  );
}
