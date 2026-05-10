# Prompt untuk Antigravity AI — AntiMusic Web Lite

## Konteks Project

Saya punya project Android bernama **AntiMusic**, yaitu fork dari Muzza, sebuah YouTube Music client Android berbasis Kotlin/Jetpack Compose. Saya ingin membuat versi web bernama **AntiMusic Web Lite**.

Tujuan utama: membuat web music client yang ringan, modern, mudah dikembangkan, dan tidak memasukkan fitur Android/native yang sulit diadaptasi ke web.

AntiMusic Web Lite **bukan hasil convert langsung dari Android**, tetapi project web baru yang mengambil konsep utama AntiMusic: clean UI, search musik, playback, queue, lyrics, playlist lokal, private/focus mode, dan statistik lokal.

---

## Tujuan Utama

Buat aplikasi web bernama **AntiMusic Web Lite** dengan fokus pada:

1. UI music player modern dan responsive.
2. Search lagu/video/artist/playlist.
3. Playback melalui YouTube embed atau player web yang aman.
4. Queue sederhana.
5. Lyrics viewer.
6. Playlist lokal.
7. Listening history lokal.
8. Stats lokal.
9. Focus Mode.
10. Anti-Algorithm Mode sederhana.
11. PWA basic agar bisa di-install di browser.

---

## Fitur yang Harus Dibuat

### 1. Home Page

Buat halaman utama dengan:

- Header nama app: `AntiMusic`
- Search bar besar
- Quick action:
  - Focus Mode
  - Private Session
  - Local Library
  - Stats
- Section:
  - Recently Played
  - Local Playlists
  - Offline-style saved items, tetapi hanya metadata lokal, bukan download audio
  - Anti-Algorithm Mix

Catatan:
Data awal boleh dummy/mock terlebih dahulu jika backend belum tersedia.

---

### 2. Search Page

Buat halaman search dengan fitur:

- Input search
- Debounce query
- Result tabs:
  - Songs
  - Videos
  - Albums
  - Artists
  - Playlists
- Setiap result card memiliki aksi:
  - Play now
  - Add to queue
  - Save to local playlist
  - View lyrics jika tersedia

Jika API asli belum tersedia, buat abstraction layer agar mudah diganti nanti.

Contoh interface TypeScript:

```ts
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  thumbnail?: string;
  duration?: string;
  source: "youtube" | "local" | "mock";
}

export interface SearchResult {
  songs: Song[];
  videos: Song[];
  albums: Album[];
  artists: Artist[];
  playlists: Playlist[];
}
```

---

### 3. Player

Buat global music player yang selalu muncul di bawah halaman.

Fitur player:

- Play/pause
- Next
- Previous
- Seek bar jika memungkinkan
- Volume control
- Current song title
- Artist
- Thumbnail
- Queue button
- Lyrics button
- Focus Mode button

Untuk playback awal, gunakan pendekatan aman:

- YouTube IFrame Player API, atau
- embed player abstraction yang bisa diganti nanti.

Buat service/wrapper seperti:

```ts
export interface PlayerService {
  load(song: Song): Promise<void>;
  play(): Promise<void>;
  pause(): Promise<void>;
  next(): Promise<void>;
  previous(): Promise<void>;
  seekTo(seconds: number): Promise<void>;
}
```

---

### 4. Queue

Buat queue manager lokal.

Fitur:

- Add to queue
- Remove from queue
- Move up/down
- Clear queue
- Play selected item
- Persistent queue di `localStorage` atau IndexedDB

Gunakan state management yang rapi, misalnya Zustand atau Context API.

---

### 5. Lyrics

Buat halaman atau panel lyrics.

Fitur lyrics:

- Tampilkan lirik plain text
- Support synced lyrics format LRC untuk masa depan
- Placeholder jika lirik tidak ditemukan
- Tombol:
  - Copy lyrics
  - Toggle fullscreen lyrics
  - Toggle translated lyrics placeholder

Interface:

```ts
export interface LyricsLine {
  time?: number;
  text: string;
  translation?: string;
}

export interface LyricsResult {
  songId: string;
  provider: "lrclib" | "youtube" | "manual" | "mock";
  synced: boolean;
  lines: LyricsLine[];
}
```

---

### 6. Local Playlist

Buat sistem playlist lokal tanpa login.

Fitur:

- Create playlist
- Rename playlist
- Delete playlist
- Add song to playlist
- Remove song from playlist
- Reorder songs
- Save di IndexedDB atau localStorage

Tidak perlu integrasi akun YouTube dulu.

---

### 7. Listening History

