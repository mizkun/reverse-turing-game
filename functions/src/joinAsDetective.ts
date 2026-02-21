import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generateId } from "./utils";
import { FALLBACK_PERSONAS } from "./personas";

const db = getFirestore();

export const joinAsDetective = onCall(
  { region: "asia-northeast1", minInstances: 1 },
  async (request) => {
    const { roomId } = request.data as { roomId: string };
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "認証が必要です");

    const roomRef = db.doc(`rooms/${roomId}`);
    const room = (await roomRef.get()).data();

    if (!room) {
      throw new HttpsError("not-found", "ルームが見つかりません");
    }

    // Increment detective count immediately
    await roomRef.update({ detectiveCount: FieldValue.increment(1) });

    // Late join or cap reached: skip persona generation
    if (room.status !== "waiting") {
      return { success: true, lateJoin: true };
    }

    const personasSnap = await db
      .collection(`rooms/${roomId}/personas`)
      .get();
    const currentCount = personasSnap.size;

    if (currentCount >= 10) {
      return { success: true, aiAdded: false };
    }

    // Add persona with fallback immediately, generate better one in background
    const authorId = generateId(8);
    const fallback = FALLBACK_PERSONAS[currentCount % FALLBACK_PERSONAS.length];

    const batch = db.batch();
    batch.set(db.collection(`rooms/${roomId}/personas`).doc(), {
      bigFive: fallback.bigFive,
      name: fallback.name,
      systemPrompt: fallback.systemPrompt,
      postFrequency: fallback.postFrequency,
      assignedAuthorId: authorId,
      eliminated: false,
    });
    batch.update(roomRef, {
      activeIds: FieldValue.arrayUnion(authorId),
    });
    await batch.commit();

    return { success: true, aiAdded: true };
  }
);
