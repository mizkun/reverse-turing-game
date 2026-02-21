import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";
import { endRoundAndReveal } from "./endRound";

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

    const result = await endRoundAndReveal(roomId);
    return { success: true, ...result };
  }
);
