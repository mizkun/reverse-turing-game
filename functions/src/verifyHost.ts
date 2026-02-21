import { onCall, HttpsError } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const verifyHost = onCall(
  { region: "asia-northeast1" },
  async (request) => {
    const { hostToken } = request.data as { hostToken: string };
    if (!hostToken) {
      throw new HttpsError("invalid-argument", "hostToken is required");
    }

    const roomsSnap = await db.collection("rooms").get();
    for (const roomDoc of roomsSnap.docs) {
      const secretSnap = await db
        .doc(`rooms/${roomDoc.id}/hostSecret/config`)
        .get();
      if (secretSnap.exists && secretSnap.data()?.hostToken === hostToken) {
        return { roomId: roomDoc.id, room: roomDoc.data() };
      }
    }
    throw new HttpsError("not-found", "無効なホストトークンです");
  }
);
