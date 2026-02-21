import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { generateId } from "./utils";
import { generatePersona, FALLBACK_PERSONAS } from "./personas";

const db = getFirestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const joinAsDetective = onCall(
  { region: "asia-northeast1", secrets: [geminiApiKey] },
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

    // Generate persona in background (don't block response)
    const authorId = generateId(8);
    const personaPromise = (async () => {
      let persona;
      try {
        persona = await generatePersona(geminiApiKey.value());
      } catch {
        persona = FALLBACK_PERSONAS[currentCount % FALLBACK_PERSONAS.length];
      }

      const batch = db.batch();
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
      await batch.commit();
    })();

    // Wait for persona but with a short timeout - use fallback if slow
    await Promise.race([
      personaPromise,
      new Promise((resolve) => setTimeout(resolve, 5000)),
    ]);

    return { success: true, aiAdded: true };
  }
);
