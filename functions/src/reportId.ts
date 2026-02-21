import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import { endRoundAndReveal } from "./endRound";

const db = getFirestore();

export const reportId = onCall(
  { region: "asia-northeast1", minInstances: 1 },
  async (request) => {
    const { roomId, targetId } = request.data as {
      roomId: string;
      targetId: string;
    };
    const uid = request.auth?.uid;
    if (!uid) throw new HttpsError("unauthenticated", "認証が必要です");

    const roomRef = db.doc(`rooms/${roomId}`);
    const reportRef = db.doc(`rooms/${roomId}/reports/${uid}`);
    const gameStateRef = db.doc(`rooms/${roomId}/secret/gameState`);

    // Pre-fetch persona refs (can't use where() inside transaction)
    const personasSnap = await db
      .collection(`rooms/${roomId}/personas`)
      .where("assignedAuthorId", "==", targetId)
      .get();
    const personaRefs = personasSnap.docs.map((d) => d.ref);

    // Pre-count existing reports (outside transaction for simplicity)
    const existingReportsSnap = await db
      .collection(`rooms/${roomId}/reports`)
      .get();
    const existingReportCount = existingReportsSnap.size;

    const txResult = await db.runTransaction(async (tx) => {
      const roomSnap = await tx.get(roomRef);
      const room = roomSnap.data();
      const existingReport = await tx.get(reportRef);
      const gameStateSnap = await tx.get(gameStateRef);
      const gameState = gameStateSnap.data();

      // Re-read personas in transaction
      const personaDocs = await Promise.all(
        personaRefs.map((ref) => tx.get(ref))
      );

      // Validation
      if (room?.status !== "playing") {
        throw new HttpsError(
          "failed-precondition",
          "ラウンド中ではありません"
        );
      }
      if (existingReport.exists) {
        throw new HttpsError("already-exists", "通報は1回だけです");
      }
      if (!room.activeIds.includes(targetId)) {
        throw new HttpsError(
          "not-found",
          "対象IDは既に排除されています"
        );
      }

      // Record report
      tx.set(reportRef, {
        targetId,
        reportedAt: FieldValue.serverTimestamp(),
        isCorrect: null,
      });

      // Eliminate target
      tx.update(roomRef, {
        activeIds: FieldValue.arrayRemove(targetId),
        eliminatedIds: FieldValue.arrayUnion(targetId),
      });

      // Stop AI persona if applicable
      for (const pDoc of personaDocs) {
        if (pDoc.exists) tx.update(pDoc.ref, { eliminated: true });
      }

      // Check if all spies eliminated
      const spyAuthorIds: string[] = gameState?.spyAuthorIds || [];
      const remainingActiveIds = room.activeIds.filter(
        (id: string) => id !== targetId
      );
      const remainingSpies = spyAuthorIds.filter((id: string) =>
        remainingActiveIds.includes(id)
      );
      const allSpiesEliminated = remainingSpies.length === 0;

      // Check if all detectives have now reported (+1 for this new report)
      const detectiveCount: number = room.detectiveCount || 0;
      const newReportCount = existingReportCount + 1;
      const allDetectivesReported = detectiveCount > 0 && newReportCount >= detectiveCount;

      return { success: true, shouldEnd: allSpiesEliminated || allDetectivesReported };
    });

    // After transaction: if game should end, run full scoring & reveal
    if (txResult.shouldEnd) {
      logger.info(`reportId: game ending in room ${roomId}, triggering endRoundAndReveal`);
      await endRoundAndReveal(roomId);
    }

    return { success: true };
  }
);
