import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as crypto from "crypto";

const db = getFirestore();

const generateId = (len: number) =>
  Array.from(crypto.randomBytes(len), (b) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[b % 62]
  ).join("");

const THREAD_TOPICS = [
  {
    title: "雑談スレ",
    topic: "日常的な話題",
    openingPost: "何でも雑に話すスレです。",
  },
  {
    title: "今日の飯スレ",
    topic: "食べ物の話題",
    openingPost: "今日何食べた？何作った？",
  },
  {
    title: "最近見たもの",
    topic: "映画・動画・本",
    openingPost: "最近見て面白かったもの教えて。",
  },
];

export const createRoom = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    const { spySlots = 2, roundMinutes = 7 } = request.data as {
      spySlots?: number;
      roundMinutes?: number;
    };

    if (spySlots < 1 || spySlots > 5) {
      throw new HttpsError("invalid-argument", "spySlots must be 1-5");
    }

    const roomId = generateId(6);
    const hostToken = crypto.randomUUID();
    const roomRef = db.doc(`rooms/${roomId}`);
    const batch = db.batch();

    // Room
    batch.set(roomRef, {
      status: "waiting",
      settings: { spySlots, roundMinutes },
      detectiveCount: 0,
      activeIds: [],
      eliminatedIds: [],
      createdAt: FieldValue.serverTimestamp(),
      roundStartedAt: null,
      roundEndsAt: null,
      result: null,
    });

    // Host secret
    batch.set(db.doc(`rooms/${roomId}/hostSecret/config`), { hostToken });

    // Game state (spy IDs stored here, hidden from clients)
    batch.set(db.doc(`rooms/${roomId}/secret/gameState`), {
      spyAuthorIds: [],
    });

    // Spy tokens
    const spyUrls: string[] = [];
    for (let i = 0; i < spySlots; i++) {
      const token = generateId(16);
      batch.set(db.doc(`rooms/${roomId}/spyTokens/slot${i}`), {
        token,
        assignedAuthorId: null,
        used: false,
      });
      spyUrls.push(`/room/${roomId}?spy=${token}`);
    }

    // Threads
    for (let i = 0; i < THREAD_TOPICS.length; i++) {
      const t = THREAD_TOPICS[i];
      batch.set(db.doc(`rooms/${roomId}/threads/thread${i}`), {
        title: t.title,
        topic: t.topic,
        openingPost: t.openingPost,
        createdBy: "SYSTEM",
        postCount: 0,
        createdAt: FieldValue.serverTimestamp(),
      });
    }

    await batch.commit();

    return {
      roomId,
      hostUrl: `/host/${hostToken}`,
      detectiveUrl: `/room/${roomId}`,
      spyUrls,
    };
  }
);
