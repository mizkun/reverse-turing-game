import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generateId } from "./utils";
import { FALLBACK_PERSONAS } from "./personas";
import { FALLBACK_POSTS } from "./fallbackPosts";

const db = getFirestore();

export const startRound = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    const { roomId, hostToken } = request.data as {
      roomId: string;
      hostToken: string;
    };

    // Verify host
    const secretSnap = await db
      .doc(`rooms/${roomId}/hostSecret/config`)
      .get();
    if (!secretSnap.exists || secretSnap.data()?.hostToken !== hostToken) {
      throw new HttpsError("permission-denied", "ホスト権限がありません");
    }

    const roomRef = db.doc(`rooms/${roomId}`);
    const room = (await roomRef.get()).data();

    if (room?.status !== "waiting") {
      throw new HttpsError(
        "failed-precondition",
        "待機中のルームでのみ開始できます"
      );
    }

    // Ensure minimum 5 AI personas (use fallbacks for instant start)
    const personasSnap = await db
      .collection(`rooms/${roomId}/personas`)
      .get();
    const currentAiCount = personasSnap.size;

    if (currentAiCount < 5) {
      const batch = db.batch();
      for (let i = currentAiCount; i < 5; i++) {
        const persona = FALLBACK_PERSONAS[i % FALLBACK_PERSONAS.length];
        const authorId = generateId(8);
        batch.set(db.collection(`rooms/${roomId}/personas`).doc(), {
          bigFive: persona.bigFive,
          name: persona.name,
          systemPrompt: persona.systemPrompt,
          postFrequency: persona.postFrequency,
          assignedAuthorId: authorId,
          eliminated: false,
        });
        batch.update(roomRef, {
          activeIds: FieldValue.arrayUnion(authorId),
        });
      }
      await batch.commit();
    }

    // Start round
    const now = new Date();
    const roundMinutes = room.settings.roundMinutes;
    const endsAt = new Date(now.getTime() + roundMinutes * 60 * 1000);

    await roomRef.update({
      status: "playing",
      roundStartedAt: now,
      roundEndsAt: endsAt,
    });

    // Generate initial posts for all personas immediately
    const allPersonas = await db
      .collection(`rooms/${roomId}/personas`)
      .get();
    const threadsSnap = await db
      .collection(`rooms/${roomId}/threads`)
      .get();
    const threads = threadsSnap.docs;

    if (threads.length > 0) {
      const initBatch = db.batch();
      for (const pDoc of allPersonas.docs) {
        const persona = pDoc.data();
        const thread = threads[Math.floor(Math.random() * threads.length)];
        const threadData = thread.data();
        const content =
          FALLBACK_POSTS[Math.floor(Math.random() * FALLBACK_POSTS.length)];
        const postRef = db.collection(`rooms/${roomId}/posts`).doc();
        initBatch.set(postRef, {
          threadId: thread.id,
          postNumber: threadData.postCount + 1,
          authorId: persona.assignedAuthorId,
          authorName: "名無しさん",
          content,
          createdAt: FieldValue.serverTimestamp(),
        });
        initBatch.set(db.doc(`${postRef.path}/secret/metadata`), {
          isHuman: false,
          personaId: pDoc.id,
        });
        initBatch.update(thread.ref, {
          postCount: FieldValue.increment(1),
        });
      }
      await initBatch.commit();
    }

    return { success: true, roundEndsAt: endsAt.toISOString() };
  }
);
