import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const revealResults = onCall(
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

    // Idempotent
    if (room?.status === "revealed") {
      return { success: true, alreadyRevealed: true };
    }

    // Get all posts' isHuman flags
    const postsSnap = await db.collection(`rooms/${roomId}/posts`).get();
    const authorIsHuman: Record<string, boolean> = {};
    for (const postDoc of postsSnap.docs) {
      const metaSnap = await db
        .doc(`${postDoc.ref.path}/secret/metadata`)
        .get();
      if (metaSnap.exists) {
        const authorId = postDoc.data().authorId;
        authorIsHuman[authorId] = metaSnap.data()?.isHuman || false;
      }
    }

    // Score each report
    const reportsSnap = await db
      .collection(`rooms/${roomId}/reports`)
      .get();
    const batch = db.batch();
    let correctCount = 0;
    let totalReports = 0;

    for (const reportDoc of reportsSnap.docs) {
      const targetId = reportDoc.data().targetId;
      const isCorrect = authorIsHuman[targetId] === true;
      if (isCorrect) correctCount++;
      totalReports++;
      batch.update(reportDoc.ref, { isCorrect });
    }

    // Winner
    const gameState = (
      await db.doc(`rooms/${roomId}/secret/gameState`).get()
    ).data();
    const spyAuthorIds: string[] = gameState?.spyAuthorIds || [];
    const allSpiesEliminated = spyAuthorIds.every((id: string) =>
      room?.eliminatedIds?.includes(id)
    );
    const winner = allSpiesEliminated ? "detective" : "spy";

    // Turing score (0-100, higher = harder to detect humans)
    const turingScore =
      totalReports > 0
        ? Math.round((1 - correctCount / totalReports) * 100)
        : 50;

    batch.update(roomRef, {
      status: "revealed",
      result: { winner, turingScore },
    });

    await batch.commit();
    return { success: true, winner, turingScore };
  }
);
