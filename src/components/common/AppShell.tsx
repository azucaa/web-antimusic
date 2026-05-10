"use client";

import { ReactNode } from "react";
import Sidebar from "./Sidebar";
import BottomNavbar from "./BottomNavbar";
import RightMusicPanel from "../layout/RightMusicPanel";
import MiniPlayer from "../player/MiniPlayer";
import YTPlayerManager from "./YTPlayerManager";
import YTPlayerSyncManager from "./YTPlayerSyncManager";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUIStore } from "@/store/useUIStore";
import ToastContainer from "./Toast";
import AddToPlaylistDialog from "../playlist/AddToPlaylistDialog";
import AddToTogetherDialog from "../together/AddToTogetherDialog";
import { AlbumDetailSheet, ArtistDetailSheet, PlaylistDetailSheet } from "@/components/search/DetailSheets";

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { theme } = useSettingsStore();
  const { 
    selectedAlbumId, selectedArtistId, selectedPlaylistId,
    songForPlaylistModal, songForTogetherModal,
    isRightPanelOpen,
    setSelectedAlbumId, setSelectedArtistId, setSelectedPlaylistId,
    setSongForPlaylistModal, setSongForTogetherModal
  } = useUIStore();

  return (
    <div className={`min-h-screen text-foreground select-none relative ${theme === "light" ? "bg-purple-50 text-slate-900" : ""}`}>
      {/* 1. YouTube hidden player instance controller */}
      <YTPlayerManager />
      <YTPlayerSyncManager />

      {/* 2. Sidebar Navigation (Visible on Desktop) */}
      <Sidebar />
      {isRightPanelOpen && <RightMusicPanel />}

      {/* 3. Main Content Scroll Area */}
      <main className={`min-h-screen md:pl-64 ${isRightPanelOpen ? "xl:pr-80" : "xl:pr-0"} pb-44 md:pb-32 transition-all duration-300`}>
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* 4. Interactive Music Player Bar */}
      <MiniPlayer />

      {/* 5. Bottom Navigation Bar (Visible on Mobile) */}
      <BottomNavbar />

      {/* 6. Global Detail Sheets Modals */}
      {selectedAlbumId && (
        <AlbumDetailSheet id={selectedAlbumId} onClose={() => setSelectedAlbumId(null)} />
      )}
      {selectedArtistId && (
        <ArtistDetailSheet id={selectedArtistId} onClose={() => setSelectedArtistId(null)} />
      )}
      {selectedPlaylistId && (
        <PlaylistDetailSheet id={selectedPlaylistId} onClose={() => setSelectedPlaylistId(null)} />
      )}
      {songForPlaylistModal && (
        <AddToPlaylistDialog song={songForPlaylistModal} onClose={() => setSongForPlaylistModal(null)} />
      )}
      {songForTogetherModal && (
        <AddToTogetherDialog song={songForTogetherModal} onClose={() => setSongForTogetherModal(null)} />
      )}

      {/* 7. Global Toast Notifications Container */}
      <ToastContainer />
    </div>
  );
}
