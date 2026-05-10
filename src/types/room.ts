import { Song } from "./music";

export interface RoomParticipant {
  id: string; // socketId, connectionId or simple username
  name: string;
  avatar?: string;
  role: "host" | "cohost" | "guest";
  joinedAt: number;
  lastSeenAt: number;
  isOnline: boolean;
  isMuted?: boolean;
}

export interface RoomPlaybackState {
  status: "playing" | "paused" | "buffering" | "stopped";
  currentSongId?: string;
  currentVideoId?: string;
  positionMs: number; // current time in milliseconds or seconds (we'll standardize on seconds to align with YT Player)
  durationMs?: number;
  startedAt?: number;
  updatedAt: number;
  controlledBy: string;
  revision: number; // Increment on every playback state change
}

export interface RoomSettings {
  allowGuestsToAddSongs: boolean;
  allowGuestsToVoteSkip: boolean;
  allowGuestsToControlPlayback: boolean;
  maxQueueSize: number;
  syncToleranceMs: number; // in milliseconds (e.g. 4000)
  chatEnabled: boolean;
  reactionsEnabled: boolean;
}

export interface RoomChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  text: string;
  createdAt: number;
}

export interface RoomReaction {
  emoji: string;
  senderName: string;
  timestamp: number;
  id: string; // unique anim trigger id
}

export interface ListeningRoom {
  id: string; // 6-character roomCode
  name: string;
  hostId: string; // host's username
  createdAt: number;
  updatedAt: number;
  isPrivate: boolean;
  inviteCode: string;
  participants: RoomParticipant[];
  queue: Song[];
  currentTrack: Song | null;
  playbackState: RoomPlaybackState;
  settings: RoomSettings;
  chat: RoomChatMessage[];
  reactions: RoomReaction[];
  votes: string[]; // usernames that voted to skip
  queueRevision: number; // Increment on every queue mutation
}
