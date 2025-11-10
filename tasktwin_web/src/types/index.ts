import { User, Room, Match, Recap, Streak, Team, OKR, Report } from "@prisma/client";

// Base types from Prisma
export type { User, Room, Match, Recap, Streak, Team, OKR, Report };

// Extended types with relations
export type UserWithRelations = User & {
  matches?: Match[];
  streaks?: Streak[];
};

export type RoomWithRelations = Room & {
  matches?: (Match & { user: User })[];
  recap?: Recap | null;
  checklist?: ChecklistItem[];
};

export type MatchWithRelations = Match & {
  user: User;
  room: Room;
};

export type RecapWithRelations = Recap & {
  room: Room;
  user1: User;
};

// API Request/Response types
export interface CreateMatchRequest {
  topic: string;
  intent: string[];
  preferences?: Record<string, any>;
}

export interface CreateMatchResponse {
  queueId: string;
  estimatedWaitTime: number; // in seconds
}

export interface MatchStatusResponse {
  status: "waiting" | "matched" | "expired";
  roomId?: string;
  partnerId?: string;
  position?: number;
}

export interface StartRoomRequest {
  topic: string;
  description?: string;
  durationMinutes?: number;
  participantIds: string[];
}

export interface StartRoomResponse {
  room: Room;
  participants: User[];
}

export interface CreateRecapRequest {
  roomId: string;
  text: string;
}

export interface ApproveRecapRequest {
  recapId: string;
}

export interface GetStreaksResponse {
  current: number;
  best: number;
  history: Array<{
    date: string;
    sessions: number;
  }>;
}

export interface UserStatsResponse {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  bestStreak: number;
  averageSessionsPerWeek: number;
}

// WebSocket message types
export type WSMessage =
  | { type: "match.found"; roomId: string; partnerId: string }
  | { type: "match.cancelled"; reason: string }
  | { type: "room.started"; roomId: string }
  | { type: "room.participant.joined"; userId: string }
  | { type: "room.participant.left"; userId: string }
  | { type: "room.timer.tick"; secondsRemaining: number }
  | { type: "room.paused" }
  | { type: "room.resumed" }
  | { type: "room.completed" }
  | { type: "checklist.updated"; items: ChecklistItem[] }
  | { type: "recap.created"; recapId: string }
  | { type: "recap.approved"; userId: string };

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  order: number;
}

// Matching algorithm types
export interface MatchingPreferences {
  workStyle?: "focused" | "collaborative" | "flexible";
  communicationLevel?: "minimal" | "moderate" | "active";
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  timezone?: string;
}

export interface MatchScore {
  userId1: string;
  userId2: string;
  score: number;
  factors: {
    topicSimilarity: number;
    intentAlignment: number;
    styleCompatibility: number;
    historicalSuccess: number;
  };
}
