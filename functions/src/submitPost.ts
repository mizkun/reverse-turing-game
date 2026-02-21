import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const db = getFirestore();

export const submitPost = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    const { roomId, threadId, content, spyToken } = request.data as {
      roomId: string;
      threadId: string;
      content: string;
      spyToken: string;
    };

    if (!content || content.trim().length === 0) {
      throw new HttpsError("invalid-argument", "内容を入力してください");
    }

    // Verify spy token → get authorId
    const tokensSnap = await db
      .collection(`rooms/${roomId}/spyTokens`)
      .get();
    let authorId: string | null = null;
    for (const d of tokensSnap.docs) {
      if (d.data().token === spyToken && d.data().used) {
        authorId = d.data().assignedAuthorId;
        break;
      }
    }
    if (!authorId)
      throw new HttpsError("permission-denied", "無効なトークン");

    // Check if eliminated
    const room = (await db.doc(`rooms/${roomId}`).get()).data();
    if (room?.eliminatedIds?.includes(authorId)) {
      throw new HttpsError(
        "failed-precondition",
        "あなたのアカウントは凍結されています"
      );
    }
    if (room?.status !== "playing") {
      throw new HttpsError(
        "failed-precondition",
        "ラウンド中ではありません"
      );
    }

    // Write post
    const threadRef = db.doc(`rooms/${roomId}/threads/${threadId}`);
    const threadData = (await threadRef.get()).data();
    const nextPostNumber = (threadData?.postCount || 0) + 1;

    const postRef = db.collection(`rooms/${roomId}/posts`).doc();
    const batch = db.batch();
    batch.set(postRef, {
      threadId,
      postNumber: nextPostNumber,
      authorId,
      authorName: "名無しさん",
      content: content.trim(),
      createdAt: FieldValue.serverTimestamp(),
    });
    batch.set(db.doc(`${postRef.path}/secret/metadata`), {
      isHuman: true,
      personaId: null,
    });
    batch.update(threadRef, { postCount: FieldValue.increment(1) });
    await batch.commit();

    return { success: true };
  }
);
