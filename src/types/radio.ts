import { Song } from "./music";

export type RadioSeedType =
  | "song"
  | "artist"
  | "album"
  | "playlist"
  | "mood"
  | "genre"
  | "history";

export interface RadioSeed {
  type: RadioSeedType;
  id: string;
  title: string;
  artist?: string;
  videoId?: string;
  browseId?: string;
  thumbnail?: string;
}

export interface RadioSession {
  id: string;
  seed: RadioSeed;
  title: string;
  description?: string;
  tracks: Song[];
  createdAt: number;
  updatedAt: number;
  mode: "balanced" | "discovery" | "familiar" | "anti_algorithm";
}

export interface SavedRadio {
  id: string;
  seed: RadioSeed;
  title: string;
  tracks: Song[];
  mode: RadioSession["mode"];
  createdAt: number;
  updatedAt: number;
}
export interface RadioResponse {
  ok: true;
  radio: RadioSession;
}
