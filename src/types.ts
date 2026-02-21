import { Timestamp } from "firebase/firestore";

export interface Room {
  status: "waiting" | "playing" | "revealed";
  settings: {
    spySlots: number;
    roundMinutes: number;
  };
  detectiveCount: number;
  activeIds: string[];
  eliminatedIds: string[];
  createdAt: Timestamp;
  roundStartedAt: Timestamp | null;
  roundEndsAt: Timestamp | null;
  result?: {
    winner: "spy" | "detective";
    turingScore: number;
  };
}

export interface GameState {
  spyAuthorIds: string[];
}

export interface Thread {
  title: string;
  topic: string;
  openingPost: string;
  createdBy: "SYSTEM";
  postCount: number;
  createdAt: Timestamp;
}

export interface Post {
  threadId: string;
  postNumber: number;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Timestamp;
}

export interface PostSecret {
  isHuman: boolean;
  personaId: string | null;
}

export interface SpyToken {
  token: string;
  assignedAuthorId: string | null;
  used: boolean;
}

export interface Report {
  targetId: string;
  reportedAt: Timestamp;
  isCorrect: boolean | null;
}

export interface Persona {
  bigFive: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  name: string;
  systemPrompt: string;
  postFrequency: number;
  assignedAuthorId: string;
  eliminated: boolean;
}
