"use client";

import { useState } from "react";
import { useLibraryStore } from "@/store/useLibraryStore";
import { useToastStore } from "@/store/useToastStore";
import { Song } from "@/types/music";
import { X, Plus, Music, FolderPlus, Check } from "lucide-react";

interface AddToPlaylistDialogProps {
  song: Song;
  onClose: () => void;
}

export default function AddToPlaylistDialog({ song, onClose }: AddToPlaylistDialogProps) {
  const { playlists, createPlaylist, addSongToPlaylist } = useLibraryStore();
  const { addToast } = useToastStore();
  const [newTitle, setNewTitle] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreatePlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTitle.trim()) {
      createPlaylist(newTitle.trim());
      addToast(`Playlist "${newTitle.trim()}" berhasil dibuat!`, "success");
      setNewTitle("");
      setShowCreateForm(false);
    }
  };

  const handleAddSong = (playlistId: string, playlistTitle: string) => {
    const playlist = playlists.find((p) => p.id === playlistId);
    if (playlist) {
      const exists = playlist.songs.some((s) => s.id === song.id);
      if (exists) {
        addToast(`Lagu sudah ada di playlist "${playlistTitle}"`, "warning");
        return;
      }
      addSongToPlaylist(playlistId, song);
      addToast(`Lagu berhasil ditambahkan ke "${playlistTitle}"`, "success");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md rounded-3xl bg-[#0d0d12]/95 border border-white/10 p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 font-sans text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Tambah ke Playlist</h3>
            <p className="text-[10px] text-zinc-400 truncate max-w-[280px]">"{song.title}"</p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Playlist selection list */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-zinc-500 gap-2">
              <Music size={24} className="text-zinc-600" />
              <p className="text-xs font-bold">Belum ada playlist.</p>
              <p className="text-[10px] text-zinc-500">Mulai dengan membuat playlist baru di bawah ini.</p>
            </div>
          ) : (
            playlists.map((playlist) => {
              const hasSong = playlist.songs.some((s) => s.id === song.id);
              return (
                <button
                  key={playlist.id}
                  onClick={() => handleAddSong(playlist.id, playlist.title)}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/5 transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-10 h-10 rounded-xl bg-zinc-900/50 border border-white/5 flex items-center justify-center text-[#ff004f] shrink-0">
                      <Music size={16} />
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-bold text-white group-hover:text-[#ff004f] transition-colors">{playlist.title}</p>
                      <p className="text-[10px] text-zinc-400 mt-0.5">{playlist.songs.length} lagu</p>
                    </div>
                  </div>
                  <div>
                    {hasSong ? (
                      <span className="w-6 h-6 rounded-full bg-[#ff004f]/15 border border-[#ff004f]/20 flex items-center justify-center text-[#ff004f]">
                        <Check size={12} />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-hover:text-white transition-colors">
                        <Plus size={12} />
                      </span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Create playlist toggle form */}
        <div className="mt-4 pt-4 border-t border-white/5">
          {showCreateForm ? (
            <form onSubmit={handleCreatePlaylist} className="flex gap-2 animate-in slide-in-from-bottom-2 duration-200">
              <input
                type="text"
                placeholder="Nama playlist baru..."
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="flex-1 bg-zinc-900/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-zinc-500 focus:outline-none focus:border-[#ff004f]/40 transition-colors"
              />
              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="px-4 py-2 bg-[#ff004f] hover:bg-[#ff1a5f] disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Buat
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-2 bg-zinc-900 border border-white/5 hover:bg-zinc-800 rounded-xl text-xs font-bold cursor-pointer text-zinc-300"
              >
                Batal
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/10 hover:border-[#ff004f]/30 hover:text-[#ff004f] transition-all text-xs font-black uppercase tracking-wider text-zinc-400 cursor-pointer"
            >
              <FolderPlus size={14} />
              <span>Buat Playlist Baru</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
