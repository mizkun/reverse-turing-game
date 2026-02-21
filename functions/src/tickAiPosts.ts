import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { generatePost } from "./aiEngine";
import { FALLBACK_POSTS } from "./fallbackPosts";
import { endRoundAndReveal } from "./endRound";

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const db = getFirestore();

export const tickAiPosts = onCall(
  { region: "asia-northeast1", secrets: [geminiApiKey] },
  async (request) => {
    const { roomId } = request.data as { roomId: string };
    if (!roomId) throw new HttpsError("invalid-argument", "roomId is required");

    const roomRef = db.doc(`rooms/${roomId}`);
    const room = (await roomRef.get()).data();
    if (!room || room.status !== "playing") {
      return { posted: 0 };
    }

    // Auto-end if past roundEndsAt
    if (room.roundEndsAt && room.roundEndsAt.toDate() < new Date()) {
      await endRoundAndReveal(roomId);
      return { posted: 0, ended: true };
    }

    const personasSnap = await db
      .collection(`rooms/${roomId}/personas`)
      .get();

    let posted = 0;

    for (const personaDoc of personasSnap.docs) {
      const persona = personaDoc.data();
      if (persona.eliminated) continue;

      // Check last post time
      const lastPostSnap = await db
        .collection(`rooms/${roomId}/posts`)
        .where("authorId", "==", persona.assignedAuthorId)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get();

      const now = Date.now();
      const freq = persona.postFrequency;

      if (lastPostSnap.empty) {
        // First post: small random delay (0-30s) from round start
        const roundStart = room.roundStartedAt.toDate().getTime();
        const initialDelay = Math.random() * Math.min(freq * 1000, 30000);
        if (now < roundStart + initialDelay) continue;
      } else {
        const lastPostTime = lastPostSnap.docs[0]
          .data()
          .createdAt.toDate()
          .getTime();
        const jitter = (Math.random() - 0.5) * freq * 500;
        if (now - lastPostTime < freq * 1000 + jitter) continue;
      }

      // Pick random thread
      const threadsSnap = await db
        .collection(`rooms/${roomId}/threads`)
        .get();
      const threads = threadsSnap.docs;
      const thread = threads[Math.floor(Math.random() * threads.length)];
      const threadData = thread.data();

      // Get recent posts for context
      const recentSnap = await db
        .collection(`rooms/${roomId}/posts`)
        .where("threadId", "==", thread.id)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();
      const recentPosts = recentSnap.docs.reverse().map((d) => d.data());

      // Generate post
      let content: string;
      try {
        content = await generatePost(
          geminiApiKey.value(),
          persona.systemPrompt,
          threadData.title,
          recentPosts as {
            postNumber: number;
            authorId: string;
            content: string;
          }[]
        );
      } catch {
        content =
          FALLBACK_POSTS[Math.floor(Math.random() * FALLBACK_POSTS.length)];
      }

      // Write post
      const postRef = db.collection(`rooms/${roomId}/posts`).doc();
      const batch = db.batch();
      batch.set(postRef, {
        threadId: thread.id,
        postNumber: threadData.postCount + 1,
        authorId: persona.assignedAuthorId,
        authorName: "名無しさん",
        content,
        createdAt: FieldValue.serverTimestamp(),
      });
      batch.set(db.doc(`${postRef.path}/secret/metadata`), {
        isHuman: false,
        personaId: personaDoc.id,
      });
      batch.update(thread.ref, { postCount: FieldValue.increment(1) });
      await batch.commit();
      posted++;
    }

    return { posted };
  }
);
