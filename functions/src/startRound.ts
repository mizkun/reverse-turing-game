import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { defineSecret } from "firebase-functions/params";
import { generateId } from "./utils";
import { generatePersona, FALLBACK_PERSONAS } from "./personas";

const db = getFirestore();
const geminiApiKey = defineSecret("GEMINI_API_KEY");

export const startRound = onCall(
  { region: "asia-northeast1", secrets: [geminiApiKey] },
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

    // Ensure minimum 3 AI personas
    const personasSnap = await db
      .collection(`rooms/${roomId}/personas`)
      .get();
    const currentAiCount = personasSnap.size;

    if (currentAiCount < 3) {
      const batch = db.batch();
      for (let i = currentAiCount; i < 3; i++) {
        let persona;
        try {
          persona = await generatePersona(geminiApiKey.value());
        } catch {
          persona = FALLBACK_PERSONAS[i % FALLBACK_PERSONAS.length];
        }
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

    return { success: true, roundEndsAt: endsAt.toISOString() };
  }
);