Buat history lokal.

Simpan data:

- Song ID
- Title
- Artist
- Played at
- Duration listened jika tersedia
- Source

Fitur:

- Recently played
- Clear history
- Private Session: saat aktif, jangan simpan history

---

### 8. Stats Page

Buat halaman statistik lokal.

Fitur:

- Total songs played
- Top artists
- Top songs
- Listening time estimate
- Most active listening hour
- Recently played chart sederhana
- AntiMusic Recap card

Data boleh dihitung dari local history.

---

### 9. Focus Mode

Focus Mode adalah fitur pembeda AntiMusic.

Saat aktif:

- UI player jadi minimal
- Sembunyikan rekomendasi/search suggestion
- Tampilkan hanya current song, controls, lyrics optional
- Bisa set timer:
  - 15 menit
  - 30 menit
  - 45 menit
  - 60 menit
- Setelah timer selesai, pause playback

---

### 10. Anti-Algorithm Mode

Anti-Algorithm Mode adalah mode yang tidak bergantung pada rekomendasi online.

Saat aktif:

- Home tidak menampilkan rekomendasi online
- Tampilkan lagu dari:
  - Local playlists
  - Recently played
  - Forgotten songs
  - Random local queue
- Buat “Anti-Algorithm Mix” dari data lokal/history

Tidak perlu AI recommendation dulu.

---

### 11. Settings

Buat halaman settings:

- Theme:
  - Dark
  - Light
  - System
- Private Session toggle
- Focus Mode default duration
- Clear local history
- Clear local playlists
- Clear queue
- About AntiMusic
- Credit upstream Muzza

About text:

```text
AntiMusic Web Lite is a lightweight web adaptation inspired by AntiMusic Android, which is based on the open-source Muzza project.
This web version focuses on clean UI, local-first playlists, lyrics, queue, stats, and distraction-free listening.
```

---

## Fitur yang Tidak Perlu Dibuat di Web

Jangan masukkan fitur sulit/native berikut pada versi web awal:

1. Background playback mobile yang kompleks.
2. Offline audio download.
3. Audio enhancement real-time seperti Android Equalizer, BassBoost, Virtualizer.
4. Android Auto.
5. Media notification native Android.
6. ExoPlayer atau Media3.
7. Room database Android.
8. Jetpack Compose.
9. Login YouTube Music.
10. Cache audio besar.
11. AI audio super-resolution.
12. Crossfade/gapless advanced.
13. ReplayGain scanner native.
14. Integrasi akun Google/YouTube.
15. Sinkronisasi cloud.

Jika perlu placeholder, tulis sebagai “future feature”, jangan implementasikan sekarang.

---

## Tech Stack yang Disarankan

Gunakan salah satu stack berikut.

### Pilihan Utama

- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand untuk state management
- IndexedDB atau localStorage untuk data lokal
- YouTube IFrame Player API abstraction
- PWA support

### Alternatif

- Vite + React + TypeScript
- SvelteKit
- Vue + Nuxt

Prioritaskan Next.js jika memungkinkan.

---

## Struktur Folder yang Diinginkan

```text
antimusic-web/
├─ app/
│  ├─ page.tsx
│  ├─ search/
│  │  └─ page.tsx
│  ├─ library/
│  │  └─ page.tsx
│  ├─ playlist/
│  │  └─ [id]/
│  │     └─ page.tsx
│  ├─ lyrics/
│  │  └─ page.tsx
│  ├─ stats/
│  │  └─ page.tsx
│  ├─ settings/
│  │  └─ page.tsx
│  └─ layout.tsx
├─ components/
│  ├─ player/
│  │  ├─ MiniPlayer.tsx
│  │  ├─ PlayerControls.tsx
│  │  ├─ QueuePanel.tsx
│  │  └─ LyricsPanel.tsx
│  ├─ search/
│  │  ├─ SearchBar.tsx
│  │  ├─ SearchResults.tsx
│  │  └─ SongCard.tsx
│  ├─ playlist/
│  │  ├─ PlaylistCard.tsx
│  │  └─ PlaylistEditor.tsx
│  ├─ stats/
│  │  └─ StatsCard.tsx
│  └─ common/
│     ├─ AppShell.tsx
│     ├─ Sidebar.tsx
│     └─ ThemeToggle.tsx
├─ lib/
│  ├─ player/
│  │  ├─ playerService.ts
│  │  └─ youtubeIframeService.ts
│  ├─ api/
│  │  ├─ searchApi.ts
│  │  └─ lyricsApi.ts
│  ├─ storage/
│  │  ├─ localDb.ts
│  │  ├─ playlistStore.ts
│  │  └─ historyStore.ts
│  └─ utils/
│     └─ format.ts
├─ store/
│  ├─ usePlayerStore.ts
│  ├─ useQueueStore.ts
│  ├─ useSettingsStore.ts
│  └─ useLibraryStore.ts
├─ types/
│  ├─ music.ts
│  ├─ lyrics.ts
│  └─ settings.ts
├─ public/
│  ├─ icon.png
│  └─ manifest.json
├─ README.md
└─ package.json
```

