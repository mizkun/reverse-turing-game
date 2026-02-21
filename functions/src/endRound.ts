import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

const db = getFirestore();

/**
 * Shared logic: calculate results and set status to "revealed"
 */
export async function endRoundAndReveal(roomId: string) {
  logger.info(`endRoundAndReveal: starting for room ${roomId}`);

  const roomRef = db.doc(`rooms/${roomId}`);
  const room = (await roomRef.get()).data();
  if (!room) {
    logger.error(`endRoundAndReveal: room ${roomId} not found`);
    return;
  }
  if (room.status === "revealed" && room.result) {
    logger.info(`endRoundAndReveal: room ${roomId} already revealed with result`);
    return;
  }

  // Get all posts' isHuman flags (parallel reads)
  const postsSnap = await db.collection(`rooms/${roomId}/posts`).get();
  const authorIsHuman: Record<string, boolean> = {};

  const metaReads = postsSnap.docs.map(async (postDoc) => {
    const metaSnap = await db
      .doc(`${postDoc.ref.path}/secret/metadata`)
      .get();
    if (metaSnap.exists) {
      const authorId = postDoc.data().authorId;
      authorIsHuman[authorId] = metaSnap.data()?.isHuman || false;
    }
  });
  await Promise.all(metaReads);

  logger.info(`endRoundAndReveal: ${postsSnap.size} posts, ${Object.keys(authorIsHuman).length} authors`);

  // Score each report
  const reportsSnap = await db.collection(`rooms/${roomId}/reports`).get();
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

  logger.info(`endRoundAndReveal: ${totalReports} reports, ${correctCount} correct`);

  // Winner
  const gameState = (
    await db.doc(`rooms/${roomId}/secret/gameState`).get()
  ).data();
  const spyAuthorIds: string[] = gameState?.spyAuthorIds || [];
  const allSpiesEliminated =
    spyAuthorIds.length > 0 &&
    spyAuthorIds.every((id: string) => room.eliminatedIds?.includes(id));
  const winner = allSpiesEliminated ? "detective" : "spy";

  // Turing score (0-100, higher = harder to detect humans)
  const turingScore =
    totalReports > 0
      ? Math.round((1 - correctCount / totalReports) * 100)
      : 50;

  logger.info(`endRoundAndReveal: winner=${winner}, turingScore=${turingScore}`);

  batch.update(roomRef, {
    status: "revealed",
    result: { winner, turingScore },
  });

  await batch.commit();
  logger.info(`endRoundAndReveal: committed for room ${roomId}`);
  return { winner, turingScore };
}