---

## Desain UI

Gaya visual:

- Modern
- Dark-first
- Minimal
- Mobile responsive
- Card-based
- Rounded corners
- Smooth transitions
- Tidak terlalu ramai
- Cocok untuk music app

Warna brand:

- Background gelap
- Accent bisa ungu, biru, atau hijau neon
- Hindari UI terlalu mirip YouTube Music

Layout:

- Desktop: sidebar kiri + main content + mini player bawah
- Mobile: bottom navigation + mini player bawah
- Lyrics fullscreen harus nyaman dibaca

---

## Data Storage Lokal

Gunakan local-first approach.

Simpan di IndexedDB/localStorage:

- Settings
- Queue
- Playlists
- Listening history
- Private Session status
- Focus Mode preference

Jangan simpan data sensitif.

---

## API Abstraction

Buat API abstraction agar nanti bisa diganti ke backend asli.

Contoh:

```ts
export async function searchMusic(query: string): Promise<SearchResult> {
  // sekarang boleh return mock data
  // nanti bisa diganti ke backend AntiMusic API
}

export async function getLyrics(song: Song): Promise<LyricsResult | null> {
  // sekarang boleh mock
  // nanti bisa integrasi LRCLIB atau backend sendiri
}
```

Jangan hardcode semua logic di komponen UI.

---

## Acceptance Criteria

Project dianggap selesai tahap awal jika:

1. Aplikasi bisa dibuka di browser.
2. Home page tampil rapi.
3. Search page bisa menampilkan mock result atau API result.
4. User bisa play song melalui player abstraction.
5. Queue bisa ditambah, dihapus, dan disimpan lokal.
6. Playlist lokal bisa dibuat dan diisi lagu.
7. Lyrics panel bisa menampilkan lirik mock/plain text.
8. History lokal tersimpan saat lagu diputar.
9. Private Session mencegah history disimpan.
10. Stats page membaca data history lokal.
11. Focus Mode mengubah UI menjadi minimal.
12. Settings bisa clear local data.
13. UI responsive di mobile dan desktop.
14. README menjelaskan cara run project.
15. Fitur native/sulit tidak dimasukkan.

---

## README yang Harus Dibuat

Buat README dengan isi:

```md
# AntiMusic Web Lite

AntiMusic Web Lite is a lightweight web adaptation of AntiMusic Android.

It focuses on clean listening, local-first playlists, queue, lyrics, private sessions, focus mode, and local listening stats.

## Features

- Modern web music player UI
- Search page
- Queue
- Local playlists
- Lyrics panel
- Listening history
- Local stats
- Focus Mode
- Anti-Algorithm Mode
- Private Session
- PWA-ready structure

## Not Included Yet

- Offline audio download
- Android audio effects
- Android Auto
- YouTube Music login
- Native mobile background service
- AI audio enhancement

## Development

```bash
npm install
npm run dev
```

## Credits

AntiMusic Web Lite is inspired by AntiMusic Android, which is based on the open-source Muzza project.
```

---

## Instruksi Implementasi untuk Antigravity AI

Tolong buat project web baru bernama **AntiMusic Web Lite** berdasarkan spesifikasi ini.

Prioritaskan:
1. Struktur folder bersih.
2. TypeScript types jelas.
3. UI responsive.
4. State management rapi.
5. Data lokal berjalan.
6. Mock API dulu jika API asli belum tersedia.
7. Komponen reusable.
8. Kode mudah dikembangkan.
9. Jangan masukkan fitur native/sulit yang sudah dilarang.
10. Jangan membuat integrasi ilegal atau berisiko tinggi.

Mulai dari MVP yang bisa jalan, lalu pastikan setiap fitur utama punya placeholder yang jelas untuk pengembangan berikutnya.

---

## Catatan Penting

AntiMusic Web Lite harus terasa seperti produk sendiri, bukan clone Muzza dan bukan clone YouTube Music.

Fokus identitas:

- Clean
- Private
- Local-first
- Anti-distraction
- Anti-algorithm optional
- Lyrics-friendly
- Lightweight

